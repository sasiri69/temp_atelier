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
  Modal,
  Image,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { 
  ChevronLeft, Plus, X, Upload, Check, Pencil, ChevronDown, 
  Shirt, Briefcase, Layers, Moon, Heart, Zap, Activity,
  ShoppingBag as BagIcon, Wallet, Box, Glasses, Watch, Gem, Sparkles, Footprints, Hand, Trash2 
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAdmin } from '../context/AdminContext';
import { useUser } from '../context/UserContext';
import { API_BASE } from '../config/api';

const { width } = Dimensions.get('window');
// COLUMN_WIDTH calculation removed to use percentage-based styling for better responsiveness

export default function InventoryScreen({ navigation }) {
  const { inventoryProducts, setInventoryProducts } = useAdmin();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState('Women');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCategoryDropdownVisible, setIsCategoryDropdownVisible] = useState(false);
  
  const womenSubCategories = [
    { label: 'Casual Wear', icon: Shirt },
    { label: 'Formal / Office Wear', icon: Briefcase },
    { label: 'Lingerie & Innerwear', icon: Layers },
    { label: 'Nightwear', icon: Moon },
    { label: 'Maternity Wear', icon: Heart }
  ];
  const menSubCategories = [
    { label: 'Casual Wear', icon: Shirt },
    { label: 'Formal / Office Wear', icon: Briefcase },
    { label: 'Innerwear', icon: Layers },
    { label: 'Sportswear', icon: Activity }
  ];
  
  const accessoriesSubCategories = [
    { label: 'Bags', icon: BagIcon },
    { label: 'Wallets', icon: Wallet },
    { label: 'Belts', icon: Box },
    { label: 'Hats & Caps', icon: Shirt }, // Generic if specific hat icon missing
    { label: 'Sunglasses', icon: Glasses },
    { label: 'Watches', icon: Watch },
    { label: 'Jewelry', icon: Gem },
    { label: 'Scarves', icon: Moon }, // Generic
    { label: 'Hair Accessories', icon: Sparkles },
    { label: 'Socks', icon: Footprints },
    { label: 'Gloves', icon: Hand }
  ];

  const [selectedSubCategory, setSelectedSubCategory] = useState('All Pieces');
  const [isMainFilterVisible, setIsMainFilterVisible] = useState(false);
  
  const [name, setName] = useState('');
  const [itemNumber, setItemNumber] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [discount, setDiscount] = useState('0');
  const [singleStock, setSingleStock] = useState('0'); // For Accessories
  const [sizeStocks, setSizeStocks] = useState({
    'XS': {}, 'S': {}, 'M': {}, 'L': {}, 'XL': {}
  });
  const [selectedColors, setSelectedColors] = useState([]);
  const [customColor, setCustomColor] = useState('');
  const [materialCare, setMaterialCare] = useState('');
  const [shippingReturns, setShippingReturns] = useState('');
  const [sustainability, setSustainability] = useState('');
  const [isSeasonal, setIsSeasonal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const tabs = ['Women', 'Men', 'Accessories'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const presetColors = ['Emerald', 'Midnight', 'Cream', 'Pearl', 'Onyx'];

  const updateColorStockForSize = (size, color, count) => {
    setSizeStocks(prev => ({
      ...prev,
      [size]: {
        ...(prev[size] || {}),
        [color]: parseInt(count) || 0
      }
    }));
  };

  const calculateTotalStock = (stocks) => {
    if (!stocks) return parseInt(singleStock) || 0;
    let total = 0;
    Object.values(stocks).forEach(sizeObj => {
      if (typeof sizeObj === 'object' && sizeObj !== null) {
        total += Object.values(sizeObj).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
      } else {
        total += parseInt(sizeObj) || 0; // Support legacy flat structure
      }
    });
    return total;
  };

  const addColor = () => {
    if (customColor && !selectedColors.includes(customColor)) {
      setSelectedColors([...selectedColors, customColor]);
      setCustomColor('');
    }
  };

  const removeColor = (color) => {
    setSelectedColors(selectedColors.filter(c => c !== color));
  };

  const openEditModal = (product) => {
    setEditingProductId(product._id || product.id);
    setName(product.name);
    setItemNumber(product.itemNumber || '');
    setPrice(product.price.toString());
    setImage(product.image);
    setCategory(product.category); // Fix: also set category
    setDiscount(product.discountPercentage?.toString() || '0');
    setMaterialCare(product.materialCare || '');
    setShippingReturns(product.shippingReturns || '');
    setSustainability(product.sustainability || '');
    setIsSeasonal(product.isSeasonal || false);
    
    if (product.category === 'Accessories') {
      setSingleStock(product.stock.toString());
      setSizeStocks({ 'XS': 0, 'S': 0, 'M': 0, 'L': 0, 'XL': 0 });
    } else if (product.sizeStocks) {
      setSizeStocks(product.sizeStocks);
      setSingleStock('0');
    }
    
    setSelectedColors(product.colors || []);
    setIsModalVisible(true);
  };

  const resetForm = () => {
    setName('');
    setItemNumber('');
    setPrice('');
    setImage('');
    setCategory('');
    setDiscount('0');
    setSingleStock('0');
    setSizeStocks({ 'XS': {}, 'S': {}, 'M': {}, 'L': {}, 'XL': {} });
    setSelectedColors([]);
    setMaterialCare('');
    setShippingReturns('');
    setSustainability('');
    setIsSeasonal(false);
    setEditingProductId(null);
    setShowDeleteConfirm(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Atelier requires gallery access to upload product visuals.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,         // slightly compressed to keep MongoDB size reasonable
      base64: true,         // ← get Base64 directly from picker
    });

    if (!result.canceled && result.assets[0].base64) {
      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      const base64Uri = `data:${mimeType};base64,${result.assets[0].base64}`;
      setImage(base64Uri);  // store as data URI
    } else if (!result.canceled) {
      // Fallback: use file URI (won't persist across server restart)
      setImage(result.assets[0].uri);
    }
  };

  // uploadImage is no longer needed — Base64 is stored directly in MongoDB
  // Kept as passthrough for backward compatibility with any existing http/file URIs
  const uploadImage = async (uri) => {
    return uri; // Base64 data URIs are already ready; http URIs stay as-is
  };


  const handleAddProduct = async () => {
    if (!name || !price) {
      Alert.alert('Missing Information', 'Please fill in the product name and price.');
      return;
    }
    
    setLoading(true);
    try {
      const uploadedImagePath = await uploadImage(image);
      const formattedItemNumber = itemNumber.startsWith('ID') ? itemNumber : `ID${itemNumber}`;
      const totalStock = activeTab === 'Accessories' ? parseInt(singleStock) || 0 : calculateTotalStock(sizeStocks);

      const productPayload = {
        name, 
        price: parseFloat(price).toFixed(2), 
        image: uploadedImagePath || image,
        stock: totalStock,
        itemNumber: formattedItemNumber,
        category: activeTab,
        subCategory: category,
        discountPercentage: parseInt(discount) || 0,
        sizeStocks: activeTab === 'Accessories' ? null : sizeStocks,
        colors: selectedColors,
        materialCare,
        shippingReturns,
        sustainability,
        isSeasonal
      };

      if (editingProductId) {
        const response = await fetch(`${API_BASE}/api/inventory/${editingProductId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`,
          },
          body: JSON.stringify(productPayload)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update product in database');
        }
        
        const updatedFromDB = await response.json();
        setInventoryProducts(prev => prev.map(p => (p._id === editingProductId ? updatedFromDB : p)));
        Alert.alert('Success', 'Inventory entry refined successfully.');
      } else {
        const response = await fetch(`${API_BASE}/api/inventory`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`,
          },
          body: JSON.stringify(productPayload)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save to database');
        }
        
        const savedProduct = await response.json();
        setInventoryProducts(prev => [savedProduct, ...prev]);
        Alert.alert('Success', `Added to ${activeTab} collection.`);
      }

      setIsModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Save Failed', 'Could not sync with the database. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/inventory/${editingProductId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete product');
      
      setInventoryProducts(prev => prev.filter(p => p._id !== editingProductId));
      setIsModalVisible(false);
      resetForm();
      // Optional simple alert on success since modal is already closed
      Alert.alert('Deleted', 'The piece has been permanently removed.');
    } catch (error) {
      Alert.alert('Error', 'Could not delete the product.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = inventoryProducts.filter(p => {
    const matchesTab = p.category === activeTab;
    const isSpecialTab = (activeTab === 'Women' || activeTab === 'Men' || activeTab === 'Accessories');
    const matchesSubTab = (!isSpecialTab || selectedSubCategory === 'All Pieces' || p.subCategory === selectedSubCategory);
    return matchesTab && matchesSubTab;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#00332B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDITORIAL INVENTORY</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => {
              setActiveTab(tab);
              setSelectedSubCategory('All Pieces');
              setIsMainFilterVisible(false);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
              <Text style={styles.tabCount}> ({inventoryProducts.filter(p => p.category === tab).length})</Text>
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>{activeTab.toUpperCase()}</Text>
            <Text style={styles.summarySubtitle}>Archival stock management for {activeTab.toLowerCase()}.</Text>
          </View>
          <View style={styles.summaryDecor} />
        </View>

        <View style={styles.mainFilterContainer}>
            <TouchableOpacity 
              style={[styles.mainFilterSelector, isMainFilterVisible && styles.mainFilterSelectorActive]}
              onPress={() => setIsMainFilterVisible(!isMainFilterVisible)}
            >
              <View style={styles.filterLeft}>
                <Text style={styles.filterLabel}>FILTER BY</Text>
                <Text style={styles.filterValue}>{selectedSubCategory}</Text>
              </View>
              <ChevronDown size={20} color={isMainFilterVisible ? "#00332B" : "#999"} />
            </TouchableOpacity>

            {isMainFilterVisible && (
              <View style={styles.mainFilterList}>
                <TouchableOpacity 
                  style={[styles.mainFilterItem, selectedSubCategory === 'All Pieces' && styles.mainFilterItemActive]}
                  onPress={() => {
                    setSelectedSubCategory('All Pieces');
                    setIsMainFilterVisible(false);
                  }}
                >
                  <Text style={[styles.mainFilterItemText, selectedSubCategory === 'All Pieces' && styles.mainFilterItemTextActive]}>
                    All Pieces
                  </Text>
                </TouchableOpacity>
                {(activeTab === 'Women' ? womenSubCategories : activeTab === 'Men' ? menSubCategories : accessoriesSubCategories).map((cat) => (
                  <TouchableOpacity 
                    key={cat.label} 
                    style={[styles.mainFilterItem, selectedSubCategory === cat.label && styles.mainFilterItemActive]}
                    onPress={() => {
                      setSelectedSubCategory(cat.label);
                      setIsMainFilterVisible(false);
                    }}
                  >
                    <View style={styles.dropdownItemContent}>
                      <cat.icon size={16} color={selectedSubCategory === cat.label ? "#00332B" : "#666"} />
                      <Text style={[styles.mainFilterItemText, selectedSubCategory === cat.label && styles.mainFilterItemTextActive]}>
                        {cat.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

        <View style={styles.gridContainer}>
          {filteredProducts.map(product => {
            const isOutOfStock = product.stock === 0;
            return (
              <TouchableOpacity 
                key={product._id || product.id} 
                style={styles.gridItem}
                onPress={() => openEditModal(product)}
              >
                <View style={styles.imageWrapper}>
                  <Image 
                    source={{ 
                      uri: product.image?.startsWith('data:') || product.image?.startsWith('http')
                        ? product.image                        // Base64 or external URL → use directly
                        : `${API_BASE}${product.image}`       // server path → prepend API_BASE
                    }} 
                    style={styles.gridImage} 
                  />
                  <View style={styles.editBadge}>
                    <Pencil size={12} color="#FFF" />
                  </View>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.itemPrice}>Rs. {product.price} • {product.itemNumber}</Text>
                  <View style={[styles.stockBadge, isOutOfStock ? styles.oosBadge : styles.availableBadge]}>
                    <Text style={[styles.stockBadgeText, isOutOfStock ? { color: '#D32F2F' } : { color: '#00332B' }]}>
                      {isOutOfStock ? 'OUT OF STOCK' : 'AVAILABLE'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredProducts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pieces in this collection.</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => { resetForm(); setIsModalVisible(true); }}
      >
        <Plus size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setIsModalVisible(false); resetForm(); }}>
              <X size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingProductId ? 'Refine Entry' : `New ${activeTab} Item`}</Text>
            <TouchableOpacity onPress={handleAddProduct}>
              <Check size={24} color="#00332B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.7}>
              {image ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: image }} style={styles.selectedImage} />
                  <View style={styles.changeImageOverlay}>
                    <Text style={styles.changeImageText}>Change Visual</Text>
                  </View>
                </View>
              ) : (
                <>
                  <Upload size={32} color="#999" />
                  <Text style={styles.uploadText}>Upload Visuals for {activeTab}</Text>
                  <Text style={styles.tapToBrowse}>Tap to browse device gallery</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 0.65 }]}>
                <Text style={styles.label}>PRODUCT NAME</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g. Drape Collar Blazer"
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 0.3 }]}>
                <Text style={styles.label}>ITEM ID</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="xxxx"
                  value={itemNumber}
                  onChangeText={setItemNumber}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Category Selection for all tabs */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>COLLECTION CATEGORY</Text>
                <TouchableOpacity 
                  style={[styles.dropdownSelector, isCategoryDropdownVisible && styles.dropdownSelectorActive]} 
                  onPress={() => setIsCategoryDropdownVisible(!isCategoryDropdownVisible)}
                  activeOpacity={0.7}
                >
                  <View style={styles.selectorMain}>
                    <Text style={[styles.selectorText, !category && { color: '#999' }]}>
                      {category || 'Select sub-category...'}
                    </Text>
                  </View>
                  <View style={[styles.chevronWrapper, isCategoryDropdownVisible && { transform: [{ rotate: '180deg' }] }]}>
                    <ChevronDown size={20} color={isCategoryDropdownVisible ? "#00332B" : "#999"} />
                  </View>
                </TouchableOpacity>

                {isCategoryDropdownVisible && (
                  <View style={styles.dropdownList}>
                    {(activeTab === 'Women' ? womenSubCategories : activeTab === 'Men' ? menSubCategories : accessoriesSubCategories).map((cat) => (
                      <TouchableOpacity 
                        key={cat.label} 
                        style={[styles.dropdownItem, category === cat.label && styles.dropdownItemActive]}
                        onPress={() => {
                          setCategory(cat.label);
                          setIsCategoryDropdownVisible(false);
                        }}
                      >
                        <View style={styles.dropdownItemContent}>
                          <cat.icon size={18} color={category === cat.label ? "#00332B" : "#666"} />
                          <Text style={[styles.dropdownItemText, category === cat.label && styles.dropdownItemTextActive]}>
                            {cat.label}
                          </Text>
                        </View>
                        {category === cat.label && <Check size={16} color="#00332B" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 0.31 }]}>
                <Text style={styles.label}>PRICE (Rs.)</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 0.31 }]}>
                <Text style={styles.label}>DISC. (%)</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  value={discount}
                  onChangeText={setDiscount}
                />
              </View>
              
              {activeTab === 'Accessories' ? (
                <View style={[styles.inputGroup, { flex: 0.31 }]}>
                    <Text style={styles.label}>QUANTITY</Text>
                    <TextInput 
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={singleStock}
                    onChangeText={setSingleStock}
                    />
                </View>
              ) : (
                <View style={[styles.inputGroup, { flex: 0.31 }]}>
                    <Text style={styles.label}>TOT. STOCK</Text>
                    <View style={[styles.input, { justifyContent: 'center', backgroundColor: '#F9F9F9' }]}>
                    <Text style={{ fontWeight: 'bold' }}>{calculateTotalStock(sizeStocks)}</Text>
                    </View>
                </View>
              )}
            </View>

            {activeTab !== 'Accessories' && (
              <>
                <Text style={styles.label}>STOCK PER SIZE</Text>
                <View style={styles.sizeStockContainer}>
                  {sizes.map(size => (
                    <View key={size} style={styles.sizeStockSection}>
                      <View style={styles.sizeLabel}>
                          <Text style={styles.sizeLabelText}>{size}</Text>
                      </View>
                      <View style={styles.colorStockList}>
                        {selectedColors.length > 0 ? selectedColors.map((color, index) => (
                          <View key={`${size}-${color}-${index}`} style={styles.colorStockRow}>
                            <Text style={styles.colorStockName}>{color}</Text>
                            <TextInput 
                                style={styles.colorStockInput}
                                keyboardType="numeric"
                                placeholder="0"
                                value={(sizeStocks[size]?.[color] || 0).toString()}
                                onChangeText={(val) => updateColorStockForSize(size, color, val)}
                            />
                          </View>
                        )) : (
                          <Text style={styles.noColorMsg}>Select colors below first to set inventory levels.</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>AVAILABLE COLOURS</Text>
            <View style={styles.colorInputRow}>
              <TextInput 
                style={styles.colorInput}
                placeholder="Add a color (e.g. Sage)"
                value={customColor}
                onChangeText={setCustomColor}
              />
              <TouchableOpacity style={styles.addColorBtn} onPress={addColor}>
                <Plus size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.variantRow}>
              {presetColors.map((c, i) => (
                <TouchableOpacity 
                  key={`preset-${c}-${i}`} 
                  style={[styles.variantChip, selectedColors.includes(c) && styles.activeChip]}
                  onPress={() => selectedColors.includes(c) ? removeColor(c) : setSelectedColors([...selectedColors, c])}
                >
                  <Text style={[styles.variantText, selectedColors.includes(c) && styles.activeVariantText]}>{c}</Text>
                </TouchableOpacity>
              ))}
              {selectedColors.filter(c => !presetColors.includes(c)).map((c, i) => (
                <TouchableOpacity 
                  key={`custom-${c}-${i}`} 
                  style={[styles.variantChip, styles.activeChip]}
                  onPress={() => removeColor(c)}
                >
                  <Text style={[styles.variantText, styles.activeVariantText]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 15 }]}>EDITORIAL DETAILS</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontSize: 9, color: '#666', marginBottom: 5 }]}>MATERIAL & CARE</Text>
              <TextInput 
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 15 }]}
                placeholder="e.g. Dry clean only. Handle with care..."
                multiline
                value={materialCare}
                onChangeText={setMaterialCare}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontSize: 9, color: '#666', marginBottom: 5 }]}>SHIPPING & RETURNS</Text>
              <TextInput 
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 15 }]}
                placeholder="e.g. Complimentary express shipping..."
                multiline
                value={shippingReturns}
                onChangeText={setShippingReturns}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontSize: 9, color: '#666', marginBottom: 5 }]}>SUSTAINABILITY</Text>
              <TextInput 
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 15 }]}
                placeholder="e.g. Crafted from 100% peace silk..."
                multiline
                value={sustainability}
                onChangeText={setSustainability}
              />
            </View>

            {/* Seasonal Promotion Toggle */}
            <TouchableOpacity 
              style={[styles.seasonalToggle, isSeasonal && styles.seasonalToggleActive]}
              onPress={() => setIsSeasonal(!isSeasonal)}
              activeOpacity={0.8}
            >
              <View style={styles.seasonalToggleContent}>
                <Sparkles size={20} color={isSeasonal ? "#D4AF37" : "#999"} />
                <View style={styles.seasonalToggleText}>
                  <Text style={[styles.seasonalLabel, isSeasonal && { color: '#00332B' }]}>SEASONAL PROMOTION</Text>
                  <Text style={styles.seasonalSub}>Display this piece in the curated seasonal gallery.</Text>
                </View>
              </View>
              <View style={[styles.toggleTrack, isSeasonal && styles.toggleTrackActive]}>
                <View style={[styles.toggleThumb, isSeasonal && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
              onPress={handleAddProduct}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {editingProductId ? 'UPDATE CATALOG PIECE' : `CONFIRM & ADD TO ${activeTab.toUpperCase()}`}
                </Text>
              )}
            </TouchableOpacity>
            
            {editingProductId && !showDeleteConfirm && (
              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D32F2F', marginTop: 15 }]} 
                onPress={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                <Trash2 size={16} color="#D32F2F" style={{ marginRight: 8 }} />
                <Text style={[styles.submitBtnText, { color: '#D32F2F' }]}>PERMANENTLY REMOVE PIECE</Text>
              </TouchableOpacity>
            )}

            {showDeleteConfirm && (
              <View style={styles.inlineConfirm}>
                <Text style={styles.confirmTitle}>Remove Piece?</Text>
                <Text style={styles.confirmSub}>This action cannot be undone.</Text>
                <View style={styles.confirmRow}>
                  <TouchableOpacity style={styles.confirmBtnCancel} onPress={() => setShowDeleteConfirm(false)}>
                    <Text style={styles.confirmCancelText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtnDelete} onPress={handleDeleteProduct}>
                    {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.confirmDeleteText}>YES, DELETE</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 60,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#00332B',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tabButton: {
    marginRight: 20,
    paddingBottom: 8,
  },
  tabCount: {
    fontSize: 10,
    opacity: 0.6,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#00332B',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#00332B',
  },
  content: {
    padding: 24,
  },
  summaryBox: {
    marginBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryContent: {
    flex: 1,
  },
  summaryDecor: {
    width: 60,
    height: 1,
    backgroundColor: '#00332B',
    opacity: 0.3,
  },
  summaryTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 1,
  },
  summarySubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 30,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1 / 1.3,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    marginTop: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  itemPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '600',
  },
  stockBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  availableBadge: {
    backgroundColor: '#E8F5F2',
  },
  oosBadge: {
    backgroundColor: '#FFF0F0',
  },
  stockBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#BBB',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00332B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  formContent: {
    padding: 24,
  },
  imagePicker: {
    height: 180,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EEE',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    padding: 15,
  },
  uploadText: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    fontWeight: '600',
  },
  tapToBrowse: {
    fontSize: 10,
    color: '#BBB',
    marginTop: 4,
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeImageText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  input: {
    height: 56,
    backgroundColor: '#F3F5F4',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sizeStockContainer: {
    marginBottom: 25,
  },
  sizeStockSection: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#F7F9F8',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECEFEF',
  },
  sizeLabel: {
    width: 50,
    backgroundColor: '#00332B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeLabelText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  colorStockList: {
    flex: 1,
    padding: 10,
  },
  colorStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 4,
  },
  colorStockName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    flex: 1,
  },
  colorStockInput: {
    width: 60,
    height: 32,
    backgroundColor: '#F3F5F4',
    textAlign: 'center',
    borderRadius: 4,
    fontSize: 13,
    color: '#000',
  },
  noColorMsg: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  colorInputRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  colorInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F3F5F4',
    paddingHorizontal: 15,
    fontSize: 14,
  },
  addColorBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#00332B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  variantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
  },
  variantChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EEE',
    marginRight: 10,
    marginBottom: 10,
  },
  activeChip: {
    backgroundColor: '#00332B',
    borderColor: '#00332B',
  },
  variantText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  activeVariantText: {
    color: '#FFF',
  },
  submitBtn: {
    backgroundColor: '#00332B',
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  dropdownSelector: {
    height: 56,
    backgroundColor: '#F3F5F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderRadius: 0, // Keeping it consistent with other inputs if they are square
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dropdownSelectorActive: {
    borderColor: '#00332B',
    backgroundColor: '#FFF',
  },
  selectorMain: {
    flex: 1,
  },
  selectorText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  chevronWrapper: {
    marginLeft: 10,
  },
  dropdownList: {
    backgroundColor: '#FFF',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemActive: {
    backgroundColor: '#F0F7F5',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 12,
  },
  dropdownItemTextActive: {
    color: '#00332B',
    fontWeight: '700',
  },
  mainFilterContainer: {
    marginBottom: 25,
    zIndex: 10,
  },
  mainFilterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EBE9',
  },
  mainFilterSelectorActive: {
    borderColor: '#00332B',
    backgroundColor: '#FFF',
  },
  filterLeft: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 8,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  filterValue: {
    fontSize: 14,
    color: '#00332B',
    fontWeight: '600',
  },

  mainFilterList: {
    marginTop: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  mainFilterItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  mainFilterItemActive: {
    backgroundColor: '#F0F7F5',
  },
  mainFilterItemText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginLeft: 12,
  },
  mainFilterItemTextActive: {
    color: '#00332B',
    fontWeight: '700',
  },
  seasonalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F9F8',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEFEF',
    marginTop: 10,
    marginBottom: 20,
  },
  seasonalToggleActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#FFFDF9',
  },
  seasonalToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  seasonalToggleText: {
    marginLeft: 15,
    flex: 1,
  },
  seasonalLabel: {
    fontSize: 11,
    fontWeight: 'BOLD',
    color: '#666',
    letterSpacing: 1,
  },
  seasonalSub: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E4E2',
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: '#00332B',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  inlineConfirm: {
    backgroundColor: '#FFF0F0',
    padding: 20,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 4,
  },
  confirmSub: {
    fontSize: 11,
    color: '#D32F2F',
    marginBottom: 15,
    opacity: 0.8,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D32F2F',
    alignItems: 'center',
    borderRadius: 4,
  },
  confirmCancelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  confirmBtnDelete: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    borderRadius: 4,
  },
  confirmDeleteText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  }
});
