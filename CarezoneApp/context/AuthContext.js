// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  // In AuthContext.js, update loadStoredData
const loadStoredData = async () => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    const storedUser = await AsyncStorage.getItem('user');
    
    console.log('📦 Loading stored data - Token:', !!storedToken);
    console.log('📦 Loading stored data - User type:', typeof storedUser);
    
    if (storedToken && storedUser) {
      // Check if storedUser is a valid object (not a JWT token)
      let parsedUser;
      try {
        parsedUser = JSON.parse(storedUser);
      } catch (e) {
        console.log('❌ Stored user is not valid JSON:', storedUser?.substring(0, 50));
        // Clear invalid data
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
        setLoading(false);
        return;
      }
      
      // Validate that parsedUser has required fields
      if (parsedUser && typeof parsedUser === 'object' && parsedUser.id && parsedUser.role) {
        setToken(storedToken);
        setUser(parsedUser);
        console.log('✅ Loaded valid user:', parsedUser.name, 'Role:', parsedUser.role);
      } else {
        console.log('❌ Stored user missing required fields');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
      }
    }
  } catch (error) {
    console.error('Failed to load user:', error);
  } finally {
    setLoading(false);
  }
};

  const login = async (userData, authToken) => {
    console.log('🔐 LOGIN CALLED');
    console.log('UserData:', userData);
    console.log('AuthToken:', authToken?.substring(0, 50) + '...');
    
    if (!userData || !authToken) {
      console.error('❌ Invalid login data - missing userData or token');
      return false;
    }
    
    try {
      setUser(userData);
      setToken(authToken);
      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('✅ Login successful - User:', userData.name, 'Role:', userData.role);
      return true;
    } catch (error) {
      console.error('Login storage error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};