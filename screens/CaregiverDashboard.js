import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import { Card } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useDarkMode } from '../context/DarkModeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';

import { API_BASE_URL } from '../config';

const CaregiverDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigation = useNavigation();
  const { colors } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [visits, setVisits] = useState([]);
  const [pendingAcknowledgments, setPendingAcknowledgments] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    pending: true,
    today: true,
    upcoming: true,
    completed: false,
  });
  
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [acknowledgeNotes, setAcknowledgeNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState('accept');

  // Patient Info Modal states
  const [showPatientInfoModal, setShowPatientInfoModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [patientNotes, setPatientNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loadingPatientInfo, setLoadingPatientInfo] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  const fetchUnreadCount = async () => {
    if (isOffline) return;
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      if (data.success) setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch patient info and notes
  const fetchPatientInfo = async (careRecipientId, patientName) => {
    setLoadingPatientInfo(true);
    setSelectedPatient({ id: careRecipientId, name: patientName });
    setShowPatientInfoModal(true);
    
    try {
      const infoResponse = await fetch(`${API_BASE_URL}/care-recipient/${careRecipientId}/info`, {
        headers: { 'x-auth-token': token },
      });
      const infoData = await infoResponse.json();
      
      const notesResponse = await fetch(`${API_BASE_URL}/caregiver-notes/${careRecipientId}`, {
        headers: { 'x-auth-token': token },
      });
      const notesData = await notesResponse.json();
      
      if (infoData.success) setPatientInfo(infoData.data);
      if (notesData.success) setPatientNotes(notesData.data || []);
      
    } catch (error) {
      console.error('Error fetching patient info:', error);
      Alert.alert('Error', 'Failed to load patient information');
    } finally {
      setLoadingPatientInfo(false);
    }
  };

  // Add a new note
  const addPatientNote = async () => {
    if (!newNote.trim()) {
      Alert.alert('Error', 'Please enter a note');
      return;
    }
    
    setAddingNote(true);
    try {
      const response = await fetch(`${API_BASE_URL}/caregiver-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({
          care_recipient_id: selectedPatient.id,
          note: newNote
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setPatientNotes([data.note, ...patientNotes]);
        setNewNote('');
        Alert.alert('Success', 'Note added successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Network error');
    } finally {
      setAddingNote(false);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      if (state.isConnected && isOffline) {
        syncOfflineData();
      }
    });
    const checkInitialConnection = async () => {
      const state = await NetInfo.fetch();
      setIsOffline(!state.isConnected);
    };
    checkInitialConnection();
    
    if (!isOffline) {
      fetchData();
      fetchPendingAcknowledgments();
      fetchUnreadCount();
    } else {
      loadCachedData();
    }
    
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadCachedData = async () => {
    try {
      const cachedVisits = await AsyncStorage.getItem('cached_visits');
      if (cachedVisits) setVisits(JSON.parse(cachedVisits));
    } catch (error) {
      console.error('Error loading cache:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const syncOfflineData = async () => {
    try {
      const pendingTasks = await AsyncStorage.getItem('pending_tasks');
      if (pendingTasks) {
        const tasks = JSON.parse(pendingTasks);
        for (const task of tasks) {
          await fetch(`${API_BASE_URL}/tasks/${task.id}/complete`, {
            method: 'PUT',
            headers: { 'x-auth-token': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: task.notes })
          });
        }
        await AsyncStorage.removeItem('pending_tasks');
        Alert.alert('Sync Complete', 'All offline changes have been synced.');
      }
      fetchData();
      fetchPendingAcknowledgments();
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const fetchPendingAcknowledgments = async () => {
    if (isOffline) return;
    try {
      const response = await fetch(`${API_BASE_URL}/visits/pending-acknowledgment`, {
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      if (data.success) setPendingAcknowledgments(data.data || []);
    } catch (error) {
      console.error('Error fetching pending acknowledgments:', error);
    }
  };

  const fetchData = async () => {
    if (isOffline) {
      setLoading(false);
      return;
    }
    try {
      if (!token) {
        setLoading(false);
        return;
      }

      const profileRes = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: { 'x-auth-token': token },
      });
      const profileData = await profileRes.json();
      if (profileData.success) {
        setProfile(profileData.data);
        await AsyncStorage.setItem('cached_profile', JSON.stringify(profileData.data));
      }

      const visitsRes = await fetch(`${API_BASE_URL}/visits/my-visits`, {
        headers: { 'x-auth-token': token },
      });
      const visitsData = await visitsRes.json();
      if (visitsData.success) {
        setVisits(visitsData.data || []);
        await AsyncStorage.setItem('cached_visits', JSON.stringify(visitsData.data || []));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      await loadCachedData();
      Alert.alert('Error', 'Failed to fetch data. Showing cached version.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (!isOffline) {
      fetchData();
      fetchPendingAcknowledgments();
      fetchUnreadCount();
    } else {
      Alert.alert('Offline', 'Cannot refresh while offline');
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const openAcceptModal = (visit) => {
    setSelectedVisit(visit);
    setActionType('accept');
    setAcknowledgeNotes('');
    setShowAcknowledgeModal(true);
  };

  const openDeclineModal = (visit) => {
    setSelectedVisit(visit);
    setActionType('decline');
    setDeclineReason('');
    setShowAcknowledgeModal(true);
  };

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/visits/${selectedVisit.visit_id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ notes: acknowledgeNotes }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Visit confirmed!');
        setShowAcknowledgeModal(false);
        setSelectedVisit(null);
        setAcknowledgeNotes('');
        fetchPendingAcknowledgments();
        fetchData();
      } else {
        Alert.alert('Error', data.message || 'Failed to confirm visit');
      }
    } catch (error) {
      console.error('Error accepting visit:', error);
      Alert.alert('Error', 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for declining');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/visits/${selectedVisit.visit_id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ reason: declineReason }),
      });
      const data = await response.json();
      if (data.success) {
        let message = 'Visit declined.';
        if (data.reassigned) message += ` Reassigned to ${data.new_caregiver.name}.`;
        else if (data.pending_reassignment) message += ' No other caregivers available. Family will be notified.';
        Alert.alert('Success', message);
        setShowAcknowledgeModal(false);
        setSelectedVisit(null);
        setDeclineReason('');
        fetchPendingAcknowledgments();
        fetchData();
      } else {
        Alert.alert('Error', data.message || 'Failed to decline visit');
      }
    } catch (error) {
      console.error('Error declining visit:', error);
      Alert.alert('Error', 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const SectionHeader = ({ title, section, icon, count }) => (
    <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(section)} activeOpacity={0.7}>
      <View style={styles.sectionHeaderLeft}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
        {count !== undefined && <Text style={styles.sectionCount}>({count})</Text>}
      </View>
      <Ionicons name={expandedSections[section] ? "chevron-up" : "chevron-down"} size={20} color="#4A627A" />
    </TouchableOpacity>
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return '#2196F3';
      case 'confirmed': return '#4CAF50';
      case 'in_progress': return '#FF9800';
      case 'completed': return '#4CAF50';
      case 'missed': return '#F44336';
      case 'declined': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2C7DA0" />
        <Text style={styles.loadingText}>Loading your schedule...</Text>
      </View>
    );
  }

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  const todayVisits = visits.filter(v => new Date(v.scheduled_time).toISOString().split('T')[0] === todayString);
  const upcomingVisits = visits.filter(v => new Date(v.scheduled_time) > today && v.status !== 'completed');
  const completedVisits = visits.filter(v => v.status === 'completed');

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2C7DA0" />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="wifi-outline" size={16} color="#fff" />
            <Text style={styles.offlineText}> Offline Mode - Using cached data</Text>
          </View>
        )}

        <LinearGradient
          colors={['#2C7DA0', '#61A5C2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name || 'Caregiver'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>CAREGIVER</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => navigation.navigate('NotificationScreen')} style={styles.notificationButton} activeOpacity={0.7}>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <LinearGradient colors={['#2C7DA0', '#61A5C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingAcknowledgments.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </LinearGradient>
          <LinearGradient colors={['#61A5C2', '#A9D6E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Text style={styles.statNumber}>{todayVisits.length}</Text>
            <Text style={styles.statLabel}>Today's Visits</Text>
          </LinearGradient>
          <LinearGradient colors={['#2C7DA0', '#61A5C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Text style={styles.statNumber}>{upcomingVisits.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </LinearGradient>
        </View>

        {pendingAcknowledgments.length > 0 && (
          <Card style={styles.card}>
            <SectionHeader
              title="Pending Confirmation"
              section="pending"
              icon={<Ionicons name="time-outline" size={20} color="#FF9800" />}
              count={pendingAcknowledgments.length}
            />
            {expandedSections.pending && (
              <View style={styles.cardContent}>
                {pendingAcknowledgments.map((visit) => (
                  <View key={visit.visit_id} style={styles.pendingItem}>
                    <View style={styles.visitHeader}>
                      <View>
                        <Text style={styles.visitPatient}>{visit.recipient_name}</Text>
                        <Text style={styles.visitTime}>{formatDate(visit.scheduled_time)} at {formatTime(visit.scheduled_time)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: '#FF980020' }]}>
                        <Text style={[styles.statusText, { color: '#FF9800' }]}>AWAITING</Text>
                      </View>
                    </View>
                    {visit.address && (
                      <View style={styles.visitAddress}>
                        <Ionicons name="location-outline" size={12} color="#4A627A" />
                        <Text style={{ marginLeft: 4 }}>{visit.address}</Text>
                      </View>
                    )}
                    <View style={styles.pendingActions}>
                      <TouchableOpacity style={styles.acceptButton} onPress={() => openAcceptModal(visit)} activeOpacity={0.7}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.acceptButtonText}> Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.declineButton} onPress={() => openDeclineModal(visit)} activeOpacity={0.7}>
                        <Ionicons name="close" size={16} color="#fff" />
                        <Text style={styles.declineButtonText}> Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Today's Visits with Info Button */}
        <Card style={styles.card}>
          <SectionHeader
            title="Today's Visits"
            section="today"
            icon={<Ionicons name="today-outline" size={20} color="#1A2C3E" />}
            count={todayVisits.length}
          />
          {expandedSections.today && (
            <View style={styles.cardContent}>
              {todayVisits.length > 0 ? (
                todayVisits.map((visit) => (
                  <View key={visit.visit_id} style={styles.visitItem}>
                    <View style={styles.visitHeader}>
                      <View style={styles.visitHeaderLeft}>
                        <Text style={styles.visitPatient}>{visit.care_recipient_name}</Text>
                        <Text style={styles.visitTime}>{formatTime(visit.scheduled_time)}</Text>
                      </View>
                      <View style={styles.visitHeaderRight}>
                        <TouchableOpacity 
                          style={styles.infoButton}
                          onPress={() => fetchPatientInfo(visit.care_recipient_id, visit.care_recipient_name)}
                        >
                          <Ionicons name="information-circle-outline" size={24} color="#2C7DA0" />
                        </TouchableOpacity>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visit.status) + '20' }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(visit.status) }]}>
                            {visit.status?.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {visit.notes && (
                      <View style={styles.visitNotes}>
                        <Ionicons name="document-text-outline" size={12} color="#4A627A" />
                        <Text style={{ marginLeft: 4 }}>{visit.notes}</Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={styles.viewDetailsButton}
                      onPress={() => navigation.navigate('VisitDetails', { visitId: visit.visit_id, patientName: visit.care_recipient_name })}
                    >
                      <Text style={styles.viewDetailsText}>View Details →</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No visits scheduled for today</Text>
              )}
            </View>
          )}
        </Card>

        {/* Upcoming Visits with Info Button */}
        <Card style={styles.card}>
          <SectionHeader
            title="Upcoming Visits"
            section="upcoming"
            icon={<Ionicons name="calendar-outline" size={20} color="#1A2C3E" />}
            count={upcomingVisits.length}
          />
          {expandedSections.upcoming && (
            <View style={styles.cardContent}>
              {upcomingVisits.length > 0 ? (
                upcomingVisits.map((visit) => (
                  <View key={visit.visit_id} style={styles.visitItem}>
                    <View style={styles.visitHeader}>
                      <View style={styles.visitHeaderLeft}>
                        <Text style={styles.visitPatient}>{visit.care_recipient_name}</Text>
                        <Text style={styles.visitTime}>{formatDate(visit.scheduled_time)} at {formatTime(visit.scheduled_time)}</Text>
                      </View>
                      <View style={styles.visitHeaderRight}>
                        <TouchableOpacity 
                          style={styles.infoButton}
                          onPress={() => fetchPatientInfo(visit.care_recipient_id, visit.care_recipient_name)}
                        >
                          <Ionicons name="information-circle-outline" size={24} color="#2C7DA0" />
                        </TouchableOpacity>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visit.status) + '20' }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(visit.status) }]}>
                            {visit.status?.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {visit.notes && (
                      <View style={styles.visitNotes}>
                        <Ionicons name="document-text-outline" size={12} color="#4A627A" />
                        <Text style={{ marginLeft: 4 }}>{visit.notes}</Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={styles.viewDetailsButton}
                      onPress={() => navigation.navigate('VisitDetails', { visitId: visit.visit_id, patientName: visit.care_recipient_name })}
                    >
                      <Text style={styles.viewDetailsText}>View Details →</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No upcoming visits</Text>
              )}
            </View>
          )}
        </Card>

        {completedVisits.length > 0 && (
          <Card style={styles.card}>
            <SectionHeader
              title="Completed Visits"
              section="completed"
              icon={<Ionicons name="checkmark-done-circle-outline" size={20} color="#4CAF50" />}
              count={completedVisits.length}
            />
            {expandedSections.completed && (
              <View style={styles.cardContent}>
                {completedVisits.slice(0, 5).map((visit) => (
                  <TouchableOpacity key={visit.visit_id} style={styles.visitItem} onPress={() => navigation.navigate('VisitDetails', { visitId: visit.visit_id, patientName: visit.care_recipient_name })}>
                    <View style={styles.visitHeader}>
                      <View>
                        <Text style={styles.visitPatient}>{visit.care_recipient_name}</Text>
                        <Text style={styles.visitTime}>{formatDate(visit.scheduled_time)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(visit.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(visit.status) }]}>{visit.status?.toUpperCase()}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                {completedVisits.length > 5 && <Text style={styles.moreText}>+ {completedVisits.length - 5} more visits</Text>}
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Acknowledge Modal */}
      <Modal visible={showAcknowledgeModal} animationType="slide" transparent={true} onRequestClose={() => setShowAcknowledgeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{actionType === 'accept' ? 'Confirm Visit' : 'Decline Visit'}</Text>
              <TouchableOpacity onPress={() => setShowAcknowledgeModal(false)}>
                <Ionicons name="close" size={24} color="#4A627A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedVisit && (
                <>
                  <View style={styles.modalInfo}>
                    <Ionicons name="person-outline" size={16} color="#1A2C3E" />
                    <Text style={styles.modalInfoLabel}> Patient:</Text>
                    <Text style={styles.modalInfoValue}>{selectedVisit.recipient_name}</Text>
                  </View>
                  <View style={styles.modalInfo}>
                    <Ionicons name="calendar-outline" size={16} color="#1A2C3E" />
                    <Text style={styles.modalInfoLabel}> Date & Time:</Text>
                    <Text style={styles.modalInfoValue}>{formatDate(selectedVisit.scheduled_time)} at {formatTime(selectedVisit.scheduled_time)}</Text>
                  </View>
                  {selectedVisit.address && (
                    <View style={styles.modalInfo}>
                      <Ionicons name="location-outline" size={16} color="#1A2C3E" />
                      <Text style={styles.modalInfoLabel}> Location:</Text>
                      <Text style={styles.modalInfoValue}>{selectedVisit.address}</Text>
                    </View>
                  )}
                </>
              )}
              {actionType === 'accept' ? (
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Notes (Optional)</Text>
                  <TextInput style={[styles.modalInput, styles.modalTextArea]} value={acknowledgeNotes} onChangeText={setAcknowledgeNotes} placeholder="Any notes or questions about this visit..." placeholderTextColor="#999" multiline numberOfLines={3} />
                </View>
              ) : (
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Reason for Declining *</Text>
                  <TextInput style={[styles.modalInput, styles.modalTextArea]} value={declineReason} onChangeText={setDeclineReason} placeholder="e.g., Already at max visits, unavailable, etc." placeholderTextColor="#999" multiline numberOfLines={3} />
                </View>
              )}
              <TouchableOpacity style={[styles.modalSubmitButton, submitting && styles.modalSubmitButtonDisabled, actionType === 'decline' && styles.declineModalButton]} onPress={actionType === 'accept' ? handleAccept : handleDecline} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitButtonText}>{actionType === 'accept' ? 'Confirm Visit' : 'Decline Visit'}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Patient Info Modal */}
      <Modal
        visible={showPatientInfoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPatientInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.patientInfoModalContent]}>
            <LinearGradient
              colors={['#2C7DA0', '#61A5C2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeaderGradient}
            >
              <Text style={styles.modalHeaderTitle}>Patient Information</Text>
              <TouchableOpacity onPress={() => setShowPatientInfoModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.patientInfoBody} showsVerticalScrollIndicator={false}>
              {loadingPatientInfo ? (
                <ActivityIndicator size="large" color="#2C7DA0" style={{ marginTop: 40 }} />
              ) : (
                <>
                  <Text style={styles.patientNameTitle}>{selectedPatient?.name}</Text>

                  {/* Medical Conditions */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoSectionHeader}>
                      <FontAwesome5 name="stethoscope" size={18} color="#2C7DA0" />
                      <Text style={styles.infoSectionTitle}> Medical Conditions</Text>
                    </View>
                    {patientInfo?.conditions?.length > 0 ? (
                      patientInfo.conditions.map((condition, idx) => (
                        <View key={idx} style={styles.conditionItem}>
                          <Text style={styles.conditionName}>{condition.condition_name}</Text>
                          {condition.description && (
                            <Text style={styles.conditionDesc}>{condition.description}</Text>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noDataText}>No medical conditions recorded</Text>
                    )}
                  </View>

                  {/* Current Medications */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoSectionHeader}>
                      <MaterialIcons name="medication" size={18} color="#2C7DA0" />
                      <Text style={styles.infoSectionTitle}> Current Medications</Text>
                    </View>
                    {patientInfo?.medications?.length > 0 ? (
                      patientInfo.medications.map((med, idx) => (
                        <View key={idx} style={styles.medicationItem}>
                          <Text style={styles.medicationName}>{med.name}</Text>
                          <Text style={styles.medicationDetail}>{med.dosage} - {med.frequency}</Text>
                          {med.instructions && (
                            <Text style={styles.medicationInstruction}>📌 {med.instructions}</Text>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noDataText}>No active medications</Text>
                    )}
                  </View>

                  {/* Emergency Contact */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoSectionHeader}>
                      <Ionicons name="call-outline" size={18} color="#2C7DA0" />
                      <Text style={styles.infoSectionTitle}> Emergency Contact</Text>
                    </View>
                    <Text style={styles.emergencyName}>
                      {patientInfo?.emergency_contact_name || 'Not provided'}
                    </Text>
                    <Text style={styles.emergencyPhone}>
                      {patientInfo?.emergency_contact_phone || 'Not provided'}
                    </Text>
                  </View>

                  {/* Special Instructions */}
                  {patientInfo?.special_instructions && (
                    <View style={styles.infoSection}>
                      <View style={styles.infoSectionHeader}>
                        <Ionicons name="alert-circle-outline" size={18} color="#FF9800" />
                        <Text style={styles.infoSectionTitle}> Special Instructions</Text>
                      </View>
                      <Text style={styles.specialInstructions}>{patientInfo.special_instructions}</Text>
                    </View>
                  )}

                  {/* Recent Visit Notes */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoSectionHeader}>
                      <Ionicons name="document-text-outline" size={18} color="#2C7DA0" />
                      <Text style={styles.infoSectionTitle}> Recent Visit Notes</Text>
                    </View>
                    {patientInfo?.recent_visits?.length > 0 ? (
                      patientInfo.recent_visits.map((visit, idx) => (
                        <View key={idx} style={styles.recentVisitItem}>
                          <Text style={styles.recentVisitDate}>{formatDisplayDate(visit.date)}</Text>
                          <Text style={styles.recentVisitCaregiver}>Caregiver: {visit.caregiver_name}</Text>
                          {visit.notes && (
                            <Text style={styles.recentVisitNote}>📝 {visit.notes}</Text>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noDataText}>No recent visit notes</Text>
                    )}
                  </View>

                  {/* Caregiver Notes Section */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoSectionHeader}>
                      <Ionicons name="create-outline" size={18} color="#2C7DA0" />
                      <Text style={styles.infoSectionTitle}> My Notes</Text>
                    </View>
                    
                    <View style={styles.addNoteContainer}>
                      <TextInput
                        style={styles.noteInput}
                        placeholder="Add a note about this patient..."
                        placeholderTextColor="#A9D6E5"
                        value={newNote}
                        onChangeText={setNewNote}
                        multiline
                      />
                      <TouchableOpacity 
                        style={styles.addNoteButton}
                        onPress={addPatientNote}
                        disabled={addingNote}
                      >
                        <LinearGradient
                          colors={['#2C7DA0', '#61A5C2']}
                          style={styles.addNoteGradient}
                        >
                          {addingNote ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.addNoteButtonText}>Add Note</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>

                    {patientNotes.length > 0 ? (
                      patientNotes.map((note, idx) => (
                        <View key={idx} style={styles.noteItem}>
                          <Text style={styles.noteDate}>{formatDisplayDate(note.created_at)}</Text>
                          <Text style={styles.noteText}>{note.note}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noDataText}>No notes added yet</Text>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFE' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFE' },
  loadingText: { marginTop: 10, color: '#4A627A', fontSize: 16 },
  offlineBanner: { backgroundColor: '#FF9800', padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  offlineText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  header: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerText: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  welcomeText: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  roleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  logoutButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 },
  notificationButton: { position: 'relative', padding: 8 },
  notificationIcon: { fontSize: 24, color: '#fff' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#F44336', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 4, textAlign: 'center' },
  card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: 1, borderColor: '#E8EEF2' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E8EEF2' },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A2C3E' },
  sectionCount: { fontSize: 14, color: '#4A627A', marginLeft: 8 },
  cardContent: { padding: 16 },
  pendingItem: { borderBottomWidth: 1, borderBottomColor: '#E8EEF2', paddingVertical: 12 },
  pendingActions: { flexDirection: 'row', marginTop: 12, gap: 12 },
  acceptButton: { backgroundColor: '#4CAF50', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  acceptButtonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 4 },
  declineButton: { backgroundColor: '#F44336', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  declineButtonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 4 },
  visitItem: { borderBottomWidth: 1, borderBottomColor: '#E8EEF2', paddingVertical: 12 },
  visitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  visitHeaderLeft: { flex: 1 },
  visitHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  visitPatient: { fontSize: 16, fontWeight: '500', color: '#1A2C3E' },
  visitTime: { fontSize: 13, color: '#4A627A', marginTop: 2 },
  infoButton: { padding: 4 },
  viewDetailsButton: { marginTop: 8, alignSelf: 'flex-start' },
  viewDetailsText: { fontSize: 13, color: '#2C7DA0', fontWeight: '500' },
  visitAddress: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  visitNotes: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  emptyText: { fontStyle: 'italic', color: '#4A627A', textAlign: 'center', padding: 16 },
  moreText: { fontSize: 12, color: '#2C7DA0', textAlign: 'center', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E8EEF2' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1A2C3E' },
  modalBody: { padding: 20 },
  modalInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E8EEF2', flexWrap: 'wrap' },
  modalInfoLabel: { fontSize: 14, fontWeight: '600', color: '#1A2C3E' },
  modalInfoValue: { fontSize: 14, color: '#4A627A', flex: 1 },
  modalField: { marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '500', color: '#1A2C3E', marginBottom: 6 },
  modalInput: { borderWidth: 1, borderColor: '#E8EEF2', borderRadius: 12, padding: 12, fontSize: 14, backgroundColor: '#FFFFFF', color: '#1A2C3E' },
  modalTextArea: { height: 80, textAlignVertical: 'top' },
  modalSubmitButton: { backgroundColor: '#2C7DA0', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  declineModalButton: { backgroundColor: '#F44336' },
  modalSubmitButtonDisabled: { opacity: 0.6 },
  modalSubmitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // Patient Info Modal Styles
  patientInfoModalContent: { maxHeight: '90%' },
  modalHeaderGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeaderTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  patientInfoBody: { padding: 20 },
  patientNameTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A2C3E', textAlign: 'center', marginBottom: 20 },
  infoSection: { marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#E8EEF2', paddingBottom: 16 },
  infoSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoSectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A2C3E', marginLeft: 8 },
  conditionItem: { marginBottom: 8, paddingLeft: 8, borderLeftWidth: 3, borderLeftColor: '#2C7DA0' },
  conditionName: { fontSize: 14, fontWeight: '500', color: '#1A2C3E' },
  conditionDesc: { fontSize: 12, color: '#4A627A', marginTop: 2 },
  medicationItem: { marginBottom: 10, paddingLeft: 8, borderLeftWidth: 3, borderLeftColor: '#61A5C2' },
  medicationName: { fontSize: 14, fontWeight: '500', color: '#1A2C3E' },
  medicationDetail: { fontSize: 12, color: '#4A627A' },
  medicationInstruction: { fontSize: 11, color: '#2C7DA0', marginTop: 2 },
  emergencyName: { fontSize: 14, color: '#1A2C3E', fontWeight: '500', marginBottom: 4 },
  emergencyPhone: { fontSize: 13, color: '#2C7DA0' },
  specialInstructions: { fontSize: 13, color: '#FF9800', backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8 },
  recentVisitItem: { marginBottom: 12, padding: 10, backgroundColor: '#F8FAFE', borderRadius: 8 },
  recentVisitDate: { fontSize: 12, fontWeight: '600', color: '#2C7DA0', marginBottom: 4 },
  recentVisitCaregiver: { fontSize: 11, color: '#4A627A', marginBottom: 2 },
  recentVisitNote: { fontSize: 12, color: '#4A627A', fontStyle: 'italic' },
  addNoteContainer: { marginBottom: 16 },
  noteInput: { borderWidth: 1, borderColor: '#E8EEF2', borderRadius: 12, padding: 12, fontSize: 14, backgroundColor: '#FFFFFF', color: '#1A2C3E', minHeight: 70, textAlignVertical: 'top', marginBottom: 10 },
  addNoteButton: { borderRadius: 12, overflow: 'hidden' },
  addNoteGradient: { paddingVertical: 10, alignItems: 'center' },
  addNoteButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  noteItem: { backgroundColor: '#F8FAFE', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#E8EEF2' },
  noteDate: { fontSize: 10, color: '#A9D6E5', marginBottom: 4 },
  noteText: { fontSize: 13, color: '#1A2C3E' },
  noDataText: { fontSize: 13, color: '#4A627A', fontStyle: 'italic', paddingLeft: 8, textAlign: 'center', padding: 20 },
});

export default CaregiverDashboard;