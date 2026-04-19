import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { TextInput, Card, Title, HelperText } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from '../context/DarkModeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const API_BASE_URL = 'http://PC:5000/api';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const { colors } = useDarkMode();
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [address, setAddress] = useState('');
  const [type, setType] = useState('volunteer');
  const [availability, setAvailability] = useState('Weekdays');
  
  const [relationship, setRelationship] = useState('spouse');
  const [addRecipientNow, setAddRecipientNow] = useState(false);
  
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientDob, setRecipientDob] = useState('');
  const [recipientGender, setRecipientGender] = useState('Male');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientMedicalNotes, setRecipientMedicalNotes] = useState('');
  const [recipientEmergencyName, setRecipientEmergencyName] = useState('');
  const [recipientEmergencyPhone, setRecipientEmergencyPhone] = useState('');

  const availabilityOptions = ['Weekdays', 'Weekends', 'Evenings', 'Flexible'];
  const relationshipOptions = ['spouse', 'parent', 'child', 'sibling', 'grandparent', 'other'];
  const genderOptions = ['Male', 'Female', 'Other'];

  const styles = getStyles(colors);

  const validateStep1 = () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all required fields');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setRole(null);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1()) return;

    setLoading(true);
    try {
      let endpoint = '';
      let body = {};

      if (role === 'caregiver') {
        endpoint = `${API_BASE_URL}/auth/register/caregiver`;
        body = { name, email, phone, password, address, type, availability };
      } else {
        endpoint = `${API_BASE_URL}/auth/register/family`;
        body = {
          name, email, phone, password, relationship, addRecipientNow,
          recipient: addRecipientNow ? {
            name: recipientName,
            email: recipientEmail || null,
            phone: recipientPhone || null,
            date_of_birth: recipientDob,
            gender: recipientGender,
            address: recipientAddress || null,
            emergency_contact_name: recipientEmergencyName,
            emergency_contact_phone: recipientEmergencyPhone,
            medical_notes: recipientMedicalNotes || null,
          } : null,
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        let successMessage = `Welcome, ${data.user.name}! 🎉\n\nYour account has been created successfully.\nRole: ${data.user.role === 'family_member' ? 'Family Member' : 'Caregiver'}\nEmail: ${data.user.email}`;
        
        if (role === 'family' && addRecipientNow && data.careRecipientAdded) {
          successMessage += `\n\n✓ Care recipient "${recipientName}" has been registered.\nYou are now connected as ${relationship}.`;
        }
        
        Alert.alert('Registration Successful!', successMessage, [
          { text: 'Continue', onPress: async () => { await login(data.user, data.token); } }
        ]);
      } else {
        Alert.alert('Registration Failed', data.message || 'Server error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Network Error', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#2C7DA0" />
        <ScrollView contentContainerStyle={styles.container}>
          <LinearGradient colors={['#2C7DA0', '#61A5C2', '#A9D6E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
            <FontAwesome5 name="hospital" size={48} color="#fff" />
            <Text style={styles.logo}>CareZone</Text>
            <Text style={styles.tagline}>Care.Connect.Coordinate</Text>
          </LinearGradient>

          <Card style={styles.card}>
            <Title style={styles.title}>Join Carezone</Title>
            <Text style={styles.subtitle}>Select your role to get started</Text>

            <TouchableOpacity style={styles.roleCard} onPress={() => handleRoleSelect('caregiver')} activeOpacity={0.7}>
              <LinearGradient colors={['#2C7DA020', '#61A5C220']} style={styles.roleCardGradient}>
                <FontAwesome5 name="user-md" size={40} color="#2C7DA0" />
                <View style={styles.roleInfo}>
                  <Text style={styles.roleTitle}>I'm a Caregiver</Text>
                  <Text style={styles.roleDescription}>Provide care to patients and manage visits</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#2C7DA0" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.roleCard} onPress={() => handleRoleSelect('family')} activeOpacity={0.7}>
              <LinearGradient colors={['#61A5C220', '#A9D6E520']} style={styles.roleCardGradient}>
                <Ionicons name="people" size={40} color="#61A5C2" />
                <View style={styles.roleInfo}>
                  <Text style={styles.roleTitle}>I'm a Family Member</Text>
                  <Text style={styles.roleDescription}>Register and manage care for your loved ones</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#61A5C2" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginLink}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLinkText}>Login</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#2C7DA0" />
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient colors={['#2C7DA0', '#61A5C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.formHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButtonWrapper}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Step {step === 2 ? '2' : '3'} of 3</Text>
          <Text style={styles.formHeaderTitle}>{role === 'caregiver' ? 'Caregiver Registration' : 'Family Registration'}</Text>
        </LinearGradient>

        <Card style={styles.card}>
          {step === 2 && (
            <>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                <TextInput label="Full Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
              </View>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                <TextInput label="Email *" value={email} onChangeText={setEmail} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
              </View>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                <TextInput label="Phone Number *" value={phone} onChangeText={setPhone} mode="outlined" keyboardType="phone-pad" style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
              </View>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                <TextInput label="Password *" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
              </View>
              <HelperText type="info" visible={password.length > 0 && password.length < 6}>Password must be at least 6 characters</HelperText>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                <TextInput label="Confirm Password *" value={confirmPassword} onChangeText={setConfirmPassword} mode="outlined" secureTextEntry style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
              </View>
              {password && confirmPassword && password !== confirmPassword && <HelperText type="error">Passwords do not match</HelperText>}

              {role === 'caregiver' && (
                <>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="location-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                    <TextInput label="Address (Optional)" value={address} onChangeText={setAddress} mode="outlined" multiline numberOfLines={2} style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
                  </View>
                  
                  <Text style={styles.label}>Caregiver Type</Text>
                  <View style={styles.optionsContainer}>
                    {['professional', 'volunteer'].map((opt) => (
                      <TouchableOpacity key={opt} style={[styles.optionButton, type === opt && styles.optionButtonSelected]} onPress={() => setType(opt)}>
                        <Text style={[styles.optionText, type === opt && styles.optionTextSelected]}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Availability</Text>
                  <View style={styles.optionsContainer}>
                    {availabilityOptions.map((opt) => (
                      <TouchableOpacity key={opt} style={[styles.optionButton, availability === opt && styles.optionButtonSelected]} onPress={() => setAvailability(opt)}>
                        <Text style={[styles.optionText, availability === opt && styles.optionTextSelected]}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {role === 'family' && (
                <>
                  <Text style={styles.label}>Relationship to Care Recipient</Text>
                  <View style={styles.optionsContainer}>
                    {relationshipOptions.map((opt) => (
                      <TouchableOpacity key={opt} style={[styles.optionButton, relationship === opt && styles.optionButtonSelected]} onPress={() => setRelationship(opt)}>
                        <Text style={[styles.optionText, relationship === opt && styles.optionTextSelected]}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.toggleContainer}>
                    <Text style={styles.toggleLabel}>Register a care recipient now?</Text>
                    <View style={styles.toggleButtons}>
                      <TouchableOpacity style={[styles.toggleButton, addRecipientNow && styles.toggleButtonActive]} onPress={() => setAddRecipientNow(true)}>
                        <Text style={[styles.toggleButtonText, addRecipientNow && styles.toggleButtonTextActive]}>Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.toggleButton, !addRecipientNow && styles.toggleButtonActive]} onPress={() => setAddRecipientNow(false)}>
                        <Text style={[styles.toggleButtonText, !addRecipientNow && styles.toggleButtonTextActive]}>No</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              <TouchableOpacity onPress={() => {
                if (validateStep1()) {
                  if (role === 'family' && addRecipientNow) setStep(3);
                  else handleSubmit();
                }
              }} activeOpacity={0.8}>
                <LinearGradient colors={['#2C7DA0', '#61A5C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>{role === 'family' && addRecipientNow ? 'Next →' : 'Complete Registration'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {step === 3 && role === 'family' && addRecipientNow && (
            <>
              <Text style={styles.sectionTitle}>Care Recipient Details</Text>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                <TextInput label="Recipient Full Name *" value={recipientName} onChangeText={setRecipientName} mode="outlined" style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
              </View>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                <TextInput label="Recipient Email (optional)" value={recipientEmail} onChangeText={setRecipientEmail} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
              </View>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                <TextInput label="Recipient Phone" value={recipientPhone} onChangeText={setRecipientPhone} mode="outlined" keyboardType="phone-pad" style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
              </View>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                <TextInput label="Date of Birth (YYYY-MM-DD) *" value={recipientDob} onChangeText={setRecipientDob} mode="outlined" placeholder="1945-03-15" style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
              </View>

              <Text style={styles.label}>Gender</Text>
              <View style={styles.optionsContainer}>
                {genderOptions.map((opt) => (
                  <TouchableOpacity key={opt} style={[styles.optionButton, recipientGender === opt && styles.optionButtonSelected]} onPress={() => setRecipientGender(opt)}>
                    <Text style={[styles.optionText, recipientGender === opt && styles.optionTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                <TextInput label="Address" value={recipientAddress} onChangeText={setRecipientAddress} mode="outlined" multiline numberOfLines={2} style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
              </View>

              <Text style={styles.sectionTitle}>Emergency Contact</Text>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                <TextInput label="Emergency Contact Name *" value={recipientEmergencyName} onChangeText={setRecipientEmergencyName} mode="outlined" style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
              </View>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                <TextInput label="Emergency Contact Phone *" value={recipientEmergencyPhone} onChangeText={setRecipientEmergencyPhone} mode="outlined" keyboardType="phone-pad" style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
              </View>
              
              <View style={styles.inputWrapper}>
                <Ionicons name="document-text-outline" size={20} color="#A9D6E5" style={styles.inputIcon} />
                <TextInput label="Medical Notes (optional)" value={recipientMedicalNotes} onChangeText={setRecipientMedicalNotes} mode="outlined" multiline numberOfLines={3} style={styles.input} theme={{ colors: { primary: '#2C7DA0' } }} />
              </View>

              <TouchableOpacity onPress={handleSubmit} disabled={loading || !recipientName || !recipientDob || !recipientEmergencyName || !recipientEmergencyPhone} activeOpacity={0.8}>
                <LinearGradient colors={['#2C7DA0', '#61A5C2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.submitButton, (loading || !recipientName || !recipientDob || !recipientEmergencyName || !recipientEmergencyPhone) && styles.submitButtonDisabled]}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Complete Registration</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F8FAFE' },
  headerGradient: { paddingTop: 50, paddingBottom: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  logo: { fontSize: 42, fontWeight: 'bold', color: '#fff', marginTop: 12, marginBottom: 8 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  formHeader: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, flexDirection: 'row', alignItems: 'center' },
  backButtonWrapper: { padding: 8 },
  stepIndicator: { fontSize: 14, color: 'rgba(255,255,255,0.8)', flex: 1, textAlign: 'center' },
  formHeaderTitle: { fontSize: 16, fontWeight: '600', color: '#fff', flex: 1, textAlign: 'right' },
  card: { margin: 16, padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  title: { textAlign: 'center', marginBottom: 10, fontSize: 28, fontWeight: 'bold', color: '#1A2C3E' },
  subtitle: { textAlign: 'center', marginBottom: 30, color: '#4A627A', fontSize: 16 },
  roleCard: { marginBottom: 15, borderRadius: 16, overflow: 'hidden', elevation: 2 },
  roleCardGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: '600', color: '#1A2C3E', marginBottom: 5 },
  roleDescription: { fontSize: 14, color: '#4A627A' },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { color: '#4A627A', fontSize: 14 },
  loginLinkText: { color: '#2C7DA0', fontSize: 14, fontWeight: '600' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, backgroundColor: '#FFFFFF' },
  label: { fontSize: 14, color: '#1A2C3E', fontWeight: '500', marginTop: 10, marginBottom: 5 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A2C3E', marginTop: 15, marginBottom: 10 },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, gap: 10 },
  optionButton: { paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E8EEF2', borderRadius: 20, backgroundColor: '#FFFFFF' },
  optionButtonSelected: { backgroundColor: '#2C7DA0', borderColor: '#2C7DA0' },
  optionText: { color: '#4A627A', fontSize: 14 },
  optionTextSelected: { color: '#fff' },
  toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15, flexWrap: 'wrap', gap: 10 },
  toggleLabel: { fontSize: 16, color: '#1A2C3E', fontWeight: '500' },
  toggleButtons: { flexDirection: 'row', gap: 10 },
  toggleButton: { paddingVertical: 8, paddingHorizontal: 20, borderWidth: 1, borderColor: '#E8EEF2', borderRadius: 8, backgroundColor: '#FFFFFF' },
  toggleButtonActive: { backgroundColor: '#2C7DA0', borderColor: '#2C7DA0' },
  toggleButtonText: { color: '#4A627A', fontSize: 14, fontWeight: '500' },
  toggleButtonTextActive: { color: '#fff' },
  submitButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 10 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default RegisterScreen;