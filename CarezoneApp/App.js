import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';
import SplashScreen from './screens/SplashScreen';
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import FamilyDashboard from './screens/FamilyDashboard';
import CaregiverDashboard from './screens/CaregiverDashboard';
import CareRecipientDashboard from './screens/CareRecipientDashboard';
import NotificationScreen from './screens/NotificationScreen';
import VisitDetails from './screens/VisitDetails';
import { ActivityIndicator, View, Text, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

// These components will be used INSIDE NavigationContainer
const UnauthenticatedStack = () => {
  const { colors } = useDarkMode();
  
  console.log('🔓 Unauthenticated Stack - Showing Landing/Login/Register');
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const AuthenticatedStack = () => {
  const { user } = useAuth();
  
  console.log('🔐 Authenticated Stack - User role:', user?.role);
  
  if (user?.role === 'caregiver') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CaregiverDashboard" component={CaregiverDashboard} />
        <Stack.Screen name="VisitDetails" component={VisitDetails} />
        <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
      </Stack.Navigator>
    );
  }
  
  if (user?.role === 'family_member') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="FamilyDashboard" component={FamilyDashboard} />
        <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
      </Stack.Navigator>
    );
  }
  
  if (user?.role === 'care_recipient') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CareRecipientDashboard" component={CareRecipientDashboard} />
        <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
      </Stack.Navigator>
    );
  }
  
  return null;
};

const AppNavigator = () => {
  const { user, loading, logout } = useAuth();
  const { colors } = useDarkMode();
  const [showSplash, setShowSplash] = React.useState(true);

  // Fix storage issue - clear invalid user data
  useEffect(() => {
    const fixStorage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        console.log('📦 Current stored user type:', typeof storedUser);
        
        // If stored user is a JWT token (starts with eyJ) or not a valid JSON object
        if (storedUser && (storedUser.startsWith('eyJ') || !storedUser.includes('{'))) {
          console.log('🧹 Found invalid user data. Clearing storage...');
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('token');
          await logout();
          console.log('✅ Invalid data cleared.');
        }
      } catch (error) {
        console.error('Error fixing storage:', error);
      }
    };
    fixStorage();
  }, []);

  console.log('========== APP STATE ==========');
  console.log('Loading:', loading);
  console.log('User type:', typeof user);
  console.log('Is user object:', user && typeof user === 'object');
  console.log('User role:', user?.role);
  console.log('===============================');

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  // Check if user is a valid object with role
  const isValidUser = user && typeof user === 'object' && user.role;
  
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {isValidUser ? <AuthenticatedStack /> : <UnauthenticatedStack />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <AppNavigator />
      </DarkModeProvider>
    </AuthProvider>
  );
}