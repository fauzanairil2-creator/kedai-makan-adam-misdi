import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MENU_NAMES = [
  'Ayam Penyet', 'Keli Penyet', 'Talapia Penyet', 'Bawal Penyet', 'Puyuh Penyet',
  'Kerisi Penyet', 'Nasi Ayam', 'Ayam Kunyit', 'Ayam Paprik', 'Daging Paprik',
  'Daging Merah', 'Bakso', 'Mee Goreng', 'Mee Goreng Basah', 'Sup Tulang',
  'Sup Daging', 'Sup Ayam', 'Nasi Goreng Ayam Sambal', 'Nasi Goreng Kampung',
  'Nasi Goreng Ayam Penyet', 'Rojak', 'Sate Kambing', 'Sate Ayam', 'Sate Lembu',
  'Nasi Goreng Keli Penyet',
];
const STORAGE_KEY = '@kedai_makan_orders_v1';
const TABLES = Array.from({ length: 12 }, (_, i) => `Meja ${i + 1}`);
const money = (value) => `RM ${Number(value || 0).toFixed(2)}`;

export default function App() {
  const [menu, setMenu] = useState(MENU_NAMES.map((name, i) => ({ id: String(i + 1), name, price: 0 })));
  const [table, setTable] = useState(TABLES[0]);
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState('');
  const [orders, setOrders] = useState([]);
  const [screen, setScreen] = useState('order');
  const [search, setSearch] = useState('');
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceInput, setPriceInput] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) {
        const saved = JSON.parse(value);
        if (saved.orders) setOrders(saved.orders);
        if (saved.menu) setMenu(saved.menu);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ orders, menu })).catch(() => {});
  }, [orders, menu]);

  const filteredMenu = useMemo(() => menu.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [menu, search]);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = (menuItem) => setCart((current) => {
    const found = current.find((item) => item.id === menuItem.id);
    if (found) return current.map((item) => item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item);
    return [...current, { ...menuItem, quantity: 1 }];
  });

  const changeQuantity = (id, delta) => setCart((current) => current
    .map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
    .filter((item) => item.quantity > 0));

  const sendOrder = () => {
    if (!cart.length) {
      Alert.alert('Order kosong', 'Tambah makanan dahulu sebelum hantar ke dapur.');
      return;
    }
    const order = {
      id: `${Date.now()}`,
      table,
      items: cart,
      note: note.trim(),
      total,
      status: 'Baru',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setOrders((current) => [order, ...current]);
    setCart([]);
    setNote('');
    setScreen('kitchen');
    Alert.alert('Pesanan dihantar', `${table} — pesanan telah dihantar ke senarai dapur.`);
  };

  const nextStatus = (id) => {
    const flow = ['Baru', 'Sedang dimasak', 'Siap'];
    setOrders((current) => current.map((order) => {
      if (order.id !== id) return order;
      const next = flow[(flow.indexOf(order.status) + 1) % flow.length];
      return { ...order, status: next };
    }));
  };

  const savePrice = () => {
    const value = Number(priceInput.replace(',', '.'));
    if (!Number.isFinite(value) || value < 0) {
      Alert.alert('Harga tidak sah', 'Masukkan harga yang betul, contohnya 12.50.');
      return;
    }
    setMenu((current) => current.map((item) => item.id === editingPrice ? { ...item, price: value } : item));
    setCart((current) => current.map((item) => item.id === editingPrice ? { ...item, price: value } : item));
    setEditingPrice(null);
  };

  const statusColor = (status) => status === 'Siap' ? '#15803d' : status === 'Sedang dimasak' ? '#c2410c' : '#1d4ed8';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff7ed" />
      <View style={styles.header}>
        <View><Text style={styles.brand}>Kedai Makan</Text><Text style={styles.subtitle}>Adam Misdi · Pengurusan pesanan</Text></View>
        <View style={styles.badge}><Text style={styles.badgeText}>{orders.filter((o) => o.status !== 'Siap').length} aktif</Text></View>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, screen === 'order' && styles.activeTab]} onPress={() => setScreen('order')}><Text style={[styles.tabText, screen === 'order' && styles.activeTabText]}>＋ Pesanan</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, screen === 'kitchen' && styles.activeTab]} onPress={() => setScreen('kitchen')}><Text style={[styles.tabText, screen === 'kitchen' && styles.activeTabText]}>Dapur ({orders.length})</Text></TouchableOpacity>
      </View>

      {screen === 'order' ? <>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Pilih meja</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableRow}>
            {TABLES.map((item) => <TouchableOpacity key={item} style={[styles.tableChip, table === item && styles.selectedTable]} onPress={() => setTable(item)}><Text style={[styles.tableText, table === item && styles.selectedTableText]}>{item.replace('Meja ', 'M')}</Text></TouchableOpacity>)}
          </ScrollView>
          <View style={styles.menuHeading}><Text style={styles.sectionTitle}>Menu</Text><Text style={styles.hint}>Tekan harga untuk tetapkan / ubah</Text></View>
          <TextInput value={search} onChangeText={setSearch} placeholder="Cari menu..." placeholderTextColor="#9a8b7b" style={styles.search} />
          {filteredMenu.map((item) => <View key={item.id} style={styles.menuItem}>
            <View style={styles.menuInfo}><Text style={styles.menuName}>{item.name}</Text><TouchableOpacity onPress={() => { setEditingPrice(item.id); setPriceInput(item.price ? String(item.price.toFixed(2)) : ''); }}><Text style={styles.price}>{money(item.price)}  <Text style={styles.editMark}>✎</Text></Text></TouchableOpacity></View>
            <TouchableOpacity style={styles.addButton} onPress={() => addItem(item)}><Text style={styles.addText}>Tambah</Text></TouchableOpacity>
          </View>)}
          <View style={styles.cartHeader}><Text style={styles.sectionTitle}>Pesanan semasa</Text><Text style={styles.hint}>{cart.reduce((sum, item) => sum + item.quantity, 0)} item</Text></View>
          {cart.length === 0 ? <Text style={styles.empty}>Belum ada item. Pilih makanan daripada menu.</Text> : cart.map((item) => <View key={item.id} style={styles.cartItem}>
            <View style={styles.cartDesc}><Text style={styles.menuName}>{item.name}</Text><Text style={styles.hint}>{money(item.price * item.quantity)}</Text></View>
            <View style={styles.qty}><TouchableOpacity style={styles.qtyButton} onPress={() => changeQuantity(item.id, -1)}><Text style={styles.qtyText}>−</Text></TouchableOpacity><Text style={styles.qtyNumber}>{item.quantity}</Text><TouchableOpacity style={styles.qtyButton} onPress={() => changeQuantity(item.id, 1)}><Text style={styles.qtyText}>＋</Text></TouchableOpacity></View>
          </View>)}
          <Text style={styles.fieldLabel}>Nota untuk dapur</Text>
          <TextInput value={note} onChangeText={setNote} placeholder="Contoh: tidak pedas, sambal asing..." placeholderTextColor="#9a8b7b" style={[styles.search, styles.noteInput]} multiline />
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Jumlah</Text><Text style={styles.total}>{money(total)}</Text></View>
          <TouchableOpacity style={[styles.sendButton, !cart.length && styles.disabled]} onPress={sendOrder}><Text style={styles.sendText}>Hantar pesanan ke dapur</Text></TouchableOpacity>
          <Text style={styles.footerHint}>Harga menu belum ditetapkan. Tekan harga pada menu untuk masukkan harga RM.</Text>
        </ScrollView>
      </> : <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Pesanan dapur</Text>
        {!orders.length ? <View style={styles.emptyCard}><Text style={styles.empty}>Belum ada pesanan. Pesanan yang dihantar akan muncul di sini.</Text></View> : orders.map((order) => <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderTop}><View><Text style={styles.orderTable}>{order.table}</Text><Text style={styles.hint}>#{order.id.slice(-5)} · {order.createdAt}</Text></View><Text style={[styles.status, { color: statusColor(order.status) }]}>{order.status}</Text></View>
          {order.items.map((item) => <Text key={item.id} style={styles.orderItem}>{item.quantity} × {item.name}</Text>)}
          {order.note ? <Text style={styles.orderNote}>Nota: {order.note}</Text> : null}
          <View style={styles.orderBottom}><Text style={styles.orderTotal}>{money(order.total)}</Text><TouchableOpacity style={styles.statusButton} onPress={() => nextStatus(order.id)}><Text style={styles.statusButtonText}>{order.status === 'Siap' ? 'Tandakan baru' : 'Kemas kini status →'}</Text></TouchableOpacity></View>
        </View>)}
      </ScrollView>}

      {editingPrice ? <View style={styles.modalBackdrop}><View style={styles.modal}><Text style={styles.sectionTitle}>Tetapkan harga (RM)</Text><TextInput autoFocus keyboardType="decimal-pad" value={priceInput} onChangeText={setPriceInput} placeholder="cth. 12.50" style={styles.priceInput} /><View style={styles.modalActions}><TouchableOpacity onPress={() => setEditingPrice(null)} style={styles.cancelButton}><Text style={styles.cancelText}>Batal</Text></TouchableOpacity><TouchableOpacity onPress={savePrice} style={styles.saveButton}><Text style={styles.saveText}>Simpan</Text></TouchableOpacity></View></View></View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fffaf5' }, header: { backgroundColor: '#fff7ed', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { fontSize: 23, fontWeight: '800', color: '#431407' }, subtitle: { marginTop: 3, fontSize: 12, color: '#9a3412' }, badge: { backgroundColor: '#ffedd5', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20 }, badgeText: { color: '#9a3412', fontWeight: '700', fontSize: 12 }, tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 5, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1e8df' }, tab: { paddingVertical: 11, paddingHorizontal: 18, marginRight: 8, borderRadius: 10 }, activeTab: { backgroundColor: '#9a3412' }, tabText: { color: '#6b5b4c', fontWeight: '700' }, activeTabText: { color: '#fff' }, content: { padding: 16, paddingBottom: 38 }, sectionTitle: { fontSize: 18, fontWeight: '800', color: '#29221d' }, tableRow: { paddingTop: 11, paddingBottom: 17, gap: 8 }, tableChip: { borderWidth: 1, borderColor: '#e7d8ca', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 9, backgroundColor: '#fff' }, selectedTable: { backgroundColor: '#9a3412', borderColor: '#9a3412' }, tableText: { color: '#5e5045', fontWeight: '700' }, selectedTableText: { color: '#fff' }, menuHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }, hint: { fontSize: 11, color: '#8b7b6d' }, search: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eadfd5', borderRadius: 11, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: '#29221d', marginTop: 10, marginBottom: 9 }, menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f0e7df', padding: 12, marginBottom: 8 }, menuInfo: { flex: 1, paddingRight: 8 }, menuName: { color: '#332a24', fontSize: 14, fontWeight: '700' }, price: { color: '#9a3412', fontSize: 12, fontWeight: '700', marginTop: 5 }, editMark: { color: '#b89578' }, addButton: { backgroundColor: '#fff1e6', borderRadius: 9, paddingVertical: 9, paddingHorizontal: 12 }, addText: { color: '#9a3412', fontWeight: '800', fontSize: 12 }, cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 6 }, empty: { color: '#8b7b6d', fontSize: 13, lineHeight: 20 }, cartItem: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f0e7df', paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cartDesc: { flex: 1 }, qty: { flexDirection: 'row', alignItems: 'center', gap: 10 }, qtyButton: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#fff1e6', alignItems: 'center', justifyContent: 'center' }, qtyText: { color: '#9a3412', fontSize: 18, fontWeight: '700' }, qtyNumber: { minWidth: 16, textAlign: 'center', fontWeight: '800', color: '#332a24' }, fieldLabel: { fontSize: 13, fontWeight: '700', marginTop: 16, color: '#4b3b30' }, noteInput: { minHeight: 52, textAlignVertical: 'top' }, totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#eadfd5', paddingTop: 14, marginTop: 8 }, totalLabel: { fontWeight: '700', fontSize: 16, color: '#332a24' }, total: { fontWeight: '900', fontSize: 20, color: '#9a3412' }, sendButton: { backgroundColor: '#9a3412', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 13 }, disabled: { opacity: 0.55 }, sendText: { color: '#fff', fontWeight: '800', fontSize: 15 }, footerHint: { textAlign: 'center', fontSize: 11, color: '#9a8b7b', marginTop: 12 }, emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 18, marginTop: 12 }, orderCard: { backgroundColor: '#fff', borderRadius: 14, padding: 15, marginTop: 12, borderWidth: 1, borderColor: '#f0e7df' }, orderTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 9 }, orderTable: { fontSize: 18, fontWeight: '900', color: '#431407' }, status: { fontSize: 12, fontWeight: '800' }, orderItem: { color: '#43382f', fontSize: 13, paddingVertical: 3 }, orderNote: { backgroundColor: '#fff7ed', color: '#7c2d12', fontSize: 12, padding: 9, borderRadius: 8, marginTop: 8 }, orderBottom: { borderTopWidth: 1, borderColor: '#f1e8df', marginTop: 11, paddingTop: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, orderTotal: { color: '#9a3412', fontSize: 15, fontWeight: '900' }, statusButton: { backgroundColor: '#fff1e6', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 }, statusButtonText: { color: '#9a3412', fontWeight: '800', fontSize: 11 }, modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(25,15,8,0.42)', justifyContent: 'center', padding: 24 }, modal: { backgroundColor: '#fffaf5', borderRadius: 16, padding: 20 }, priceInput: { borderWidth: 1, borderColor: '#e7d8ca', backgroundColor: '#fff', borderRadius: 10, padding: 13, fontSize: 17, marginTop: 14 }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 }, cancelButton: { paddingHorizontal: 14, paddingVertical: 11 }, cancelText: { color: '#6b5b4c', fontWeight: '700' }, saveButton: { backgroundColor: '#9a3412', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 9 }, saveText: { color: '#fff', fontWeight: '800' },
});
