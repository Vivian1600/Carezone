// config.js
// Detect platform and set API URL accordingly
const getApiUrl = () => {
  // Check if running in web browser
  if (typeof window !== 'undefined') {
    return 'http://localhost:5000/api';
  }
  // For Android emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  // For iOS emulator
  if (Platform.OS === 'ios') {
    return 'http://localhost:5000/api';
  }
  // Default
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiUrl();