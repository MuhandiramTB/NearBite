import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

/**
 * M0 auth screen: email OTP (magic link / code) sign-in via Supabase.
 * Proves the mobile client authenticates against the same backend as web.
 * Browsing is anonymous (no login required, FR-3.1); login is only needed
 * later to review/save — this screen is the entry point for that path.
 */
export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function sendOtp() {
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('sent');
      setMessage('Check your email for the sign-in link.');
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
      <Text style={styles.title}>NearBite</Text>
      <Text style={styles.subtitle}>Sign in to review & save favorites</Text>

      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Pressable
        style={styles.button}
        onPress={sendOtp}
        disabled={status === 'sending' || email.length < 3}
      >
        {status === 'sending' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send sign-in link</Text>
        )}
      </Pressable>

      {message ? (
        <Text style={[styles.message, status === 'error' && styles.error]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, backgroundColor: '#fff' },
  title: { fontSize: 34, fontWeight: '800' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4, marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  message: { marginTop: 16, color: '#333' },
  error: { color: '#c00' },
});
