import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAddresses from '../hooks/useAddresses';

// Addis Ababa center for proximity bias
const ADDIS_CENTER = { lat: 9.0054, lon: 38.7636 };

// Debounce helper
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

/**
 * Search OpenStreetMap Nominatim for places near Addis Ababa.
 * No API key required. Rate-limited to 1 req/sec.
 */
const searchPlaces = async (query) => {
  if (!query || query.trim().length < 3) return [];
  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '8',
      addressdetails: '1',
      'viewbox': `${ADDIS_CENTER.lon - 0.15},${ADDIS_CENTER.lat + 0.15},${ADDIS_CENTER.lon + 0.15},${ADDIS_CENTER.lat - 0.15}`,
      bounded: '0',
      countrycodes: 'et',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((item) => ({
      id: item.place_id,
      displayName: item.display_name,
      shortName: item.display_name.split(',').slice(0, 3).join(', '),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type,
      category: item.class,
    }));
  } catch (err) {
    console.warn('[AddressPicker] Geocoding error:', err);
    return [];
  }
};

const AddressPicker = ({ visible, onClose, onSelect }) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const { addresses, selectedAddress, setSelectedAddress, addAddress, deleteAddress, setDefault, loading } = useAddresses();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceVal = useDebounce(newAddress, 400);
  const searchTimerRef = useRef(null);

  // Trigger geocoding when debounced address changes
  useEffect(() => {
    if (!showAddForm || debounceVal.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchPlaces(debounceVal).then((results) => {
      if (!cancelled) {
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSearching(false);
      }
    });
    return () => { cancelled = true; };
  }, [debounceVal, showAddForm]);

  const handleSelectSuggestion = (suggestion) => {
    setNewAddress(suggestion.displayName);
    setSelectedCoords({ latitude: suggestion.latitude, longitude: suggestion.longitude });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const LABELS = ['Home', 'Work', 'Other'];

  const handleSelect = (addr) => {
    setSelectedAddress(addr);
    onSelect(addr);
    onClose();
  };

  const handleAddAddress = async () => {
    if (!newAddress.trim()) {
      Alert.alert('Required', 'Please enter an address.');
      return;
    }
    setAdding(true);
    const result = await addAddress({
      label: newLabel,
      fullAddress: newAddress.trim(),
      latitude: selectedCoords?.latitude || null,
      longitude: selectedCoords?.longitude || null,
      phone: newPhone.trim() || null,
    });
    setAdding(false);
    if (result) {
      setShowAddForm(false);
      setNewAddress('');
      setNewPhone('');
      setNewLabel('Home');
      setSelectedCoords(null);
    } else {
      Alert.alert('Error', 'Failed to save address.');
    }
  };

  const handleDelete = (addr) => {
    Alert.alert('Delete Address', `Remove "${addr.label}" from saved addresses?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteAddress(addr.id);
          if (!ok) Alert.alert('Error', 'Could not delete address.');
        },
      },
    ]);
  };

  const renderAddressCard = (addr) => {
    const isSelected = selectedAddress?.id === addr.id;
    const labelIcons = { Home: 'home', Work: 'briefcase', Other: 'map-marker' };
    const icon = labelIcons[addr.label] || 'map-marker';

    return (
      <TouchableOpacity
        key={addr.id}
        style={[
          styles.addressCard,
          {
            backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surfaceContainer,
            borderColor: isSelected ? theme.colors.primary : theme.colors.outlineVariant,
          },
        ]}
        onPress={() => handleSelect(addr)}
        onLongPress={() => {
          Alert.alert(addr.label, addr.fullAddress, [
            addr.isDefault ? null : { text: 'Set as Default', onPress: () => setDefault(addr.id) },
            { text: 'Delete', style: 'destructive', onPress: () => handleDelete(addr) },
            { text: 'Cancel', style: 'cancel' },
          ].filter(Boolean));
        }}
      >
        <View style={[styles.addrIcon, { backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant }]}>
          <MaterialCommunityIcons name={icon} size={20} color={isSelected ? '#fff' : theme.colors.text.secondary} />
        </View>
        <View style={styles.addrInfo}>
          <View style={styles.addrLabelRow}>
            <Text style={[styles.addrLabel, { color: theme.colors.text.primary }]}>{addr.label}</Text>
            {addr.isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: isDark ? '#4CAF5033' : '#E8F5E9' }]}>
                <Text style={[styles.defaultText, { color: '#4CAF50' }]}>Default</Text>
              </View>
            )}
          </View>
          <Text style={[styles.addrFull, { color: theme.colors.text.secondary }]} numberOfLines={2}>{addr.fullAddress}</Text>
          {addr.phone && <Text style={[styles.addrPhone, { color: theme.colors.text.secondary }]}>{addr.phone}</Text>}
        </View>
        {isSelected && <MaterialCommunityIcons name="check-circle" size={22} color={theme.colors.primary} />}
      </TouchableOpacity>
    );
  };

  const renderAddForm = () => (
    <View style={[styles.addForm, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outlineVariant }]}>
      <Text style={[styles.addFormTitle, { color: theme.colors.text.primary }]}>New Address</Text>

      {/* Label chips */}
      <View style={styles.labelChips}>
        {LABELS.map((l) => (
          <TouchableOpacity
            key={l}
            style={[styles.labelChip, { backgroundColor: newLabel === l ? theme.colors.primary : theme.colors.surfaceVariant }]}
            onPress={() => setNewLabel(l)}
          >
            <Text style={{ color: newLabel === l ? '#fff' : theme.colors.text.primary, fontWeight: '600', fontSize: 13 }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Address input with autocomplete */}
      <View style={styles.addressInputWrapper}>
        <TextInput
          style={[styles.input, { color: theme.colors.text.primary, backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
          placeholder="Start typing an address in Addis Ababa..."
          placeholderTextColor={theme.colors.text.secondary}
          value={newAddress}
          onChangeText={(text) => {
            setNewAddress(text);
            setSelectedCoords(null);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          multiline
        />
        {searching && (
          <ActivityIndicator size="small" color={theme.colors.primary} style={styles.searchSpinner} />
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={[styles.suggestionsDropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant, shadowColor: '#000' }]}>
            <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.suggestionItem, { borderBottomColor: theme.colors.outlineVariant }]}
                  onPress={() => handleSelectSuggestion(s)}
                >
                  <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.primary} />
                  <Text style={[styles.suggestionText, { color: theme.colors.text.primary }]} numberOfLines={2}>
                    {s.shortName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {selectedCoords && (
        <View style={[styles.coordBadge, { backgroundColor: isDark ? '#4CAF5022' : '#E8F5E9' }]}>
          <MaterialCommunityIcons name="crosshairs-gps" size={14} color="#4CAF50" />
          <Text style={[styles.coordText, { color: '#4CAF50' }]}>
            Location pinned · {selectedCoords.latitude.toFixed(4)}, {selectedCoords.longitude.toFixed(4)}
          </Text>
        </View>
      )}

      <TextInput
        style={[styles.input, { color: theme.colors.text.primary, backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
        placeholder="Phone (optional)"
        placeholderTextColor={theme.colors.text.secondary}
        value={newPhone}
        onChangeText={setNewPhone}
        keyboardType="phone-pad"
      />

      <View style={styles.addFormActions}>
        <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.colors.surfaceVariant }]} onPress={() => { setShowAddForm(false); setSuggestions([]); setShowSuggestions(false); }}>
          <Text style={{ color: theme.colors.text.primary, fontWeight: '600' }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.colors.primary, opacity: adding ? 0.6 : 1 }]}
          onPress={handleAddAddress}
          disabled={adding}
        >
          {adding ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Save Address</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Delivery Address</Text>
          <TouchableOpacity onPress={() => setShowAddForm(true)} style={styles.headerBtn}>
            <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {showAddForm && renderAddForm()}
              {addresses.length === 0 && !showAddForm && (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="map-marker-outline" size={48} color={theme.colors.text.secondary} />
                  <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>No saved addresses</Text>
                  <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>Add a delivery address to speed up checkout.</Text>
                  <TouchableOpacity style={[styles.addFirstBtn, { backgroundColor: theme.colors.primary }]} onPress={() => setShowAddForm(true)}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Add Address</Text>
                  </TouchableOpacity>
                </View>
              )}
              {addresses.map(renderAddressCard)}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scrollContent: { padding: 20, gap: 12, paddingBottom: 40 },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1.5 },
  addrIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addrInfo: { flex: 1, gap: 3 },
  addrLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addrLabel: { fontSize: 15, fontWeight: '700' },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  defaultText: { fontSize: 10, fontWeight: '700' },
  addrFull: { fontSize: 13, lineHeight: 18 },
  addrPhone: { fontSize: 12 },
  addForm: { padding: 18, borderRadius: 14, borderWidth: 1, gap: 12, marginBottom: 8 },
  addFormTitle: { fontSize: 16, fontWeight: '700' },
  labelChips: { flexDirection: 'row', gap: 8 },
  labelChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addressInputWrapper: { position: 'relative' },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 15 },
  searchSpinner: { position: 'absolute', right: 14, top: 16 },
  suggestionsDropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    zIndex: 100, borderWidth: 1, borderRadius: 10, marginTop: 4,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1 },
  suggestionText: { flex: 1, fontSize: 13, lineHeight: 18 },
  coordBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  coordText: { fontSize: 11, fontWeight: '600' },
  addFormActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  addFirstBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
});

export default AddressPicker;
