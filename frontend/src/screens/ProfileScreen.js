import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  SafeAreaView, 
  StatusBar,
  TextInput,
  Switch,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Menu, Settings, ChevronRight, Bell, LogOut, Edit2, Award, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../context/UserContext';
import { API_BASE } from '../config/api';

const { width } = Dimensions.get('window');

const PLACEHOLDER_AVATAR = 'https://ui-avatars.com/api/?background=00332B&color=fff&size=200&name=';

export default function ProfileScreen({ navigation }) {
  const { user, updateUser, logout } = useUser();

  // Derive display name from context (fallback to 'Member')
  const displayName = user?.name || 'Member';
  const memberYear  = user?.createdAt
    ? new Date(user.createdAt).getFullYear().toString()
    : new Date().getFullYear().toString();
  const avatarUri   = user?.profileImage 
    ? (user.profileImage.startsWith('http') || user.profileImage.startsWith('data:') ? user.profileImage : `${API_BASE}${user.profileImage}`)
    : `${PLACEHOLDER_AVATAR}${encodeURIComponent(displayName)}`;

  const [profileImage, setProfileImage]           = useState(avatarUri);

  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  // Edit modal state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [tempUsername, setTempUsername]             = useState(displayName);
  const [tempProfileImage, setTempProfileImage]     = useState(avatarUri);
  const [saving, setSaving]                         = useState(false);

  // Keep local state in sync when context user changes
  useEffect(() => {
    setTempUsername(displayName);
    setProfileImage(avatarUri);
    setTempProfileImage(avatarUri);
  }, [user]);

  const handleSave = async () => {
    if (!tempUsername.trim()) {
      Alert.alert('Name Required', 'Please enter a display name.');
      return;
    }

    try {
      setSaving(true);
      
      // 2. Update profile with Base64 image
      const response = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ 
          name: tempUsername,
          profileImage: tempProfileImage 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update failed.');

      // 3. Update local context
      updateUser({ 
        name: data.name,
        profileImage: data.profileImage 
      });
      
      setProfileImage(data.profileImage?.startsWith('http') || data.profileImage?.startsWith('data:') ? data.profileImage : `${API_BASE}${data.profileImage}`);
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err) {
      console.error(err);
      Alert.alert('Update Failed', 'Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) {
      setTempProfileImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const renderArchiveItem = (title, onPress = null) => (
    <TouchableOpacity style={styles.archiveItem} onPress={onPress}>
      <Text style={styles.archiveItemText}>{title}</Text>
      <ChevronRight size={20} color="#BBB" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ACCOUNT</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info Section */}
        <View style={styles.profileHeader}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
            <TouchableOpacity 
              style={styles.editImageBtn}
              onPress={() => setIsEditModalVisible(true)}
            >
              <Camera size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userSubtitle}>ATELIER MEMBER</Text>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{displayName}</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(true)}>
                <Edit2 size={16} color="#00332B" style={styles.editIcon} />
              </TouchableOpacity>
            </View>
            <Text style={styles.memberText}>Atelier Member since {memberYear}</Text>
            {user?.email ? (
              <Text style={styles.emailText}>{user.email}</Text>
            ) : null}
          </View>
        </View>

        {/* Personal Archive */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PERSONAL ARCHIVE</Text>
          <View style={styles.archiveList}>
            {renderArchiveItem('Personal Information', () => navigation.navigate('PersonalInfo'))}
            {renderArchiveItem('Order History',        () => navigation.navigate('OrderHistory'))}
            {renderArchiveItem('Payment Methods',      () => navigation.navigate('UserPaymentMethods'))}
            {renderArchiveItem('Delivery Addresses',   () => navigation.navigate('DeliveryAddresses'))}
          </View>
        </View>

        {/* Service Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SERVICE & SETTINGS</Text>

          <View style={styles.conciergeBanner}>
            <Text style={styles.conciergeLabel}>PRIORITY ACCESS</Text>
            <Text style={styles.conciergeTitle}>Concierge Support</Text>
            <Text style={styles.conciergeText}>
              As an Atelier Member, you have a dedicated styling assistant available 24/7 for tailored advice.
            </Text>
            <TouchableOpacity style={styles.consultationBtn} onPress={() => navigation.navigate('Consultation')}>
              <Text style={styles.consultationBtnText}>START CONSULTATION</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsRow}>
            <View>
              <Text style={styles.settingsLabel}>Notifications</Text>
              <Text style={styles.settingsSub}>Manage your editorial alerts</Text>
            </View>
            <Switch 
              value={isNotificationsEnabled}
              onValueChange={setIsNotificationsEnabled}
              trackColor={{ false: '#EEE', true: '#00332B' }}
            />
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>LOG OUT</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>VERSION 4.2.0 — ATELIER EMERALD</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <View style={styles.editGroup}>
              <Text style={styles.editLabel}>DISPLAY NAME</Text>
              <TextInput 
                style={styles.editInput}
                value={tempUsername}
                onChangeText={setTempUsername}
                placeholder="Your name"
                placeholderTextColor="#BBB"
              />
            </View>

            <View style={styles.editGroup}>
              <Text style={styles.editLabel}>PROFILE PHOTO</Text>
              <TouchableOpacity style={styles.pickImageBtn} onPress={pickImage}>
                <Camera size={20} color="#00332B" style={{ marginRight: 10 }} />
                <Text style={styles.pickImageBtnText}>
                  {tempProfileImage && tempProfileImage.startsWith('data:')
                    ? 'IMAGE SELECTED'
                    : 'CHOOSE FROM GALLERY'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#00332B',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 25,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#F3F5F4',
  },
  editImageBtn: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#00332B',
    padding: 10,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  userInfo: {
    alignItems: 'center',
  },
  userSubtitle: {
    fontSize: 10,
    color: '#999',
    letterSpacing: 1.5,
    marginBottom: 8,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  editIcon: {
    marginLeft: 10,
    opacity: 0.6,
  },
  memberText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  emailText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  section: {
    marginTop: 40,
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontSize: 10,
    color: '#999',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 20,
  },
  archiveList: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  archiveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  archiveItemText: {
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  conciergeBanner: {
    backgroundColor: '#00332B',
    padding: 30,
    marginBottom: 25,
  },
  conciergeLabel: {
    fontSize: 8,
    color: '#FFF',
    letterSpacing: 2,
    opacity: 0.7,
    marginBottom: 12,
  },
  conciergeTitle: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  conciergeText: {
    fontSize: 13,
    color: '#FFF',
    opacity: 0.8,
    lineHeight: 22,
    marginBottom: 25,
  },
  consultationBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 14,
    alignItems: 'center',
  },
  consultationBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#00332B',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F5F4',
    padding: 24,
    marginBottom: 20,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  settingsSub: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#EEE',
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: '#999',
  },
  versionText: {
    fontSize: 8,
    color: '#CCC',
    textAlign: 'center',
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00332B',
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  editGroup: {
    marginBottom: 25,
  },
  editLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  editInput: {
    height: 56,
    backgroundColor: '#F3F5F4',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingBottom: 20,
  },
  cancelBtn: {
    flex: 0.45,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 28,
  },
  cancelBtnText: {
    color: '#999',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pickImageBtn: {
    height: 56,
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#00332B',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickImageBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00332B',
    letterSpacing: 1,
  },
  saveBtn: {
    flex: 0.5,
    height: 56,
    backgroundColor: '#00332B',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
