import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions, 
  StatusBar,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Modal,
} from 'react-native';
import { Chrome, Facebook, Eye, EyeOff, X, Apple } from 'lucide-react-native';
import { API_BASE } from '../config/api';

import { useUser } from '../context/UserContext';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [bgImage, setBgImage]         = useState(null);

  // Social Auth State
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialProvider, setSocialProvider] = useState('');
  const [socialEmail, setSocialEmail] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);
  const { login } = useUser();

  React.useEffect(() => {
    const fetchVisuals = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/visuals`);
        const data = await res.json();
        if (data && data.registerBackgroundImage) {
          setBgImage(data.registerBackgroundImage);
        }
      } catch (e) {
        console.log('Error fetching visual settings:', e);
      }
    };
    fetchVisuals();
  }, []);

  const handleRegister = async () => {
    // ── Basic validation ──────────────────────────────────────────────────
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    // ── API call ──────────────────────────────────────────────────────────
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.message?.includes('User already exists')) {
          throw new Error('An account with this email already exists. Please log in instead.');
        }
        throw new Error(data.message || 'Registration failed.');
      }

      // ── Success → go to Login ─────────────────────────────────────────
      Alert.alert(
        'Account Created! 🎉',
        'Your account has been created successfully. Please log in.',
        [{ text: 'Log In', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const openSocialModal = (provider) => {
    setSocialProvider(provider);
    setSocialEmail('');
    setSocialModalVisible(true);
  };

  const handleSocialSubmit = async () => {
    if (!socialEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your email to continue with social login.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(socialEmail.trim())) {
      Alert.alert('Invalid Email', 'Please provide a valid email format.');
      return;
    }

    try {
      setSocialLoading(true);
      const response = await fetch(`${API_BASE}/api/users/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: socialEmail.trim(), provider: socialProvider }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Social Authentication Failed');
      }

      setSocialModalVisible(false);
      login(data);
      
      Alert.alert(
        'Success! 🎉',
        `Successfully connected with ${socialProvider}.`,
        [
          { 
            text: 'Continue', 
            onPress: () => {
              if (data.isAdmin) {
                navigation.navigate('AdminDashboard');
              } else {
                navigation.navigate('HomeMain');
              }
            } 
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ImageBackground 
        source={bgImage ? { uri: bgImage.startsWith('/') ? `${API_BASE}${bgImage}` : bgImage } : { uri: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop' }}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ATELIER</Text>
            <Text style={styles.slogan}>Join the world of refined aesthetics</Text>
          </View>

          {/* Title Section */}
          <Text style={styles.title}>Create your account</Text>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input}
                  placeholder="Julianne Moore"
                  placeholderTextColor="#BBB"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input}
                  placeholder="j.moore@atelier.com"
                  placeholderTextColor="#BBB"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#BBB"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(v => !v)}>
                  {showPassword
                    ? <EyeOff size={20} color="#BBB" />
                    : <Eye    size={20} color="#BBB" />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#BBB"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.createButtonText}>Create Account</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR REGISTER WITH</Text>
            <View style={styles.line} />
          </View>

          {/* Social Register Section */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={() => openSocialModal('Google')}>
              <Chrome size={20} color="#EA4335" />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={() => openSocialModal('Apple')}>
              <Apple size={20} color="#000" />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>

    {/* Simulated Social Auth Modal */}
    <Modal visible={socialModalVisible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Connect with {socialProvider}</Text>
            <TouchableOpacity onPress={() => setSocialModalVisible(false)} disabled={socialLoading}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>
            Please provide your {socialProvider} account email. (Simulated OAuth Flow)
          </Text>
          <TextInput
            style={styles.modalInput}
            placeholder="user@gmail.com"
            placeholderTextColor="#999"
            value={socialEmail}
            onChangeText={setSocialEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity 
            style={[styles.modalButton, socialLoading && { opacity: 0.7 }]} 
            onPress={handleSocialSubmit}
            disabled={socialLoading}
          >
            {socialLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalButtonText}>Continue</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.75)', // Elegant subtle white overlay
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.03,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Optima' : 'serif',
  },
  slogan: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 35,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: '#F1F3F2',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  eyeIcon: {
    padding: 4,
  },
  createButton: {
    backgroundColor: '#00332B',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 40,
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDD',
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  socialButton: {
    flex: 0.48,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  socialButtonText: {
    color: '#333',
    fontWeight: '700',
    marginLeft: 10,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 50,
    paddingBottom: 40,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    fontWeight: 'bold',
    color: '#8D6E63',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00332B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#F3F5F4',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#00332B',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
