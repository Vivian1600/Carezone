import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Card } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useDarkMode } from '../context/DarkModeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const API_BASE_URL = 'http://192.168.1.117:5000/api';

const VisitDetails = () => {
  const { token } = useAuth();
  const navigation = useNavigation();
  const { colors } = useDarkMode();
  const route = useRoute();
  const { visitId, patientName } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visit, setVisit] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskNotes, setTaskNotes] = useState({});
  const [isOffline, setIsOffline] = useState(false);
  const [visitStarted, setVisitStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [medications, setMedications] = useState([]);
  const [medicationsLoading, setMedicationsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => { setIsOffline(!state.isConnected); });
    const checkInitialConnection = async () => { const state = await NetInfo.fetch(); setIsOffline(!state.isConnected); };
    checkInitialConnection();
    return () => unsubscribe();
  }, []);

  useEffect(() => { fetchVisitDetails(); }, []);
  useEffect(() => { if (visitStarted || visit?.status === 'in_progress') fetchMedications(); }, [visitStarted, visit]);

  const fetchVisitDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/visits/${visitId}`, { headers: { 'x-auth-token': token } });
      const data = await response.json();
      if (data.success) {
        setVisit(data.data);
        setTasks(data.data.tasks || []);
        const notes = {};
        (data.data.tasks || []).forEach(task => { if (task.status !== 'completed') notes[task.task_id] = ''; });
        setTaskNotes(notes);
        if (data.data.status === 'in_progress') { setVisitStarted(true); setStartTime(new Date(data.data.actual_start_time).getTime()); }
      }
    } catch (error) { console.error('Error fetching visit:', error); Alert.alert('Error', 'Failed to load visit details'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchMedications = async () => {
    setMedicationsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/medication-admin/visit/${visitId}`, { headers: { 'x-auth-token': token } });
      const data = await response.json();
      if (data.success && data.logs && data.logs.length > 0) setMedications(data.logs);
      else {
        const medResponse = await fetch(`${API_BASE_URL}/medication/visit/${visitId}`, { headers: { 'x-auth-token': token } });
        const medData = await medResponse.json();
        if (medData.success && medData.data) setMedications(medData.data);
      }
    } catch (error) { console.error('Error fetching medications:', error); }
    finally { setMedicationsLoading(false); }
  };

  const toggleMedication = async (medicationId, currentStatus) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/medication-admin/log`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ medication_id: medicationId, visit_id: visitId, administered: !currentStatus, dose_given: 'as prescribed', notes: '' }),
      });
      const data = await response.json();
      if (data.success) setMedications(prev => prev.map(m => m.medication_id === medicationId ? { ...m, administered: !currentStatus } : m));
      else Alert.alert('Error', data.message || 'Failed to update');
    } catch (error) { console.error('Error:', error); Alert.alert('Error', 'Network error'); }
    finally { setSaving(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchVisitDetails(); if (visitStarted) fetchMedications(); };

  const handleStartVisit = async () => {
    if (isOffline) { Alert.alert('Offline', 'You need to be online to start a visit'); return; }
    try {
      const latitude = -1.286389; const longitude = 36.817223;
      const response = await fetch(`${API_BASE_URL}/visits/${visitId}/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ latitude, longitude }),
      });
      const data = await response.json();
      if (data.success) { setVisitStarted(true); setStartTime(Date.now()); Alert.alert('Success', 'Visit started!'); fetchVisitDetails(); }
      else Alert.alert('Error', data.message || 'Failed to start visit');
    } catch (error) { console.error('Error starting visit:', error); Alert.alert('Error', 'Network error'); }
  };

  const handleTaskComplete = async (taskId) => {
    const notes = taskNotes[taskId] || '';
    setTasks(prevTasks => prevTasks.map(task => task.task_id === taskId ? { ...task, status: 'completed', notes } : task));
    if (!isOffline) {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }, body: JSON.stringify({ notes }),
        });
        const data = await response.json();
        if (!data.success) { setTasks(prevTasks => prevTasks.map(task => task.task_id === taskId ? { ...task, status: 'pending', notes: '' } : task)); Alert.alert('Error', data.message || 'Failed to complete task'); }
      } catch (error) { setTasks(prevTasks => prevTasks.map(task => task.task_id === taskId ? { ...task, status: 'pending', notes: '' } : task)); Alert.alert('Error', 'Network error'); }
    } else {
      try {
        const pendingTasks = await AsyncStorage.getItem('pending_tasks') || '[]';
        const pending = JSON.parse(pendingTasks);
        pending.push({ id: taskId, visitId, notes, timestamp: new Date().toISOString() });
        await AsyncStorage.setItem('pending_tasks', JSON.stringify(pending));
        Alert.alert('Offline', 'Task saved. Will sync when online.');
      } catch (error) { console.error('Error saving offline task:', error); }
    }
  };

  const handleCompleteVisit = async () => {
    const allTasksCompleted = tasks.every(t => t.status === 'completed');
    if (!allTasksCompleted) {
      Alert.alert('Incomplete Tasks', 'Not all tasks are completed. Do you want to continue?', [
        { text: 'Cancel', style: 'cancel' }, { text: 'Complete Anyway', onPress: () => completeVisit() }
      ]);
    } else completeVisit();
  };

  const completeVisit = async () => {
    setCompleting(true);
    const completedTasks = tasks.filter(t => t.status === 'completed').map(t => ({ id: t.task_id, notes: t.notes || '' }));
    const requestBody = { tasks: completedTasks, notes: visit?.notes || '' };
    if (!isOffline) {
      try {
        const response = await fetch(`${API_BASE_URL}/visits/${visitId}/complete`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': token }, body: JSON.stringify(requestBody),
        });
        const data = await response.json();
        if (data.success) Alert.alert('Success', 'Visit completed successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        else Alert.alert('Error', data.message || 'Failed to complete visit');
      } catch (error) { console.error('Error completing visit:', error); Alert.alert('Error', 'Network error'); }
    } else {
      try {
        const offlineCompletes = await AsyncStorage.getItem('offline_completes') || '[]';
        const completes = JSON.parse(offlineCompletes);
        completes.push({ visit_id: visitId, tasks: completedTasks, notes: visit?.notes || '', timestamp: new Date().toISOString() });
        await AsyncStorage.setItem('offline_completes', JSON.stringify(completes));
        Alert.alert('Offline Mode', 'Visit completed offline. Will sync when online.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } catch (error) { console.error('Error saving offline complete:', error); }
    }
    setCompleting(false);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2C7DA0" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <StatusBar barStyle="light-content" backgroundColor="#2C7DA0" />
      
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi-outline" size={16} color="#fff" />
          <Text style={styles.offlineText}> Offline Mode - Changes saved locally</Text>
        </View>
      )}

      <LinearGradient colors={['#2C7DA0', '#61A5C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Visit Details</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.patientHeader}>
            <FontAwesome5 name="user-circle" size={24} color="#2C7DA0" />
            <Text style={styles.patientName}>{visit?.care_recipient_name || patientName}</Text>
          </View>
          <View style={styles.visitTimeRow}>
            <Ionicons name="calendar-outline" size={16} color="#4A627A" />
            <Text style={styles.visitTime}> Scheduled: {new Date(visit?.scheduled_time).toLocaleString()}</Text>
          </View>
          {visitStarted && (
            <LinearGradient colors={['#2C7DA020', '#61A5C220']} style={styles.timerContainer}>
              <Ionicons name="timer-outline" size={20} color="#2C7DA0" />
              <Text style={styles.timerLabel}> Visit Duration:</Text>
              <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
            </LinearGradient>
          )}
          {visit?.status === 'completed' && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.completedBadgeText}> Completed</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {visit?.status === 'scheduled' && !visitStarted && (
        <TouchableOpacity style={styles.startButtonWrapper} onPress={handleStartVisit} activeOpacity={0.8}>
          <LinearGradient colors={['#2C7DA0', '#61A5C2']} style={styles.startButtonGradient}>
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.startButtonText}> Start Visit</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {visitStarted && visit?.status !== 'completed' && (
        <TouchableOpacity style={styles.completeButtonWrapper} onPress={handleCompleteVisit} disabled={completing} activeOpacity={0.8}>
          <LinearGradient colors={['#FF9800', '#FFB74D']} style={styles.completeButtonGradient}>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.completeButtonText}>{completing ? 'Completing...' : ' Complete Visit'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>
            <Ionicons name="clipboard-outline" size={18} color="#2C7DA0" /> Tasks
          </Text>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <View key={task.task_id} style={styles.taskItem}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                  {task.status === 'completed' ? (
                    <View style={styles.completedTaskBadge}><Text style={styles.completedTaskText}>✓ Done</Text></View>
                  ) : (
                    <View style={styles.pendingTaskBadge}><Text style={styles.pendingTaskText}>Pending</Text></View>
                  )}
                </View>
                {task.status === 'completed' ? (
                  task.notes && <Text style={styles.taskNotes}>📝 {task.notes}</Text>
                ) : (
                  <View style={styles.taskInputContainer}>
                    <TextInput style={styles.taskInput} placeholder="Add notes..." value={taskNotes[task.task_id] || ''} onChangeText={(text) => setTaskNotes(prev => ({ ...prev, [task.task_id]: text }))} multiline />
                    <TouchableOpacity style={styles.completeTaskButton} onPress={() => handleTaskComplete(task.task_id)}>
                      <Ionicons name="checkmark" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No tasks for this visit</Text>
          )}
        </Card.Content>
      </Card>

      {visitStarted && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="medication" size={18} color="#2C7DA0" /> Medications
            </Text>
            {medicationsLoading ? (
              <ActivityIndicator size="small" color="#2C7DA0" />
            ) : medications.length > 0 ? (
              medications.map((med) => (
                <View key={med.medication_id} style={styles.medicationItem}>
                  <View style={styles.medicationHeader}>
                    <View style={styles.medicationInfo}>
                      <Text style={styles.medicationName}>{med.name}</Text>
                      <Text style={styles.medicationDosage}>{med.dosage} - {med.frequency}</Text>
                      {med.instructions && <Text style={styles.medicationInstructions}>📌 {med.instructions}</Text>}
                    </View>
                    <TouchableOpacity style={[styles.medicationToggle, { backgroundColor: med.administered ? '#4CAF50' : '#F44336' }]} onPress={() => toggleMedication(med.medication_id, med.administered)} disabled={saving}>
                      <Text style={styles.medicationToggleText}>{med.administered ? 'Given' : 'Not Given'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No medications prescribed</Text>
            )}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFE' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFE' },
  offlineBanner: { backgroundColor: '#FF9800', padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  offlineText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingTop: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 18, color: '#fff', fontWeight: '600' },
  card: { margin: 15, marginTop: 0, borderRadius: 20, backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: 1, borderColor: '#E8EEF2' },
  patientHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  patientName: { fontSize: 22, fontWeight: 'bold', color: '#2C7DA0' },
  visitTimeRow: { flexDirection: 'row', alignItems: 'center' },
  visitTime: { fontSize: 14, color: '#4A627A' },
  timerContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, padding: 10, borderRadius: 8 },
  timerLabel: { fontSize: 14, color: '#2C7DA0', marginLeft: 6 },
  timerValue: { fontSize: 18, fontWeight: 'bold', color: '#2C7DA0', marginLeft: 4 },
  completedBadge: { marginTop: 10, backgroundColor: '#4CAF50', padding: 8, borderRadius: 20, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
  completedBadgeText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 4 },
  startButtonWrapper: { margin: 15, borderRadius: 12, overflow: 'hidden', elevation: 3 },
  startButtonGradient: { padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  completeButtonWrapper: { margin: 15, borderRadius: 12, overflow: 'hidden', elevation: 3 },
  completeButtonGradient: { padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  completeButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C7DA0', marginBottom: 15 },
  taskItem: { borderBottomWidth: 1, borderBottomColor: '#E8EEF2', paddingVertical: 15 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  taskDescription: { fontSize: 16, fontWeight: '500', color: '#1A2C3E', flex: 1, marginRight: 10 },
  completedTaskBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  completedTaskText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  pendingTaskBadge: { backgroundColor: '#FF9800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pendingTaskText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  taskNotes: { fontSize: 14, color: '#4A627A', fontStyle: 'italic', backgroundColor: '#F8FAFE', padding: 8, borderRadius: 5, marginTop: 6 },
  taskInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskInput: { flex: 1, borderWidth: 1, borderColor: '#E8EEF2', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#FFFFFF', minHeight: 60, textAlignVertical: 'top', color: '#1A2C3E' },
  completeTaskButton: { backgroundColor: '#2C7DA0', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  noDataText: { fontSize: 14, color: '#4A627A', fontStyle: 'italic', textAlign: 'center', padding: 20 },
  medicationItem: { borderBottomWidth: 1, borderBottomColor: '#E8EEF2', paddingVertical: 12 },
  medicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  medicationInfo: { flex: 1, marginRight: 10 },
  medicationName: { fontSize: 16, fontWeight: '600', color: '#1A2C3E' },
  medicationDosage: { fontSize: 13, color: '#4A627A', marginTop: 2 },
  medicationInstructions: { fontSize: 12, color: '#2C7DA0', marginTop: 2 },
  medicationToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  medicationToggleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

export default VisitDetails;