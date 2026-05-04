import React, { useState, useCallback } from 'react';
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
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {
  ChevronLeft, Plus, X, Upload, Check, Sparkles, Pencil, Trash2
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE } from '../config/api';
import { useAdmin } from '../context/AdminContext';
import { useUser } from '../context/UserContext';




export default function SeasonalManagementScreen({ navigation }) {
  const { setInventoryProducts } = useAdmin();
  const { user: currentUser } = useUser();


  const [seasonalProducts, setSeasonalProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form fields
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [itemNumber, setItemNumber] = useState('');
  const [category, setCategory] = useState('Women');
  const [stock, setStock] = useState('10');
  const [imageUri, setImageUri] = useState('');
  const [discount, setDiscount] = useState('0');
  const [materialCare, setMaterialCare] = useState('');
  const [shippingReturns, setShippingReturns] = useState('');
  const [sustainability, setSustainability] = useState('');

  // Size/Color Inventory state
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const [selectedColors, setSelectedColors] = useState(['Neutral']);
  const [customColor, setCustomColor] = useState('');
  const [sizeStocks, setSizeStocks] = useState({});
  const presetColors = ['Cloud', 'Sand', 'Stone', 'Mist', 'Noir'];



  // Hero Banner fields
  const [bannerTitle, setBannerTitle] = useState('SPRING / SUMMER 2026');
  const [bannerSubtitle, setBannerSubtitle] = useState('The Summer Collection');
  const [bannerImage, setBannerImage] = useState('');
  const [isHeroModalVisible, setIsHeroModalVisible] = useState(false);

  // Login Background fields
  const [loginBgImage, setLoginBgImage] = useState('');
  const [isLoginBgModalVisible, setIsLoginBgModalVisible] = useState(false);

  // Register Background fields
  const [registerBgImage, setRegisterBgImage] = useState('');
  const [isRegisterBgModalVisible, setIsRegisterBgModalVisible] = useState(false);

  // Home Background fields
  const [homeBgImage, setHomeBgImage] = useState('');
  const [isHomeBgModalVisible, setIsHomeBgModalVisible] = useState(false);


  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSeasonal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/inventory/seasonal`);
      if (!res.ok) throw new Error('Failed to fetch seasonal items');
      const data = await res.json();
      setSeasonalProducts(data);
      // Also refresh global inventory context
      const allRes = await fetch(`${API_BASE}/api/inventory`);
      if (allRes.ok) {
        const allData = await allRes.json();
        setInventoryProducts(allData);
      }
    } catch (e) {
      console.error('Fetch seasonal error:', e);
    } finally {
      setLoading(false);
    }
  };

  const addColor = () => {
    if (customColor.trim()) {
      const color = customColor.trim();
      if (!selectedColors.includes(color)) {
        setSelectedColors([...selectedColors, color]);
      }
      setCustomColor('');
    }
  };

  const removeColor = (color) => {
    setSelectedColors(selectedColors.filter(c => c !== color));
    const newStocks = { ...sizeStocks };
    Object.keys(newStocks).forEach(size => {
      if (newStocks[size]) delete newStocks[size][color];
    });
    setSizeStocks(newStocks);
  };

  const updateColorStockForSize = (size, color, val) => {
    const num = parseInt(val) || 0;
    setSizeStocks(prev => ({
      ...prev,
      [size]: {
        ...(prev[size] || {}),
        [color]: num
      }
    }));
  };

  const calculateTotalStock = (stocks) => {
    let total = 0;
    Object.values(stocks).forEach(colors => {
      Object.values(colors).forEach(count => {
        total += (parseInt(count) || 0);
      });
    });
    return total;
  };



  const fetchHeroSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      const data = await res.json();
      if (data) {
        setBannerTitle(data.bannerTitle);
        setBannerSubtitle(data.bannerSubtitle);
        setBannerImage(data.bannerImage);
      }
    } catch (e) {
      console.log('Error fetching hero settings:', e);
    }
  };

  const fetchVisualSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/visuals`);
      const data = await res.json();
      if (data) {
        if (data.loginBackgroundImage) setLoginBgImage(data.loginBackgroundImage);
        if (data.registerBackgroundImage) setRegisterBgImage(data.registerBackgroundImage);
        if (data.homeBackgroundImage) setHomeBgImage(data.homeBackgroundImage);
      }
    } catch (e) {
      console.log('Error fetching visual settings:', e);
    }
  };

  // Refresh every time screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchSeasonal();
      fetchHeroSettings();
      fetchVisualSettings();
    }, [])
  );


  // ── Image picker ──────────────────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required to upload visuals.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      const base64Uri = `data:${mimeType};base64,${result.assets[0].base64}`;
      setImageUri(base64Uri);
    }
  };

  const uploadImage = async (uri) => {
    return uri; // Base64 data URIs are stored directly in MongoDB
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleHeroSubmit = async () => {
    setSaving(true);
    try {
      const uploadedImg = await uploadImage(bannerImage);
      const res = await fetch(`${API_BASE}/api/settings/banner`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`
        },
        body: JSON.stringify({ 
          title: bannerTitle, 
          subtitle: bannerSubtitle, 
          image: uploadedImg 
        }),
      });


      if (res.ok) {
        Alert.alert('✓ Concept Updated', 'The shop home screen has been updated with the new seasonal visuals.');
        setIsHeroModalVisible(false);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update hero visuals.');
    } finally {
      setSaving(false);
    }
  };

  const handleLoginBgSubmit = async () => {
    setSaving(true);
    try {
      const uploadedImg = await uploadImage(loginBgImage);
      const res = await fetch(`${API_BASE}/api/visuals/login-bg`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`
        },
        body: JSON.stringify({ 
          loginBackgroundImage: uploadedImg 
        }),
      });

      if (res.ok) {
        Alert.alert('✓ Visual Updated', 'The app authentication screens have been updated.');
        setIsLoginBgModalVisible(false);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update authentication visuals.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterBgSubmit = async () => {
    setSaving(true);
    try {
      const uploadedImg = await uploadImage(registerBgImage);
      const res = await fetch(`${API_BASE}/api/visuals/register-bg`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`
        },
        body: JSON.stringify({ 
          registerBackgroundImage: uploadedImg 
        }),
      });

      if (res.ok) {
        Alert.alert('✓ Visual Updated', 'The registration screen background has been updated.');
        setIsRegisterBgModalVisible(false);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update registration visuals.');
    } finally {
      setSaving(false);
    }
  };

  const handleHomeBgSubmit = async () => {
    setSaving(true);
    try {
      const uploadedImg = await uploadImage(homeBgImage);
      const res = await fetch(`${API_BASE}/api/visuals/home-bg`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`
        },
        body: JSON.stringify({ 
          homeBackgroundImage: uploadedImg 
        }),
      });

      if (res.ok) {
        Alert.alert('✓ Visual Updated', 'The home screen hero background has been updated.');
        setIsHomeBgModalVisible(false);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update home screen visuals.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Incomplete', 'Please enter at least a name and price.');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Invalid Price', 'Price must be a positive number (e.g. 2500).');
      return;
    }

    const parsedDiscount = parseInt(discount) || 0;
    if (parsedDiscount < 0 || parsedDiscount > 99) {
      Alert.alert('Invalid Discount', 'Discount must be between 0% and 99%.');
      return;
    }

    setSaving(true);
    try {
      const finalImage = await uploadImage(imageUri);
      const rawNum = itemNumber.trim();
      const formattedItemNum = rawNum
        ? (rawNum.toUpperCase().startsWith('ID') ? rawNum.toUpperCase() : `ID${rawNum}`)
        : `ID${Date.now()}`;

      const totalStock = category === 'Accessories' ? (parseInt(stock) || 0) : calculateTotalStock(sizeStocks);

      const payload = {
        name: name.trim(),
        itemNumber: formattedItemNum,
        price: parseFloat(price) || 0,
        discountPercentage: parseInt(discount) || 0,
        image: finalImage || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
        stock: totalStock,
        sizeStocks: category === 'Accessories' ? {} : sizeStocks,
        colors: selectedColors,
        category,
        materialCare,
        shippingReturns,
        sustainability,
        status: 'ACTIVE',
        isSeasonal: true,
      };



      const method = editId ? 'PUT' : 'POST';
      const url = editId
        ? `${API_BASE}/api/inventory/${editId}`
        : `${API_BASE}/api/inventory`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Server error');
      }

      Alert.alert(
        '✓ Saved',
        editId ? 'Seasonal piece updated.' : 'New piece added to the collection.',
        [{ text: 'OK' }]
      );
      resetForm();
      setModalVisible(false);
      fetchSeasonal(); // refresh list
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save the item. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/inventory/${editId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete piece');
      
      setSeasonalProducts(prev => prev.filter(p => p._id !== editId));
      // Also remove from global inventory context
      setInventoryProducts(prev => prev.filter(p => p._id !== editId));
      setModalVisible(false);
      resetForm();
      Alert.alert('Deleted', 'The piece has been permanently removed.');
    } catch (e) {
      Alert.alert('Error', 'Could not delete the piece.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setName('');
    setPrice('');
    setItemNumber('');
    setCategory('Women');
    setStock('10');
    setImageUri('');
    setDiscount('0');
    setMaterialCare('');
    setShippingReturns('');
    setSustainability('');
    setSelectedColors(['Neutral']);
    setCustomColor('');
    setSizeStocks({});
    setShowDeleteConfirm(false);
  };

  const openEdit = (p) => {
    setEditId(p._id);
    setName(p.name || '');
    setPrice(String(p.price || ''));
    setItemNumber(p.itemNumber || '');
    setCategory(p.category || 'Women');
    setStock(String(p.stock || 0));
    setImageUri(p.image || '');
    setDiscount(String(p.discountPercentage || 0));
    setMaterialCare(p.materialCare || '');
    setShippingReturns(p.shippingReturns || '');
    setSustainability(p.sustainability || '');
    setSelectedColors(p.colors && p.colors.length > 0 ? p.colors : ['Neutral']);
    setSizeStocks(p.sizeStocks || {});
    setModalVisible(true);
  };



  // ── Render card (used inside ScrollView flex-wrap grid) ──────────────────
  const renderCard = (item) => {
    const imgUri = item.image?.startsWith('data:') || item.image?.startsWith('http')
      ? item.image
      : `${API_BASE}${item.image}`;

    return (
      <TouchableOpacity
        key={item._id}
        style={styles.card}
        onPress={() => openEdit(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardImageBox}>
          <Image source={{ uri: imgUri }} style={styles.cardImage} />
          <View style={styles.editOverlay}>
            <Pencil size={14} color="#FFF" />
          </View>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardPrice}>Rs. {Number(item.price).toLocaleString()}</Text>
          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>{item.category?.toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#00332B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Sparkles size={16} color="#D4AF37" />
          <Text style={styles.headerTitle}>SEASONAL CURATION</Text>
        </View>
        <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }} style={styles.addBtn}>
          <Plus size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Hero strip */}
      <TouchableOpacity 
        style={styles.hero} 
        activeOpacity={0.9} 
        onPress={() => setIsHeroModalVisible(true)}
      >
        <View style={styles.heroHeader}>
          <Text style={styles.heroLabel}>{bannerTitle.toUpperCase()}</Text>
          <View style={styles.editHeroBadge}>
            <Pencil size={10} color="#FFF" />
            <Text style={styles.editHeroText}>EDIT BANNER</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>{bannerSubtitle.replace('Collection', 'Collection\n')}</Text>
        <View style={styles.divider} />
        <Text style={styles.heroCount}>{seasonalProducts.length} pieces curated</Text>
      </TouchableOpacity>

      {/* App Visuals Strip */}
      <TouchableOpacity 
        style={[styles.hero, { backgroundColor: '#F0F4F2', marginTop: 1, height: 100 }]} 
        activeOpacity={0.9} 
        onPress={() => setIsLoginBgModalVisible(true)}
      >
        <View style={styles.heroHeader}>
          <Text style={[styles.heroLabel, { color: '#00332B' }]}>APP VISUALS</Text>
          <View style={styles.editHeroBadge}>
            <Pencil size={10} color="#FFF" />
            <Text style={styles.editHeroText}>EDIT LOGIN BG</Text>
          </View>
        </View>
        <Text style={[styles.heroTitle, { fontSize: 20, lineHeight: 24 }]}>Login Experience</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.hero, { backgroundColor: '#F5EBE9', marginTop: 1, height: 100 }]} 
        activeOpacity={0.9} 
        onPress={() => setIsRegisterBgModalVisible(true)}
      >
        <View style={styles.heroHeader}>
          <Text style={[styles.heroLabel, { color: '#8D6E63' }]}>APP VISUALS</Text>
          <View style={[styles.editHeroBadge, { backgroundColor: '#8D6E63' }]}>
            <Pencil size={10} color="#FFF" />
            <Text style={styles.editHeroText}>EDIT REGISTER BG</Text>
          </View>
        </View>
        <Text style={[styles.heroTitle, { fontSize: 20, lineHeight: 24, color: '#8D6E63' }]}>Registration Experience</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.hero, { backgroundColor: '#1A1A2E', marginTop: 1, height: 100 }]} 
        activeOpacity={0.9} 
        onPress={() => setIsHomeBgModalVisible(true)}
      >
        <View style={styles.heroHeader}>
          <Text style={[styles.heroLabel, { color: '#D4AF37' }]}>APP VISUALS</Text>
          <View style={[styles.editHeroBadge, { backgroundColor: '#D4AF37' }]}>
            <Pencil size={10} color="#FFF" />
            <Text style={styles.editHeroText}>EDIT HOME BG</Text>
          </View>
        </View>
        <Text style={[styles.heroTitle, { fontSize: 20, lineHeight: 24, color: '#FFF' }]}>Home Screen Hero</Text>
      </TouchableOpacity>


      {/* Products Grid inside one big ScrollView */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#00332B" />
            <Text style={styles.loadingText}>Fetching seasonal pieces…</Text>
          </View>
        ) : seasonalProducts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Sparkles size={40} color="#D4AF37" />
            <Text style={styles.emptyTitle}>No seasonal pieces yet</Text>
            <Text style={styles.emptySub}>Tap the + button to add the first drop.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {seasonalProducts.map(item => renderCard(item))}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modal}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
              <X size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editId ? 'Edit Seasonal Piece' : 'New Seasonal Piece'}
            </Text>
            <TouchableOpacity onPress={handleSubmit} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#00332B" />
                : <Check size={24} color="#00332B" />
              }
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Image picker */}
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri.startsWith('http') || imageUri.startsWith('/') ? (imageUri.startsWith('/') ? `${API_BASE}${imageUri}` : imageUri) : imageUri }}
                  style={styles.previewImg}
                />
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Upload size={32} color="#BBB" />
                  <Text style={styles.pickerText}>Upload Photo</Text>
                  <Text style={styles.pickerSub}>Square crops look best</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Name & ID */}
            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 0.7, marginRight: 10 }]}>
                <Text style={styles.fieldLabel}>PIECE NAME *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Silk Drape Dress"
                  placeholderTextColor="#BBB"
                />
              </View>
              <View style={[styles.field, { flex: 0.3 }]}>
                <Text style={styles.fieldLabel}>ITEM ID</Text>
                <TextInput
                  style={styles.input}
                  value={itemNumber}
                  onChangeText={setItemNumber}
                  placeholder="xxxx"
                  placeholderTextColor="#BBB"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Price, Discount & Stock */}
            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.fieldLabel}>PRICE (RS.) *</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#BBB"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.fieldLabel}>DISC. (%)</Text>
                <TextInput
                  style={styles.input}
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#BBB"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>STOCK QTY</Text>
                <View style={[styles.input, { justifyContent: 'center', backgroundColor: category === 'Accessories' ? '#F5F6F5' : '#E8F0ED' }]}>
                  {category === 'Accessories' ? (
                    <TextInput
                      style={{ flex: 1, fontSize: 13, color: '#1A1A1A' }}
                      value={stock}
                      onChangeText={setStock}
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#00332B' }}>
                      {calculateTotalStock(sizeStocks)}
                    </Text>
                  )}
                </View>
              </View>
            </View>


            {/* Category chips */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>CATEGORY</Text>
              <View style={styles.chips}>
                {['Women', 'Men', 'Accessories'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, category === cat && styles.chipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Matrix (only for clothing) */}
            {category !== 'Accessories' ? (
              <>
                <Text style={styles.fieldLabel}>STOCK PER SIZE</Text>
                <View style={styles.matrixContainer}>
                  {sizes.map(size => (
                    <View key={size} style={styles.matrixSizeRow}>
                      <View style={styles.sizeColumn}>
                        <Text style={styles.sizeTitle}>{size}</Text>
                      </View>
                      <View style={styles.colorStockGrid}>
                        {selectedColors.map(color => (
                          <View key={`${size}-${color}`} style={styles.colorInputItem}>
                            <Text style={styles.variantLabel}>{color}</Text>
                            <TextInput
                              style={styles.matrixInput}
                              keyboardType="numeric"
                              placeholder="0"
                              value={(sizeStocks[size]?.[color] || 0).toString()}
                              onChangeText={(v) => updateColorStockForSize(size, color, v)}
                            />
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>STOCK QTY</Text>
                <TextInput
                  style={styles.input}
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            )}

            {/* Color Chips */}
            <Text style={styles.fieldLabel}>AVAILABLE COLOURS</Text>
            <View style={styles.colorAddRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Add color (e.g. Sage)"
                value={customColor}
                onChangeText={setCustomColor}
              />
              <TouchableOpacity style={styles.smallAddBtn} onPress={addColor}>
                <Plus size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.chips}>
              {presetColors.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, selectedColors.includes(c) && styles.chipActive]}
                  onPress={() => selectedColors.includes(c) ? removeColor(c) : setSelectedColors([...selectedColors, c])}
                >
                  <Text style={[styles.chipText, selectedColors.includes(c) && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
              {selectedColors.filter(c => !presetColors.includes(c)).map(c => (
                <TouchableOpacity key={c} style={[styles.chip, styles.chipActive]} onPress={() => removeColor(c)}>
                  <Text style={[styles.chipText, styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>


            {/* Editorial Details */}


            <View style={styles.field}>
              <Text style={styles.fieldLabel}>MATERIAL & CARE</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                value={materialCare}
                onChangeText={setMaterialCare}
                placeholder="Fabric and maintenance details..."
                placeholderTextColor="#BBB"
                multiline
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>SHIPPING & RETURNS</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                value={shippingReturns}
                onChangeText={setShippingReturns}
                placeholder="Policy information..."
                placeholderTextColor="#BBB"
                multiline
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>SUSTAINABILITY</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                value={sustainability}
                onChangeText={setSustainability}
                placeholder="Environmental impact details..."
                placeholderTextColor="#BBB"
                multiline
              />
            </View>


            {/* Submit button */}
            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.submitText}>
                    {editId ? 'UPDATE PIECE' : 'ADD TO SEASONAL COLLECTION'}
                  </Text>
              }
            </TouchableOpacity>

            {editId && !showDeleteConfirm && (
              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D32F2F', marginTop: 15 }]} 
                onPress={() => setShowDeleteConfirm(true)}
                disabled={saving}
              >
                <Trash2 size={16} color="#D32F2F" style={{ marginRight: 8 }} />
                <Text style={[styles.submitText, { color: '#D32F2F' }]}>PERMANENTLY REMOVE PIECE</Text>
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
                    {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.confirmDeleteText}>YES, DELETE</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
      {/* Hero Management Modal */}
      <Modal visible={isHeroModalVisible} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsHeroModalVisible(false)}>
              <X size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Campaign Visuals</Text>
            <TouchableOpacity onPress={handleHeroSubmit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" /> : <Check size={24} color="#00332B" />}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHint}>The Hero Section is the first thing customers see. Update it to match the current season's aesthetic.</Text>
            
            <TouchableOpacity 
              style={[styles.imagePicker, { height: 300 }]} 
              onPress={async () => {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') return;
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [3, 4],
                  quality: 0.7,
                  base64: true,
                });
                if (!result.canceled && result.assets[0].base64) {
                  const mimeType = result.assets[0].mimeType || 'image/jpeg';
                  const base64Uri = `data:${mimeType};base64,${result.assets[0].base64}`;
                  setBannerImage(base64Uri);
                }
              }}
            >
              {bannerImage ? (
                <Image source={{ uri: bannerImage.startsWith('http') || bannerImage.startsWith('/') ? (bannerImage.startsWith('/') ? `${API_BASE}${bannerImage}` : bannerImage) : bannerImage }} style={styles.previewImg} />
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Upload size={32} color="#BBB" />
                  <Text style={styles.pickerText}>Set Campaign Image</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>CAMPAIGN TITLE (TOP LINE)</Text>
              <TextInput style={styles.input} value={bannerTitle} onChangeText={setBannerTitle} placeholder="e.g. S/S 2026 DROP" />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>COLLECTION NAME (MAIN TITLE)</Text>
              <TextInput style={styles.input} value={bannerSubtitle} onChangeText={setBannerSubtitle} placeholder="e.g. Summer Collection" />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleHeroSubmit} disabled={saving}>
              <Text style={styles.submitText}>SAVE CAMPAIGN CHANGES</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Login Background Management Modal */}
      <Modal visible={isLoginBgModalVisible} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsLoginBgModalVisible(false)}>
              <X size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>App Visuals</Text>
            <TouchableOpacity onPress={handleLoginBgSubmit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" /> : <Check size={24} color="#00332B" />}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHint}>This image appears on the Login and Registration screens. Choose a portrait-oriented fashion image.</Text>
            
            <TouchableOpacity 
              style={[styles.imagePicker, { height: 400 }]} 
              onPress={async () => {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') return;
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [3, 4],
                  quality: 0.7,
                  base64: true,
                });
                if (!result.canceled && result.assets[0].base64) {
                  const mimeType = result.assets[0].mimeType || 'image/jpeg';
                  const base64Uri = `data:${mimeType};base64,${result.assets[0].base64}`;
                  setLoginBgImage(base64Uri);
                }
              }}
            >
              {loginBgImage ? (
                <Image source={{ uri: loginBgImage.startsWith('http') || loginBgImage.startsWith('/') ? (loginBgImage.startsWith('/') ? `${API_BASE}${loginBgImage}` : loginBgImage) : loginBgImage }} style={styles.previewImg} />
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Upload size={32} color="#BBB" />
                  <Text style={styles.pickerText}>Set Login Background</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleLoginBgSubmit} disabled={saving}>
              <Text style={styles.submitText}>SAVE VISUAL CHANGES</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Register Background Management Modal */}
      <Modal visible={isRegisterBgModalVisible} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsRegisterBgModalVisible(false)}>
              <X size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>App Visuals (Register)</Text>
            <TouchableOpacity onPress={handleRegisterBgSubmit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" /> : <Check size={24} color="#00332B" />}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHint}>This image appears on the Registration screen. Choose a portrait-oriented fashion image.</Text>
            
            <TouchableOpacity 
              style={[styles.imagePicker, { height: 400 }]} 
              onPress={async () => {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') return;
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [3, 4],
                  quality: 0.7,
                  base64: true,
                });
                if (!result.canceled && result.assets[0].base64) {
                  const mimeType = result.assets[0].mimeType || 'image/jpeg';
                  const base64Uri = `data:${mimeType};base64,${result.assets[0].base64}`;
                  setRegisterBgImage(base64Uri);
                }
              }}
            >
              {registerBgImage ? (
                <Image source={{ uri: registerBgImage.startsWith('http') || registerBgImage.startsWith('/') ? (registerBgImage.startsWith('/') ? `${API_BASE}${registerBgImage}` : registerBgImage) : registerBgImage }} style={styles.previewImg} />
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Upload size={32} color="#BBB" />
                  <Text style={styles.pickerText}>Set Register Background</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleRegisterBgSubmit} disabled={saving}>
              <Text style={styles.submitText}>SAVE VISUAL CHANGES</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Home Background Management Modal */}
      <Modal visible={isHomeBgModalVisible} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsHomeBgModalVisible(false)}>
              <X size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Home Screen Hero</Text>
            <TouchableOpacity onPress={handleHomeBgSubmit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" /> : <Check size={24} color="#00332B" />}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHint}>This image fills the large hero section on the Home screen. Use a wide landscape or portrait fashion image for best results.</Text>
            
            <TouchableOpacity 
              style={[styles.imagePicker, { height: 400 }]} 
              onPress={async () => {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') return;
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [4, 5],
                  quality: 0.7,
                  base64: true,
                });
                if (!result.canceled && result.assets[0].base64) {
                  const mimeType = result.assets[0].mimeType || 'image/jpeg';
                  const base64Uri = `data:${mimeType};base64,${result.assets[0].base64}`;
                  setHomeBgImage(base64Uri);
                }
              }}
            >
              {homeBgImage ? (
                <Image source={{ uri: homeBgImage.startsWith('http') || homeBgImage.startsWith('/') ? (homeBgImage.startsWith('/') ? `${API_BASE}${homeBgImage}` : homeBgImage) : homeBgImage }} style={styles.previewImg} />
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Upload size={32} color="#BBB" />
                  <Text style={styles.pickerText}>Set Home Hero Background</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleHomeBgSubmit} disabled={saving}>
              <Text style={styles.submitText}>SAVE HOME VISUAL</Text>
            </TouchableOpacity>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 2.5, color: '#00332B', marginLeft: 6 },
  addBtn: {
    backgroundColor: '#00332B',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero
  hero: { paddingHorizontal: 20, paddingVertical: 22, backgroundColor: '#FAFAF8' },
  heroLabel: { fontSize: 9, color: '#D4AF37', letterSpacing: 2, fontWeight: 'bold', marginBottom: 8 },
  heroTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#00332B',
    lineHeight: 38,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  divider: { width: 30, height: 2, backgroundColor: '#D4AF37', marginTop: 14, marginBottom: 10 },
  heroCount: { fontSize: 11, color: '#999', letterSpacing: 0.5 },

  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editHeroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00332B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 5 },
  editHeroText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  sectionHint: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 20, fontStyle: 'italic' },


  // Grid — responsive flex-wrap, auto-adjusts to any screen width
  scrollContent: { paddingBottom: 80 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 12,
  },

  // Card — always 48% wide so 2 cards fit and auto-adjust on resize
  card: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEECE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImageBox: {
    width: '100%',
    aspectRatio: 1, // ← always square, adjusts with card width
    backgroundColor: '#F5F3EE',
    position: 'relative',
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  editOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { marginTop: 10, paddingHorizontal: 4 },
  cardName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', flexShrink: 1 },
  cardPrice: { fontSize: 12, color: '#00332B', fontWeight: '600', marginTop: 3 },
  catBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#F0EEE8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  catBadgeText: { fontSize: 8, fontWeight: 'bold', color: '#D4AF37', letterSpacing: 1 },

  // States
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 12, color: '#999', fontStyle: 'italic' },
  emptyBox: { marginTop: 60, alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20 },

  // Modal
  modal: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  form: { paddingHorizontal: 24, paddingTop: 20 },

  // Image picker
  imagePicker: {
    height: 220,
    backgroundColor: '#F3F5F4',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#E8EBEA',
    borderStyle: 'dashed',
  },
  previewImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  pickerPlaceholder: { alignItems: 'center' },
  pickerText: { fontSize: 15, fontWeight: '600', color: '#999', marginTop: 12 },
  pickerSub: { fontSize: 11, color: '#BBB', marginTop: 4 },

  // Form fields
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1.5, color: '#999', marginBottom: 10 },
  input: {
    backgroundColor: '#F5F6F5',
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1A1A1A',
  },
  rowFields: { flexDirection: 'row', marginBottom: 0 },

  // Category chips
  chips: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F6F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: { backgroundColor: '#E8F0ED', borderColor: '#00332B' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#888' },
  chipTextActive: { color: '#00332B', fontWeight: 'bold' },

  // Submit
  submitBtn: {
    backgroundColor: '#00332B',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  submitText: { color: '#FFF', fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
  
  // Matrix Styles
  matrixContainer: {
    backgroundColor: '#FAFAF8',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CCC',
  },
  matrixSizeRow: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 10,
  },
  sizeColumn: {
    width: 40,
    justifyContent: 'center',
  },
  sizeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00332B',
  },
  colorStockGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorInputItem: {
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    width: '48%',
  },
  variantLabel: {
    fontSize: 9,
    color: '#999',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  matrixInput: {
    fontSize: 14,
    color: '#00332B',
    padding: 0,
    fontWeight: '800',
  },
  colorAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  smallAddBtn: {
    backgroundColor: '#00332B',
    width: 48,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
