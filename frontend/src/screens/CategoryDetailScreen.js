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
  Platform,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { ChevronDown, Filter, Search, ChevronLeft, Heart, Shirt, Briefcase, Layers, Activity, Smile, Moon, Baby, LayoutGrid, ShoppingBag, Wallet, Watch, Glasses, Gem, Wind, Flower, Footprints, Hand, Zap } from 'lucide-react-native';
import { API_BASE } from '../config/api';
import { useShop } from '../context/ShopContext';

const { width } = Dimensions.get('window');

const CATEGORIES_CONFIG = {
  Women: {
    subs: [
      { name: 'Casual Wear', icon: Smile },
      { name: 'Formal / Office Wear', icon: Briefcase },
      { name: 'Lingerie & Innerwear', icon: Heart },
      { name: 'Nightwear', icon: Moon },
      { name: 'Maternity Wear', icon: Baby }
    ]
  },
  Men: {
    subs: [
      { name: 'Casual Wear', icon: Shirt },
      { name: 'Formal / Office Wear', icon: Briefcase },
      { name: 'Innerwear', icon: Layers },
      { name: 'Sportswear', icon: Activity }
    ]
  },
  Accessories: {
    subs: [
      { name: 'Bags', icon: ShoppingBag },
      { name: 'Wallets', icon: Wallet },
      { name: 'Belts', icon: Zap },
      { name: 'Hats & Caps', icon: Smile },
      { name: 'Sunglasses', icon: Glasses },
      { name: 'Watches', icon: Watch },
      { name: 'Jewelry', icon: Gem },
      { name: 'Scarves', icon: Wind },
      { name: 'Hair Accessories', icon: Flower },
      { name: 'Socks', icon: Footprints },
      { name: 'Gloves', icon: Hand }
    ]
  }
};

export default function CategoryDetailScreen({ route, navigation }) {
  const { title, categoryId } = route.params || { title: "Women's Collection", categoryId: 'Women' };
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSubCat, setSelectedSubCat] = useState('All Pieces');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToWishlist, wishlist } = useShop();

  useEffect(() => {
    fetchProducts();
  }, [categoryId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/inventory`);
      const data = await response.json();
      // Filter by the main category (Women, Men, Accessories)
      // Normalizing case just in case the backend or admin input varies
      const filtered = data.filter(p => p.category?.toLowerCase() === categoryId?.toLowerCase());
      setProducts(filtered);
    } catch (error) {
      console.error('Error fetching category products:', error);
    } finally {
      setLoading(false);
    }
  };

  const config = CATEGORIES_CONFIG[categoryId] || CATEGORIES_CONFIG.Women;
  const subCats = config.subs;

  const filteredProducts = selectedSubCat === 'All Pieces' 
    ? products
    : products.filter(p => p.subCategory === selectedSubCat);

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

  const renderProduct = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.image?.startsWith('data:') || item.image?.startsWith('http') ? item.image : `${API_BASE}${item.image}` }} 
          style={styles.productImage} 
        />
        <TouchableOpacity 
          style={styles.wishlistBtn}
          onPress={() => addToWishlist(item)}
        >
          <Heart 
            size={16} 
            color={wishlist.some(p => p._id === item._id) ? "#D4AF37" : "#000"} 
            fill={wishlist.some(p => p._id === item._id) ? "#D4AF37" : "transparent"} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>Rs. {item.price}</Text>
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
      
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>ATELIER</Text>
        <TouchableOpacity>
          <Search size={22} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Page Title & Dropdown Trigger */}
        <View style={styles.titleSection}>
          <Text style={styles.collectionTitle}>{title.toUpperCase()}</Text>
          <TouchableOpacity 
            style={styles.dropdownTrigger}
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Text style={styles.dropdownActiveText}>{selectedSubCat}</Text>
            <ChevronDown size={14} color="#666" style={{ transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>
        </View>

        {/* Floating Dropdown Menu */}
        {isDropdownOpen && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity 
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedSubCat('All Pieces');
                setIsDropdownOpen(false);
              }}
            >
              <LayoutGrid size={18} color={selectedSubCat === 'All Pieces' ? '#00332B' : '#666'} />
              <Text style={[styles.dropdownItemText, selectedSubCat === 'All Pieces' && styles.selectedItemText]}>All Pieces</Text>
            </TouchableOpacity>
            {subCats.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedSubCat(cat.name);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Icon size={18} color={selectedSubCat === cat.name ? '#00332B' : '#666'} />
                  <Text style={[styles.dropdownItemText, selectedSubCat === cat.name && styles.selectedItemText]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Product Grid */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#00332B" />
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={item => item._id || item.id}
            numColumns={2}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <View style={styles.filterBar}>
                <Text style={styles.countText}>{filteredProducts.length} PIECES</Text>
                <TouchableOpacity style={styles.filterToggle}>
                  <Filter size={14} color="#1A1A1A" />
                  <Text style={styles.filterToggleText}>SORT & FILTER</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={{ flex: 1, height: 400, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#999', fontSize: 13, fontStyle: 'italic' }}>
                  No items found in this collection category.
                </Text>
              </View>
            )}
          />
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
    height: 60,
    backgroundColor: '#FAF9F6',
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: '#00332B',
  },
  content: {
    flex: 1,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  dropdownActiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginRight: 6,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#FFF',
    zIndex: 100,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F0EBE9',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 15,
  },
  selectedItemText: {
    color: '#00332B',
    fontWeight: 'bold',
  },
  gridContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 15,
  },
  countText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 1,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 8,
    letterSpacing: 1,
  },
  productCard: {
    width: (width - 50) / 2,
    marginBottom: 25,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.8,
    backgroundColor: '#F3F5F4',
    position: 'relative',
    borderRadius: 2,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 6,
    borderRadius: 20,
  },
  productInfo: {
    marginTop: 12,
  },
  productName: {
    fontSize: 13,
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  productPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
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
  }
});
