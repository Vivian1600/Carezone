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
import { useDarkMode } from '../context/DarkModeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const API_BASE_URL = 'http://PC:5000/api';

const NotificationScreen = () => {
  const { token } = useAuth();
  const navigation = useNavigation();
  const { colors } = useDarkMode();
  const styles = getStyles(colors);
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, { headers: { 'x-auth-token': token } });
      const data = await response.json();
      if (data.success) { setNotifications(data.data); setUnreadCount(data.unread_count); }
    } catch (error) { console.error('Error fetching notifications:', error); Alert.alert('Error', 'Failed to load notifications'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchNotifications(); };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, { method: 'PUT', headers: { 'x-auth-token': token } });
      const data = await response.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) { console.error('Error marking as read:', error); }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, { method: 'PUT', headers: { 'x-auth-token': token } });
      const data = await response.json();
      if (data.success) { setNotifications(prev => prev.map(n => ({ ...n, is_read: true }))); setUnreadCount(0); Alert.alert('Success', data.message); }
    } catch (error) { console.error('Error marking all as read:', error); Alert.alert('Error', 'Failed to mark all as read'); }
  };

  const deleteNotification = async (notificationId) => {
    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
          const data = await response.json();
          if (data.success) setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
        } catch (error) { console.error('Error deleting notification:', error); Alert.alert('Error', 'Failed to delete'); }
      } }
    ]);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'visit_scheduled': return <Ionicons name="calendar-outline" size={24} color="#2196F3" />;
      case 'visit_acknowledged': return <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />;
      case 'visit_declined': return <Ionicons name="close-circle-outline" size={24} color="#F44336" />;
      case 'visit_completed': return <Ionicons name="checkmark-done-circle-outline" size={24} color="#4CAF50" />;
      case 'visit_reminder': return <Ionicons name="alarm-outline" size={24} color="#FF9800" />;
      case 'medication_reminder': return <MaterialIcons name="medication" size={24} color="#9C27B0" />;
      case 'report_ready': return <Ionicons name="document-text-outline" size={24} color="#2C7DA0" />;
      default: return <Ionicons name="notifications-outline" size={24} color="#4A627A" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const renderCaregiverDetails = (extraData) => {
    if (!extraData?.caregiver) return null;
    const caregiver = extraData.caregiver;
    return (
      <View style={styles.caregiverDetails}>
        <FontAwesome5 name="user-md" size={14} color="#2C7DA0" />
        <Text style={styles.caregiverTitle}> Caregiver Details:</Text>
        <Text style={styles.caregiverText}>Name: {caregiver.name}</Text>
        {caregiver.phone && <Text style={styles.caregiverText}>Phone: {caregiver.phone}</Text>}
        {caregiver.address && <Text style={styles.caregiverText}>Address: {caregiver.address}</Text>}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2C7DA0" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2C7DA0" />
      <View style={styles.container}>
        <LinearGradient colors={['#2C7DA0', '#61A5C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <TouchableOpacity onPress={markAllAsRead}><Text style={styles.markAllText}>Mark all read</Text></TouchableOpacity>}
        </LinearGradient>

        <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.notification_id}
                style={[styles.notificationItem, !notification.is_read && styles.unreadNotification]}
                onPress={() => markAsRead(notification.notification_id)}
                onLongPress={() => deleteNotification(notification.notification_id)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    {!notification.is_read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  {renderCaregiverDetails(notification.extra_data)}
                  <View style={styles.notificationTimeRow}>
                    <Ionicons name="time-outline" size={12} color="#A9D6E5" />
                    <Text style={styles.notificationTime}> {formatDate(notification.created_at)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#A9D6E5" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>Notifications will appear here when you receive updates</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFE' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFE' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingTop: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { fontSize: 16, color: '#fff', fontWeight: '600' },
  headerTitle: { fontSize: 18, color: '#fff', fontWeight: '600' },
  markAllText: { fontSize: 12, color: '#fff', textDecorationLine: 'underline' },
  content: { flex: 1 },
  notificationItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E8EEF2', backgroundColor: '#FFFFFF' },
  unreadNotification: { backgroundColor: '#2C7DA010' },
  notificationIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F8FAFE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notificationContent: { flex: 1 },
  notificationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  notificationTitle: { fontSize: 16, fontWeight: '600', color: '#1A2C3E', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2C7DA0', marginLeft: 8 },
  notificationMessage: { fontSize: 14, color: '#4A627A', marginBottom: 8, lineHeight: 20 },
  caregiverDetails: { backgroundColor: '#F8FAFE', padding: 10, borderRadius: 8, marginTop: 8, marginBottom: 8 },
  caregiverTitle: { fontSize: 13, fontWeight: '600', color: '#2C7DA0', marginBottom: 4 },
  caregiverText: { fontSize: 12, color: '#1A2C3E', marginBottom: 2 },
  notificationTimeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  notificationTime: { fontSize: 11, color: '#A9D6E5' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 50 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#1A2C3E', marginBottom: 8, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#4A627A', textAlign: 'center' },
});

export default NotificationScreen;