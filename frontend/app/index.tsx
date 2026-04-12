import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../utils/colors';

export default function LandingScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!loading && user) {
      if (user.skill_level) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <View style={styles.heroSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="diamond" size={60} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Foldiverse</Text>
        <Text style={styles.subtitle}>
          <Text style={{ fontStyle: 'italic', color: Colors.textMuted }}>Start with paper. End with magic.</Text>
        </Text>
      </View>

      <View style={styles.featuresSection}>
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: '#E0F7FA' }]}>
            <Ionicons name="school" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.featureTitle}>Step by Step</Text>
          <Text style={styles.featureDesc}>Easy instructions for every fold</Text>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: '#FFF9C4' }]}>
            <Ionicons name="trophy" size={28} color={Colors.secondaryDark} />
          </View>
          <Text style={styles.featureTitle}>Track Progress</Text>
          <Text style={styles.featureDesc}>Earn XP and level up!</Text>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: '#FCE4EC' }]}>
            <Ionicons name="leaf" size={28} color={Colors.danger} />
          </View>
          <Text style={styles.featureTitle}>Seasonal Fun</Text>
          <Text style={styles.featureDesc}>New themes every season</Text>
        </View>
      </View>

      <View style={styles.trialBadge}>
        <Ionicons name="gift" size={20} color={Colors.white} />
        <Text style={styles.trialText}>1 Month Free Trial for All Premium Content!</Text>
      </View>

      <TouchableOpacity
        testID="get-started-btn"
        style={styles.primaryButton}
        onPress={() => router.push('/(auth)/register')}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={22} color={Colors.white} />
      </TouchableOpacity>

      <TouchableOpacity
        testID="login-btn"
        style={styles.secondaryButton}
        onPress={() => router.push('/(auth)/login')}
        activeOpacity={0.8}
      >
        <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.textMain,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderBottomWidth: 4,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  trialText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 9999,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: Colors.primaryDark,
    gap: 8,
    marginBottom: 14,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderRadius: 9999,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderBottomWidth: 4,
  },
  secondaryButtonText: {
    color: Colors.textMain,
    fontSize: 16,
    fontWeight: '700',
  },
});
