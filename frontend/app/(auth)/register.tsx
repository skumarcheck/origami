import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../utils/colors';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity testID="register-back-btn" style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textMain} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles" size={40} color={Colors.secondary} />
          </View>
          <Text style={styles.title}>Join Origami World!</Text>
          <Text style={styles.subtitle}>Start your 1-month free trial</Text>
        </View>

        <View style={styles.trialBadge}>
          <Ionicons name="gift" size={18} color={Colors.white} />
          <Text style={styles.trialText}>All premium videos free for 30 days!</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={Colors.textMuted} />
            <TextInput
              testID="register-name-input"
              style={styles.input}
              placeholder="What should we call you?"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
            <TextInput
              testID="register-email-input"
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />
            <TextInput
              testID="register-password-input"
              style={styles.input}
              placeholder="Create a password (6+ chars)"
              placeholderTextColor={Colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          testID="register-submit-btn"
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity testID="register-to-login-btn" style={styles.linkBtn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.linkText}>Already have an account? </Text>
          <Text style={[styles.linkText, { color: Colors.primary, fontWeight: '800' }]}>Log In</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginTop: 8 },
  header: { alignItems: 'center', paddingVertical: 20 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFF9C4', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 2, borderColor: Colors.secondary,
  },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textMain },
  subtitle: { fontSize: 16, fontWeight: '600', color: Colors.textMuted, marginTop: 4 },
  trialBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.success, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16,
    marginBottom: 20,
  },
  trialText: { color: Colors.white, fontSize: 13, fontWeight: '800' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#DC2626', fontSize: 14, fontWeight: '600', flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.textMain, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: 16, paddingHorizontal: 16,
    borderWidth: 2, borderColor: Colors.border, borderBottomWidth: 3,
    height: 54,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textMain },
  primaryButton: {
    backgroundColor: Colors.primary, borderRadius: 9999,
    paddingVertical: 18, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 4, borderBottomColor: Colors.primaryDark,
    marginTop: 8, marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  linkBtn: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  linkText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
});
