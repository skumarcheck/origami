import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<any>(null);
  const [completed, setCompleted] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'completed' | 'favorites'>('completed');

  const loadData = useCallback(async () => {
    try {
      const [st, comp, fav] = await Promise.all([
        apiCall('/progress/stats'),
        apiCall('/progress/completed'),
        apiCall('/progress/favorites'),
      ]);
      setStats(st);
      setCompleted(comp);
      setFavorites(fav);
    } catch (e) { console.error(e); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); refreshUser(); }, [loadData]);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { logout(); router.replace('/'); } },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const items = tab === 'completed' ? completed : favorites;
  const trialDays = user?.trial_end
    ? Math.max(0, Math.ceil((new Date(user.trial_end).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.levelBadge}>
          <Ionicons name="ribbon" size={16} color={Colors.white} />
          <Text style={styles.levelText}>{user?.skill_level || 'Not set'}</Text>
        </View>
      </View>

      {user?.subscription_status === 'trial' && (
        <TouchableOpacity
          testID="trial-banner-btn"
          style={styles.trialBanner}
          onPress={() => router.push('/subscription')}
          activeOpacity={0.8}
        >
          <View style={styles.trialInfo}>
            <Ionicons name="time" size={20} color="#F59E0B" />
            <View>
              <Text style={styles.trialTitle}>Free Trial Active</Text>
              <Text style={styles.trialDays}>{trialDays} days remaining</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
        </TouchableOpacity>
      )}

      {user?.subscription_status === 'expired' && (
        <TouchableOpacity
          testID="subscribe-banner-btn"
          style={[styles.trialBanner, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}
          onPress={() => router.push('/subscription')}
          activeOpacity={0.8}
        >
          <View style={styles.trialInfo}>
            <Ionicons name="lock-closed" size={20} color="#DC2626" />
            <View>
              <Text style={[styles.trialTitle, { color: '#DC2626' }]}>Trial Expired</Text>
              <Text style={[styles.trialDays, { color: '#DC2626' }]}>Subscribe to unlock premium videos</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#DC2626" />
        </TouchableOpacity>
      )}

      {stats && (
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats.completed}</Text>
            <Text style={styles.statLbl}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats.xp_points}</Text>
            <Text style={styles.statLbl}>XP Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats.favorites}</Text>
            <Text style={styles.statLbl}>Favorites</Text>
          </View>
        </View>
      )}

      <View style={styles.tabRow}>
        <TouchableOpacity
          testID="profile-completed-tab"
          style={[styles.tabBtn, tab === 'completed' && styles.tabBtnActive]}
          onPress={() => setTab('completed')}
        >
          <Ionicons name="checkmark-circle" size={18} color={tab === 'completed' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActive]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="profile-favorites-tab"
          style={[styles.tabBtn, tab === 'favorites' && styles.tabBtnActive]}
          onPress={() => setTab('favorites')}
        >
          <Ionicons name="heart" size={18} color={tab === 'favorites' ? Colors.danger : Colors.textMuted} />
          <Text style={[styles.tabText, tab === 'favorites' && styles.tabTextActive]}>Favorites</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name={tab === 'completed' ? 'checkmark-circle-outline' : 'heart-outline'} size={48} color={Colors.textLight} />
          <Text style={styles.emptyText}>No {tab} origami yet</Text>
          <Text style={styles.emptySubtext}>Start folding to fill this section!</Text>
        </View>
      ) : (
        items.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            testID={`profile-item-${item.id}`}
            style={styles.listItem}
            onPress={() => router.push(`/origami/${item.id}`)}
            activeOpacity={0.8}
          >
            <View style={[styles.listIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={ICON_MAP[item.icon_name] || 'diamond'} size={24} color={item.color} />
            </View>
            <View style={styles.listInfo}>
              <Text style={styles.listTitle}>{item.title}</Text>
              <Text style={styles.listMeta}>{item.skill_level} | {item.estimated_time}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  profileHeader: { alignItems: 'center', paddingTop: 20, paddingBottom: 20 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#E0F7FA', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.primary, marginBottom: 12,
  },
  userName: { fontSize: 24, fontWeight: '900', color: Colors.textMain },
  userEmail: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginTop: 4 },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: 9999,
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 10,
  },
  levelText: { fontSize: 13, fontWeight: '800', color: Colors.white, textTransform: 'capitalize' },
  trialBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FEF9C3', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 16,
  },
  trialInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trialTitle: { fontSize: 14, fontWeight: '800', color: '#92400E' },
  trialDays: { fontSize: 12, fontWeight: '600', color: '#B45309', marginTop: 2 },
  statsGrid: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 18,
    padding: 20, borderWidth: 2, borderColor: Colors.border, borderBottomWidth: 3,
    marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '900', color: Colors.textMain },
  statLbl: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.white,
    borderWidth: 2, borderColor: Colors.border,
  },
  tabBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  tabText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.textMuted, marginTop: 12 },
  emptySubtext: { fontSize: 13, fontWeight: '600', color: Colors.textLight, marginTop: 4 },
  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  listIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '800', color: Colors.textMain },
  listMeta: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: '#FEE2E2',
    marginTop: 24, borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#DC2626' },
});
