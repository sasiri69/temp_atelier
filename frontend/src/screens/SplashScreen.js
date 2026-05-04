import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  Dimensions, 
  StatusBar, 
  Animated,
  Platform,
  Easing
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useUser } from '../context/UserContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const { user, isInitializing } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const lineAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Elegant entrance animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lineAnim, {
        toValue: 80, // Expand to 80px width
        duration: 1200,
        delay: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 900,
        useNativeDriver: true,
      })
    ]).start();

    // Subtle pulsing animation for the loading dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  useEffect(() => {
    // Navigate strictly after animations AND async initialization
    const minimumDelay = 2800; // minimum display time
    const launchTime = Date.now();

    if (!isInitializing) {
      const waitTime = Math.max(0, minimumDelay - (Date.now() - launchTime));
      
      const timer = setTimeout(() => {
        if (user && !user.explicitLoggedOut && user.token) {
          if (user.isAdmin) {
             navigation.replace('AdminDashboard');
          } else {
             navigation.replace('HomeMain');
          }
        } else {
          navigation.replace('Login');
        }
      }, waitTime);

      return () => clearTimeout(timer);
    }
  }, [navigation, user, isInitializing]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Premium Dynamic Background */}
      <View style={StyleSheet.absoluteFillObject}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#1a1a1a" stopOpacity="1" />
              <Stop offset="0.4" stopColor="#0a0a0a" stopOpacity="1" />
              <Stop offset="1" stopColor="#000000" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grad)" />
        </Svg>
      </View>

      <SafeAreaView style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.headerSpacer} />
          
          <Animated.View style={[
            styles.centerContent, 
            { 
              opacity: fadeAnim, 
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ] 
            }
          ]}>
            <Text style={styles.logoText}>ATELIER</Text>
            
            <Animated.View style={[styles.goldLine, { width: lineAnim }]} />
            
            <Animated.View style={{ opacity: textFadeAnim }}>
              <Text style={styles.tagline}>MEMBER OF THE ARCHIVE</Text>
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.bottomSection, { opacity: textFadeAnim }]}>
            <View style={styles.loadingContainer}>
              <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
              <Text style={styles.loadingText}>CURATING COLLECTION...</Text>
            </View>
            
            <View style={styles.footerInfo}>
              <Text style={styles.footerNote}>© 2024 ATELIER</Text>
              <Text style={styles.footerNote}>PARIS • STOCKHOLM • NEW YORK</Text>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: height * 0.05,
  },
  headerSpacer: {
    flex: 1,
  },
  centerContent: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 52,
    fontWeight: '300',
    color: '#E8C37D', // Premium soft gold
    letterSpacing: 14,
    fontFamily: Platform.OS === 'ios' ? 'Optima' : 'serif',
    marginBottom: 5,
  },
  goldLine: {
    height: 1,
    backgroundColor: '#E8C37D',
    marginVertical: 22,
    opacity: 0.7,
  },
  tagline: {
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 6,
    fontWeight: '500',
    opacity: 0.7,
  },
  bottomSection: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'ios' ? 20 : 30, // account for android nav bar
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8C37D',
    marginRight: 12,
  },
  loadingText: {
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 2.5,
    fontWeight: '600',
    opacity: 0.6,
  },
  footerInfo: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  footerNote: {
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    fontWeight: '500',
    opacity: 0.4,
  },
});
