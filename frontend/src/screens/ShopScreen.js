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
  TextInput,
  Platform,
  FlatList,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Menu, Search, ArrowRight, Plus, Heart } from 'lucide-react-native';
import { API_BASE } from '../config/api';
import { useShop } from '../context/ShopContext';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'Women', title: 'Women', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop', color: '#F8F4F1' },
  { id: 'Men', title: 'Men', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1974&auto=format&fit=crop', color: '#F1F4F8' },
  { id: 'Accessories', title: 'Accessories', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=2076&auto=format&fit=crop', color: '#F8F1F4' },
];

export default function ShopScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { addToWishlist, wishlist } = useShop();

  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/inventory`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSafeColor = (colorName) => {
    if (!colorName) return '#E0E0E0';
    const c = colorName.toLowerCase().trim();
    const map = {
      'emerald': '#00332B',
      'midnight': '#1A1A1A',
      'cream': '#F5F5DC',
      'pearl': '#FDFDFD',
      'onyx': '#111111',
      'sage': '#9EB2A8',
      'rose': '#E5B7B7'
    };
    if (map[c]) return map[c];
    if (/^#([0-9A-F]{3}){1,2}$/i.test(c)) return c;
    const standard = ["aliceblue","antiquewhite","aqua","aquamarine","azure","beige","bisque","black","blanchedalmond","blue","blueviolet","brown","burlywood","cadetblue","chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson","cyan","darkblue","darkcyan","darkgoldenrod","darkgray","darkgreen","darkgrey","darkkhaki","darkmagenta","darkolivegreen","darkorange","darkorchid","darkred","darksalmon","darkseagreen","darkslateblue","darkslategray","darkslategrey","darkturquoise","darkviolet","deeppink","deepskyblue","dimgray","dimgrey","dodgerblue","firebrick","floralwhite","forestgreen","fuchsia","gainsboro","ghostwhite","gold","goldenrod","gray","green","greenyellow","grey","honeydew","hotpink","indianred","indigo","ivory","khaki","lavender","lavenderblush","lawngreen","lemonchiffon","lightblue","lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgreen","lightgrey","lightpink","lightsalmon","lightseagreen","lightskyblue","lightslategray","lightslategrey","lightsteelblue","lightyellow","lime","limegreen","linen","magenta","maroon","mediumaquamarine","mediumblue","mediumorchid","mediumpurple","mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise","mediumvioletred","midnightblue","mintcream","mistyrose","moccasin","navajowhite","navy","oldlace","olive","olivedrab","orange","orangered","orchid","palegoldenrod","palegreen","paleturquoise","palevioletred","papayawhip","peachpuff","peru","pink","plum","powderblue","purple","rebeccapurple","red","rosybrown","royalblue","saddlebrown","salmon","sandybrown","seagreen","seashell","sienna","silver","skyblue","slateblue","slategray","slategrey","snow","springgreen","steelblue","tan","teal","thistle","tomato","turquoise","violet","wheat","white","whitesmoke","yellow","yellowgreen"];
    return standard.includes(c) ? c : '#E0E0E0';
  };

  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) || 
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(q))
    );
  });

  const renderProduct = (item) => (
    <TouchableOpacity 
      key={item._id || item.id} 
      style={styles.gridItem}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      <View style={styles.itemImageContainer}>
        <Image 
          source={{ uri: item.image?.startsWith('data:') || item.image?.startsWith('http') ? item.image : `${API_BASE}${item.image}` }} 
          style={styles.itemImage} 
        />
        <TouchableOpacity 
          style={styles.wishlistBtn}
          onPress={() => addToWishlist(item)}
        >
          <Heart 
            size={18} 
            color={wishlist.some(p => p._id === item._id) ? "#D4AF37" : "#FFF"} 
            fill={wishlist.some(p => p._id === item._id) ? "#D4AF37" : "transparent"} 
          />
        </TouchableOpacity>
        {item.discountPercentage > 0 && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{item.discountPercentage}% OFF</Text>
          </View>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemCategory}>{item.category}</Text>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>Rs. {item.price}</Text>
        <View style={styles.colorRow}>
          {item.colors?.map((c, idx) => (
            <View key={idx} style={[styles.colorCircle, { backgroundColor: getSafeColor(c) }]} />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        {isSearching ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 24, paddingHorizontal: 15, flex: 1, height: 46 }}>
            <Search size={18} color="#999" />
            <TextInput 
              style={{ flex: 1, height: '100%', marginLeft: 10, fontSize: 13, color: '#1A1A1A' }}
              placeholder="Search Atelier directory..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 5 }}>
                 <Text style={{ color: '#999', fontSize: 16, fontWeight: 'bold' }}>×</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }} style={{ marginLeft: 8, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: '#DDD' }}>
               <Text style={{ fontSize: 10, color: '#1A1A1A', fontWeight: 'bold' }}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.headerLogo}>DISCOVER</Text>
            <TouchableOpacity onPress={() => setIsSearching(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Search size={22} color="#1A1A1A" />
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Category Gateways */}
        {!isSearching && !searchQuery && (
          <View style={styles.topSection}>
            <Text style={styles.sectionLabel}>COLLECTIONS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={styles.catWrapper}
                  onPress={() => navigation.navigate('CategoryDetail', { title: cat.title + " Collection", categoryId: cat.id })}
                >
                  <View style={[styles.catCard, { backgroundColor: cat.color }]}>
                     <Image source={{ uri: cat.image }} style={styles.catCardIconImage} />
                  </View>
                  <Text style={styles.catTitleLabel}>{cat.title.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mixed Feed Section */}
        <View style={[styles.feedSection, isSearching && { paddingTop: 20 }]}>
          {!isSearching && !searchQuery && (
            <View style={styles.feedHeader}>
               <Text style={styles.feedTitle}>Shop All Designs</Text>
               <Text style={styles.feedSubtitle}>Explore the complete Atelier collection</Text>
            </View>
          )}

          {!!searchQuery && (
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 20, letterSpacing: 1 }}>
              RESULTS FOR "{searchQuery.toUpperCase()}"
            </Text>
          )}

          <View style={styles.productGrid}>
            {loading ? (
              <ActivityIndicator size="large" color="#00332B" style={{ flex: 1, marginTop: 40 }} />
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(renderProduct)
            ) : (
              <Text style={{ textAlign: 'center', color: '#999', flex: 1, marginTop: 40, fontStyle: 'italic' }}>
                {searchQuery ? `No matches found for "${searchQuery}".` : "The catalog is currently empty."}
              </Text>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
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
    paddingHorizontal: 24,
    height: 80,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE9',
  },
  headerLogo: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 6,
    color: '#00332B',
    fontFamily: Platform.OS === 'ios' ? 'Optima' : 'serif',
  },
  topSection: {
    paddingTop: 30,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 2,
    marginLeft: 24,
    marginBottom: 20,
  },
  catScroll: {
    paddingLeft: 24,
    paddingRight: 10,
  },
  catWrapper: {
    alignItems: 'center',
    marginRight: 25,
  },
  catCard: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEE',
    borderWidth: 1,
    borderColor: '#00332B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catCardIconImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    resizeMode: 'cover',
  },
  catTitleLabel: {
    marginTop: 10,
    fontSize: 9,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 1,
  },
  feedSection: {
    paddingHorizontal: 24,
  },
  feedHeader: {
    marginBottom: 30,
  },
  feedTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  feedSubtitle: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 35,
  },
  itemImageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#FFF',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tagBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#00332B',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  itemInfo: {
    marginTop: 15,
  },
  itemCategory: {
    fontSize: 9,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00332B',
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 8,
    borderRadius: 20,
  },
});
