import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

/**
 * Mobile Supabase client. Uses the ANON key + user session only — RLS always
 * applies (the service-role key never ships in the app bundle, §9).
 * Tokens persist in the OS secure enclave via expo-secure-store.
 */
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const extra = Constants.expoConfig?.extra ?? {};
const url = (extra.supabaseUrl as string) ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey =
  (extra.supabaseAnonKey as string) ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
