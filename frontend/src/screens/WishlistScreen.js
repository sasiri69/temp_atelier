import React, { useState } from 'react';
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
  Platform,
  FlatList
} from 'react-native';
import { ShoppingBag, X, Heart, ChevronLeft } from 'lucide-react-native';
import { API_BASE } from '../config/api';

const { width } = Dimensions.get('window');
import { useShop } from '../context/ShopContext';

export default function WishlistScreen({ navigation }) {
  const { wishlist, removeFromWishlist, addToCart, cart } = useShop();

  const renderWishlistItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      <View style={styles.imageWrapper}>
        <Image 
          source={{ uri: item.image?.startsWith('data:') || item.image?.startsWith('http') ? item.image : `${API_BASE}${item.image}` }} 
          style={styles.itemImage} 
        />
        <TouchableOpacity 
          style={styles.removeBtn}
          onPress={() => removeFromWishlist(item._id || item.id)}
        >
          <X size={16} color="#000" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoWrapper}>
        <Text style={styles.itemCategory}>{item.category}</Text>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>Rs. {item.price}</Text>
        
        <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
          <ShoppingBag size={14} color="#FFF" />
          <Text style={styles.addBtnText}>ADD TO BAG</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Heart size={24} color="#00332B" fill="#00332B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>WISHLIST</Text>
        <TouchableOpacity onPress={() => navigation.navigate('BAG')}>
          <ShoppingBag size={24} color="#00332B" />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.subHeader}>
          <Text style={styles.countText}>{wishlist.length} ITEMS SAVED</Text>
          <Text style={styles.archiveSubtitle}>Your personal archive of curated pieces.</Text>
        </View>

        {wishlist.length > 0 ? (
          <FlatList
            data={wishlist}
            renderItem={renderWishlistItem}
            keyExtractor={item => item._id || item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Heart size={48} color="#EEE" />
            <Text style={styles.emptyTitle}>Your archive is empty</Text>
            <Text style={styles.emptySubtitle}>
              Save items you love to revisit them here.
            </Text>
            <TouchableOpacity style={styles.browseBtn}>
              <Text style={styles.browseBtnText}>EXPLORE COLLECTION</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: '#00332B',
    fontFamily: Platform.OS === 'ios' ? 'Optima' : 'serif',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#00332B',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  countText: {
    fontSize: 10,
    color: '#00332B',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  archiveSubtitle: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  itemContainer: {
    width: (width - 45) / 2,
    marginBottom: 25,
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#F3F5F4',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF',
    padding: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  infoWrapper: {
    padding: 15,
  },
  itemCategory: {
    fontSize: 8,
    color: '#999',
    letterSpacing: 1,
    marginBottom: 5,
    fontWeight: '700',
  },
  itemName: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 5,
    height: 40,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00332B',
    marginBottom: 15,
  },
  addBtn: {
    backgroundColor: '#00332B',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 4,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  browseBtn: {
    borderWidth: 1,
    borderColor: '#00332B',
    paddingHorizontal: 25,
    paddingVertical: 14,
  },
  browseBtnText: {
    fontSize: 10,
    color: '#00332B',
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
