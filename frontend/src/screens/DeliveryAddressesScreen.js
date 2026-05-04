import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView
} from 'react-native';
import { ChevronLeft, Plus, MapPin, Trash2, CheckCircle, Edit2, X } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import { API_BASE } from '../config/api';

export default function DeliveryAddressesScreen({ navigation }) {
  const { user, updateUser } = useUser();
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // inline delete confirm
  
  const syncAddressesToBackend = async (newAddresses) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ addresses: newAddresses })
      });
      
      if (response.ok) {
        const updatedProfile = await response.json();
        updateUser({ addresses: updatedProfile.addresses });
        return true;
      } else {
        Alert.alert('Error', 'Failed to save address to server.');
        return false;
      }
    } catch (error) {
      Alert.alert('Error', 'Network error while saving address.');
      return false;
    }
  };
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newAddress, setNewAddress] = useState({
    name: '',
    recipient: '',
    street: '',
    city: '',
    country: ''
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setNewAddress({ name: '', recipient: '', street: '', city: '', country: '' });
    setModalVisible(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingId(addr._id || addr.id);
    setNewAddress({
      name: addr.label || addr.name,
      recipient: addr.recipient,
      street: addr.street,
      city: addr.city,
      country: addr.country
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    // Inline confirm — no Alert.alert (unreliable in ScrollView on Android)
    const updated = addresses.filter(a => (a._id || a.id) !== id);
    const success = await syncAddressesToBackend(updated);
    if (success) {
      setAddresses(updated);
      setConfirmDeleteId(null);
    }
  };

  const handleSetDefault = async (id) => {
    const updated = addresses.map(a => ({
      ...a,
      isDefault: (a._id || a.id) === id
    }));
    const success = await syncAddressesToBackend(updated);
    if (success) setAddresses(updated);
  };

  const handleSave = async () => {
    const { name, recipient, street, city, country } = newAddress;

    // Validation: Check if any field is empty after trimming whitespace
    if (!name?.trim() || !recipient?.trim() || !street?.trim() || !city?.trim() || !country?.trim()) {
      Alert.alert(
        "Missing Information", 
        "Please fill out all address fields before saving.",
        [{ text: "OK" }]
      );
      return;
    }

    let updatedList;
    if (editingId) {
      updatedList = addresses.map(a => 
        (a._id || a.id) === editingId ? { ...newAddress, _id: editingId, isDefault: a.isDefault } : a
      );
    } else {
      updatedList = [...addresses, { ...newAddress, isDefault: addresses.length === 0 }];
    }

    const success = await syncAddressesToBackend(updatedList);
    if (success) {
      setAddresses(updatedList);
      setModalVisible(false);
      Alert.alert("Success", editingId ? "Address updated." : "Address added.");
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
        <Text style={styles.headerTitle}>Delivery Addresses</Text>
        <TouchableOpacity onPress={handleOpenAdd}>
          <Plus size={24} color="#00332B" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.sectionSubtitle}>PERSONAL ARCHIVE</Text>
          <Text style={styles.title}>Saved Locations</Text>
          <Text style={styles.description}>
            Manage your delivery destinations for a seamless checkout experience.
          </Text>
        </View>

        {addresses.map(address => (
          <View key={address._id || address.id} style={styles.addressContainer}>
            <View style={styles.addressInfo}>
              <View style={styles.iconContainer}>
                <MapPin size={24} color="#1A1A1A" />
              </View>
              <View style={styles.addressDetails}>
                <Text style={styles.addressName}>{address.name}</Text>
                <Text style={styles.addressText}>{address.recipient}</Text>
                <Text style={styles.addressText}>{address.street}</Text>
                <Text style={styles.addressText}>{address.city}</Text>
                <Text style={styles.addressText}>{address.country}</Text>
              </View>
            </View>

            {/* Inline delete confirm */}
            {confirmDeleteId === (address._id || address.id) ? (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmText}>Remove this address?</Text>
                <TouchableOpacity
                  style={styles.confirmYes}
                  onPress={() => handleDelete(address._id || address.id)}
                >
                  <Text style={styles.confirmYesText}>YES, DELETE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmNo}
                  onPress={() => setConfirmDeleteId(null)}
                >
                  <Text style={styles.confirmNoText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.addressActions}>
                {address.isDefault ? (
                  <View style={styles.defaultBadge}>
                    <CheckCircle size={12} color="#00332B" style={{marginRight: 4}} />
                    <Text style={styles.defaultText}>DEFAULT</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleSetDefault(address._id || address.id)}
                  >
                    <Text style={styles.setDefaultText}>SET DEFAULT</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.rightActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleOpenEdit(address)}
                  >
                    <Edit2 size={16} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => setConfirmDeleteId(address._id || address.id)}
                  >
                    <Trash2 size={16} color="#E53935" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addAddressBtn} onPress={handleOpenAdd}>
          <Plus size={20} color="#00332B" style={{marginRight: 10}} />
          <Text style={styles.addAddressText}>ADD NEW ADDRESS</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Address Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Address' : 'New Address'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ADDRESS LABEL (E.G. HOME, OFFICE)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Home"
                  value={newAddress.name}
                  onChangeText={(text) => setNewAddress({...newAddress, name: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>RECIPIENT NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Eleanor Vance"
                  value={newAddress.recipient}
                  onChangeText={(text) => setNewAddress({...newAddress, recipient: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>STREET ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="124 Couture Avenue"
                  value={newAddress.street}
                  onChangeText={(text) => setNewAddress({...newAddress, street: text})}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 15 }]}>
                  <Text style={styles.inputLabel}>CITY / STATE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="New York, NY"
                    value={newAddress.city}
                    onChangeText={(text) => setNewAddress({...newAddress, city: text})}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>COUNTRY</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="United States"
                    value={newAddress.country}
                    onChangeText={(text) => setNewAddress({...newAddress, country: text})}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>SAVE ADDRESS</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addressContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: 20,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE9',
  },
  iconContainer: {
    width: 44,
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  addressDetails: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#00332B',
    letterSpacing: 1,
  },
  actionBtn: {
    paddingVertical: 6,
  },
  setDefaultText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#999',
    letterSpacing: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtn: {
    padding: 6,
    marginRight: 10,
  },
  deleteBtn: {
    padding: 6,
  },
  addAddressBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#00332B',
    borderStyle: 'dashed',
    paddingVertical: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  addAddressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00332B',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F3F5F4',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1A1A1A',
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  saveBtn: {
    backgroundColor: '#00332B',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    backgroundColor: '#FFF0F0',
    padding: 10,
    borderRadius: 8,
  },
  confirmText: {
    flex: 1,
    fontSize: 12,
    color: '#E53935',
    fontWeight: '600',
  },
  confirmYes: {
    backgroundColor: '#E53935',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 10,
  },
  confirmYesText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  confirmNo: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  confirmNoText: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
