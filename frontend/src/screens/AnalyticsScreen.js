import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ChevronLeft, TrendingUp, DollarSign, ShoppingBag,
  Users, ArrowUpRight, ArrowDownRight, Calendar, Package, Star
} from 'lucide-react-native';
import { API_BASE } from '../config/api';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

function getWeekBuckets(orders) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const buckets = { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    if (d >= weekAgo) buckets[days[d.getDay()]] += o.totalPrice || 0;
  });
  return { labels: days, data: days.map(d => buckets[d]) };
}

function getMonthBuckets(orders) {
  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const data = [0, 0, 0, 0];
  const now = new Date();
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      const week = Math.min(Math.floor((d.getDate() - 1) / 7), 3);
      data[week] += o.totalPrice || 0;
    }
  });
  return { labels, data };
}

function getYearBuckets(orders) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = new Array(12).fill(0);
  const now = new Date();
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    if (d.getFullYear() === now.getFullYear()) data[d.getMonth()] += o.totalPrice || 0;
  });
  return { labels: months, data };
}

// ─── component ────────────────────────────────────────────────────────────────
export default function AnalyticsScreen({ navigation }) {
  const { user } = useUser();
  const [timeframe, setTimeframe] = useState('Weekly');
  const [loading, setLoading] = useState(true);

  // raw data from DB
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${user?.token}` };

      const [ordRes, usrRes, invRes, revRes] = await Promise.all([
        fetch(`${API_BASE}/api/orders`, { headers }),
        fetch(`${API_BASE}/api/users`, { headers }),
        fetch(`${API_BASE}/api/inventory`),
        fetch(`${API_BASE}/api/reviews/admin/all`, { headers }),
      ]);

      if (ordRes.ok)  setOrders(await ordRes.json());
      if (usrRes.ok)  setUsers(await usrRes.json());
      if (invRes.ok)  setProducts(await invRes.json());
      if (revRes.ok)  setReviews(await revRes.json());
    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  // ── derived metrics ──────────────────────────────────────────────────────
  const totalRevenue   = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const totalOrders    = orders.length;
  const totalCustomers = users.length;
  const totalProducts  = products.length;

  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const pendingOrders   = orders.filter(o => o.status === 'Pending');

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  // category distribution from real products
  const catCount = {};
  products.forEach(p => { catCount[p.category] = (catCount[p.category] || 0) + 1; });
  const catColors = { Women: '#00332B', Men: '#8D6E63', Accessories: '#D4AF37' };
  const categoryRows = Object.entries(catCount).map(([label, count]) => ({
    label,
    count,
    percentage: totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0,
    color: catColors[label] || '#999',
  }));

  // chart buckets
  const chartData = timeframe === 'Weekly'
    ? getWeekBuckets(orders)
    : timeframe === 'Monthly'
      ? getMonthBuckets(orders)
      : getYearBuckets(orders);

  const chartTotal = chartData.data.reduce((s, v) => s + v, 0);
  const maxVal = Math.max(...chartData.data, 1);

  // trend vs previous period (simple: compare first half vs second half of data)
  const half = Math.floor(chartData.data.length / 2);
  const firstHalf  = chartData.data.slice(0, half).reduce((s, v) => s + v, 0);
  const secondHalf = chartData.data.slice(half).reduce((s, v) => s + v, 0);
  const trendPct = firstHalf > 0 ? (((secondHalf - firstHalf) / firstHalf) * 100).toFixed(1) : '0.0';
  const trendUp = parseFloat(trendPct) >= 0;

  // top selling product (most ordered)
  const productFreq = {};
  orders.forEach(o => o.orderItems?.forEach(i => {
    const id = i.product?._id || i.product;
    if (id) productFreq[id] = (productFreq[id] || 0) + (i.qty || 1);
  }));
  const topProductId = Object.entries(productFreq).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topProduct = products.find(p => String(p._id) === String(topProductId));

  // low stock items
  const lowStock = products.filter(p => (p.stock || 0) < 5);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#00332B" />
        <Text style={{ marginTop: 12, color: '#999', fontSize: 12 }}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#00332B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ANALYTICS & INSIGHTS</Text>
        <TouchableOpacity onPress={fetchAll}>
          <Calendar size={20} color="#00332B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Performance Matrix</Text>
          <Text style={styles.summarySubtitle}>Live data from your database.</Text>
        </View>

        {/* ── KPI cards ── */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: '#00332B' }]}>
            <DollarSign size={18} color="rgba(255,255,255,0.7)" />
            <Text style={[styles.kpiVal, { color: '#FFF' }]}>{fmt(totalRevenue)}</Text>
            <Text style={[styles.kpiLabel, { color: 'rgba(255,255,255,0.6)' }]}>Total Revenue</Text>
          </View>
          <View style={styles.kpiCard}>
            <ShoppingBag size={18} color="#00332B" />
            <Text style={styles.kpiVal}>{totalOrders}</Text>
            <Text style={styles.kpiLabel}>Orders</Text>
          </View>
          <View style={styles.kpiCard}>
            <Users size={18} color="#8D6E63" />
            <Text style={styles.kpiVal}>{totalCustomers}</Text>
            <Text style={styles.kpiLabel}>Customers</Text>
          </View>
          <View style={styles.kpiCard}>
            <Package size={18} color="#D4AF37" />
            <Text style={styles.kpiVal}>{totalProducts}</Text>
            <Text style={styles.kpiLabel}>Products</Text>
          </View>
        </View>

        {/* ── Timeframe switcher ── */}
        <View style={styles.timeframeContainer}>
          {['Weekly', 'Monthly', 'Yearly'].map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.timeframeBtn, timeframe === mode && styles.timeframeBtnActive]}
              onPress={() => setTimeframe(mode)}
            >
              <Text style={[styles.timeframeBtnText, timeframe === mode && styles.timeframeBtnTextActive]}>
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Revenue chart ── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartLabel}>{timeframe.toUpperCase()} REVENUE</Text>
              <Text style={styles.chartValue}>{fmt(chartTotal)}</Text>
            </View>
            <View style={[styles.trendBadge, { backgroundColor: trendUp ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)' }]}>
              {trendUp
                ? <ArrowUpRight size={14} color="#4CAF50" />
                : <ArrowDownRight size={14} color="#F44336" />}
              <Text style={[styles.trendText, { color: trendUp ? '#4CAF50' : '#F44336' }]}>
                {trendUp ? '+' : ''}{trendPct}%
              </Text>
            </View>
          </View>

          <View style={styles.barChart}>
            {chartData.data.map((val, idx) => (
              <View key={idx} style={styles.barContainer}>
                <View style={[
                  styles.bar,
                  { height: Math.max((val / maxVal) * 150, val > 0 ? 4 : 2) },
                  val === 0 && { opacity: 0.2 }
                ]} />
                <Text style={styles.barLabel}>{chartData.labels[idx].substring(0, 1)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Breakdown ── */}
        <Text style={styles.sectionTitle}>{timeframe.toUpperCase()} BREAKDOWN</Text>
        <View style={styles.breakdownCard}>
          {chartData.labels.map((label, idx) => (
            <View key={idx} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{label}</Text>
              <View style={styles.breakdownValueContainer}>
                <Text style={styles.breakdownValue}>{fmt(chartData.data[idx])}</Text>
                {chartData.data[idx] > 0
                  ? <ArrowUpRight size={12} color="#4CAF50" />
                  : <ArrowDownRight size={12} color="#CCC" />}
              </View>
            </View>
          ))}
        </View>

        {/* ── Order status ── */}
        <Text style={styles.sectionTitle}>ORDER STATUS</Text>
        <View style={styles.statusRow}>
          {[
            { label: 'Pending',    count: pendingOrders.length,                             color: '#F9A825' },
            { label: 'Delivered',  count: deliveredOrders.length,                           color: '#00332B' },
            { label: 'Other',      count: totalOrders - pendingOrders.length - deliveredOrders.length, color: '#8D6E63' },
          ].map(s => (
            <View key={s.label} style={[styles.statusCard, { borderTopColor: s.color }]}>
              <Text style={[styles.statusCount, { color: s.color }]}>{s.count}</Text>
              <Text style={styles.statusLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Category distribution ── */}
        <Text style={styles.sectionTitle}>COLLECTION REACH</Text>
        <View style={styles.card}>
          {categoryRows.length > 0 ? categoryRows.map((cat, idx) => (
            <View key={idx} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <View style={[styles.dot, { backgroundColor: cat.color }]} />
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={styles.categoryCount}>({cat.count} items)</Text>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                </View>
                <Text style={styles.progressText}>{cat.percentage}%</Text>
              </View>
            </View>
          )) : (
            <Text style={{ color: '#999', fontSize: 12, textAlign: 'center' }}>No products in inventory yet.</Text>
          )}
        </View>

        {/* ── Key metrics ── */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#E8F5F2' }]}>
              <DollarSign size={20} color="#00332B" />
            </View>
            <Text style={styles.metricVal}>{fmt(avgOrderValue)}</Text>
            <Text style={styles.metricLabel}>Avg Order Value</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#FFF8E1' }]}>
              <Star size={20} color="#D4AF37" />
            </View>
            <Text style={styles.metricVal}>{avgRating} ★</Text>
            <Text style={styles.metricLabel}>Avg Review ({reviews.length})</Text>
          </View>
        </View>

        {/* ── Editorial insights (real data) ── */}
        <Text style={styles.sectionTitle}>EDITORIAL INSIGHTS</Text>
        <View style={styles.insightBox}>
          {topProduct && (
            <View style={styles.insightItem}>
              <TrendingUp size={16} color="#00332B" />
              <Text style={styles.insightText}>
                Best seller: <Text style={{ fontWeight: 'bold' }}>{topProduct.name}</Text> ({productFreq[topProductId]} units ordered)
              </Text>
            </View>
          )}
          <View style={styles.insightItem}>
            <ShoppingBag size={16} color="#00332B" />
            <Text style={styles.insightText}>
              {deliveredOrders.length} out of {totalOrders} orders successfully delivered
              {totalOrders > 0 ? ` (${Math.round((deliveredOrders.length / totalOrders) * 100)}% fulfillment rate)` : '.'}
            </Text>
          </View>
          <View style={styles.insightItem}>
            <DollarSign size={16} color="#00332B" />
            <Text style={styles.insightText}>
              Average order value is {fmt(avgOrderValue)}.
            </Text>
          </View>
          {lowStock.length > 0 && (
            <View style={styles.insightItem}>
              <Package size={16} color="#E53935" />
              <Text style={[styles.insightText, { color: '#E53935' }]}>
                ⚠ {lowStock.length} product{lowStock.length > 1 ? 's' : ''} running low on stock (under 5 units).
              </Text>
            </View>
          )}
        </View>

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
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  summaryBox: { marginBottom: 20 },
  summaryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#1A1A1A',
  },
  summarySubtitle: { fontSize: 13, color: '#999', marginTop: 4 },

  // KPI grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  kpiCard: {
    width: '47%',
    backgroundColor: '#F3F5F4',
    borderRadius: 18,
    padding: 18,
    marginBottom: 4,
  },
  kpiVal: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginTop: 8, marginBottom: 2 },
  kpiLabel: { fontSize: 11, color: '#999', fontWeight: '600', letterSpacing: 0.5 },

  // Timeframe
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F5F4',
    padding: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  timeframeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  timeframeBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  timeframeBtnText: { fontSize: 12, fontWeight: '600', color: '#999' },
  timeframeBtnTextActive: { color: '#00332B' },

  // Chart
  chartCard: {
    backgroundColor: '#00332B',
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  chartLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1.5 },
  chartValue: { fontSize: 24, color: '#FFF', fontWeight: 'bold', marginTop: 5 },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trendText: { fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: { alignItems: 'center' },
  bar: { width: 12, backgroundColor: '#FFF', borderRadius: 6, opacity: 0.8 },
  barLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 10, fontWeight: 'bold' },

  // Breakdown
  sectionTitle: {
    fontSize: 10, color: '#999', fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 15,
  },
  breakdownCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 10,
    marginBottom: 30, borderWidth: 1, borderColor: '#F0F0F0',
  },
  breakdownRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 15,
    borderBottomWidth: 1, borderBottomColor: '#F9FAF9',
  },
  breakdownLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  breakdownValueContainer: { flexDirection: 'row', alignItems: 'center' },
  breakdownValue: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginRight: 6 },

  // Order status
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statusCard: {
    width: '31%', backgroundColor: '#F3F5F4', borderRadius: 16,
    padding: 16, alignItems: 'center', borderTopWidth: 3,
  },
  statusCount: { fontSize: 24, fontWeight: 'bold' },
  statusLabel: { fontSize: 11, color: '#999', marginTop: 4, fontWeight: '600' },

  // Category
  card: { backgroundColor: '#F3F5F4', borderRadius: 20, padding: 24, marginBottom: 30 },
  categoryRow: { marginBottom: 20 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  categoryLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  categoryCount: { fontSize: 11, color: '#999', marginLeft: 6 },
  progressContainer: { flexDirection: 'row', alignItems: 'center' },
  progressBar: {
    flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3, marginRight: 15,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: 'bold', color: '#1A1A1A', width: 35 },

  // Metrics
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  metricCard: {
    width: '48%', backgroundColor: '#FFF', borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: '#F0F0F0', alignItems: 'center',
  },
  metricIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  metricVal: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center' },
  metricLabel: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'center' },

  // Insights
  insightBox: { backgroundColor: '#FAF9F6', borderRadius: 20, padding: 24, marginBottom: 30 },
  insightItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
  insightText: { fontSize: 13, color: '#555', marginLeft: 15, lineHeight: 20, flex: 1 },
});
