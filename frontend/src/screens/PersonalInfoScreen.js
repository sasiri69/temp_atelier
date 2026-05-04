import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import { API_BASE } from '../config/api';

export default function PersonalInfoScreen({ navigation }) {
  const { user, updateUser } = useUser();

  // Pre-fill from the real logged-in user — empty strings if not available
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName,  setLastName]  = useState(user?.name?.split(' ').slice(1).join(' ') || '');
  const [email,     setEmail]     = useState(user?.email || '');
  const [phone,     setPhone]     = useState(user?.phone || '');
  const [dob,       setDob]       = useState(user?.dob   || '');

  const handleDobChange = (text) => {
    let cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length > 4 && cleaned.length <= 6) {
      cleaned = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    } else if (cleaned.length > 6) {
      cleaned = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    }
    
    setDob(cleaned);
  };

  const handleSave = async () => {
    // 1. Validate First Name
    if (!firstName.trim()) {
      Alert.alert('Missing Info', 'First Name is required.');
      return;
    }

    // 2. Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // 3. Validate Phone (optional but must be valid if provided)
    if (phone.trim() && phone.replace(/\D/g, '').length < 9) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number (at least 9 digits).');
      return;
    }

    // 4. Validate DOB (optional but must be valid YYYY-MM-DD if provided)
    if (dob.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) {
        Alert.alert('Invalid Date', 'Date of Birth must be in YYYY-MM-DD format.');
        return;
      }
      const dobDate = new Date(dob.trim());
      const today = new Date();
      if (isNaN(dobDate.getTime())) {
        Alert.alert('Invalid Date', 'Please enter a real date of birth.');
        return;
      }
      if (dobDate >= today) {
        Alert.alert('Invalid Date', 'Date of Birth cannot be today or in the future.');
        return;
      }
      if (dobDate.getFullYear() < 1900) {
        Alert.alert('Invalid Date', 'Please enter a valid date of birth after 1900.');
        return;
      }
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    try {
      const response = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ name: fullName, email: email.trim(), phone: phone.trim(), dob: dob.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update failed.');
      updateUser({ name: data.name, email: data.email, phone: data.phone, dob: data.dob });
      Alert.alert('Saved', 'Your details have been updated.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Details</Text>
        <TouchableOpacity onPress={handleSave}>
          <Save size={20} color="#00332B" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.sectionSubtitle}>ACCOUNT SETTINGS</Text>
          <Text style={styles.title}>Your Profile</Text>
          <Text style={styles.description}>
            Update your personal details. This information is used to personalize your Atelier experience and pre-fill your checkout forms.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.rowWrapper}>
            <View style={[styles.inputGroup, { flex: 0.48 }]}>
              <Text style={styles.label}>FIRST NAME</Text>
              <TextInput 
                style={styles.input} 
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 0.48 }]}>
              <Text style={styles.label}>LAST NAME</Text>
              <TextInput 
                style={styles.input} 
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput 
              style={styles.input} 
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PHONE NUMBER</Text>
            <TextInput 
              style={styles.input} 
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DATE OF BIRTH</Text>
            <TextInput 
              style={styles.input} 
              value={dob}
              onChangeText={handleDobChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 70,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE9',
  },
  headerTitle: {
    fontSize: 16,
    color: '#00332B',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  headerSection: {
    marginBottom: 40,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: '#999',
    letterSpacing: 2,
    marginBottom: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: 30,
  },
  rowWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 9,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    fontSize: 15,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  saveBtn: {
    backgroundColor: '#00332B',
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
