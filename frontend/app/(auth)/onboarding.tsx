import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiCall } from '../../utils/api';
import { Colors } from '../../utils/colors';

const SKILL_LEVELS = [
  {
    id: 'beginner',
    title: 'Beginner',
    desc: 'I\'m just starting out!',
    icon: 'leaf' as const,
    color: Colors.skillBeginner,
    bgColor: '#DCFCE7',
    ages: '5-7 years',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    desc: 'I know some basic folds',
    icon: 'star' as const,
    color: '#EAB308',
    bgColor: '#FEF9C3',
    ages: '8-10 years',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    desc: 'I love complex origami!',
    icon: 'trophy' as const,
    color: Colors.danger,
    bgColor: '#FFE4E6',
    ages: '11+ years',
  },
];

export default function OnboardingScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    try {
      const level = SKILL_LEVELS.find(s => s.id === selected);
      const updated = await apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ skill_level: selected, age_range: level?.ages }),
      });
      updateUser(updated);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>What's your skill level?</Text>
        <Text style={styles.subtitle}>We'll tailor the origami projects just for you!</Text>
      </View>

      <View style={styles.cardList}>
        {SKILL_LEVELS.map(level => (
          <TouchableOpacity
            key={level.id}
            testID={`skill-${level.id}-btn`}
            style={[
              styles.skillCard,
              { borderColor: selected === level.id ? level.color : Colors.border },
              selected === level.id && { backgroundColor: level.bgColor, borderBottomColor: level.color },
            ]}
            onPress={() => setSelected(level.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.skillIcon, { backgroundColor: level.bgColor }]}>
              <Ionicons name={level.icon} size={32} color={level.color} />
            </View>
            <View style={styles.skillInfo}>
              <Text style={styles.skillTitle}>{level.title}</Text>
              <Text style={styles.skillDesc}>{level.desc}</Text>
              <Text style={styles.skillAge}>{level.ages}</Text>
            </View>
            <View style={[styles.radio, selected === level.id && { borderColor: level.color }]}>
              {selected === level.id && <View style={[styles.radioDot, { backgroundColor: level.color }]} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          testID="onboarding-continue-btn"
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selected || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.continueBtnText}>Let's Go!</Text>
              <Ionicons name="arrow-forward" size={22} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 24 },
  header: { alignItems: 'center', paddingVertical: 24 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textMain, textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: '600', color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
  cardList: { flex: 1, justifyContent: 'center', gap: 16 },
  skillCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.white, borderRadius: 20, padding: 20,
    borderWidth: 2, borderColor: Colors.border, borderBottomWidth: 4, borderBottomColor: Colors.border,
  },
  skillIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  skillInfo: { flex: 1 },
  skillTitle: { fontSize: 20, fontWeight: '800', color: Colors.textMain },
  skillDesc: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginTop: 2 },
  skillAge: { fontSize: 12, fontWeight: '700', color: Colors.textLight, marginTop: 4 },
  radio: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 3, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 14, height: 14, borderRadius: 7 },
  bottom: { paddingBottom: 40 },
  continueBtn: {
    flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 9999,
    paddingVertical: 18, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 4, borderBottomColor: Colors.primaryDark, gap: 8,
  },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnText: { color: Colors.white, fontSize: 18, fontWeight: '800' },
});
