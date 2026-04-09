import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LandingScreen = ({ navigation }) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation for hero image
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const scrollToFeatures = () => {
    // Scroll to features section
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <StatusBar barStyle="light-content" backgroundColor="#2C7DA0" />

      {/* Hero Section with Image and Gradient Overlay */}
      <View style={styles.heroContainer}>
        <Image
          source={require('../assets/hero-image.jpg')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(44,125,160,0.7)', 'rgba(97,165,194,0.8)', '#2C7DA0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroOverlay}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.logoContainer}>
              <FontAwesome5 name="hands-helping" size={24} color="#fff" />
              <Text style={styles.logoText}>CareZone</Text>
            </View>
            <View style={styles.topButtons}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.topLoginBtn}>
                <Text style={styles.topLoginText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.topSignupBtn}>
                <LinearGradient
                  colors={['#A9D6E5', '#61A5C2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.topSignupGradient}
                >
                  <Text style={styles.topSignupText}>Sign Up</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Content */}
          <Animated.View
            style={[
              styles.heroContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Animated.View style={{ transform: [{ translateY: floatY }] }}>
              <FontAwesome5 name="hands-helping" size={70} color="#fff" style={styles.heroIcon} />
            </Animated.View>
            <Text style={styles.heroTitle}>CARE. CONNECT. COORDINATE.</Text>
            <Text style={styles.heroSubtitle}>Rural Caregiving Made Simple</Text>

            <View style={styles.ctaButtons}>
              <TouchableOpacity
                style={styles.ctaPrimary}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#A9D6E5', '#61A5C2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaPrimaryGradient}
                >
                  <Text style={styles.ctaPrimaryText}>Get Started</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctaSecondary} onPress={scrollToFeatures} activeOpacity={0.8}>
                <Text style={styles.ctaSecondaryText}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        <View style={styles.featuresRow}>
          <Animated.View
            style={[
              styles.featureCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient colors={['#2C7DA0', '#61A5C2']} style={styles.featureIconCircle}>
              <Ionicons name="calendar-outline" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.featureTitle}>Visit Scheduling</Text>
            <Text style={styles.featureDesc}>Schedule appointments with caregivers and healthcare providers</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.featureCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient colors={['#61A5C2', '#A9D6E5']} style={styles.featureIconCircle}>
              <MaterialIcons name="medication" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.featureTitle}>Medication Tracking</Text>
            <Text style={styles.featureDesc}>Track medication intake and refill dates for prescriptions</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.featureCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient colors={['#2C7DA0', '#61A5C2']} style={styles.featureIconCircle}>
              <Feather name="bar-chart-2" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.featureTitle}>Weekly Reports</Text>
            <Text style={styles.featureDesc}>Receive weekly reports on progress and health updates</Text>
          </Animated.View>
        </View>
      </View>

      {/* How It Works Section */}
      <View style={[styles.section, styles.howItWorksSection]}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          <Animated.View
            style={[
              styles.stepCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient colors={['#2C7DA0', '#61A5C2']} style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </LinearGradient>
            <FontAwesome5 name="user-plus" size={32} color="#2C7DA0" />
            <Text style={styles.stepTitle}>Sign Up</Text>
            <Text style={styles.stepDesc}>Create your account as a family member or caregiver</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.stepCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient colors={['#61A5C2', '#A9D6E5']} style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </LinearGradient>
            <Ionicons name="calendar-outline" size={32} color="#2C7DA0" />
            <Text style={styles.stepTitle}>Schedule Visit</Text>
            <Text style={styles.stepDesc}>Book a visit with available caregivers at your preferred time</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.stepCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient colors={['#2C7DA0', '#61A5C2']} style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </LinearGradient>
            <Ionicons name="document-text-outline" size={32} color="#2C7DA0" />
            <Text style={styles.stepTitle}>Track & Report</Text>
            <Text style={styles.stepDesc}>Monitor care progress and receive detailed weekly reports</Text>
          </Animated.View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 CareZone. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFE',
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroContainer: {
    height: height * 0.7,
    width: width,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    width: '100%',
    height: '100%',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  topButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  topLoginBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  topLoginText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  topSignupBtn: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  topSignupGradient: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  topSignupText: {
    color: '#1A2C3E',
    fontSize: 14,
    fontWeight: '600',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIcon: {
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 30,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  ctaPrimary: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  ctaPrimaryGradient: {
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  ctaPrimaryText: {
    color: '#1A2C3E',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#fff',
  },
  ctaSecondaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A2C3E',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E8EEF2',
  },
  featureIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2C3E',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    color: '#4A627A',
    textAlign: 'center',
    lineHeight: 18,
  },
  howItWorksSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8EEF2',
  },
  stepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  stepCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#F8FAFE',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EEF2',
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2C3E',
    marginTop: 12,
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 12,
    color: '#4A627A',
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#A9D6E5',
  },
});

export default LandingScreen;