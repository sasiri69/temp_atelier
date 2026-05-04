import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  Alert,
  Dimensions
} from 'react-native';
import { ChevronLeft, Download, Share2, Printer } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function InvoiceScreen({ route, navigation }) {
  const { order } = route.params || { order: null };

  if (!order) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Order details not available.</Text>
      </View>
    );
  }

  const handleDownload = () => {
    Alert.alert("Download Started", "The invoice PDF is being saved to your device cache.");
  };

  const handleShare = () => {
    Alert.alert("Sharing", "Preparing your invoice for sharing...");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#00332B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleDownload} style={{marginRight: 15}}>
            <Download size={20} color="#00332B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Share2 size={20} color="#00332B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Invoice Paper Style */}
        <View style={styles.invoicePaper}>
          {/* Logo & Company Info */}
          <View style={styles.paperHeader}>
            <View>
              <Text style={styles.logo}>ATELIER</Text>
              <Text style={styles.tagline}>Curated Couture</Text>
            </View>
            <View style={styles.invoiceMeta}>
              <Text style={styles.metaLabel}>INVOICE NO.</Text>
              <Text style={styles.metaValue}>#INV-{order._id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.metaLabel}>DATE</Text>
              <Text style={styles.metaValue}>{new Date(order.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Billing Info */}
          <View style={styles.addressSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>BILL TO</Text>
              <Text style={styles.addressName}>Eleanor Vance</Text>
              <Text style={styles.addressText}>{order.shippingAddress.address}</Text>
              <Text style={styles.addressText}>{order.shippingAddress.city}</Text>
              <Text style={styles.addressText}>{order.shippingAddress.country}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.sectionHeading}>SEND BY</Text>
              <Text style={styles.addressName}>Atelier Global</Text>
              <Text style={styles.addressText}>12 Rue de la Mode</Text>
              <Text style={styles.addressText}>Paris, France</Text>
            </View>
          </View>

          {/* Items Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, { flex: 2 }]}>DESCRIPTION</Text>
            <Text style={[styles.columnHeader, { flex: 0.5, textAlign: 'center' }]}>QTY</Text>
            <Text style={[styles.columnHeader, { flex: 1, textAlign: 'right' }]}>AMOUNT</Text>
          </View>

          {/* Table Items */}
          {order.orderItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>Designer Collection</Text>
              </View>
              <Text style={[styles.itemQty, { flex: 0.5 }]}>{item.qty}</Text>
              <Text style={[styles.itemPrice, { flex: 1 }]}>Rs. {item.price.toFixed(2)}</Text>
            </View>
          ))}

          {/* Summary Section */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SUBTOTAL</Text>
              <Text style={styles.summaryValue}>Rs. {order.totalPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>SHIPPING</Text>
              <Text style={styles.summaryValue}>Rs. 0.00</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>TAX (INCLUDED)</Text>
              <Text style={styles.summaryValue}>Rs. {(order.totalPrice * 0.05).toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRowBorder]}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>Rs. {order.totalPrice.toFixed(2)}</Text>
            </View>
          </View>

          {/* Footer Note */}
          <View style={styles.paperFooter}>
            <Text style={styles.footerNote}>
              Thank you for choosing Atelier. We hope your new pieces inspire confidence and timeless style.
            </Text>
            <View style={styles.watermark}>
              <Text style={styles.watermarkText}>ORIGINAL DOCUMENT</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
          <Printer size={20} color="#FFF" style={{marginRight: 10}} />
          <Text style={styles.downloadBtnText}>PRINT INVOICE</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
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
    paddingHorizontal: 20,
    height: 70,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE9',
  },
  headerTitle: {
    fontSize: 16,
    color: '#00332B',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  invoicePaper: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 30,
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00332B',
    fontFamily: Platform.OS === 'ios' ? 'Optima' : 'serif',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 10,
    color: '#999',
    letterSpacing: 2,
    marginTop: 4,
  },
  invoiceMeta: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#BBB',
    letterSpacing: 1,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EBE9',
    marginBottom: 30,
  },
  addressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  sectionHeading: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#BBB',
    letterSpacing: 2,
    marginBottom: 12,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00332B',
    marginBottom: 6,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE9',
    marginBottom: 20,
  },
  columnHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#BBB',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  itemName: {
    fontSize: 14,
    color: '#00332B',
    fontWeight: '600',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  itemQty: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700',
    textAlign: 'right',
  },
  summaryContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE9',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '700',
  },
  totalRowBorder: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1.5,
    borderTopColor: '#00332B',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00332B',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00332B',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  paperFooter: {
    marginTop: 50,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  watermark: {
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#F0EBE9',
    paddingHorizontal: 15,
    paddingVertical: 4,
    transform: [{ rotate: '-3deg' }],
  },
  watermarkText: {
    fontSize: 10,
    color: '#EEE',
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  downloadBtn: {
    backgroundColor: '#00332B',
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  downloadBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
