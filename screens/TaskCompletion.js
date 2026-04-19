import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Card } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useDarkMode } from '../context/DarkModeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const API_BASE_URL = 'http://PC:5000/api';

const TaskCompletion = () => {
  const { token } = useAuth();
  const navigation = useNavigation();
  const { colors } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskNotes, setTaskNotes] = useState({});
  const [isOffline, setIsOffline] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // NetInfo for online/offline detection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    const checkInitialConnection = async () => {
      const state = await NetInfo.fetch();
      setIsOffline(!state.isConnected);
    };
    checkInitialConnection();
    fetchVisits();
    return () => unsubscribe();
  }, []);

  const fetchVisits = async () => {
    if (isOffline) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/visits/my-visits`, {
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      
      if (data.success) {
        const visitsWithTasks = data.data.filter(v => v.status !== 'completed');
        setVisits(visitsWithTasks);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksForVisit = async (visitId) => {
    if (isOffline) {
      Alert.alert('Offline', 'You are offline. Please connect to the internet to load tasks.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/visit/${visitId}`, {
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.data || []);
        const notes = {};
        data.data.forEach(task => {
          if (!task.completed) notes[task.task_id] = '';
        });
        setTaskNotes(notes);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleVisitSelect = (visit) => {
    setSelectedVisit(visit);
    fetchTasksForVisit(visit.visit_id);
  };

  const handleTaskComplete = async (taskId) => {
    const notes = taskNotes[taskId] || '';
    
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.task_id === taskId
          ? { ...task, completed: true, notes }
          : task
      )
    );

    if (!isOffline) {
      try {
        await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
          method: 'PUT',
          headers: { 
            'x-auth-token': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notes })
        });
        Alert.alert('Success', 'Task completed!');
      } catch (error) {
        console.error('Error completing task:', error);
        Alert.alert('Error', 'Failed to complete task');
      }
    } else {
      try {
        const pendingTasks = await AsyncStorage.getItem('pending_tasks') || '[]';
        const pending = JSON.parse(pendingTasks);
        pending.push({
          id: taskId,
          visitId: selectedVisit.visit_id,
          notes,
          timestamp: new Date().toISOString()
        });
        await AsyncStorage.setItem('pending_tasks', JSON.stringify(pending));
        Alert.alert('Offline', 'Task saved. Will sync when online.');
      } catch (error) {
        console.error('Error saving offline task:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2C7DA0" />
        <Text style={styles.loadingText}>Loading visits...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2C7DA0" />
      <ScrollView style={styles.container}>
        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="wifi-outline" size={16} color="#fff" />
            <Text style={styles.offlineText}> Offline Mode - Changes saved locally</Text>
          </View>
        )}

        {/* Gradient Header */}
        <LinearGradient
          colors={['#2C7DA0', '#61A5C2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Completion</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        {!selectedVisit ? (
          // Visit Selection Screen
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={22} color="#2C7DA0" />
                <Text style={styles.sectionTitle}> Select a Visit</Text>
              </View>
              {visits.length > 0 ? (
                visits.map((visit) => (
                  <TouchableOpacity
                    key={visit.visit_id}
                    style={styles.visitItem}
                    onPress={() => handleVisitSelect(visit)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.visitHeader}>
                      <FontAwesome5 name="user-circle" size={24} color="#2C7DA0" />
                      <View style={styles.visitInfo}>
                        <Text style={styles.visitPatient}>{visit.care_recipient_name}</Text>
                        <View style={styles.visitDateTimeRow}>
                          <Ionicons name="calendar-outline" size={12} color="#4A627A" />
                          <Text style={styles.visitTime}> {formatDate(visit.scheduled_time)}</Text>
                          <Ionicons name="time-outline" size={12} color="#4A627A" style={{ marginLeft: 8 }} />
                          <Text style={styles.visitTime}> {formatTime(visit.scheduled_time)}</Text>
                        </View>
                        <View style={styles.statusRow}>
                          <View style={[styles.statusBadge, { backgroundColor: visit.status === 'scheduled' ? '#2196F320' : '#FF980020' }]}>
                            <Text style={[styles.statusText, { color: visit.status === 'scheduled' ? '#2196F3' : '#FF9800' }]}>
                              {visit.status?.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-done-circle-outline" size={64} color="#A9D6E5" />
                  <Text style={styles.emptyText}>No pending visits</Text>
                  <Text style={styles.emptySubtext}>All caught up! Great job!</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        ) : (
          // Task Completion Screen
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.selectedVisitHeader}>
                <View style={styles.selectedVisitTitleRow}>
                  <FontAwesome5 name="user-circle" size={24} color="#2C7DA0" />
                  <Text style={styles.selectedVisitTitle}>
                    {selectedVisit.care_recipient_name}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedVisit(null)} style={styles.changeVisitButton}>
                  <Ionicons name="arrow-back" size={16} color="#2C7DA0" />
                  <Text style={styles.changeVisitText}> Change Visit</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.visitDateTimeRow}>
                <Ionicons name="calendar-outline" size={14} color="#4A627A" />
                <Text style={styles.visitDateText}> {formatDate(selectedVisit.scheduled_time)}</Text>
                <Ionicons name="time-outline" size={14} color="#4A627A" style={{ marginLeft: 12 }} />
                <Text style={styles.visitTimeText}> {formatTime(selectedVisit.scheduled_time)}</Text>
              </View>

              <View style={styles.sectionHeader}>
                <MaterialIcons name="assignment" size={22} color="#2C7DA0" />
                <Text style={styles.sectionTitle}> Tasks to Complete</Text>
              </View>
              
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <View key={task.task_id} style={styles.taskItem}>
                    <View style={styles.taskHeader}>
                      <Text style={styles.taskDescription}>{task.description}</Text>
                      {task.completed ? (
                        <View style={styles.completedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#fff" />
                          <Text style={styles.completedText}> Done</Text>
                        </View>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Ionicons name="time-outline" size={12} color="#fff" />
                          <Text style={styles.pendingText}> Pending</Text>
                        </View>
                      )}
                    </View>
                    
                    {task.completed ? (
                      task.notes && (
                        <View style={styles.completedNotes}>
                          <Ionicons name="document-text-outline" size={12} color="#4A627A" />
                          <Text style={styles.completedNotesText}> {task.notes}</Text>
                        </View>
                      )
                    ) : (
                      <View style={styles.taskForm}>
                        <View style={styles.notesInputWrapper}>
                          <Ionicons name="create-outline" size={18} color="#A9D6E5" style={styles.notesIcon} />
                          <TextInput
                            style={styles.taskNotesInput}
                            placeholder="Add notes (e.g., blood pressure, observations)"
                            placeholderTextColor="#A9D6E5"
                            value={taskNotes[task.task_id]}
                            onChangeText={(text) => 
                              setTaskNotes(prev => ({ ...prev, [task.task_id]: text }))
                            }
                            multiline
                          />
                        </View>
                        <TouchableOpacity
                          style={styles.completeTaskButton}
                          onPress={() => handleTaskComplete(task.task_id)}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#2C7DA0', '#61A5C2']}
                            style={styles.completeTaskGradient}
                          >
                            <Ionicons name="checkmark" size={20} color="#fff" />
                            <Text style={styles.completeTaskText}> Mark Complete</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-done-circle-outline" size={48} color="#A9D6E5" />
                  <Text style={styles.emptyText}>No tasks for this visit</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFE',
  },
  loadingText: {
    marginTop: 10,
    color: '#4A627A',
    fontSize: 16,
  },
  offlineBanner: {
    backgroundColor: '#FF9800',
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    margin: 15,
    marginTop: 15,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E8EEF2',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2C3E',
  },
  visitItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF2',
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visitInfo: {
    flex: 1,
  },
  visitPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2C3E',
    marginBottom: 4,
  },
  visitDateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  visitTime: {
    fontSize: 13,
    color: '#4A627A',
  },
  statusRow: {
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#4A627A',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A9D6E5',
    textAlign: 'center',
    marginTop: 8,
  },
  selectedVisitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  selectedVisitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedVisitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C7DA0',
  },
  changeVisitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeVisitText: {
    fontSize: 13,
    color: '#2C7DA0',
    fontWeight: '500',
  },
  visitDateText: {
    fontSize: 14,
    color: '#4A627A',
  },
  visitTimeText: {
    fontSize: 14,
    color: '#4A627A',
  },
  taskItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF2',
    paddingVertical: 15,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A2C3E',
    flex: 1,
    marginRight: 10,
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  completedNotes: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#F8FAFE',
    padding: 10,
    borderRadius: 8,
  },
  completedNotesText: {
    fontSize: 13,
    color: '#4A627A',
    fontStyle: 'italic',
  },
  taskForm: {
    marginTop: 10,
  },
  notesInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E8EEF2',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
    marginBottom: 12,
  },
  notesIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  taskNotesInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A2C3E',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  completeTaskButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  completeTaskGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  completeTaskText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TaskCompletion;