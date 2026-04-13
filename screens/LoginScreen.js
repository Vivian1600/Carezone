import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const API_BASE_URL = 'http://192.168.1.117:5000/api';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { colors, isDarkMode } = useDarkMode();
  const [selectedRole, setSelectedRole] = useState('family_member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    { id: 'family_member', label: 'Family Member', icon: 'people', color: '#2C7DA0' },
    { id: 'caregiver', label: 'Caregiver', icon: 'medical', color: '#61A5C2' },
    { id: 'care_recipient', label: 'Care Recipient', icon: 'person', color: '#2C7DA0' },
  ];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await login(data.user, data.token);
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'family_member': return <Ionicons name="people-outline" size={24} color="#fff" />;
      case 'caregiver': return <FontAwesome5 name="user-md" size={20} color="#fff" />;
      case 'care_recipient': return <Ionicons name="person-outline" size={24} color="#fff" />;
      default: return <Ionicons name="person-outline" size={24} color="#fff" />;
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#2C7DA0" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <LinearGradient
          colors={['#2C7DA0', '#61A5C2', '#A9D6E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <FontAwesome5 name="hospital" size={48} color="#fff" />
          <Text style={styles.logo}>CareZone</Text>
          <Text style={styles.tagline}>Rural Caregiving Made Simple</Text>
        </LinearGradient>

        <View style={styles.roleTabsContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[styles.roleTab, selectedRole === role.id && styles.roleTabActive]}
              onPress={() => setSelectedRole(role.id)}
            >
              <LinearGradient
                colors={selectedRole === role.id ? [role.color, '#A9D6E5'] : ['#F8FAFE', '#F8FAFE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.roleTabGradient}
              >
                {getRoleIcon(role.id)}
                <Text style={[styles.roleLabel, selectedRole === role.id && styles.roleLabelActive, { color: selectedRole === role.id ? '#fff' : '#4A627A' }]}>
                  {role.label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#A9D6E5"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#A9D6E5"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            <LinearGradient
              colors={['#2C7DA0', '#61A5C2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButtonGradient}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Login</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFE' },
  scrollContainer: { flexGrow: 1 },
  headerGradient: { paddingTop: 60, paddingBottom: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  logo: { fontSize: 42, fontWeight: 'bold', color: '#fff', marginTop: 12, marginBottom: 8 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  roleTabsContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: -20, marginBottom: 30, gap: 10 },
  roleTab: { flex: 1, borderRadius: 25, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  roleTabActive: { elevation: 5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
  roleTabGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 10, gap: 8 },
  roleLabel: { fontSize: 13, fontWeight: '600' },
  roleLabelActive: { color: '#fff' },
  formContainer: { paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A2C3E', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#4A627A', marginBottom: 30 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#1A2C3E', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E8EEF2', borderRadius: 12, backgroundColor: '#FFFFFF' },
  inputIcon: { marginLeft: 15 },
  input: { flex: 1, padding: 15, fontSize: 16, color: '#1A2C3E' },
  loginButton: { borderRadius: 30, overflow: 'hidden', marginTop: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  loginButtonGradient: { paddingVertical: 15, alignItems: 'center' },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  registerText: { fontSize: 14, color: '#4A627A' },
  registerLink: { fontSize: 14, fontWeight: '600', color: '#2C7DA0' },
});

export default LoginScreen;