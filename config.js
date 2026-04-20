// config.js
import { Platform } from 'react-native';

// Ngrok URL (public, works anywhere)
const NGROK_URL = 'https://sensitometrically-wackiest-reita.ngrok-free.dev';

const getApiUrl = () => {
  // For Android APK on real device - USE NGORK URL
  if (Platform.OS === 'android' && !__DEV__) {
    return `${NGROK_URL}/api`;
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
  
  // Default fallback
  return `${NGROK_URL}/api`;
};

export const API_BASE_URL = getApiUrl();