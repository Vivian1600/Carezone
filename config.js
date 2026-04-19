// config.js
import { Platform } from 'react-native';

// Use computer name (never changes) instead of IP
const COMPUTER_NAME = 'PC';  // from hostname command

const getApiUrl = () => {
  // For Android APK on real device (use computer name)
  if (Platform.OS === 'android' && !__DEV__) {
    return `http://${COMPUTER_NAME}:5000/api`;
  }
  
  // For Android emulator
  if (Platform.OS === 'android' && __DEV__) {
    return 'http://10.0.2.2:5000/api';
  }
  
  // For iOS emulator
  if (Platform.OS === 'ios') {
    return 'http://localhost:5000/api';
  }
  
  // For web browser
  if (typeof window !== 'undefined') {
    return 'http://localhost:5000/api';
  }
  
  // Default
  return `http://${COMPUTER_NAME}:5000/api`;
};

export const API_BASE_URL = getApiUrl();