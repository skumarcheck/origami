import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function OrigamiDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [origami, setOrigami] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [completing, setCompleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [orig, prog] = await Promise.all([
        apiCall(`/origami/${id}`),
        apiCall('/progress').catch(() => []),
      ]);
      setOrigami(orig);
      const myProgress = (prog as any[]).find((p: any) => p.origami_id === id);
      if (myProgress) {
        setProgress(myProgress);
        setCurrentStep(myProgress.current_step || 0);
        setFavorited(myProgress.favorited || false);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  async function toggleFav() {
    try {
      const res = await apiCall(`/progress/${id}/favorite`, { method: 'POST' });
      setFavorited(res.favorited);
    } catch (e) { console.error(e); }
  }

  async function goToStep(step: number) {
    setCurrentStep(step);
    try {
      await apiCall(`/progress/${id}/step?step=${step}`, { method: 'POST' });
    } catch (e) { console.error(e); }
  }

  async function completeOrigami() {
    setCompleting(true);
    try {
      const res = await apiCall(`/progress/${id}/complete`, { method: 'POST' });
      if (res.xp_earned) {
        setProgress({ ...progress, completed: true });
      }
    } catch (e) { console.error(e); } finally { setCompleting(false); }
  }

  if (loading || !origami) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const steps = origami.steps || [];
  const isLastStep = currentStep >= steps.length - 1;
  const isCompleted = progress?.completed;
  const canAccessVideo = user?.subscription_status === 'trial' || user?.subscription_status === 'active';
  const canAccessPremium = canAccessVideo;

  // If premium and user can't access, show locked screen
  if (origami.is_premium && !canAccessPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity testID="detail-back-btn" style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textMain} />
          </TouchableOpacity>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView contentContainerStyle={[styles.content, { alignItems: 'center', paddingTop: 40 }]}>
          <View style={[styles.heroIcon, { backgroundColor: origami.color + '20' }]}>
            <Ionicons name="lock-closed" size={40} color={origami.color} />
          </View>
          <Text style={styles.title}>{origami.title}</Text>
          <View style={{ backgroundColor: '#FDE047', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6, marginTop: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#92400E' }}>PREMIUM</Text>
          </View>
          <Text style={[styles.description, { marginTop: 16 }]}>This is a premium origami! Subscribe to unlock 185+ extra projects including this one.</Text>
          <TouchableOpacity
            testID="unlock-premium-btn"
            style={{ backgroundColor: Colors.primary, borderRadius: 9999, paddingVertical: 16, paddingHorizontal: 40, borderBottomWidth: 4, borderBottomColor: Colors.primaryDark, marginTop: 24 }}
            onPress={() => router.push('/subscription')}
            activeOpacity={0.8}
          >
            <Text style={{ color: Colors.white, fontSize: 18, fontWeight: '800' }}>Unlock Premium</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="detail-back-btn" style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textMain} />
        </TouchableOpacity>
        <TouchableOpacity testID="detail-fav-btn" style={styles.favBtn} onPress={toggleFav}>
          <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={24} color={favorited ? Colors.danger : Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroIcon, { backgroundColor: origami.color + '20' }]}>
          <Ionicons name={ICON_MAP[origami.icon_name] || 'diamond'} size={56} color={origami.color} />
        </View>
        <Text style={styles.title}>{origami.title}</Text>
        <Text style={styles.description}>{origami.description}</Text>

        <View style={styles.metaRow}>
          <View style={[styles.metaChip, { backgroundColor: origami.skill_level === 'beginner' ? '#DCFCE7' : origami.skill_level === 'intermediate' ? '#FEF9C3' : '#FFE4E6' }]}>
            <Text style={[styles.metaText, { color: origami.skill_level === 'beginner' ? '#16A34A' : origami.skill_level === 'intermediate' ? '#CA8A04' : '#E11D48' }]}>
              {origami.skill_level}
            </Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: '#F1F5F9' }]}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={[styles.metaText, { color: Colors.textMuted }]}>{origami.estimated_time}</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: '#F1F5F9' }]}>
            <Ionicons name="flash" size={14} color="#EAB308" />
            <Text style={[styles.metaText, { color: Colors.textMuted }]}>+{origami.xp_reward} XP</Text>
          </View>
        </View>

        {origami.is_premium && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF9C3', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, marginTop: 12, gap: 6 }}>
            <Ionicons name="star" size={16} color="#EAB308" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#92400E' }}>Premium Origami</Text>
          </View>
        )}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Steps ({currentStep + 1}/{steps.length})</Text>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.completedText}>Completed!</Text>
              </View>
            )}
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentStep + 1) / steps.length) * 100}%`, backgroundColor: origami.color }]} />
          </View>
        </View>

        {steps.length > 0 && (
          <View style={styles.stepCard}>
            <View style={[styles.stepNumCircle, { backgroundColor: origami.color }]}>
              <Text style={styles.stepNumText}>{currentStep + 1}</Text>
            </View>
            <Text style={styles.stepTitle}>{steps[currentStep]?.title}</Text>
            <Text style={styles.stepInstruction}>{steps[currentStep]?.instruction}</Text>
            {steps[currentStep]?.tip && (
              <View style={styles.tipBox}>
                <Ionicons name="bulb" size={18} color="#EAB308" />
                <Text style={styles.tipText}>{steps[currentStep].tip}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.stepNav}>
          <TouchableOpacity
            testID="prev-step-btn"
            style={[styles.navBtn, currentStep === 0 && styles.navBtnDisabled]}
            onPress={() => currentStep > 0 && goToStep(currentStep - 1)}
            disabled={currentStep === 0}
          >
            <Ionicons name="arrow-back" size={20} color={currentStep === 0 ? Colors.textLight : Colors.textMain} />
            <Text style={[styles.navBtnText, currentStep === 0 && { color: Colors.textLight }]}>Previous</Text>
          </TouchableOpacity>

          {isLastStep ? (
            <TouchableOpacity
              testID="complete-btn"
              style={[styles.completeBtn, isCompleted && styles.completeBtnDone]}
              onPress={isCompleted ? undefined : completeOrigami}
              disabled={isCompleted || completing}
              activeOpacity={0.8}
            >
              {completing ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name={isCompleted ? 'checkmark-circle' : 'trophy'} size={20} color={Colors.white} />
                  <Text style={styles.completeBtnText}>{isCompleted ? 'Done!' : 'Complete!'}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              testID="next-step-btn"
              style={styles.nextBtn}
              onPress={() => goToStep(currentStep + 1)}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>Next Step</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  favBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  content: { paddingHorizontal: 20 },
  heroIcon: {
    width: 100, height: 100, borderRadius: 30, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textMain, textAlign: 'center' },
  description: { fontSize: 15, fontWeight: '600', color: Colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  metaRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  metaText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  videoSection: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#E0F7FA', borderRadius: 16, padding: 16, marginTop: 20,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  videoLocked: { backgroundColor: '#F8FAFC', borderColor: Colors.border },
  videoTitle: { fontSize: 15, fontWeight: '800', color: Colors.textMain },
  videoSubtitle: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginTop: 2 },
  progressSection: { marginTop: 24 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTitle: { fontSize: 16, fontWeight: '800', color: Colors.textMain },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  completedText: { fontSize: 13, fontWeight: '700', color: Colors.success },
  progressBar: { height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  stepCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 24,
    marginTop: 20, borderWidth: 2, borderColor: Colors.border, borderBottomWidth: 4,
  },
  stepNumCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  stepNumText: { fontSize: 18, fontWeight: '900', color: Colors.white },
  stepTitle: { fontSize: 20, fontWeight: '800', color: Colors.textMain, marginBottom: 10 },
  stepInstruction: { fontSize: 16, fontWeight: '600', color: Colors.textMuted, lineHeight: 24 },
  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FEF9C3', borderRadius: 12, padding: 12, marginTop: 14,
  },
  tipText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#92400E' },
  stepNav: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 20 },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 9999, backgroundColor: Colors.white,
    borderWidth: 2, borderColor: Colors.border,
  },
  navBtnDisabled: { opacity: 0.5 },
  navBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textMain },
  nextBtn: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 9999, backgroundColor: Colors.primary,
    borderBottomWidth: 3, borderBottomColor: Colors.primaryDark,
  },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },
  completeBtn: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 9999, backgroundColor: Colors.success,
    borderBottomWidth: 3, borderBottomColor: '#16A34A',
  },
  completeBtnDone: { backgroundColor: Colors.textLight },
  completeBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },
});
