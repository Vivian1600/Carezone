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
  FlatList,
  StatusBar,
} from 'react-native';
import { Card } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { useDarkMode } from '../context/DarkModeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

import { API_BASE_URL } from '../config';

const FamilyDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigation = useNavigation();
  const { colors, isDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    recipients: true,
    upcoming: true,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  
  // Medications modal states
  const [showMedicationsModal, setShowMedicationsModal] = useState(false);
  const [selectedRecipientMedications, setSelectedRecipientMedications] = useState([]);
  const [loadingMedications, setLoadingMedications] = useState(false);
  
  // Availability states
  const [weeklyAvailability, setWeeklyAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [dateAvailability, setDateAvailability] = useState(null);
  const [checkingDate, setCheckingDate] = useState(false);
  const [weekDates, setWeekDates] = useState([]);
  
  // Modal states for scheduling
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleRecipientId, setScheduleRecipientId] = useState(null);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Report modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportRecipient, setReportRecipient] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  
  // Report history states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryReport, setSelectedHistoryReport] = useState(null);

  // Add Care Recipient Modal states
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [submittingRecipient, setSubmittingRecipient] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    email: '',
    date_of_birth: '',
    gender: 'Male',
    address: '',
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_notes: '',
    relationship: 'spouse',
  });

  // NetInfo for online/offline detection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      if (state.isConnected && isOffline) {
        onRefresh();
      }
    });
    const checkInitialConnection = async () => {
      const state = await NetInfo.fetch();
      setIsOffline(!state.isConnected);
    };
    checkInitialConnection();
    return () => unsubscribe();
  }, []);

  // Fetch unread notifications count
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

  const generateWeekDates = () => {
    const dates = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][i];
      dates.push({
        date: dateStr,
        dayName: dayName,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return dates;
  };

  const fetchMedicationsForRecipient = async (recipient) => {
    if (isOffline) {
      Alert.alert('Offline', 'You are offline. Please connect to the internet to view medications.');
      return;
    }
    setLoadingMedications(true);
    setSelectedRecipientMedications([]);
    setSelectedRecipient(recipient);
    setShowMedicationsModal(true);
    
    try {
      const url = `${API_BASE_URL}/medications/care-recipient/${recipient.care_recipient_id}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      });
      const data = await response.json();
      if (data.success) {
        const medications = data.medications || data.data || [];
        setSelectedRecipientMedications(medications);
      } else {
        Alert.alert('Error', data.message || 'Failed to load medications');
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
      Alert.alert('Error', 'Network error: ' + error.message);
    } finally {
      setLoadingMedications(false);
    }
  };

  const fetchWeeklyAvailability = async () => {
    if (isOffline) return;
    setAvailabilityLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/availability/week`, {
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      if (data.success) setWeeklyAvailability(data.data);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const checkAvailabilityForDate = async (date) => {
    if (isOffline) return;
    setCheckingDate(true);
    setSelectedDate(date);
    try {
      const response = await fetch(`${API_BASE_URL}/availability/date/${date}`, {
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      if (data.success) setDateAvailability(data.data);
    } catch (error) {
      console.error('Error checking date:', error);
    } finally {
      setCheckingDate(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchWeeklyAvailability();
    fetchUnreadCount();
    setWeekDates(generateWeekDates());
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
      if (profileData.success) setProfile(profileData.data);

      const recipientsRes = await fetch(`${API_BASE_URL}/family-links/my-recipients`, {
        headers: { 'x-auth-token': token },
      });
      const recipientsData = await recipientsRes.json();
      if (recipientsData.success) setRecipients(recipientsData.data || []);

      const visitsRes = await fetch(`${API_BASE_URL}/visits/upcoming`, {
        headers: { 'x-auth-token': token },
      });
      const visitsData = await visitsRes.json();
      if (visitsData.success) setUpcomingVisits(visitsData.data || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    fetchWeeklyAvailability();
    fetchUnreadCount();
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const openScheduleModal = (recipientId) => {
    if (isOffline) {
      Alert.alert('Offline', 'You are offline. Please connect to the internet to schedule a visit.');
      return;
    }
    setScheduleRecipientId(recipientId);
    setShowScheduleModal(true);
    setSelectedDate('');
    setDateAvailability(null);
    setScheduleTime('');
    setScheduleNotes('');
  };

  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setScheduleRecipientId(null);
    setSelectedDate('');
    setDateAvailability(null);
    setScheduleTime('');
    setScheduleNotes('');
  };

  const handleScheduleVisit = async () => {
    if (!selectedDate || !scheduleTime) {
      Alert.alert('Error', 'Please select a date and time');
      return;
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(scheduleTime)) {
      Alert.alert('Error', 'Please enter time in HH:MM format (24-hour)');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/visits/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({
          care_recipient_id: scheduleRecipientId,
          scheduled_date: selectedDate,
          scheduled_time: scheduleTime,
          notes: scheduleNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const caregiverInfo = data.assigned_caregiver;
        Alert.alert(
          'Visit Scheduled Successfully!',
          `Date: ${new Date(selectedDate).toLocaleDateString()}\nTime: ${scheduleTime}\n\nCaregiver: ${caregiverInfo.name}\nPhone: ${caregiverInfo.phone || 'Contact available in app'}`,
          [{ text: 'OK', onPress: () => { closeScheduleModal(); fetchData(); fetchWeeklyAvailability(); } }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to schedule visit');
      }
    } catch (error) {
      console.error('Network error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openWeeklyReport = async (recipient) => {
    if (isOffline) {
      Alert.alert('Offline', 'You are offline. Please connect to the internet to view reports.');
      return;
    }
    setReportRecipient(recipient);
    setShowReportModal(true);
    setLoadingReport(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/weekly/${recipient.care_recipient_id}`, {
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      if (data.success) setReportData(data.report);
      else Alert.alert('Error', 'Failed to load report');
    } catch (error) {
      console.error('Error loading report:', error);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoadingReport(false);
    }
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportRecipient(null);
    setReportData(null);
  };

  const fetchReportHistory = async (recipient) => {
    if (isOffline) {
      Alert.alert('Offline', 'You are offline. Please connect to the internet to view report history.');
      return;
    }
    setSelectedRecipient(recipient);
    setLoadingHistory(true);
    setShowHistoryModal(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/history/${recipient.care_recipient_id}`, {
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      if (data.success) setReportHistory(data.reports || []);
      else Alert.alert('Error', 'Failed to load report history');
    } catch (error) {
      console.error('Error loading report history:', error);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadHistoricalReport = async (reportId) => {
    setLoadingReport(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      if (data.success) {
        setReportData(data.report);
        setShowHistoryModal(false);
        setShowReportModal(true);
      } else {
        Alert.alert('Error', 'Failed to load report');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoadingReport(false);
    }
  };
  
  const handleAddRecipient = async () => {
    if (!newRecipient.name || !newRecipient.date_of_birth || !newRecipient.emergency_contact_name || !newRecipient.emergency_contact_phone) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSubmittingRecipient(true);
    try {
      const response = await fetch(`${API_BASE_URL}/care-recipients/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({
          name: newRecipient.name,
          email: newRecipient.email || null,
          phone: newRecipient.phone,
          date_of_birth: newRecipient.date_of_birth,
          gender: newRecipient.gender,
          address: newRecipient.address,
          emergency_contact_name: newRecipient.emergency_contact_name,
          emergency_contact_phone: newRecipient.emergency_contact_phone,
          medical_notes: newRecipient.medical_notes,
          relationship: newRecipient.relationship,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', `Care recipient "${newRecipient.name}" added successfully!`);
        setShowAddRecipientModal(false);
        setNewRecipient({
          name: '', email: '', date_of_birth: '', gender: 'Male', address: '', phone: '',
          emergency_contact_name: '', emergency_contact_phone: '', medical_notes: '', relationship: 'spouse',
        });
        fetchData();
      } else {
        if (data.errors) {
          const errorMessages = data.errors.map(err => `${err.field}: ${err.message}`).join('\n');
          Alert.alert('Validation Error', errorMessages);
        } else {
          Alert.alert('Error', data.message || 'Failed to add care recipient');
        }
      }
    } catch (error) {
      console.error('Error adding recipient:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSubmittingRecipient(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return '#2196F3';
      case 'in_progress': return '#FF9800';
      case 'completed': return '#4CAF50';
      case 'missed': return '#F44336';
      default: return '#9E9E9E';
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

  const renderMedicationItem = ({ item }) => (
    <View style={styles.medicationItemModal}>
      <View style={styles.medicationHeaderModal}>
        <Text style={styles.medicationNameModal}>{item.name || 'Unknown'}</Text>
        <View style={[styles.medicationStatusBadge, { backgroundColor: item.is_active ? '#4CAF5020' : '#F4433620' }]}>
          <Text style={[styles.medicationStatusText, { color: item.is_active ? '#4CAF50' : '#F44336' }]}>
            {item.is_active ? 'Active' : 'Discontinued'}
          </Text>
        </View>
      </View>
      <View style={styles.medicationDosageModal}>
        <MaterialIcons name="medication" size={14} color="#4A627A" />
        <Text style={{ marginLeft: 4 }}>{item.dosage || 'N/A'} - {item.frequency || 'N/A'}</Text>
      </View>
      {item.medical_condition && (
        <View style={styles.medicationConditionModal}>
          <FontAwesome5 name="stethoscope" size={12} color="#2C7DA0" />
          <Text style={{ marginLeft: 4 }}>For: {item.medical_condition}</Text>
        </View>
      )}
      {item.instructions && (
        <View style={styles.medicationInstructionsModal}>
          <Ionicons name="information-circle" size={12} color="#61A5C2" />
          <Text style={{ marginLeft: 4 }}>{item.instructions}</Text>
        </View>
      )}
      {item.start_date && (
        <View style={styles.medicationDateModal}>
          <Ionicons name="calendar" size={11} color="#4A627A" />
          <Text style={{ marginLeft: 4 }}>Started: {formatDate(item.start_date)}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2C7DA0" />
        <Text style={styles.loadingText}>Loading your family dashboard...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2C7DA0" />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="wifi-outline" size={16} color="#fff" />
            <Text style={styles.offlineText}> Offline Mode - Connect to internet to refresh</Text>
          </View>
        )}

        {/* Gradient Header */}
        <LinearGradient
          colors={['#2C7DA0', '#61A5C2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name || 'Family Member'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>FAMILY MEMBER</Text>
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

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <LinearGradient colors={['#2C7DA0', '#61A5C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Text style={styles.statNumber}>{recipients.length}</Text>
            <Text style={styles.statLabel}>Care Recipients</Text>
          </LinearGradient>
          <LinearGradient colors={['#61A5C2', '#A9D6E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Text style={styles.statNumber}>{upcomingVisits.length}</Text>
            <Text style={styles.statLabel}>Upcoming Visits</Text>
          </LinearGradient>
          <TouchableOpacity
            style={styles.statCardWrapper}
            onPress={() => {
              if (recipients.length > 0) {
                fetchMedicationsForRecipient(recipients[0]);
              } else {
                Alert.alert('No Recipients', 'No care recipients added yet.');
              }
            }}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#2C7DA0', '#61A5C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
              <Text style={styles.statNumber}>
                {recipients.reduce((sum, r) => sum + (r.medications_count || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Total Medications</Text>
              <Text style={styles.statTapHint}>Tap to view</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Weekly Availability Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Weekly Availability</Text>
            {availabilityLoading ? (
              <ActivityIndicator size="small" color="#2C7DA0" />
            ) : weeklyAvailability ? (
              Object.entries(weeklyAvailability).map(([day, info]) => (
                <View key={day} style={styles.availabilityRow}>
                  <Text style={styles.availabilityDay}>{day}</Text>
                  {info.available ? (
                    <View style={styles.availabilityAvailable}>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                      <Text style={{ marginLeft: 4 }}>{info.caregiver_count} available</Text>
                    </View>
                  ) : (
                    <View style={styles.availabilityUnavailable}>
                      <Ionicons name="close-circle" size={14} color="#F44336" />
                      <Text style={{ marginLeft: 4 }}>No caregivers available</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>Loading availability...</Text>
            )}
          </Card.Content>
        </Card>

        {/* Add Care Recipient Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddRecipientModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#2C7DA0', '#61A5C2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}> Add Care Recipient</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Care Recipients Section */}
        <Card style={styles.card}>
          <SectionHeader
            title="My Care Recipients"
            section="recipients"
            icon={<Ionicons name="people-outline" size={20} color="#1A2C3E" />}
            count={recipients.length}
          />
          {expandedSections.recipients && (
            <View style={styles.cardContent}>
              {recipients.length > 0 ? (
                recipients.map((recipient, index) => (
                  <View key={recipient.care_recipient_id || index} style={styles.recipientItem}>
                    <View style={styles.recipientHeader}>
                      <View style={styles.recipientInfo}>
                        <Text style={styles.recipientName}>{recipient.name}</Text>
                        <Text style={styles.recipientRelation}>Relationship: {recipient.relationship}</Text>
                      </View>
                      <View style={styles.recipientActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => openScheduleModal(recipient.care_recipient_id)}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={['#2C7DA0', '#61A5C2']}
                            style={styles.actionButtonGradient}
                          >
                            <Ionicons name="calendar-outline" size={20} color="#fff" />
                          </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => fetchMedicationsForRecipient(recipient)}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={['#61A5C2', '#A9D6E5']}
                            style={styles.actionButtonGradient}
                          >
                            <MaterialIcons name="medication" size={20} color="#fff" />
                          </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => openWeeklyReport(recipient)}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={['#A9D6E5', '#61A5C2']}
                            style={styles.actionButtonGradient}
                          >
                            <Feather name="bar-chart-2" size={20} color="#1A2C3E" />
                          </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => fetchReportHistory(recipient)}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={['#E8EEF2', '#A9D6E5']}
                            style={styles.actionButtonGradient}
                          >
                            <Ionicons name="time-outline" size={20} color="#2C7DA0" />
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {recipient.assigned_caregiver_name && (
                      <View style={styles.caregiverContact}>
                        <FontAwesome5 name="user-md" size={14} color="#2C7DA0" />
                        <Text style={styles.caregiverLabel}> Caregiver: {recipient.assigned_caregiver_name}</Text>
                        <Text style={styles.caregiverPhone}>{recipient.caregiver_phone || 'Contact info not available'}</Text>
                      </View>
                    )}
                    {index < recipients.length - 1 && <View style={styles.divider} />}
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No care recipients linked</Text>
              )}
            </View>
          )}
        </Card>

        {/* Upcoming Visits Section */}
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
                upcomingVisits.map((visit, index) => (
                  <View key={visit.visit_id || index} style={styles.visitItem}>
                    <View style={styles.visitHeader}>
                      <View>
                        <Text style={styles.visitPatient}>{visit.care_recipient_name}</Text>
                        <Text style={styles.visitDateTime}>
                          {formatDate(visit.scheduled_time)} at {formatTime(visit.scheduled_time)}
                        </Text>
                      </View>
                      <View style={[styles.visitStatusBadge, { backgroundColor: getStatusColor(visit.status) + '20' }]}>
                        <Text style={[styles.visitStatusText, { color: getStatusColor(visit.status) }]}>{visit.status?.toUpperCase()}</Text>
                      </View>
                    </View>
                    
                    {visit.caregiver_name ? (
                      <View style={styles.caregiverInfoCompact}>
                        <FontAwesome5 name="user-md" size={12} color="#4A627A" />
                        <Text style={styles.caregiverInfoLabel}> Caregiver:</Text>
                        <Text style={styles.caregiverInfoName}>{visit.caregiver_name}</Text>
                        {visit.acknowledged && (
                          <View style={styles.confirmedBadge}>
                            <Ionicons name="checkmark" size={10} color="#fff" />
                            <Text style={styles.confirmedBadgeText}> Confirmed</Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.visitCaregiver}>
                        <FontAwesome5 name="user-md" size={12} color="#4A627A" />
                        <Text style={styles.visitCaregiverText}> Caregiver: To be assigned</Text>
                      </View>
                    )}
                    
                    {visit.notes && (
                      <View style={styles.visitNotes}>
                        <Ionicons name="document-text-outline" size={12} color="#4A627A" />
                        <Text style={{ marginLeft: 4 }}>{visit.notes}</Text>
                      </View>
                    )}
                    {index < upcomingVisits.length - 1 && <View style={styles.divider} />}
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No upcoming visits scheduled</Text>
              )}
            </View>
          )}
        </Card>
      </ScrollView>

{/* ==================== SCHEDULE VISIT MODAL ==================== */}
<Modal
  visible={showScheduleModal}
  animationType="slide"
  transparent={true}
  onRequestClose={closeScheduleModal}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Schedule a Visit</Text>
        <TouchableOpacity onPress={closeScheduleModal}>
          <Ionicons name="close" size={24} color="#4A627A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalBody}>
        {/* Date Selection */}
        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Select Date *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScrollView}>
            <View style={styles.dateRow}>
              {weekDates.map((item) => {
                const isSelected = selectedDate === item.date;
                const dateData = weeklyAvailability?.[item.dayName];
                const isAvailable = dateData?.available;
                return (
                  <TouchableOpacity
                    key={item.date}
                    style={[
                      styles.dateOption,
                      isSelected && styles.dateOptionSelected,
                      !isAvailable && styles.dateOptionDisabled
                    ]}
                    onPress={() => isAvailable && checkAvailabilityForDate(item.date)}
                    disabled={!isAvailable}
                  >
                    <Text style={[styles.dateOptionDay, isSelected && styles.dateOptionTextSelected]}>{item.dayName}</Text>
                    <Text style={[styles.dateOptionNumber, isSelected && styles.dateOptionTextSelected]}>{item.displayDate}</Text>
                    {!isAvailable && <Text style={styles.dateOptionUnavailable}>Full</Text>}
                    {isAvailable && dateData && <Text style={styles.dateOptionAvailable}>{dateData.caregiver_count} avail</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          {checkingDate && <ActivityIndicator size="small" color="#2C7DA0" style={{ marginTop: 10 }} />}
          {dateAvailability && dateAvailability.available && (
            <Text style={styles.availabilityMessage}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" /> {dateAvailability.caregiver_count} caregiver(s) available
            </Text>
          )}
          {dateAvailability && !dateAvailability.available && (
            <Text style={styles.unavailabilityMessage}>
              <Ionicons name="close-circle" size={14} color="#F44336" /> No caregivers available. Please select another date.
            </Text>
          )}
        </View>

        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Time (HH:MM)</Text>
          <View style={styles.modalInputWrapper}>
            <Ionicons name="time-outline" size={20} color="#A9D6E5" style={styles.modalInputIcon} />
            <TextInput
              style={styles.modalInput}
              value={scheduleTime}
              onChangeText={setScheduleTime}
              placeholder="e.g., 14:30"
              placeholderTextColor="#A9D6E5"
            />
          </View>
        </View>

        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Notes (Optional)</Text>
          <View style={styles.modalInputWrapper}>
            <Ionicons name="document-text-outline" size={20} color="#A9D6E5" style={styles.modalInputIcon} />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={scheduleNotes}
              onChangeText={setScheduleNotes}
              placeholder="Any special instructions or notes for the visit"
              placeholderTextColor="#A9D6E5"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.modalSubmitButton, (submitting || !selectedDate) && styles.modalSubmitButtonDisabled]}
          onPress={handleScheduleVisit}
          disabled={submitting || !selectedDate}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#2C7DA0', '#61A5C2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalSubmitButtonGradient}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitButtonText}>Schedule Visit</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  </View>
</Modal>

{/* ==================== ADD CARE RECIPIENT MODAL ==================== */}
<Modal
  visible={showAddRecipientModal}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowAddRecipientModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Add Care Recipient</Text>
        <TouchableOpacity onPress={() => setShowAddRecipientModal(false)}>
          <Ionicons name="close" size={24} color="#4A627A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalBody}>
        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Full Name *</Text>
          <View style={styles.modalInputWrapper}>
            <Ionicons name="person-outline" size={20} color="#A9D6E5" style={styles.modalInputIcon} />
            <TextInput
              style={styles.modalInput}
              value={newRecipient.name}
              onChangeText={(text) => setNewRecipient({...newRecipient, name: text})}
              placeholder="Enter full name"
              placeholderTextColor="#A9D6E5"
            />
          </View>
        </View>

        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Email (Optional)</Text>
          <View style={styles.modalInputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#A9D6E5" style={styles.modalInputIcon} />
            <TextInput
              style={styles.modalInput}
              value={newRecipient.email}
              onChangeText={(text) => setNewRecipient({...newRecipient, email: text})}
              placeholder="recipient@email.com"
              placeholderTextColor="#A9D6E5"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Date of Birth (YYYY-MM-DD) *</Text>
          <View style={styles.modalInputWrapper}>
            <Ionicons name="calendar-outline" size={20} color="#A9D6E5" style={styles.modalInputIcon} />
            <TextInput
              style={styles.modalInput}
              value={newRecipient.date_of_birth}
              onChangeText={(text) => setNewRecipient({...newRecipient, date_of_birth: text})}
              placeholder="e.g., 1945-03-15"
              placeholderTextColor="#A9D6E5"
            />
          </View>
        </View>

        <Text style={styles.modalLabel}>Gender</Text>
        <View style={styles.optionsContainer}>
          {['Male', 'Female', 'Other'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.optionButton, newRecipient.gender === opt && styles.optionButtonSelected]}
              onPress={() => setNewRecipient({...newRecipient, gender: opt})}
            >
              <Text style={[styles.optionText, newRecipient.gender === opt && styles.optionTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Phone</Text>
          <View style={styles.modalInputWrapper}>
            <Ionicons name="call-outline" size={20} color="#A9D6E5" style={styles.modalInputIcon} />
            <TextInput
              style={styles.modalInput}
              value={newRecipient.phone}
              onChangeText={(text) => setNewRecipient({...newRecipient, phone: text})}
              placeholder="Phone number"
              placeholderTextColor="#A9D6E5"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Address</Text>
          <View style={styles.modalInputWrapper}>
            <Ionicons name="location-outline" size={20} color="#A9D6E5" style={styles.modalInputIcon} />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={newRecipient.address}
              onChangeText={(text) => setNewRecipient({...newRecipient, address: text})}
              placeholder="Address"
              placeholderTextColor="#A9D6E5"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        <Text style={styles.modalLabel}>Your Relationship *</Text>
        <View style={styles.optionsContainer}>
          {['spouse', 'parent', 'child', 'daughter', 'grandparent', 'son'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.optionButton, newRecipient.relationship === opt && styles.optionButtonSelected]}
              onPress={() => setNewRecipient({...newRecipient, relationship: opt})}
            >
              <Text style={[styles.optionText, newRecipient.relationship === opt && styles.optionTextSelected]}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Emergency Contact</Text>

        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Emergency Contact Name *</Text>
          <View style={styles.modalInputWrapper}>
            <Ionicons name="person-outline" size={20} color="#A9D6E5" style={styles.modalInputIcon} />
            <TextInput
              style={styles.modalInput}
              value={newRecipient.emergency_contact_name}
              onChangeText={(text) => setNewRecipient({...newRecipient, emergency_contact_name: text})}
              placeholder="Emergency contact name"
              placeholderTextColor="#A9D6E5"
            />
          </View>
        </View>

        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Emergency Contact Phone *</Text>
          <View style={styles.modalInputWrapper}>
            <Ionicons name="call-outline" size={20} color="#A9D6E5" style={styles.modalInputIcon} />
            <TextInput
              style={styles.modalInput}
              value={newRecipient.emergency_contact_phone}
              onChangeText={(text) => setNewRecipient({...newRecipient, emergency_contact_phone: text})}
              placeholder="Emergency contact phone"
              placeholderTextColor="#A9D6E5"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.modalField}>
          <Text style={styles.modalLabel}>Medical Notes (optional)</Text>
          <View style={styles.modalInputWrapper}>
            <Ionicons name="document-text-outline" size={20} color="#A9D6E5" style={styles.modalInputIcon} />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={newRecipient.medical_notes}
              onChangeText={(text) => setNewRecipient({...newRecipient, medical_notes: text})}
              placeholder="Any medical conditions, allergies, etc."
              placeholderTextColor="#A9D6E5"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.modalSubmitButton, submittingRecipient && styles.modalSubmitButtonDisabled]}
          onPress={handleAddRecipient}
          disabled={submittingRecipient}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#2C7DA0', '#61A5C2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalSubmitButtonGradient}
          >
            {submittingRecipient ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitButtonText}>Add Care Recipient</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  </View>
</Modal>

{/* ==================== REPORT HISTORY MODAL ==================== */}
<Modal
  visible={showHistoryModal}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowHistoryModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContent, styles.historyModalContent]}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Report History: {selectedRecipient?.name}</Text>
        <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
          <Ionicons name="close" size={24} color="#4A627A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalBody}>
        {loadingHistory ? (
          <View style={styles.reportLoading}>
            <ActivityIndicator size="large" color="#2C7DA0" />
            <Text style={{ marginTop: 10, color: '#4A627A' }}>Loading history...</Text>
          </View>
        ) : reportHistory.length > 0 ? (
          reportHistory.map((report) => (
            <TouchableOpacity
              key={report.report_id}
              style={styles.historyItem}
              onPress={() => loadHistoricalReport(report.report_id)}
              activeOpacity={0.7}
            >
              <View style={styles.historyHeader}>
                <Ionicons name="calendar-outline" size={20} color="#2C7DA0" />
                <Text style={styles.historyWeek}>Week of {formatDate(report.week_start)}</Text>
              </View>
              <View style={styles.historyDateRow}>
                <Ionicons name="time-outline" size={14} color="#A9D6E5" />
                <Text style={styles.historyDate}> Generated: {formatDate(report.generated_at)}</Text>
              </View>
              <View style={styles.historyViewButton}>
                <Text style={styles.historyViewText}>Tap to view →</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyReportContainer}>
            <Ionicons name="document-text-outline" size={48} color="#A9D6E5" />
            <Text style={styles.emptyReportText}>No past reports available</Text>
          </View>
        )}
      </ScrollView>
    </View>
  </View>
</Modal>

{/* ==================== WEEKLY REPORT MODAL ==================== */}
<Modal
  visible={showReportModal}
  animationType="slide"
  transparent={true}
  onRequestClose={closeReportModal}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContent, styles.reportModalContent]}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Weekly Report: {reportRecipient?.name}</Text>
        <TouchableOpacity onPress={closeReportModal}>
          <Ionicons name="close" size={24} color="#4A627A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
        {loadingReport ? (
          <View style={styles.reportLoading}>
            <ActivityIndicator size="large" color="#2C7DA0" />
            <Text style={{ marginTop: 10, color: '#4A627A' }}>Loading report...</Text>
          </View>
        ) : reportData ? (
          <>
            {/* Week Range */}
            <View style={styles.reportSection}>
              <View style={styles.reportSectionHeader}>
                <Ionicons name="calendar-outline" size={20} color="#2C7DA0" />
                <Text style={styles.reportSectionTitle}> Week</Text>
              </View>
              <Text style={styles.reportText}>
                {formatDate(reportData.week?.start)} - {formatDate(reportData.week?.end)}
              </Text>
            </View>

            {/* Summary Stats */}
            <View style={styles.reportSection}>
              <View style={styles.reportSectionHeader}>
                <Ionicons name="stats-chart-outline" size={20} color="#2C7DA0" />
                <Text style={styles.reportSectionTitle}> Summary</Text>
              </View>
              <View style={styles.reportStatsGrid}>
                <View style={styles.reportStatItem}>
                  <Text style={styles.reportStatNumber}>{reportData.summary?.total_visits || 0}</Text>
                  <Text style={styles.reportStatLabel}>Total Visits</Text>
                </View>
                <View style={styles.reportStatItem}>
                  <Text style={styles.reportStatNumber}>{reportData.summary?.completed_visits || 0}</Text>
                  <Text style={styles.reportStatLabel}>Completed</Text>
                </View>
                <View style={styles.reportStatItem}>
                  <Text style={styles.reportStatNumber}>{reportData.summary?.tasks_completed || 0}</Text>
                  <Text style={styles.reportStatLabel}>Tasks Done</Text>
                </View>
              </View>
            </View>

            {/* Medication Adherence */}
            {reportData.summary?.medication_adherence_rate && (
              <View style={styles.reportSection}>
                <View style={styles.reportSectionHeader}>
                  <MaterialIcons name="medication" size={20} color="#2C7DA0" />
                  <Text style={styles.reportSectionTitle}> Medication Adherence</Text>
                </View>
                <View style={styles.adherenceBar}>
                  <View style={[styles.adherenceFill, { width: `${reportData.summary.medication_adherence_rate}%` }]} />
                </View>
                <Text style={styles.adherenceText}>
                  {reportData.summary.medication_adherence_rate}% adherence rate
                </Text>
              </View>
            )}

            {/* Visits List */}
            {reportData.visits && reportData.visits.length > 0 && (
              <View style={styles.reportSection}>
                <View style={styles.reportSectionHeader}>
                  <Ionicons name="calendar-outline" size={20} color="#2C7DA0" />
                  <Text style={styles.reportSectionTitle}> Visits This Week</Text>
                </View>
                {reportData.visits.map((visit, idx) => (
                  <View key={idx} style={styles.reportListItem}>
                    <Text style={styles.reportListItemDate}>
                      {formatDate(visit.date)} - {visit.status?.toUpperCase()}
                    </Text>
                    <Text style={styles.reportListItemText}>
                      <Ionicons name="person-outline" size={12} color="#4A627A" /> Caregiver: {visit.caregiver || 'Not assigned'}
                    </Text>
                    {visit.notes && (
                      <Text style={styles.reportListItemNote}>
                        <Ionicons name="document-text-outline" size={12} color="#4A627A" /> {visit.notes}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Tasks Completed */}
            {reportData.tasks && reportData.tasks.length > 0 && (
              <View style={styles.reportSection}>
                <View style={styles.reportSectionHeader}>
                  <Ionicons name="checkbox-outline" size={20} color="#2C7DA0" />
                  <Text style={styles.reportSectionTitle}> Tasks Completed</Text>
                </View>
                {reportData.tasks.map((task, idx) => (
                  <View key={idx} style={styles.reportListItem}>
                    <Text style={styles.reportListItemDate}>{formatDate(task.date)}</Text>
                    <Text style={styles.reportListItemText}>
                      <Ionicons name="checkmark-circle" size={12} color="#4CAF50" /> {task.description}
                    </Text>
                    {task.notes && <Text style={styles.reportListItemNote}>📝 {task.notes}</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* Well-being Notes */}
            {reportData.well_being_notes && reportData.well_being_notes.length > 0 && (
              <View style={styles.reportSection}>
                <View style={styles.reportSectionHeader}>
                  <Ionicons name="heart-outline" size={20} color="#2C7DA0" />
                  <Text style={styles.reportSectionTitle}> Well-being Notes</Text>
                </View>
                {reportData.well_being_notes.map((note, idx) => (
                  <View key={idx} style={styles.reportListItem}>
                    <Text style={styles.reportListItemDate}>{formatDate(note.date)}</Text>
                    <Text style={styles.reportListItemText}>{note.note}</Text>
                    <Text style={styles.reportListItemCaregiver}>- {note.caregiver}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* If no data */}
            {(!reportData.visits || reportData.visits.length === 0) && 
             (!reportData.tasks || reportData.tasks.length === 0) && (
              <View style={styles.emptyReportContainer}>
                <Ionicons name="document-text-outline" size={48} color="#A9D6E5" />
                <Text style={styles.emptyReportText}>No visits or tasks recorded this week</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyReportContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF9800" />
            <Text style={styles.emptyReportText}>No report data available</Text>
          </View>
        )}
      </ScrollView>
    </View>
  </View>
</Modal>

{/* ==================== MEDICATIONS MODAL ==================== */}
<Modal
  visible={showMedicationsModal}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowMedicationsModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContent, styles.medicationsModalContent]}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>💊 Medications: {selectedRecipient?.name}</Text>
        <TouchableOpacity onPress={() => setShowMedicationsModal(false)}>
          <Ionicons name="close" size={24} color="#4A627A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalBody}>
        {loadingMedications ? (
          <View style={styles.reportLoading}>
            <ActivityIndicator size="large" color="#2C7DA0" />
            <Text style={{ marginTop: 10, color: '#4A627A' }}>Loading medications...</Text>
          </View>
        ) : selectedRecipientMedications.length > 0 ? (
          selectedRecipientMedications.map((item) => (
            <View key={item.medication_id} style={styles.medicationItemModal}>
              <View style={styles.medicationHeaderModal}>
                <Text style={styles.medicationNameModal}>{item.name || 'Unknown'}</Text>
                <View style={[styles.medicationStatusBadge, { backgroundColor: item.is_active ? '#4CAF5020' : '#F4433620' }]}>
                  <Text style={[styles.medicationStatusText, { color: item.is_active ? '#4CAF50' : '#F44336' }]}>
                    {item.is_active ? 'Active' : 'Discontinued'}
                  </Text>
                </View>
              </View>
              <View style={styles.medicationDosageModal}>
                <MaterialIcons name="medication" size={14} color="#4A627A" />
                <Text style={{ marginLeft: 4 }}>{item.dosage || 'N/A'} - {item.frequency || 'N/A'}</Text>
              </View>
              {item.medical_condition && (
                <View style={styles.medicationConditionModal}>
                  <FontAwesome5 name="stethoscope" size={12} color="#2C7DA0" />
                  <Text style={{ marginLeft: 4 }}>For: {item.medical_condition}</Text>
                </View>
              )}
              {item.instructions && (
                <View style={styles.medicationInstructionsModal}>
                  <Ionicons name="information-circle" size={12} color="#61A5C2" />
                  <Text style={{ marginLeft: 4 }}>{item.instructions}</Text>
                </View>
              )}
              {item.start_date && (
                <View style={styles.medicationDateModal}>
                  <Ionicons name="calendar-outline" size={11} color="#4A627A" />
                  <Text style={{ marginLeft: 4 }}>Started: {formatDate(item.start_date)}</Text>
                </View>
              )}
              {item.end_date && (
                <View style={styles.medicationDateModal}>
                  <Ionicons name="calendar-outline" size={11} color="#4A627A" />
                  <Text style={{ marginLeft: 4 }}>Ends: {formatDate(item.end_date)}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noMedicationsContainer}>
            <MaterialIcons name="medication" size={64} color="#A9D6E5" />
            <Text style={styles.noMedicationsText}>No medications prescribed</Text>
            <Text style={styles.noMedicationsSubtext}>Medications will appear here once prescribed by a caregiver</Text>
          </View>
        )}
      </ScrollView>
    </View>
  </View>
</Modal>
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
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCardWrapper: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  statTapHint: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    textAlign: 'center',
  },
  addButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  addButtonGradient: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF2',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2C3E',
  },
  sectionCount: {
    fontSize: 14,
    color: '#4A627A',
    marginLeft: 8,
  },
  sectionToggle: {
    fontSize: 16,
    color: '#4A627A',
  },
  cardContent: {
    padding: 16,
  },
  recipientItem: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF2',
    paddingBottom: 12,
  },
  recipientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2C3E',
  },
  recipientRelation: {
    fontSize: 13,
    color: '#4A627A',
    marginTop: 2,
  },
  recipientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caregiverContact: {
    backgroundColor: '#F8FAFE',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  caregiverLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2C7DA0',
    marginLeft: 6,
  },
  caregiverPhone: {
    fontSize: 12,
    color: '#4A627A',
    marginLeft: 6,
  },
  caregiverInfoCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  caregiverInfoLabel: {
    fontSize: 12,
    color: '#4A627A',
    marginLeft: 4,
  },
  caregiverInfoName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2C7DA0',
    marginLeft: 4,
    marginRight: 8,
  },
  confirmedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmedBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  pendingAckBadge: {
    backgroundColor: '#FF980020',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  pendingAckText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '500',
  },
  visitItem: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF2',
    paddingBottom: 12,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  visitPatient: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2C3E',
  },
  visitDateTime: {
    fontSize: 12,
    color: '#4A627A',
  },
  visitStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  visitStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  visitCaregiver: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitCaregiverText: {
    fontSize: 12,
    color: '#4A627A',
    marginLeft: 4,
  },
  visitNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF2',
  },
  availabilityDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2C3E',
    width: 100,
  },
  availabilityAvailable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityUnavailable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EEF2',
    marginTop: 12,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#4A627A',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  medicationsModalContent: {
    maxHeight: '85%',
  },
  reportModalContent: {
    maxHeight: '90%',
  },
  historyModalContent: {
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF2',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2C3E',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2C3E',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E8EEF2',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#1A2C3E',
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EEF2',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  modalInputIcon: {
    marginLeft: 12,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalInfoBox: {
    backgroundColor: '#F8FAFE',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  modalInfoText: {
    fontSize: 13,
    color: '#2C7DA0',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInfoBullet: {
    fontSize: 12,
    color: '#2C7DA0',
    marginLeft: 10,
    marginBottom: 4,
  },
  modalSubmitButton: {
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSubmitButtonDisabled: {
    opacity: 0.6,
  },
  modalSubmitButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 10,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E8EEF2',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    backgroundColor: '#2C7DA0',
    borderColor: '#2C7DA0',
  },
  optionText: {
    color: '#4A627A',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#fff',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    flexWrap: 'wrap',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#1A2C3E',
    fontWeight: '500',
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E8EEF2',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  toggleButtonActive: {
    backgroundColor: '#2C7DA0',
    borderColor: '#2C7DA0',
  },
  toggleButtonText: {
    color: '#4A627A',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  dateScrollView: {
    maxHeight: 120,
  },
  dateRow: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  dateOption: {
    width: 90,
    padding: 10,
    marginRight: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EEF2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  dateOptionSelected: {
    backgroundColor: '#2C7DA0',
    borderColor: '#2C7DA0',
  },
  dateOptionDisabled: {
    backgroundColor: '#F8FAFE',
    borderColor: '#E8EEF2',
    opacity: 0.6,
  },
  dateOptionDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2C3E',
  },
  dateOptionNumber: {
    fontSize: 11,
    color: '#4A627A',
    marginTop: 4,
  },
  dateOptionTextSelected: {
    color: '#fff',
  },
  dateOptionTextDisabled: {
    color: '#A9D6E5',
  },
  dateOptionUnavailable: {
    fontSize: 10,
    color: '#F44336',
    marginTop: 4,
  },
  dateOptionAvailable: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 4,
  },
  availabilityMessage: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 8,
    textAlign: 'center',
  },
  unavailabilityMessage: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 8,
    textAlign: 'center',
  },
  // Report styles
  reportLoading: {
    padding: 40,
    alignItems: 'center',
  },
  reportSection: {
    marginBottom: 24,
  },
  reportSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C7DA0',
    marginLeft: 8,
  },
  reportText: {
    fontSize: 14,
    color: '#1A2C3E',
  },
  reportStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  reportStatItem: {
    alignItems: 'center',
    backgroundColor: '#F8FAFE',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8EEF2',
  },
  reportStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C7DA0',
  },
  reportStatLabel: {
    fontSize: 11,
    color: '#4A627A',
    marginTop: 4,
  },
  adherenceBar: {
    height: 8,
    backgroundColor: '#E8EEF2',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  adherenceFill: {
    height: '100%',
    backgroundColor: '#61A5C2',
  },
  adherenceText: {
    fontSize: 12,
    color: '#4A627A',
    textAlign: 'center',
  },
  reportListItem: {
    backgroundColor: '#F8FAFE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8EEF2',
  },
  reportListItemDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C7DA0',
    marginBottom: 4,
  },
  reportListItemText: {
    fontSize: 13,
    color: '#1A2C3E',
  },
  reportListItemNote: {
    fontSize: 11,
    color: '#4A627A',
    fontStyle: 'italic',
    marginTop: 4,
  },
  reportListItemCaregiver: {
    fontSize: 11,
    color: '#4A627A',
    marginTop: 2,
    fontStyle: 'italic',
  },
  emptyReportContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyReportText: {
    fontSize: 16,
    color: '#4A627A',
    textAlign: 'center',
    marginTop: 12,
  },
  // History styles
  historyItem: {
    backgroundColor: '#F8FAFE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2C7DA0',
    borderWidth: 1,
    borderColor: '#E8EEF2',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  historyWeek: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2C3E',
  },
  historyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 12,
    color: '#4A627A',
  },
  historyViewButton: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  historyViewText: {
    fontSize: 13,
    color: '#2C7DA0',
    fontWeight: '500',
  },
  // Medication modal styles
  medicationItemModal: {
    backgroundColor: '#F8FAFE',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EEF2',
  },
  medicationHeaderModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationNameModal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2C3E',
    flex: 1,
  },
  medicationStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  medicationStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  medicationDosageModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicationConditionModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicationInstructionsModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicationDateModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  noMedicationsContainer: {
    alignItems: 'center',
    padding: 48,
  },
  noMedicationsIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noMedicationsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2C3E',
    marginBottom: 8,
  },
  noMedicationsSubtext: {
    fontSize: 14,
    color: '#4A627A',
    textAlign: 'center',
  },
});

export default FamilyDashboard;