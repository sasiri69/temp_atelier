import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native';
import { ChevronLeft, ShoppingBag, Heart, Sparkles } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE } from '../config/api';
import { useShop } from '../context/ShopContext';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 2; // 16px outer padding each side + 16px gap between cards

export default function SeasonalCollectionScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToWishlist, wishlist } = useShop();

  // Re-fetch every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchSeasonal = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/api/inventory/seasonal`);
          if (!res.ok) throw new Error('Failed to fetch');
          const data = await res.json();
          if (active) setProducts(data);
        } catch (e) {
          console.error('Seasonal fetch error:', e);
        } finally {
          if (active) setLoading(false);
        }
      };
      fetchSeasonal();
      return () => { active = false; };
    }, [])
  );

  const renderItem = ({ item }) => {
    const isWishlisted = wishlist.some(w => w._id === item._id);
    const imgUri = item.image?.startsWith('data:') || item.image?.startsWith('http')
      ? item.image
      : `${API_BASE}${item.image}`;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetails', { product: item })}
        activeOpacity={0.88}
      >
        {/* Square image */}
        <View style={styles.imageBox}>
          <Image source={{ uri: imgUri }} style={styles.image} />
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => addToWishlist(item)}
          >
            <Heart
              size={18}
              color={isWishlisted ? '#D4AF37' : '#FFF'}
              fill={isWishlisted ? '#D4AF37' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Card info */}
        <View style={styles.info}>
          <Text style={styles.catText}>{(item.category || '').toUpperCase()}</Text>
          <Text style={styles.nameText} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.priceText}>Rs. {Number(item.price).toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Sparkles size={15} color="#D4AF37" />
          <Text style={styles.headerTitle}>EDITORIAL PIECES</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('BAG')}>
          <ShoppingBag size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroSub}>S/S 2026 COLLECTION</Text>
        <Text style={styles.heroMain}>The Summer{'\n'}Atelier</Text>
        <View style={styles.divider} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#00332B" size="large" />
          <Text style={styles.loadingText}>Curating seasonal visuals…</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.rowGap}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Sparkles size={36} color="#D4AF37" />
              <Text style={styles.emptyTitle}>Collection Coming Soon</Text>
              <Text style={styles.emptySub}>
                Our curators are selecting the finest pieces. Check back soon.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 66,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: '#1A1A1A',
    marginLeft: 8,
  },

  // Hero
  hero: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 16 },
  heroSub: { fontSize: 9, color: '#999', letterSpacing: 2, fontWeight: 'bold', marginBottom: 10 },
  heroMain: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#00332B',
    lineHeight: 48,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  divider: { width: 36, height: 2, backgroundColor: '#D4AF37', marginTop: 18 },

  // Grid
  grid: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 60 },
  rowGap: { justifyContent: 'space-between', gap: 16, marginBottom: 20 },

  // Card — SQUARE
  card: { width: CARD_SIZE },
  imageBox: {
    width: CARD_SIZE,
    height: CARD_SIZE, // ← 1:1 square
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F5F3EE',
    borderWidth: 1,
    borderColor: '#EEECE7',
    position: 'relative',
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: 8,
    borderRadius: 20,
  },
  info: { marginTop: 10, paddingHorizontal: 4 },
  catText: { fontSize: 8, color: '#BBB', letterSpacing: 1.5, fontWeight: 'bold', marginBottom: 4 },
  nameText: {
    fontSize: 13,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 19,
    flexShrink: 1,
  },
  priceText: { fontSize: 13, fontWeight: 'bold', color: '#00332B', marginTop: 6 },

  // Loader / empty
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 14, fontSize: 12, color: '#999', fontStyle: 'italic' },
  empty: { marginTop: 70, alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginTop: 18, marginBottom: 8 },
  emptySub: { textAlign: 'center', color: '#999', fontSize: 13, lineHeight: 20 },
});
