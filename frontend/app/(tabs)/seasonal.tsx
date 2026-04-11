import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiCall } from '../../utils/api';
import { Colors } from '../../utils/colors';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  bird: 'paper-plane', airplane: 'airplane', boat: 'boat', paw: 'paw',
  flower: 'flower', heart: 'heart', leaf: 'leaf', star: 'star',
  flame: 'flame', moon: 'moon', snow: 'snow',
};

const SEASON_DATA: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  spring: { icon: 'flower', color: '#EC4899', bg: '#FDF2F8' },
  summer: { icon: 'sunny', color: '#F59E0B', bg: '#FFFBEB' },
  fall: { icon: 'leaf', color: '#F97316', bg: '#FFF7ED' },
  winter: { icon: 'snow', color: '#3B82F6', bg: '#EFF6FF' },
};

const HOLIDAYS = [
  { id: 'christmas', name: 'Christmas', icon: 'gift' as keyof typeof Ionicons.glyphMap, color: '#DC2626', bg: '#FEF2F2' },
  { id: 'halloween', name: 'Halloween', icon: 'moon' as keyof typeof Ionicons.glyphMap, color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'valentines', name: "Valentine's", icon: 'heart' as keyof typeof Ionicons.glyphMap, color: '#EC4899', bg: '#FDF2F8' },
  { id: 'easter', name: 'Easter', icon: 'flower' as keyof typeof Ionicons.glyphMap, color: '#10B981', bg: '#ECFDF5' },
];

export default function SeasonalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [seasonalItems, setSeasonalItems] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const res = await apiCall('/origami/seasonal');
      setData(res);
      setSelectedSeason(res.current_season);
    } catch (e) { console.error(e); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (selectedSeason && data) {
      loadSeasonItems(selectedSeason);
    }
  }, [selectedSeason]);

  async function loadSeasonItems(season: string) {
    try {
      const items = await apiCall(`/origami?season=${season}`);
      setSeasonalItems(items);
    } catch (e) { console.error(e); }
  }

  async function loadHolidayItems(holiday: string) {
    try {
      const items = await apiCall(`/origami?holiday=${holiday}`);
      router.push(`/(tabs)/browse`);
    } catch (e) { console.error(e); }
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Seasonal Fun</Text>
        <Text style={styles.subtitle}>Discover themed origami all year round!</Text>
      </View>

      {data?.current_season && (
        <View style={[styles.currentBanner, { backgroundColor: SEASON_DATA[data.current_season]?.bg || '#EFF6FF' }]}>
          <Ionicons name={SEASON_DATA[data.current_season]?.icon || 'leaf'} size={36} color={SEASON_DATA[data.current_season]?.color || Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.currentLabel}>Current Season</Text>
            <Text style={[styles.currentSeason, { color: SEASON_DATA[data.current_season]?.color }]}>
              {data.current_season.charAt(0).toUpperCase() + data.current_season.slice(1)}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Seasons</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonsRow}>
        {Object.entries(SEASON_DATA).map(([key, val]) => (
          <TouchableOpacity
            key={key}
            testID={`season-${key}-btn`}
            style={[styles.seasonChip, selectedSeason === key && { backgroundColor: val.color, borderColor: val.color }]}
            onPress={() => setSelectedSeason(key)}
            activeOpacity={0.8}
          >
            <Ionicons name={val.icon} size={18} color={selectedSeason === key ? Colors.white : val.color} />
            <Text style={[styles.seasonChipText, selectedSeason === key && { color: Colors.white }]}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {seasonalItems.length > 0 && (
        <View style={styles.itemsGrid}>
          {seasonalItems.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              testID={`seasonal-item-${item.id}`}
              style={[styles.itemCard, { borderColor: item.color + '40' }]}
              onPress={() => router.push(`/origami/${item.id}`)}
              activeOpacity={0.8}
            >
              <View style={[styles.itemIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={ICON_MAP[item.icon_name] || 'diamond'} size={28} color={item.color} />
              </View>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.itemTime}>{item.estimated_time}</Text>
              {item.is_premium && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Holidays</Text>
      <View style={styles.holidaysGrid}>
        {HOLIDAYS.map(h => (
          <TouchableOpacity
            key={h.id}
            testID={`holiday-${h.id}-btn`}
            style={[styles.holidayCard, { backgroundColor: h.bg, borderColor: h.color + '30' }]}
            onPress={() => loadHolidayItems(h.id)}
            activeOpacity={0.8}
          >
            <Ionicons name={h.icon} size={32} color={h.color} />
            <Text style={[styles.holidayName, { color: h.color }]}>{h.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  header: { paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textMain },
  subtitle: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginTop: 4 },
  currentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 20, padding: 20, marginBottom: 24,
    borderWidth: 2, borderColor: Colors.border,
  },
  currentLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  currentSeason: { fontSize: 24, fontWeight: '900', marginTop: 2 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.textMain, marginBottom: 14 },
  seasonsRow: { gap: 10, paddingBottom: 4, marginBottom: 16 },
  seasonChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 9999,
    backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border,
  },
  seasonChipText: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  itemCard: {
    width: '47%', backgroundColor: Colors.white, borderRadius: 18, padding: 16,
    borderWidth: 2, borderBottomWidth: 4, position: 'relative',
  },
  itemIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  itemTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMain },
  itemTime: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginTop: 4 },
  proBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: Colors.primary, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  proBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.white },
  holidaysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  holidayCard: {
    width: '47%', borderRadius: 18, padding: 20, alignItems: 'center',
    borderWidth: 2, borderBottomWidth: 4,
  },
  holidayName: { fontSize: 15, fontWeight: '800', marginTop: 8 },
});
