import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { type Card, distanceLabel, freshness, getPilotCityId, search } from '@/lib/data';

const LIVE_COLORS: Record<string, string> = { open: '#1f9d55', busy: '#d9822b', closed: '#9a8d80' };

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [cityId, setCityId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [items, setItems] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Read latest filter values without making `run` change identity every keystroke.
  const filters = { q, vegOnly };
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const run = useCallback(async (city: string) => {
    setLoading(true);
    setError('');
    try {
      const { q: cq, vegOnly: cv } = filtersRef.current;
      setItems(await search(city, { q: cq || undefined, vegOnly: cv }));
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getPilotCityId().then((id) => {
      if (!active) return;
      setCityId(id);
      if (id) run(id);
    });
    return () => {
      active = false;
    };
  }, [run]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>NearBite</Text>
      <Text style={styles.subtitle}>Fresh menus, real photos, live status.</Text>

      <TextInput
        style={styles.input}
        placeholder="Search a dish or place…"
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => cityId && run(cityId)}
        returnKeyType="search"
      />
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.chip, vegOnly && styles.chipOn]}
          onPress={() => {
            const v = !vegOnly;
            setVegOnly(v);
            if (cityId) setTimeout(() => run(cityId), 0);
          }}
        >
          <Text style={[styles.chipText, vegOnly && styles.chipTextOn]}>🌱 Veg</Text>
        </Pressable>
        <Link href="/signin" asChild>
          <Pressable style={styles.chip}>
            <Text style={styles.chipText}>Sign in</Text>
          </Pressable>
        </Link>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && items.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => cityId && run(cityId)} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No places found. Try another search.</Text>}
          renderItem={({ item: b }) => (
            <Link href={{ pathname: '/b/[id]', params: { id: b.id } }} asChild>
              <Pressable style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{b.name}</Text>
                  <View style={[styles.liveDot, { backgroundColor: LIVE_COLORS[b.live] }]} />
                </View>
                <Text style={styles.meta}>
                  {b.category_slug ?? 'food'} · {'$'.repeat(b.price_tier)} ·{' '}
                  {distanceLabel(b.distance_m)}
                  {b.review_count > 0 ? ` · ★ ${b.avg_rating}` : ''}
                </Text>
                <Text style={styles.fresh}>✦ Updated {freshness(b.last_updated_at)}</Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, backgroundColor: '#fbf7f2' },
  title: { fontSize: 30, fontWeight: '800', color: '#211915', letterSpacing: -0.5 },
  subtitle: { color: '#8c7d70', marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#e9ddce',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#e9ddce',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  chipOn: { backgroundColor: '#d6482b', borderColor: '#d6482b' },
  chipText: { fontWeight: '600', color: '#4b3f37' },
  chipTextOn: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ddce',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#211915', flex: 1 },
  liveDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  meta: { color: '#8c7d70', marginTop: 4, fontSize: 13 },
  fresh: { color: '#e0902b', marginTop: 6, fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#8c7d70', marginTop: 40 },
  error: { color: '#d6482b', marginVertical: 8 },
});
