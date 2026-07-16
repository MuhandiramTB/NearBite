import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { detail, freshness } from '@/lib/data';

type Menu = { id: string; name: string; price: number; currency: string; isVeg: boolean }[];
type Detail = {
  name: string;
  categorySlug: string | null;
  priceTier: number;
  avgRating: number;
  reviewCount: number;
  live: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  lastUpdatedAt: string;
  facilities: string[];
  visitPurposes: string[];
  menu: Menu;
  offers: { id: string; title: string; description: string | null }[];
};

const LIVE_COLORS: Record<string, string> = { open: '#1f9d55', busy: '#d9822b', closed: '#9a8d80' };

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    detail(id)
      .then((x) => setD(x as unknown as Detail))
      .catch((e) => setError(String(e.message)));
  }, [id]);

  if (error) return <Centered><Text style={s.err}>{error}</Text></Centered>;
  if (!d) return <Centered><ActivityIndicator /></Centered>;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: d.name }} />
      <ScrollView style={s.wrap} contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 24 }}>
        <View style={s.row}>
          <Text style={s.h1}>{d.name}</Text>
          <View style={[s.dot, { backgroundColor: LIVE_COLORS[d.live] }]} />
        </View>
        <Text style={s.meta}>
          {d.categorySlug ?? 'food'} · {'$'.repeat(d.priceTier)}
          {d.reviewCount > 0 ? ` · ★ ${d.avgRating} (${d.reviewCount})` : ''}
        </Text>
        <Text style={s.fresh}>✦ Updated {freshness(d.lastUpdatedAt)}</Text>

        {d.description ? <Text style={s.body}>{d.description}</Text> : null}
        {d.address ? <Text style={s.muted}>📍 {d.address}</Text> : null}
        {d.phone ? <Text style={s.muted}>📞 {d.phone}</Text> : null}

        {d.visitPurposes?.length > 0 && (
          <ChipRow title="Good for" items={d.visitPurposes} />
        )}
        {d.facilities?.length > 0 && <ChipRow title="Facilities" items={d.facilities} />}

        {d.offers?.length > 0 && (
          <>
            <Text style={s.section}>Offers</Text>
            {d.offers.map((o) => (
              <View key={o.id} style={s.offer}>
                <Text style={s.offerTitle}>🎉 {o.title}</Text>
                {o.description ? <Text style={s.muted}>{o.description}</Text> : null}
              </View>
            ))}
          </>
        )}

        <Text style={s.section}>Menu</Text>
        {d.menu.length === 0 ? (
          <Text style={s.muted}>No menu items yet.</Text>
        ) : (
          d.menu.map((m) => (
            <View key={m.id} style={s.menuRow}>
              <Text style={s.body}>
                {m.isVeg ? '🌱 ' : ''}
                {m.name}
              </Text>
              <Text style={s.price}>
                {m.currency} {m.price}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

function ChipRow({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={s.eyebrow}>{title}</Text>
      <View style={s.chips}>
        {items.map((t) => (
          <View key={t} style={s.chip}>
            <Text style={s.chipText}>{t.replace(/_/g, ' ')}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={s.centered}>{children}</View>;
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fbf7f2' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fbf7f2' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontSize: 24, fontWeight: '800', color: '#211915', flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6, marginLeft: 8 },
  meta: { color: '#8c7d70', marginTop: 4 },
  fresh: { color: '#e0902b', marginTop: 6, fontWeight: '600', fontSize: 13 },
  body: { color: '#211915', marginTop: 10, fontSize: 15, flex: 1 },
  muted: { color: '#8c7d70', marginTop: 6 },
  section: { fontSize: 18, fontWeight: '700', color: '#211915', marginTop: 22, marginBottom: 8 },
  eyebrow: { textTransform: 'uppercase', fontSize: 11, fontWeight: '700', color: '#8c7d70', letterSpacing: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: { backgroundColor: '#f4ede4', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  chipText: { color: '#4b3f37', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  offer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d6482b', borderRadius: 12, padding: 12, marginBottom: 8 },
  offerTitle: { fontWeight: '700', color: '#211915' },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e9ddce' },
  price: { fontWeight: '700', color: '#211915' },
  err: { color: '#d6482b' },
});
