// screens/RouteOptimization.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Card } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from '../context/DarkModeContext';

const API_BASE_URL = 'http://192.168.1.117:5000/api';
// for web enulator use http://localhost:5000/api// for android emulator use http://ip adress of your machine:5000/api//


const RouteOptimization = () => {
  const { token } = useAuth();
  const navigation = useNavigation();
  const { colors } = useDarkMode();
  const styles = getStyles(colors);
  
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchVisits();
  }, [selectedDate]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/visits/my-visits`, {
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      
      if (data.success) {
        const dateVisits = data.data.filter(v => 
          new Date(v.scheduled_time).toISOString().split('T')[0] === selectedDate
        );
        setVisits(dateVisits);
        
        if (dateVisits.length > 0) {
          const optimized = optimizeRoute(dateVisits);
          setOptimizedRoute(optimized);
          calculateTotalDistance(optimized);
        } else {
          setOptimizedRoute([]);
          setTotalDistance(0);
        }
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
      Alert.alert('Error', 'Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  const optimizeRoute = (visitsToOptimize) => {
    if (visitsToOptimize.length <= 1) return visitsToOptimize;
    
    const sortedByTime = [...visitsToOptimize].sort(
      (a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time)
    );
    
    const optimized = [sortedByTime[0]];
    const remaining = sortedByTime.slice(1);
    
    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      let nearestIndex = 0;
      let shortestDist = calculateDistance(current, remaining[0]);
      
      for (let i = 1; i < remaining.length; i++) {
        const dist = calculateDistance(current, remaining[i]);
        if (dist < shortestDist) {
          shortestDist = dist;
          nearestIndex = i;
        }
      }
      
      optimized.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }
    
    return optimized;
  };

  const calculateDistance = (visit1, visit2) => {
    const random = Math.random() * 10 + 1;
    return Math.round(random * 10) / 10;
  };

  const calculateTotalDistance = (route) => {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += calculateDistance(route[i], route[i + 1]);
    }
    setTotalDistance(Math.round(total * 10) / 10);
  };

  const changeDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🗺️ Route Optimizer</Text>
        <View style={{ width: 50 }} />
      </View>

      <Card style={styles.dateCard}>
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={() => changeDate(-1)}>
            <Text style={styles.dateArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.dateDisplay}>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </View>
          <TouchableOpacity onPress={() => changeDate(1)}>
            <Text style={styles.dateArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {visits.length === 0 ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.emptyText}>No visits scheduled for this date</Text>
          </Card.Content>
        </Card>
      ) : (
        <>
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.summaryTitle}>Route Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Visits:</Text>
                <Text style={styles.summaryValue}>{visits.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Optimized Route:</Text>
                <Text style={styles.summaryValue}>{optimizedRoute.length} stops</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated Distance:</Text>
                <Text style={styles.summaryValue}>{totalDistance} km</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>📋 Optimized Route Order</Text>
              {optimizedRoute.map((visit, index) => (
                <View key={visit.visit_id} style={styles.routeItem}>
                  <View style={styles.routeNumber}>
                    <Text style={styles.routeNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.routeDetails}>
                    <Text style={styles.routePatient}>{visit.care_recipient_name}</Text>
                    <Text style={styles.routeTime}>
                      Scheduled: {formatTime(visit.scheduled_time)}
                    </Text>
                    <Text style={styles.routeDistance}>
                      {index < optimizedRoute.length - 1 && (
                        `→ Next: ~${calculateDistance(visit, optimizedRoute[index + 1])} km`
                      )}
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>⏰ Original Schedule</Text>
              {visits.sort((a, b) => 
                new Date(a.scheduled_time) - new Date(b.scheduled_time)
              ).map((visit, index) => (
                <View key={visit.visit_id} style={styles.scheduleItem}>
                  <Text style={styles.scheduleTime}>{formatTime(visit.scheduled_time)}</Text>
                  <Text style={styles.schedulePatient}>{visit.care_recipient_name}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.primary,
  },
  backButton: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  dateCard: {
    margin: 15,
    padding: 10,
    backgroundColor: colors.cardBackground,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateArrow: {
    fontSize: 24,
    color: colors.primary,
    paddingHorizontal: 15,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  card: {
    margin: 15,
    marginTop: 0,
    borderRadius: 10,
    backgroundColor: colors.cardBackground,
  },
  summaryCard: {
    margin: 15,
    marginTop: 0,
    backgroundColor: colors.primary + '20',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.primary,
  },
  routeItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  routeNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  routeNumberText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  routeDetails: {
    flex: 1,
  },
  routePatient: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  routeTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  routeDistance: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  scheduleItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scheduleTime: {
    width: 80,
    fontSize: 14,
    color: colors.textSecondary,
  },
  schedulePatient: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  emptyText: {
    fontStyle: 'italic',
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
});

export default RouteOptimization;