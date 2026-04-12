import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiCall } from '../../utils/api';
import { Colors } from '../../utils/colors';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  bird: 'paper-plane', airplane: 'airplane', boat: 'boat', paw: 'paw',
  flower: 'flower', heart: 'heart', leaf: 'leaf', star: 'star',
  flame: 'flame', moon: 'moon', snow: 'snow',
};

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [featured, setFeatured] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [feat, st] = await Promise.all([
        apiCall('/origami/featured'),
        apiCall('/progress/stats'),
      ]);
      setFeatured(feat);
      setStats(st);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Reload stats every time screen comes into focus (e.g. after completing origami)
  useFocusEffect(
    useCallback(() => {
      apiCall('/progress/stats').then(setStats).catch(console.error);
    }, [])
  );

  const onRefresh = () => { setRefreshing(true); loadData(); };

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.welcomeSection}>
        <View>
          <Text style={styles.greeting}>Hey, {user?.name || 'Friend'}!</Text>
          <Text style={styles.welcomeText}>Ready to fold something awesome?</Text>
        </View>
        <TouchableOpacity testID="home-profile-btn" style={styles.avatarCircle} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="person" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#E0F7FA' }]}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF9C4' }]}>
            <Ionicons name="flash" size={24} color="#EAB308" />
            <Text style={styles.statNumber}>{stats.xp_points}</Text>
            <Text style={styles.statLabel}>XP Points</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FCE4EC' }]}>
            <Ionicons name="heart" size={24} color={Colors.danger} />
            <Text style={styles.statNumber}>{stats.favorites}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Origami</Text>
        <TouchableOpacity testID="see-all-btn" onPress={() => router.push('/(tabs)/browse')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {featured.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            testID={`featured-${item.id}`}
            style={[styles.featuredCard, { borderColor: item.color + '40' }]}
            onPress={() => router.push(`/origami/${item.id}`)}
            activeOpacity={0.8}
          >
            <View style={[styles.featuredIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={ICON_MAP[item.icon_name] || 'diamond'} size={32} color={item.color} />
            </View>
            <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.featuredMeta}>
              <View style={[styles.skillBadge, { backgroundColor: item.skill_level === 'beginner' ? Colors.skillBeginner + '30' : item.skill_level === 'intermediate' ? Colors.skillIntermediate + '30' : Colors.skillAdvanced + '30' }]}>
                <Text style={[styles.skillBadgeText, { color: item.skill_level === 'beginner' ? '#16A34A' : item.skill_level === 'intermediate' ? '#CA8A04' : '#E11D48' }]}>
                  {item.skill_level}
                </Text>
              </View>
            </View>
            <Text style={styles.featuredTime}>{item.estimated_time}</Text>
            {item.is_premium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="videocam" size={12} color={Colors.white} />
                <Text style={styles.premiumText}>PRO</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        testID="explore-seasonal-btn"
        style={styles.seasonalBanner}
        onPress={() => router.push('/(tabs)/seasonal')}
        activeOpacity={0.8}
      >
        <View style={styles.seasonalContent}>
          <Ionicons name="leaf" size={32} color={Colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={styles.seasonalTitle}>Seasonal Collection</Text>
            <Text style={styles.seasonalSubtitle}>Discover themed origami for every season!</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.white} />
        </View>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  welcomeSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 20 },
  greeting: { fontSize: 28, fontWeight: '900', color: Colors.textMain },
  welcomeText: { fontSize: 16, fontWeight: '600', color: Colors.textMuted, marginTop: 4 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E0F7FA', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  statNumber: { fontSize: 22, fontWeight: '900', color: Colors.textMain, marginTop: 4 },
  statLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.textMain },
  seeAll: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  horizontalList: { paddingRight: 20, gap: 14, paddingBottom: 4 },
  featuredCard: {
    width: 160, backgroundColor: Colors.white, borderRadius: 20, padding: 16,
    borderWidth: 2, borderBottomWidth: 4, position: 'relative',
  },
  featuredIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featuredTitle: { fontSize: 15, fontWeight: '800', color: Colors.textMain, marginBottom: 6 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  skillBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  skillBadgeText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  featuredTime: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  premiumBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  premiumText: { fontSize: 10, fontWeight: '900', color: Colors.white },
  seasonalBanner: {
    backgroundColor: Colors.success, borderRadius: 20, marginTop: 24,
    borderBottomWidth: 4, borderBottomColor: '#16A34A',
  },
  seasonalContent: {
    flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14,
  },
  seasonalTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  seasonalSubtitle: { fontSize: 13, fontWeight: '600', color: Colors.white, opacity: 0.9, marginTop: 2 },
});
