import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';

interface Plan {
  id: 'plus' | 'pro' | 'expert';
  name: string;
  price: string;
  range: string;
  reservations: string;
  color: string;
  accent: string;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: 'plus',
    name: 'Plus',
    price: '4.99',
    range: '2 km radius',
    reservations: '5 reservations / month',
    color: '#F2F2F7',
    accent: '#6C63FF',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9.99',
    range: '10 km radius',
    reservations: '20 reservations / month',
    color: '#6C63FF',
    accent: '#fff',
    badge: 'Popular',
  },
  {
    id: 'expert',
    name: 'Expert',
    price: '19.99',
    range: 'Unlimited range',
    reservations: 'Unlimited reservations',
    color: '#2E26A3',
    accent: '#FFD700',
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SubscriptionModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>Choose a Plan</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.crown}>♛</Text>
          <Text style={styles.subtitle}>Unlock the full ParkinGo experience</Text>

          {PLANS.map((plan) => {
            const isPro = plan.id === 'pro';
            return (
              <View
                key={plan.id}
                style={[
                  styles.card,
                  { backgroundColor: plan.color },
                  isPro && styles.cardFeatured,
                ]}
              >
                {plan.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{plan.badge}</Text>
                  </View>
                )}

                <View style={styles.cardTop}>
                  <Text style={[styles.planName, { color: plan.accent }]}>{plan.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.currency, { color: plan.accent }]}>BGN</Text>
                    <Text style={[styles.price, { color: plan.accent }]}>{plan.price}</Text>
                    <Text style={[styles.period, { color: plan.accent, opacity: 0.7 }]}>/mo</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: plan.accent, opacity: 0.15 }]} />

                <View style={styles.features}>
                  <FeatureRow icon="📍" text={plan.range} accent={plan.accent} />
                  <FeatureRow icon="🅿️" text={plan.reservations} accent={plan.accent} />
                </View>

                <TouchableOpacity
                  style={[styles.selectButton, { borderColor: plan.accent }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.selectText, { color: plan.accent }]}>
                    Get {plan.name}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <Text style={styles.legal}>
            Plans renew monthly. Cancel anytime. Prices in BGN, VAT included.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function FeatureRow({ icon, text, accent }: { icon: string; text: string; accent: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[styles.featureText, { color: accent }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerLeft: { width: 32 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  closeButton: { width: 32, alignItems: 'flex-end' },
  closeText: { fontSize: 16, color: '#8E8E93' },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  crown: { fontSize: 48, marginBottom: 8 },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 28,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardFeatured: {
    shadowColor: '#6C63FF',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD700',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1C1C1E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTop: { marginBottom: 16 },
  planName: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  currency: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  price: { fontSize: 36, fontWeight: '800', lineHeight: 40 },
  period: { fontSize: 14, fontWeight: '500', marginBottom: 5 },
  divider: { width: '100%', height: 1, marginBottom: 16 },
  features: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { fontSize: 16 },
  featureText: { fontSize: 14, fontWeight: '500' },
  selectButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  selectText: { fontSize: 15, fontWeight: '700' },
  legal: {
    fontSize: 12,
    color: '#C7C7CC',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
