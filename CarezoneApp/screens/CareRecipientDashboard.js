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
  StatusBar,
} from 'react-native';
import { Card } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { useDarkMode } from '../context/DarkModeContext';
import { LinearGradient } from 'expo-linear-gradient';

import { API_BASE_URL } from '../config';

const CareRecipientDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigation = useNavigation();
  const { colors } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [medicalConditions, setMedicalConditions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [visits, setVisits] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    medical: true,
    medications: true,
    visits: true,
    family: true,
  });

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

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    const checkInitialConnection = async () => {
      const state = await NetInfo.fetch();
      setIsOffline(!state.isConnected);
    };
    checkInitialConnection();
    
    fetchAllData();
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const fetchAllData = async () => {
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

      const detailsRes = await fetch(`${API_BASE_URL}/care-recipients/${user?.id}`, {
        headers: { 'x-auth-token': token },
      });
      const detailsData = await detailsRes.json();
      if (detailsData.success) setProfile(prev => ({ ...prev, ...detailsData.data }));

      const conditionsRes = await fetch(`${API_BASE_URL}/medical-conditions/patient/${user?.id}`, {
        headers: { 'x-auth-token': token },
      });
      const conditionsData = await conditionsRes.json();
      if (conditionsData.success) setMedicalConditions(conditionsData.data || []);

      const medsRes = await fetch(`${API_BASE_URL}/medications/care-recipient/${user?.id}`, {
        headers: { 'x-auth-token': token },
      });
      const medsData = await medsRes.json();
      if (medsData.success) setMedications(medsData.medications || medsData.data || []);

      const visitsRes = await fetch(`${API_BASE_URL}/visits`, {
        headers: { 'x-auth-token': token },
      });
      const visitsData = await visitsRes.json();
      if (visitsData.success) setVisits(visitsData.data || []);

      const familyRes = await fetch(`${API_BASE_URL}/family-links/${user?.id}`, {
        headers: { 'x-auth-token': token },
      });
      const familyData = await familyRes.json();
      if (familyData.success) setFamilyMembers(familyData.data || []);

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
    fetchAllData();
    fetchUnreadCount();
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count !== undefined && <Text style={styles.sectionCount}>({count})</Text>}
      </View>
      <Text style={styles.sectionToggle}>{expandedSections[section] ? '▼' : '▶'}</Text>
    </TouchableOpacity>
  );

  const InfoRow = ({ label, value, isEmergency = false }) => (
    <View style={[styles.infoRow, isEmergency && styles.emergencyRow]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, isEmergency && styles.emergencyValue]}>{value || 'Not provided'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2C7DA0" />
        <Text style={styles.loadingText}>Loading your health information...</Text>
      </View>
    );
  }

  const age = getAge(profile?.date_of_birth);
  const upcomingVisits = visits.filter(v => new Date(v.scheduled_time) > new Date() && v.status !== 'completed');
  const pastVisits = visits.filter(v => new Date(v.scheduled_time) < new Date() || v.status === 'completed');

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2C7DA0" />
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        
        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>📴 Offline Mode - Connect to internet to refresh</Text>
          </View>
        )}

        {/* Gradient Header */}
        <LinearGradient colors={['#2C7DA0', '#61A5C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{profile?.name || user?.name}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>CARE RECIPIENT</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => navigation.navigate('NotificationScreen')} style={styles.notificationButton} activeOpacity={0.7}>
                <Text style={styles.notificationIcon}>🔔</Text>
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats Cards */}
        <View style={styles.statsGrid}>
          <LinearGradient colors={['#2C7DA0', '#61A5C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Text style={styles.statNumber}>{age}</Text>
            <Text style={styles.statLabel}>Age</Text>
          </LinearGradient>
          <LinearGradient colors={['#61A5C2', '#A9D6E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Text style={styles.statNumber}>{medications.length}</Text>
            <Text style={styles.statLabel}>Medications</Text>
          </LinearGradient>
          <LinearGradient colors={['#2C7DA0', '#61A5C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Text style={styles.statNumber}>{upcomingVisits.length}</Text>
            <Text style={styles.statLabel}>Upcoming Visits</Text>
          </LinearGradient>
          <LinearGradient colors={['#61A5C2', '#A9D6E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
            <Text style={styles.statNumber}>{familyMembers.length}</Text>
            <Text style={styles.statLabel}>Family Contacts</Text>
          </LinearGradient>
        </View>

        {/* Personal Information Section */}
        <Card style={styles.card}>
          <SectionHeader title="Personal Information" section="personal" icon="👤" />
          {expandedSections.personal && (
            <View style={styles.cardContent}>
              <InfoRow label="Full Name" value={profile?.name} />
              <InfoRow label="Date of Birth" value={formatDate(profile?.date_of_birth)} />
              <InfoRow label="Age" value={`${age} years`} />
              <InfoRow label="Gender" value={profile?.gender} />
              <InfoRow label="Address" value={profile?.address} />
              <InfoRow label="Phone" value={profile?.contact_no} />
              <InfoRow label="Email" value={profile?.email} />
              <InfoRow label="Assigned Caregiver" value={profile?.caregiver_name || 'Not assigned'} />
            </View>
          )}
        </Card>

        {/* Medical Conditions Section */}
        <Card style={styles.card}>
          <SectionHeader title="Medical Conditions" section="medical" icon="🏥" count={medicalConditions.length} />
          {expandedSections.medical && (
            <View style={styles.cardContent}>
              {medicalConditions.length > 0 ? (
                medicalConditions.map((condition, index) => (
                  <View key={condition.condition_id || index} style={styles.conditionItem}>
                    <View style={[styles.conditionDot, { backgroundColor: '#2C7DA0' }]} />
                    <View style={styles.conditionDetails}>
                      <Text style={styles.conditionName}>{condition.condition_name}</Text>
                      {condition.description && <Text style={styles.conditionDesc}>{condition.description}</Text>}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No medical conditions recorded</Text>
              )}
            </View>
          )}
        </Card>

        {/* Medications Section */}
        <Card style={styles.card}>
          <SectionHeader title="Current Medications" section="medications" icon="💊" count={medications.length} />
          {expandedSections.medications && (
            <View style={styles.cardContent}>
              {medications.length > 0 ? (
                medications.map((med, index) => (
                  <View key={med.medication_id || index} style={styles.medicationItem}>
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationName}>{med.name}</Text>
                      {med.is_active ? (
                        <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Active</Text></View>
                      ) : (
                        <View style={styles.inactiveBadge}><Text style={styles.inactiveBadgeText}>Inactive</Text></View>
                      )}
                    </View>
                    <View style={styles.medicationDetails}>
                      <Text style={styles.medicationDetail}>💊 {med.dosage}</Text>
                      <Text style={styles.medicationDetail}>⏰ {med.frequency}</Text>
                    </View>
                    {med.medical_condition && <Text style={styles.medicationCondition}>For: {med.medical_condition}</Text>}
                    {med.instructions && <Text style={styles.medicationInstructions}>📌 {med.instructions}</Text>}
                    {index < medications.length - 1 && <View style={styles.divider} />}
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No active medications</Text>
              )}
            </View>
          )}
        </Card>

        {/* Upcoming Visits Section */}
        <Card style={styles.card}>
          <SectionHeader title="Upcoming Visits" section="visits" icon="📅" count={upcomingVisits.length} />
          {expandedSections.visits && (
            <View style={styles.cardContent}>
              {upcomingVisits.length > 0 ? (
                upcomingVisits.map((visit, index) => (
                  <View key={visit.visit_id} style={styles.visitItem}>
                    <View style={styles.visitHeader}>
                      <View>
                        <Text style={styles.visitDate}>{formatDate(visit.scheduled_time)}</Text>
                        <Text style={styles.visitTime}>{formatTime(visit.scheduled_time)}</Text>
                      </View>
                      <View style={[styles.visitStatusBadge, { backgroundColor: getStatusColor(visit.status) + '20' }]}>
                        <Text style={[styles.visitStatusText, { color: getStatusColor(visit.status) }]}>{visit.status?.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.visitCaregiver}>
                      <Text style={styles.visitCaregiverLabel}>Caregiver:</Text>
                      <Text style={styles.visitCaregiverName}>{visit.caregiver_name || 'To be assigned'}</Text>
                    </View>
                    {visit.acknowledged && (
                      <View style={styles.confirmedBadge}><Text style={styles.confirmedBadgeText}>✓ Confirmed by caregiver</Text></View>
                    )}
                    {visit.notes && <Text style={styles.visitNotes}>📝 {visit.notes}</Text>}
                    {index < upcomingVisits.length - 1 && <View style={styles.divider} />}
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No upcoming visits scheduled</Text>
              )}
            </View>
          )}
        </Card>

        {/* Family Contacts Section */}
        <Card style={styles.card}>
          <SectionHeader title="Family Contacts" section="family" icon="👪" count={familyMembers.length} />
          {expandedSections.family && (
            <View style={styles.cardContent}>
              {familyMembers.length > 0 ? (
                familyMembers.map((member, index) => (
                  <View key={member.family_member_id || index} style={styles.familyItem}>
                    <View style={styles.familyHeader}>
                      <Text style={styles.familyName}>{member.name}</Text>
                      {member.is_primary === 1 && (
                        <View style={styles.primaryBadge}><Text style={styles.primaryBadgeText}>Primary</Text></View>
                      )}
                    </View>
                    <Text style={styles.familyRelation}>Relationship: {member.relationship}</Text>
                    <Text style={styles.familyPhone}>📞 {member.contact_no || member.phone || 'No phone'}</Text>
                    {member.email && <Text style={styles.familyEmail}>✉️ {member.email}</Text>}
                    {index < familyMembers.length - 1 && <View style={styles.divider} />}
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No family contacts listed</Text>
              )}
            </View>
          )}
        </Card>

        {/* Past Visits Summary */}
        {pastVisits.length > 0 && (
          <View style={styles.pastVisitsSummary}>
            <Text style={styles.pastVisitsText}>📋 You have {pastVisits.length} past {pastVisits.length === 1 ? 'visit' : 'visits'}</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFE' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFE' },
  loadingText: { marginTop: 10, color: '#4A627A', fontSize: 16 },
  offlineBanner: { backgroundColor: '#FF9800', padding: 10, alignItems: 'center' },
  offlineText: { color: '#fff', fontWeight: '600' },
  header: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerText: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  welcomeText: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  roleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  logoutButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 },
  logoutText: { color: '#fff', fontSize: 14 },
  notificationButton: { position: 'relative', padding: 8 },
  notificationIcon: { fontSize: 24, color: '#fff' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#F44336', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { width: '23%', padding: 12, borderRadius: 20, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.9)', marginTop: 4, textAlign: 'center' },
  card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: 1, borderColor: '#E8EEF2' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E8EEF2' },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionIcon: { fontSize: 20, marginRight: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A2C3E' },
  sectionCount: { fontSize: 14, color: '#4A627A', marginLeft: 8 },
  sectionToggle: { fontSize: 16, color: '#4A627A' },
  cardContent: { padding: 16 },
  infoRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E8EEF2' },
  infoLabel: { width: 120, fontSize: 14, color: '#4A627A', fontWeight: '500' },
  infoValue: { flex: 1, fontSize: 14, color: '#1A2C3E' },
  emergencyRow: { backgroundColor: '#FF980020', padding: 10, borderRadius: 8, marginTop: 6 },
  emergencyValue: { color: '#FF9800', fontWeight: '600' },
  conditionItem: { flexDirection: 'row', marginBottom: 10 },
  conditionDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 12 },
  conditionDetails: { flex: 1 },
  conditionName: { fontSize: 15, fontWeight: '500', color: '#1A2C3E' },
  conditionDesc: { fontSize: 13, color: '#4A627A', marginTop: 2 },
  medicationItem: { marginBottom: 15 },
  medicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  medicationName: { fontSize: 16, fontWeight: '600', color: '#1A2C3E', flex: 1 },
  activeBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  activeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  inactiveBadge: { backgroundColor: '#9E9E9E', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  inactiveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  medicationDetails: { flexDirection: 'row', marginBottom: 3 },
  medicationDetail: { fontSize: 13, color: '#4A627A', marginRight: 15 },
  medicationCondition: { fontSize: 12, color: '#2C7DA0', fontStyle: 'italic' },
  medicationInstructions: { fontSize: 12, color: '#61A5C2', marginTop: 2 },
  visitItem: { marginBottom: 15 },
  visitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  visitDate: { fontSize: 15, fontWeight: '600', color: '#1A2C3E' },
  visitTime: { fontSize: 13, color: '#4A627A' },
  visitStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  visitStatusText: { fontSize: 11, fontWeight: '600' },
  visitCaregiver: { flexDirection: 'row', marginBottom: 5 },
  visitCaregiverLabel: { fontSize: 13, color: '#4A627A', marginRight: 5 },
  visitCaregiverName: { fontSize: 13, color: '#2C7DA0', fontWeight: '500' },
  confirmedBadge: { backgroundColor: '#4CAF5020', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: 5, marginBottom: 5 },
  confirmedBadgeText: { fontSize: 11, color: '#4CAF50', fontWeight: '500' },
  visitNotes: { fontSize: 12, color: '#4A627A', fontStyle: 'italic', marginTop: 6 },
  familyItem: { marginBottom: 15 },
  familyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  familyName: { fontSize: 16, fontWeight: '600', color: '#1A2C3E' },
  primaryBadge: { backgroundColor: '#FF9800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  primaryBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  familyRelation: { fontSize: 13, color: '#4A627A', marginBottom: 3 },
  familyPhone: { fontSize: 13, color: '#1A2C3E', marginBottom: 2 },
  familyEmail: { fontSize: 12, color: '#4A627A' },
  divider: { height: 1, backgroundColor: '#E8EEF2', marginTop: 12, marginBottom: 8 },
  noDataText: { fontSize: 14, color: '#4A627A', fontStyle: 'italic', textAlign: 'center', padding: 24 },
  pastVisitsSummary: { padding: 20, alignItems: 'center', marginBottom: 16 },
  pastVisitsText: { fontSize: 13, color: '#4A627A', fontStyle: 'italic' },
});

export default CareRecipientDashboard;