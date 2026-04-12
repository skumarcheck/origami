import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiCall } from '../../utils/api';
import { Colors } from '../../utils/colors';
import { useAuth } from '../../contexts/AuthContext';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  bird: 'paper-plane', airplane: 'airplane', boat: 'boat', paw: 'paw',
  flower: 'flower', heart: 'heart', leaf: 'leaf', star: 'star',
  flame: 'flame', moon: 'moon', snow: 'snow',
};

const SKILL_FILTERS = [
  { id: 'all', label: 'All', color: Colors.primary },
  { id: 'beginner', label: 'Beginner', color: Colors.skillBeginner },
  { id: 'intermediate', label: 'Intermediate', color: '#EAB308' },
  { id: 'advanced', label: 'Advanced', color: Colors.skillAdvanced },
];

export default function BrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [origamis, setOrigamis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const canAccessPremium = user?.subscription_status === 'trial' || user?.subscription_status === 'active';

  const loadData = useCallback(async () => {
    try {
      let query = '';
      if (filter !== 'all') query += `?skill_level=${filter}`;
      if (search.trim()) query += `${query ? '&' : '?'}search=${search.trim()}`;
      const data = await apiCall(`/origami${query}`);
      setOrigamis(data);
    } catch (e) { console.error(e); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse Origami</Text>
        <Text style={styles.subtitle}>{origamis.length} projects to explore</Text>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          testID="browse-search-input"
          style={styles.searchInput}
          placeholder="Search origami..."
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
        {SKILL_FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            testID={`filter-${f.id}-btn`}
            style={[styles.filterChip, filter === f.id && { backgroundColor: f.color, borderColor: f.color }]}
            onPress={() => setFilter(f.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === f.id && { color: Colors.white }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {origamis.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              testID={`origami-card-${item.id}`}
              style={styles.card}
              onPress={() => {
                if (item.is_premium && !canAccessPremium) {
                  router.push('/subscription');
                } else {
                  router.push(`/origami/${item.id}`);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.cardIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={ICON_MAP[item.icon_name] || 'diamond'} size={36} color={item.color} />
                {item.is_premium && (
                  <View style={[styles.proBadge, !canAccessPremium && { backgroundColor: '#94A3B8' }]}>
                    <Ionicons name={canAccessPremium ? 'star' : 'lock-closed'} size={9} color={Colors.white} />
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                )}
              </View>
              <View style={[styles.cardInfo, item.is_premium && !canAccessPremium && { opacity: 0.6 }]}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.is_premium && !canAccessPremium ? 'Unlock with Premium subscription' : item.description}</Text>
                <View style={styles.cardMeta}>
                  <View style={[styles.diffDots]}>
                    {[1, 2, 3, 4, 5].map(d => (
                      <View key={d} style={[styles.dot, d <= item.difficulty_rating ? { backgroundColor: item.color } : {}]} />
                    ))}
                  </View>
                  <Text style={styles.cardTime}>{item.estimated_time}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
          {origamis.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>No origami found</Text>
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textMain },
  subtitle: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginTop: 4 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, backgroundColor: Colors.white, borderRadius: 16,
    paddingHorizontal: 16, borderWidth: 2, borderColor: Colors.border, height: 50,
  },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textMain },
  filtersRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  filterChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 9999,
    backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border,
  },
  filterText: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { paddingHorizontal: 20, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: 18, padding: 14,
    borderWidth: 2, borderColor: Colors.border, borderBottomWidth: 3,
  },
  cardIcon: {
    width: 64, height: 64, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  proBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.primary, borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  proBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.white },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.textMain },
  cardDesc: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginTop: 3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  diffDots: { flexDirection: 'row', gap: 3 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  cardTime: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textMuted, marginTop: 12 },
});
