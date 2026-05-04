import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  TextInput,
  Image,
  Dimensions,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { ChevronLeft, Search, User, Mail, Shield, Trash2, Ban, CheckCircle, MoreVertical, ChevronDown, UserMinus, UserCheck } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import { API_BASE } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';


const { width } = Dimensions.get('window');

export default function UserAdminScreen({ navigation }) {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/users`, {
        headers: { Authorization: `Bearer ${currentUser?.token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Could not fetch user directory.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUsers();
    }, [])
  );

  const toggleStatus = async (user) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${user._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser?.token}`
        },
        body: JSON.stringify({ isActive: !user.isActive })
      });

      if (response.ok) {
        Alert.alert('Success', `Account for ${user.name} has been ${!user.isActive ? 'activated' : 'disabled'}.`);
        fetchUsers();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesRole = true;
    if (selectedRole === 'Admin') matchesRole = u.isAdmin;
    if (selectedRole === 'Customer') matchesRole = !u.isAdmin;
    
    return matchesSearch && matchesRole;
  });


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#00332B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>USER ADMINISTRATION</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#999" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterSection}>
          <TouchableOpacity 
            style={[styles.filterSelector, isFilterVisible && styles.filterSelectorActive]}
            onPress={() => setIsFilterVisible(!isFilterVisible)}
          >
            <Shield size={16} color={isFilterVisible ? "#00332B" : "#999"} />
            <Text style={styles.filterValue}>{selectedRole}</Text>
            <ChevronDown size={14} color="#999" />
          </TouchableOpacity>

          {isFilterVisible && (
            <View style={styles.filterDropdown}>
              {['All Roles', 'Customer', 'Admin'].map(role => (
                <TouchableOpacity 
                  key={role} 
                  style={[styles.filterItem, selectedRole === role && styles.filterItemActive]}
                  onPress={() => {
                    setSelectedRole(role);
                    setIsFilterVisible(false);
                  }}
                >
                  <Text style={[styles.filterItemText, selectedRole === role && styles.filterItemTextActive]}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Member Directory</Text>
          <Text style={styles.summarySubtitle}>Managing {users.length} registered profiles.</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#00332B" style={{ marginTop: 50 }} />
        ) : (
          filteredUsers.map(user => (
            <View key={user._id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <View style={[styles.avatar, { backgroundColor: user.isAdmin ? '#00332B' : '#F0F0F0', justifyContent: 'center', alignItems: 'center' }]}>
                    <User size={24} color={user.isAdmin ? '#FFF' : '#666'} />
                  </View>
                  <View style={styles.nameZone}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, user.isActive ? styles.activeBadge : styles.bannedBadge]}>
                  <Text style={[styles.statusText, user.isActive ? styles.activeText : styles.bannedText]}>
                    {user.isActive ? 'ACTIVE' : 'DISABLED'}
                  </Text>
                </View>
              </View>

              <View style={styles.userDetails}>
                <View style={styles.detailItem}>
                  <Shield size={14} color="#666" />
                  <Text style={styles.detailText}>{user.isAdmin ? 'Administrator' : 'Customer'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <CheckCircle size={14} color="#666" />
                  <Text style={styles.detailText}>Joined {new Date(user.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => toggleStatus(user)}
                >
                  {user.isActive ? <Ban size={18} color="#E53935" /> : <UserCheck size={18} color="#43A047" />}
                  <Text style={[styles.actionBtnText, { color: user.isActive ? "#E53935" : "#43A047" }]}>
                    {user.isActive ? 'Disable Account' : 'Activate Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {filteredUsers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matches found in directory.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#00332B',
  },
  searchSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    zIndex: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F5F4',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#000',
  },
  filterSection: {
    marginTop: 12,
    zIndex: 10,
  },
  filterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  filterSelectorActive: {
    borderColor: '#00332B',
  },
  filterValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00332B',
    marginHorizontal: 10,
  },
  filterDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 20,
  },
  filterItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  filterItemActive: {
    backgroundColor: '#F0F7F5',
  },
  filterItemText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterItemTextActive: {
    color: '#00332B',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 24,
  },
  summaryBox: {
    marginBottom: 25,
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#1A1A1A',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  userCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
  },
  nameZone: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  userEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
  },
  bannedBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  activeText: {
    color: '#2E7D32',
  },
  bannedText: {
    color: '#C62828',
  },
  userDetails: {
    flexDirection: 'row',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 25,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
    color: '#666',
  },
  moreBtn: {
    marginLeft: 'auto',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
