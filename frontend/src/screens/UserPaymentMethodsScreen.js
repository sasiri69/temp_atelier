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
  Image,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView
} from 'react-native';
import { ChevronLeft, Plus, CreditCard, Trash2, CheckCircle, X } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import { API_BASE } from '../config/api';

export default function UserPaymentMethodsScreen({ navigation }) {
  const { user, updateUser } = useUser();
  const [cards, setCards] = useState(user?.paymentMethods || []);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCard, setNewCard] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  });

  const syncPaymentMethodsToBackend = async (newMethods) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ paymentMethods: newMethods })
      });
      
      if (response.ok) {
        const updatedProfile = await response.json();
        updateUser({ paymentMethods: updatedProfile.paymentMethods });
        return true;
      } else {
        Alert.alert('Error', 'Failed to save payment method to server.');
        return false;
      }
    } catch (error) {
      Alert.alert('Error', 'Network error while saving payment method.');
      return false;
    }
  };

  const handleDelete = async (id) => {
    // Inline confirm — no Alert.alert (unreliable in ScrollView on Android)
    const updated = cards.filter(c => (c._id || c.id) !== id);
    const success = await syncPaymentMethodsToBackend(updated);
    if (success) {
      setCards(updated);
      setConfirmDeleteId(null);
    }
  };

  const handleSetDefault = async (id) => {
    const updated = cards.map(c => ({
      ...c,
      isDefault: (c._id || c.id) === id
    }));
    const success = await syncPaymentMethodsToBackend(updated);
    if (success) setCards(updated);
  };

  // ── Stripe Simulated Validations ───────────────────────────────────────
  const validateLuhn = (num) => {
    let arr = (num + '')
      .replace(/\s/g, '')
      .split('')
      .reverse()
      .map(x => parseInt(x));
    let lastDigit = arr.splice(0, 1)[0];
    let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0);
    sum += lastDigit;
    return sum % 10 === 0;
  };

  const validateExpiry = (exp) => {
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) return false;
    const [month, year] = exp.split('/');
    const expiryDate = new Date(`20${year}`, month - 1);
    const today = new Date();
    today.setDate(1); 
    return expiryDate >= today;
  };

  const handleCardNumberChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    setNewCard({ ...newCard, number: formatted });
  };

  const handleExpiryChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      setNewCard({ ...newCard, expiry: `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}` });
    } else {
      setNewCard({ ...newCard, expiry: cleaned });
    }
  };

  const handleAddCard = async () => {
    if (!newCard.name || !newCard.number || !newCard.expiry || !newCard.cvv) {
      Alert.alert("Missing Details", "Please complete all credit card fields.");
      return;
    }

    const cleanCard = newCard.number.replace(/\s/g, '');
    if (cleanCard.length < 15 || !validateLuhn(cleanCard)) {
      Alert.alert('Card Declined', 'Invalid card number. Please check your card details.');
      return;
    }

    if (!validateExpiry(newCard.expiry)) {
      Alert.alert('Invalid Expiry', 'Card has expired or date is invalid (Use MM/YY).');
      return;
    }

    if (newCard.cvv.length < 3) {
      Alert.alert('Invalid CVV', 'CVV must be 3 or 4 digits.');
      return;
    }

    const cardToAdd = {
      cardholderName: newCard.name,
      cardNumber: newCard.number,
      expiry: newCard.expiry,
      isDefault: cards.length === 0
    };

    const updated = [...cards, cardToAdd];
    const success = await syncPaymentMethodsToBackend(updated);
    if (success) {
      setCards(updated);
      setModalVisible(false);
      setNewCard({ name: '', number: '', expiry: '', cvv: '' });
      Alert.alert("Success", "New payment method added successfully.");
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
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Plus size={24} color="#00332B" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.sectionSubtitle}>PERSONAL ARCHIVE</Text>
          <Text style={styles.title}>Saved Cards</Text>
          <Text style={styles.description}>
            Manage your payment methods for a seamless checkout experience.
          </Text>
        </View>

        {cards.map(card => {
          const cardNum = card.cardNumber || '';
          const last4 = cardNum.slice(-4);
          const type = cardNum.startsWith('4') ? 'Visa' : 'Mastercard';
          
          return (
            <View key={card._id || card.id} style={styles.cardContainer}>
              <View style={styles.cardInfo}>
                <View style={styles.iconContainer}>
                  <CreditCard size={24} color="#1A1A1A" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>{type} ending in {last4}</Text>
                  <Text style={styles.cardExpiry}>Expires {card.expiry}</Text>
                </View>
              </View>
              
              {/* Inline delete confirm */}
              {confirmDeleteId === (card._id || card.id) ? (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmText}>Remove this card?</Text>
                  <TouchableOpacity
                    style={styles.confirmYes}
                    onPress={() => handleDelete(card._id || card.id)}
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
                <View style={styles.cardActions}>
                  {card.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <CheckCircle size={12} color="#00332B" style={{marginRight: 4}} />
                      <Text style={styles.defaultText}>DEFAULT</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => handleSetDefault(card._id || card.id)}
                    >
                      <Text style={styles.setDefaultText}>SET DEFAULT</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.deleteBtn}
                    onPress={() => setConfirmDeleteId(card._id || card.id)}
                  >
                    <Trash2 size={16} color="#E53935" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity 
          style={styles.addCardBtn}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={20} color="#00332B" style={{marginRight: 10}} />
          <Text style={styles.addCardText}>ADD NEW PAYMENT METHOD</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Card Modal */}
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
              <Text style={styles.modalTitle}>New Card</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CARDHOLDER NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Julianne Moore"
                  value={newCard.name}
                  onChangeText={(text) => setNewCard({...newCard, name: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                  <Text style={styles.inputLabel}>CARD NUMBER</Text>
                  {newCard.number.startsWith('4') ? <Text style={styles.cardBrand}>VISA</Text> : 
                   newCard.number.startsWith('5') ? <Text style={styles.cardBrand}>MASTERCARD</Text> : 
                   newCard.number.startsWith('3') ? <Text style={styles.cardBrand}>AMEX</Text> : null}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="**** **** **** 4242"
                  keyboardType="numeric"
                  maxLength={19}
                  value={newCard.number}
                  onChangeText={handleCardNumberChange}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 15 }]}>
                  <Text style={styles.inputLabel}>EXPIRY DATE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    maxLength={5}
                    keyboardType="numeric"
                    value={newCard.expiry}
                    onChangeText={handleExpiryChange}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="***"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    value={newCard.cvv}
                    onChangeText={(text) => setNewCard({...newCard, cvv: text.replace(/\D/g, '')})}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddCard}>
                <Text style={styles.saveBtnText}>SAVE CARD</Text>
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
  cardContainer: {
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
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE9',
  },
  iconContainer: {
    width: 50,
    height: 35,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardExpiry: {
    fontSize: 12,
    color: '#999',
  },
  cardActions: {
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
  deleteBtn: {
    padding: 6,
  },
  addCardBtn: {
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
  addCardText: {
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
    height: '75%',
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
  cardBrand: {
    fontSize: 9,
    color: '#00332B',
    fontWeight: '800',
    letterSpacing: 1.5,
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
