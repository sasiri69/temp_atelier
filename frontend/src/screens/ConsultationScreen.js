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
  TextInput,
  KeyboardAvoidingView
} from 'react-native';
import { ChevronLeft, Send, Image as ImageIcon } from 'lucide-react-native';

const INITIAL_MESSAGES = [
  { id: '1', text: 'Welcome to Atelier Concierge.', sender: 'concierge', time: '10:00 AM' },
  { id: '2', text: 'Im Julian, your dedicated styling assistant. How may I help you curate your wardrobe today?', sender: 'concierge', time: '10:00 AM' },
];

export default function ConsultationScreen({ navigation }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim() === '') return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setInputText('');
    
    // Simulate concierge typing response
    setTimeout(() => {
      const response = {
        id: (Date.now() + 1).toString(),
        text: "I'll review our latest arrivals to match your request. Just a moment please.",
        sender: 'concierge',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, response]);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Concierge</Text>
          <Text style={styles.onlineStatus}>Julian is online</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => (
            <View 
              key={msg.id} 
              style={[
                styles.messageWrapper, 
                msg.sender === 'user' ? styles.messageWrapperUser : styles.messageWrapperConcierge
              ]}
            >
              {msg.sender === 'concierge' && (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>J</Text>
                </View>
              )}
              <View 
                style={[
                  styles.messageBubble, 
                  msg.sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleConcierge
                ]}
              >
                <Text style={[styles.messageText, msg.sender === 'user' && styles.messageTextUser]}>
                  {msg.text}
                </Text>
                <Text style={[styles.timeText, msg.sender === 'user' && styles.timeTextUser]}>
                  {msg.time}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.attachBtn}>
            <ImageIcon size={20} color="#999" />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message Julian..."
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, inputText.trim() && styles.sendBtnActive]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Send size={18} color={inputText.trim() ? "#FFF" : "#999"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 15,
    height: 70,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    color: '#00332B',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  onlineStatus: {
    fontSize: 10,
    color: '#D4AF37',
    marginTop: 2,
    letterSpacing: 1,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperConcierge: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#00332B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 15,
    borderRadius: 12,
  },
  messageBubbleUser: {
    backgroundColor: '#00332B',
    borderBottomRightRadius: 4,
  },
  messageBubbleConcierge: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  messageText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  messageTextUser: {
    color: '#FFF',
  },
  timeText: {
    fontSize: 9,
    color: '#999',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  timeTextUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE9',
  },
  attachBtn: {
    padding: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F3F5F4',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    marginHorizontal: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#00332B',
  },
});
