import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';

/** Login is optional — only needed to review or save. Browsing is anonymous. */
export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [signedIn, setSignedIn] = useState(false);

  async function go(kind: 'in' | 'up') {
    setBusy(true);
    setMsg('');
    const fn =
      kind === 'in'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    setBusy(false);
    if (error) setMsg(error.message);
    else {
      setSignedIn(true);
      setMsg('Signed in ✓');
    }
  }

  return (
    <View style={st.wrap}>
      <Stack.Screen options={{ headerShown: true, title: 'Sign in' }} />
      <Text style={st.h1}>Sign in</Text>
      <Text style={st.muted}>Only needed to review or save favorites. Browsing is open to all.</Text>
      <TextInput
        style={st.input}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={st.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={st.row}>
        <Pressable style={[st.btn, st.primary]} onPress={() => go('in')} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={st.primaryText}>Sign in</Text>}
        </Pressable>
        <Pressable style={st.btn} onPress={() => go('up')} disabled={busy}>
          <Text style={st.btnText}>Create account</Text>
        </Pressable>
      </View>
      {msg ? <Text style={[st.msg, signedIn && st.ok]}>{msg}</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: '#fbf7f2' },
  h1: { fontSize: 26, fontWeight: '800', color: '#211915', marginTop: 8 },
  muted: { color: '#8c7d70', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#e9ddce',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { borderWidth: 1, borderColor: '#e9ddce', borderRadius: 10, padding: 13, backgroundColor: '#fff' },
  primary: { backgroundColor: '#d6482b', borderColor: '#d6482b' },
  primaryText: { color: '#fff', fontWeight: '700' },
  btnText: { color: '#4b3f37', fontWeight: '700' },
  msg: { marginTop: 16, color: '#4b3f37' },
  ok: { color: '#1f9d55' },
});
