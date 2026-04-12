import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import { Colors } from '../utils/colors';

export default function SubscriptionScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const trialDays = user?.trial_end
    ? Math.max(0, Math.ceil((new Date(user.trial_end).getTime() - Date.now()) / 86400000))
    : 0;

  const isActive = user?.subscription_status === 'active';
  const isTrial = user?.subscription_status === 'trial';

  async function handlePayPal() {
    setLoading(true);
    try {
      await apiCall('/subscription/activate', { method: 'POST' });
      await refreshUser();
      Alert.alert('Success!', 'Your premium subscription is now active. Enjoy all video tutorials!', [
        { text: 'Awesome!', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="sub-back-btn" style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textMain} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={styles.crownCircle}>
          <Ionicons name="diamond" size={44} color="#EAB308" />
        </View>
        <Text style={styles.title}>Origami World Pro</Text>
        <Text style={styles.subtitle}>Unlock all premium video tutorials</Text>
      </View>

      {isActive && (
        <View style={styles.activeBanner}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          <Text style={styles.activeText}>Your subscription is active!</Text>
        </View>
      )}

      {isTrial && trialDays > 0 && (
        <View style={styles.trialBanner}>
          <Ionicons name="time" size={20} color="#F59E0B" />
          <Text style={styles.trialText}>
            Your free trial is active! {trialDays} days remaining.
          </Text>
        </View>
      )}

      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>What You Get</Text>
        {[
          { icon: 'diamond' as const, text: '185+ extra origami projects' },
          { icon: 'paw' as const, text: 'Rare animals: Snow Leopard, Axolotl, Narwhal' },
          { icon: 'flower' as const, text: 'Beautiful flowers: Sakura, Orchid, Bird of Paradise' },
          { icon: 'gift' as const, text: 'Holiday specials: Christmas, Halloween, Easter' },
          { icon: 'star' as const, text: 'New premium projects added every month' },
        ].map((item, i) => (
          <View key={i} style={styles.benefitRow}>
            <Ionicons name={item.icon} size={20} color={Colors.primary} />
            <Text style={styles.benefitText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {!isActive && (
        <>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Monthly</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceAmount}>$4.99</Text>
              <Text style={styles.priceUnit}>/month</Text>
            </View>
            <Text style={styles.priceNote}>Cancel anytime. First month free!</Text>
          </View>

          <Text style={styles.paymentTitle}>Pay with</Text>

          <TouchableOpacity
            testID="paypal-btn"
            style={styles.paypalBtn}
            onPress={handlePayPal}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="logo-paypal" size={22} color={Colors.white} />
                <Text style={styles.paypalText}>Pay with PayPal</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="apple-pay-btn"
            style={styles.applePayBtn}
            onPress={() => Alert.alert('Coming Soon', 'Apple Pay will be available in the production app build.')}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-apple" size={22} color={Colors.white} />
            <Text style={styles.applePayText}>Apple Pay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="google-pay-btn"
            style={styles.googlePayBtn}
            onPress={() => Alert.alert('Coming Soon', 'Google Pay will be available in the production app build.')}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={22} color={Colors.textMain} />
            <Text style={styles.googlePayText}>Google Pay</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 8 },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  header: { alignItems: 'center', paddingVertical: 20 },
  crownCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#FEF9C3', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 3, borderColor: '#FDE047',
  },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textMain },
  subtitle: { fontSize: 15, fontWeight: '600', color: Colors.textMuted, marginTop: 4 },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#DCFCE7', borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 20,
  },
  activeText: { fontSize: 16, fontWeight: '800', color: '#16A34A' },
  trialBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FEF9C3', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 20,
  },
  trialText: { fontSize: 14, fontWeight: '700', color: '#92400E', flex: 1 },
  benefitsCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 20,
    borderWidth: 2, borderColor: Colors.border, borderBottomWidth: 4, marginBottom: 20,
  },
  benefitsTitle: { fontSize: 18, fontWeight: '800', color: Colors.textMain, marginBottom: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  benefitText: { fontSize: 15, fontWeight: '600', color: Colors.textMain },
  priceCard: {
    alignItems: 'center', backgroundColor: Colors.primary + '10',
    borderRadius: 20, padding: 24, borderWidth: 2, borderColor: Colors.primary + '30',
    marginBottom: 24,
  },
  priceLabel: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  priceAmount: { fontSize: 42, fontWeight: '900', color: Colors.textMain },
  priceUnit: { fontSize: 16, fontWeight: '700', color: Colors.textMuted, marginLeft: 4 },
  priceNote: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginTop: 8 },
  paymentTitle: { fontSize: 16, fontWeight: '800', color: Colors.textMain, marginBottom: 14 },
  paypalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#0070BA', borderRadius: 9999, paddingVertical: 16,
    borderBottomWidth: 3, borderBottomColor: '#003087', marginBottom: 12,
  },
  paypalText: { fontSize: 16, fontWeight: '800', color: Colors.white },
  applePayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.black, borderRadius: 9999, paddingVertical: 16, marginBottom: 12,
  },
  applePayText: { fontSize: 16, fontWeight: '800', color: Colors.white },
  googlePayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: 9999, paddingVertical: 16,
    borderWidth: 2, borderColor: Colors.border,
  },
  googlePayText: { fontSize: 16, fontWeight: '800', color: Colors.textMain },
});
