// config.js
import { Platform } from 'react-native';

// Your laptop's IP address from ipconfig
const LAPTOP_IP = '192.168.1.117';

const getApiUrl = () => {
  // For Android APK on real device (use laptop IP)
  if (Platform.OS === 'android' && !__DEV__) {
    return `http://${LAPTOP_IP}:5000/api`;
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
  return `http://${LAPTOP_IP}:5000/api`;
};

export const API_BASE_URL = getApiUrl();