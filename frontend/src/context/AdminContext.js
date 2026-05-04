import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { useUser } from './UserContext';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const { user } = useUser();
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews,  setReviews]  = useState([]);

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      // Fetch Products
      const prodRes = await fetch(`${API_BASE}/api/inventory`);
      const prodData = await prodRes.json();
      setInventoryProducts(prodData);

      // Fetch Users
      const userRes = await fetch(`${API_BASE}/api/users`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUsers(userData);
      }
      
      // Fetch Orders to map as Payments
      const orderRes = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (orderRes.ok) {
         const orderData = await orderRes.json();
         const mappedPayments = orderData.map(order => ({
           id: order._id,
           amount: order.totalPrice,
           status: order.isPaid ? 'Paid' : 'Pending',
           customer: order.user ? order.user.name : 'Guest',
           date: order.createdAt ? order.createdAt.substring(0, 10) : 'N/A',
           items: order.orderItems || [],
           method: order.paymentMethod || 'Credit Card',
           paymentReceipt: order.paymentReceipt || null,
           isPaid: order.isPaid || false,
           paidAt: order.paidAt || null
         }));
         setPayments(mappedPayments);
      }
    } catch (error) {
      console.log('Admin data fetch error:', error);
    }
  };

  // Derived Stats
  const stats = {
    revenue: payments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.amount, 0),
    orders:        payments.length,
    customers:     users.length, // Total users for now
    totalProducts: inventoryProducts.length,
  };

  return (
    <AdminContext.Provider value={{
      inventoryProducts, setInventoryProducts,
      users, setUsers,
      payments, setPayments,
      reviews, setReviews,
      stats,
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
