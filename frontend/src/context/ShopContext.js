import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useUser } from './UserContext';
import { API_BASE } from '../config/api';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const { user, updateUser } = useUser();
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Hydrate cart and wishlist when a user logs in or switches
  useEffect(() => {
    if (user) {
      setCart(user.cart || []);
      setWishlist(user.wishlist || []);
    }
  }, [user?._id]);

  const syncTimeoutRef = useRef(null);

  const syncWithBackend = async (newCart, newWishlist) => {
    if (!user?.token) return;

    // Update local user context to stay in sync immediately
    updateUser({ cart: newCart, wishlist: newWishlist });

    // Debounce backend sync to prevent MongoDB VersionError from rapid clicking
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      try {
        fetch(`${API_BASE}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ cart: newCart, wishlist: newWishlist }),
        }).catch(e => console.log('Shop sync error:', e));
      } catch (error) {
        console.log('Shop sync error:', error);
      }
    }, 1000);
  };

  const addToCart = (product, size = 'S', color = 'Default') => {
    let newCart;
    const existing = cart.find(item => item._id === product._id && item.selectedSize === size);

    // Remove from wishlist if it exists there
    const newWishlist = wishlist.filter(item => item._id !== product._id);
    setWishlist(newWishlist);

    // Calculate max available stock for this specific size
    let maxStock = product.stock !== undefined ? product.stock : 99;
    if (product.sizeStocks && product.sizeStocks[size] !== undefined) {
      maxStock = product.sizeStocks[size];
    }

    if (existing) {
      if (existing.quantity >= maxStock) {
        Alert.alert('Stock Limit', `Only ${maxStock} items available in size ${size}.`);
        return;
      }
      newCart = cart.map(item =>
        (item._id === product._id && item.selectedSize === size)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      if (maxStock < 1) {
        Alert.alert('Out of Stock', `Size ${size} is currently out of stock.`);
        return;
      }
      newCart = [...cart, { ...product, quantity: 1, selectedSize: size, selectedColor: color }];
    }

    setCart(newCart);
    syncWithBackend(newCart, newWishlist);

    Alert.alert('Success', `${product.name} added to bag.`);
  };

  const removeFromCart = (productId, size) => {
    const newCart = cart.filter(item => !(item._id === productId && item.selectedSize === size));
    setCart(newCart);
    syncWithBackend(newCart, wishlist);
  };

  const addToWishlist = (product) => {
    const isAdded = wishlist.some(item => item._id === product._id);
    if (!isAdded) {
      const newWishlist = [...wishlist, product];
      setWishlist(newWishlist);
      syncWithBackend(cart, newWishlist);
      Alert.alert('Wishlist', 'Added to your wishlist.');
    } else {
      Alert.alert('Wishlist', 'Item is already in your wishlist.');
    }
  };

  const removeFromWishlist = (productId) => {
    const newWishlist = wishlist.filter(item => item._id !== productId);
    setWishlist(newWishlist);
    syncWithBackend(cart, newWishlist);
    Alert.alert('Wishlist', 'Removed from your wishlist.');
  };

  const clearCart = () => {
    setCart([]);
    syncWithBackend([], wishlist);
  };

  const updateQuantity = (productId, size, change) => {
    let alertStock = false;
    let maxStockExceeded = 0;

    const newCart = cart.map(item => {
      if (item._id === productId && item.selectedSize === size) {
        let newQty = item.quantity + change;
        
        let maxStock = item.stock !== undefined ? item.stock : 99;
        if (item.sizeStocks && item.sizeStocks[size] !== undefined) {
          maxStock = item.sizeStocks[size];
        }
        
        // Prevent exceeding stock limit
        if (newQty > maxStock) {
          newQty = maxStock;
          alertStock = true;
          maxStockExceeded = maxStock;
        }
        
        newQty = Math.max(1, newQty);
        return { ...item, quantity: newQty };
      }
      return item;
    });

    if (alertStock) {
      Alert.alert('Stock Limit Reached', `Only ${maxStockExceeded} items available in size ${size}.`);
    } else {
      setCart(newCart);
      syncWithBackend(newCart, wishlist);
    }
  };

  return (
    <ShopContext.Provider value={{
      cart,
      wishlist,
      addToCart,
      removeFromCart,
      updateQuantity,
      addToWishlist,
      removeFromWishlist,
      clearCart
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
