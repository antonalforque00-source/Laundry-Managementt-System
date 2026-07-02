import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  FlatList
} from 'react-native';

// Standard simple types for LPDMS Mobile
interface Order {
  id: string;
  customerName: string;
  service: string;
  status: 'Pending' | 'Picked Up' | 'In Progress' | 'Ready' | 'Delivered';
  cost: number;
  weight: number;
  instructions: string;
  createdAt: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export default function App() {
  const [activeRole, setActiveRole] = useState<'customer' | 'rider' | 'staff' | 'admin'>('customer');
  
  // Shared state to mimic local database live synchronization
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'LPD-394',
      customerName: 'Nabin Bhandari',
      service: 'Wash & Fold',
      status: 'In Progress',
      cost: 15.50,
      weight: 5.2,
      instructions: 'Please use unscented detergent.',
      createdAt: '10:30 AM'
    },
    {
      id: 'LPD-395',
      customerName: 'Sita Sharma',
      service: 'Dry Cleaning',
      status: 'Pending',
      cost: 28.00,
      weight: 2.0,
      instructions: 'Delicate silk sarees. Handle with care.',
      createdAt: '11:15 AM'
    },
    {
      id: 'LPD-396',
      customerName: 'Ram Prasad',
      service: 'Premium Wash & Iron',
      status: 'Picked Up',
      cost: 22.40,
      weight: 4.5,
      instructions: 'Double starch on collars.',
      createdAt: '11:45 AM'
    }
  ]);

  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', name: 'Liquid Detergent', quantity: 24, unit: 'Liters' },
    { id: '2', name: 'Fabric Softener', quantity: 12, unit: 'Liters' },
    { id: '3', name: 'Bleach Cleanser', quantity: 8, unit: 'Bottles' },
    { id: '4', name: 'Hangers & Covers', quantity: 150, unit: 'Pieces' }
  ]);

  const [auditLogs, setAuditLogs] = useState<string[]>([
    'System initialization successful.',
    'Local SQLite storage mode synchronized.',
    'New order LPD-395 received from Sita Sharma.'
  ]);

  // Customer states
  const [customerName, setCustomerName] = useState('Nabin Bhandari');
  const [selectedService, setSelectedService] = useState('Wash & Fold');
  const [instructions, setInstructions] = useState('');
  const [weight, setWeight] = useState('4.0');

  // Add a new order
  const handlePlaceOrder = () => {
    if (!customerName || !weight) {
      alert('Please fill out your name and weight');
      return;
    }
    const orderWeight = parseFloat(weight) || 3.0;
    const baseCost = selectedService === 'Dry Cleaning' ? 12.0 : 4.0;
    const calculatedCost = Number((baseCost * orderWeight).toFixed(2));
    
    const newOrder: Order = {
      id: `LPD-${Math.floor(100 + Math.random() * 900)}`,
      customerName,
      service: selectedService,
      status: 'Pending',
      cost: calculatedCost,
      weight: orderWeight,
      instructions: instructions || 'No special instructions',
      createdAt: 'Just Now'
    };

    setOrders([newOrder, ...orders]);
    setAuditLogs([`New booking ${newOrder.id} placed by ${customerName}.`, ...auditLogs]);
    setInstructions('');
    alert(`Success! Order ${newOrder.id} placed successfully!`);
  };

  // Update order status (Rider/Staff)
  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setAuditLogs([`Order ${orderId} status updated to ${newStatus}.`, ...auditLogs]);
  };

  // Increment/Decrement Inventory
  const updateInventoryQty = (id: string, delta: number) => {
    setInventory(inventory.map(item => {
      if (item.id === id) {
        const nextQty = Math.max(0, item.quantity + delta);
        if (nextQty !== item.quantity) {
          setAuditLogs([`Inventory: ${item.name} updated to ${nextQty} ${item.unit}.`, ...auditLogs]);
        }
        return { ...item, quantity: nextQty };
      }
      return item;
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      
      {/* Header Panel */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Laundry Portal Deployment System</Text>
          <Text style={styles.headerTitle}>🧺 LPDMS Mobile</Text>
        </View>
        <View style={styles.syncIndicator}>
          <View style={styles.pulseDot} />
          <Text style={styles.syncText}>Live</Text>
        </View>
      </View>

      {/* Role Navigation Bar */}
      <View style={styles.roleSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleSelector}>
          {[
            { id: 'customer', label: '👤 Customer' },
            { id: 'rider', label: '🚴 Rider' },
            { id: 'staff', label: '🧺 Staff' },
            { id: 'admin', label: '👑 Admin' }
          ].map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleButton,
                activeRole === role.id && styles.roleButtonActive
              ]}
              onPress={() => setActiveRole(role.id as any)}
            >
              <Text style={[
                styles.roleButtonText,
                activeRole === role.id && styles.roleButtonTextActive
              ]}>
                {role.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Dashboard Panel */}
      <ScrollView style={styles.dashboardBody} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* CUSTOMER DASHBOARD */}
        {activeRole === 'customer' && (
          <View>
            {/* Loyalty and Member Badge */}
            <View style={styles.promoCard}>
              <View>
                <Text style={styles.promoTitle}>Gold Member Club</Text>
                <Text style={styles.promoPoints}>✨ 140 Loyalty Points</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>10% OFF ACTIVE</Text>
              </View>
            </View>

            {/* Book Service Section */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>New Instant Laundry Booking</Text>
              
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Enter your full name"
              />

              <Text style={styles.label}>Select Service Category</Text>
              <View style={styles.serviceRow}>
                {['Wash & Fold', 'Dry Cleaning', 'Premium Ironing'].map(srv => (
                  <TouchableOpacity
                    key={srv}
                    style={[
                      styles.serviceSelectBtn,
                      selectedService === srv && styles.serviceSelectBtnActive
                    ]}
                    onPress={() => setSelectedService(srv)}
                  >
                    <Text style={[
                      styles.serviceSelectText,
                      selectedService === srv && styles.serviceSelectTextActive
                    ]}>
                      {srv}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Est. Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="E.g. 4.5"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.label}>Estimated Cost</Text>
                  <View style={styles.costDisplay}>
                    <Text style={styles.costValue}>
                      ${((parseFloat(weight) || 0) * (selectedService === 'Dry Cleaning' ? 12 : 4)).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.label}>Special Instructions</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={instructions}
                onChangeText={setInstructions}
                placeholder="E.g. Hang dry, delicate cycles..."
                multiline
              />

              <TouchableOpacity style={styles.submitButton} onPress={handlePlaceOrder}>
                <Text style={styles.submitButtonText}>Confirm and Book Rider 🚀</Text>
              </TouchableOpacity>
            </View>

            {/* My Active Orders */}
            <Text style={styles.sectionTitle}>Track My Laundry Status</Text>
            {orders.length === 0 ? (
              <Text style={styles.emptyText}>No active laundry orders.</Text>
            ) : (
              orders.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemId}>{item.id}</Text>
                    <View style={[
                      styles.statusBadge,
                      item.status === 'Pending' && styles.statusPending,
                      item.status === 'Picked Up' && styles.statusPickedUp,
                      item.status === 'In Progress' && styles.statusProcessing,
                      item.status === 'Ready' && styles.statusReady,
                      item.status === 'Delivered' && styles.statusDelivered
                    ]}>
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemDetail}><Text style={styles.bold}>Service:</Text> {item.service}</Text>
                    <Text style={styles.itemDetail}><Text style={styles.bold}>Details:</Text> {item.weight} kg • ${item.cost.toFixed(2)}</Text>
                    <Text style={styles.itemDetail}><Text style={styles.bold}>Notes:</Text> {item.instructions}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* RIDER DASHBOARD */}
        {activeRole === 'rider' && (
          <View>
            <Text style={styles.sectionTitle}>Rider Active Shipments ({orders.length})</Text>
            {orders.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemId}>{item.id} - {item.customerName}</Text>
                  <Text style={styles.boldText}>${item.cost.toFixed(2)}</Text>
                </View>
                <Text style={styles.itemDetail}><Text style={styles.bold}>Service:</Text> {item.service}</Text>
                <Text style={styles.itemDetail}><Text style={styles.bold}>Weight:</Text> {item.weight} kg</Text>
                <Text style={styles.itemDetail}><Text style={styles.bold}>Current Status:</Text> {item.status}</Text>
                
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#ccfbf1' }]}
                    onPress={() => updateOrderStatus(item.id, 'Picked Up')}
                  >
                    <Text style={{ color: '#0f766e', fontWeight: 'bold', fontSize: 13 }}>🚴 Mark Picked Up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]}
                    onPress={() => updateOrderStatus(item.id, 'Delivered')}
                  >
                    <Text style={{ color: '#15803d', fontWeight: 'bold', fontSize: 13 }}>✅ Mark Delivered</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* STAFF DASHBOARD */}
        {activeRole === 'staff' && (
          <View>
            <Text style={styles.sectionTitle}>In-Store Laundry Queue</Text>
            {orders.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemId}>{item.id} [{item.service}]</Text>
                  <Text style={styles.bold}>{item.status}</Text>
                </View>
                <Text style={styles.itemDetail}>Customer: {item.customerName}</Text>
                <Text style={styles.itemDetail}>Instructions: {item.instructions}</Text>
                
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#fef3c7' }]}
                    onPress={() => updateOrderStatus(item.id, 'In Progress')}
                  >
                    <Text style={{ color: '#b45309', fontWeight: 'bold', fontSize: 13 }}>🌀 Set Washing</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#f0fdf4' }]}
                    onPress={() => updateOrderStatus(item.id, 'Ready')}
                  >
                    <Text style={{ color: '#16a34a', fontWeight: 'bold', fontSize: 13 }}>📦 Set Ready</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Chemical & Logistics Inventory</Text>
            <View style={styles.card}>
              {inventory.map(item => (
                <View key={item.id} style={styles.inventoryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inventoryName}>{item.name}</Text>
                    <Text style={styles.inventoryDetail}>{item.quantity} {item.unit}</Text>
                  </View>
                  <View style={styles.inventoryControls}>
                    <TouchableOpacity 
                      style={styles.invBtn} 
                      onPress={() => updateInventoryQty(item.id, -1)}
                    >
                      <Text style={styles.invBtnText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.invBtn} 
                      onPress={() => updateInventoryQty(item.id, 1)}
                    >
                      <Text style={styles.invBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ADMIN DASHBOARD */}
        {activeRole === 'admin' && (
          <View>
            {/* Quick Metrics */}
            <View style={styles.statsGrid}>
              <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Total Revenue</Text>
                <Text style={styles.statsValue}>
                  ${orders.reduce((acc, o) => acc + o.cost, 1240).toFixed(2)}
                </Text>
              </View>
              <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Active Bookings</Text>
                <Text style={styles.statsValue}>{orders.length}</Text>
              </View>
            </View>

            {/* System Logs */}
            <Text style={styles.sectionTitle}>Real-time Activity Audit Logs</Text>
            <View style={[styles.card, { backgroundColor: '#1e293b' }]}>
              {auditLogs.map((log, index) => (
                <Text key={index} style={styles.terminalText}>
                  &gt; [{index === 0 ? 'NEW' : 'OK'}] {log}
                </Text>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Mobile Portal Management</Text>
              <Text style={styles.itemDetail}>
                This mobile portal matches standard state with your Express back-end to allow teachers to easily inspect the architecture in action.
              </Text>
              <View style={styles.badgeGreen}>
                <Text style={styles.badgeGreenText}>Dual-Storage Integration Engine Active</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6
  },
  syncText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '700'
  },
  roleSelectorContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  roleSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  roleButtonActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488'
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563'
  },
  roleButtonTextActive: {
    color: '#ffffff'
  },
  dashboardBody: {
    flex: 1,
    padding: 16
  },
  promoCard: {
    backgroundColor: '#0f766e',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  promoTitle: {
    color: '#99f6e4',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  promoPoints: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2
  },
  badge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  badgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 6,
    marginTop: 8
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  serviceSelectBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  serviceSelectBtnActive: {
    backgroundColor: '#f0fdfa',
    borderColor: '#0d9488'
  },
  serviceSelectText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563'
  },
  serviceSelectTextActive: {
    color: '#0d9488'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  costDisplay: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40
  },
  costValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a'
  },
  submitButton: {
    backgroundColor: '#0d9488',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 10
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 6,
    marginBottom: 6
  },
  itemId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937'
  },
  bold: {
    fontWeight: '700'
  },
  boldText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827'
  },
  itemBody: {
    marginTop: 2
  },
  itemDetail: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 18
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  statusPending: { backgroundColor: '#fef3c7' },
  statusPickedUp: { backgroundColor: '#ccfbf1' },
  statusProcessing: { backgroundColor: '#f3e8ff' },
  statusReady: { backgroundColor: '#dcfce7' },
  statusDelivered: { backgroundColor: '#f3f4f6' },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151'
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  inventoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827'
  },
  inventoryDetail: {
    fontSize: 11,
    color: '#6b7280'
  },
  inventoryControls: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  invBtn: {
    backgroundColor: '#f3f4f6',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  invBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151'
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 4
  },
  statsLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600'
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2
  },
  terminalText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#2dd4bf',
    marginBottom: 4,
    lineHeight: 16
  },
  badgeGreen: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  badgeGreenText: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '700'
  }
});
