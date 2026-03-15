import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions, Platform
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

function FloatingCircle({ size, color, x, y, opacity = 0.4 }: { size: number; color: string; x: number; y: number; opacity?: number; delay?: number }) {
  return (
    <View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        left: x,
        top: y,
        opacity,
      }}
    />
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon as any} size={20} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const cardsOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    titleY.value = withDelay(200, withTiming(0, { duration: 600 }));
    subtitleOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    cardsOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    buttonsOpacity.value = withDelay(1100, withTiming(1, { duration: 600 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const cardsStyle = useAnimatedStyle(() => ({ opacity: cardsOpacity.value }));
  const buttonsStyle = useAnimatedStyle(() => ({ opacity: buttonsOpacity.value }));

  return (
    <LinearGradient
      colors={['#1A0533', '#3B0764', '#6B21A8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}
    >
      <FloatingCircle size={120} color="rgba(168,85,247,0.15)" delay={0} x={-30} y={80} />
      <FloatingCircle size={80} color="rgba(192,132,252,0.1)" delay={500} x={width - 60} y={160} />
      <FloatingCircle size={60} color="rgba(216,180,254,0.12)" delay={1000} x={width / 2 - 30} y={20} />
      <FloatingCircle size={100} color="rgba(147,51,234,0.1)" delay={300} x={width - 80} y={height * 0.3} />

      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="bird" size={28} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.logoText}>PHOENIX</Text>
            <Text style={styles.logoSubText}>LOAN SERVICES</Text>
          </View>
        </View>
      </View>

      <Animated.View style={[styles.heroSection, titleStyle]}>
        <Text style={styles.heroHeadline}>Fast Cash{'\n'}When You{'\n'}Need It Most</Text>
      </Animated.View>

      <Animated.View style={[styles.heroSub, subtitleStyle]}>
        <Text style={styles.heroSubText}>
          Malawi's trusted digital lender. Get loans in minutes, repay with ease.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.rateCards, cardsStyle]}>
        <View style={styles.rateHeader}>
          <View style={styles.rateBadge}>
            <Text style={styles.rateBadgeText}>Our Interest Rates</Text>
          </View>
        </View>
        <View style={styles.rateGrid}>
          {[
            { weeks: '1 Week', rate: '20%' },
            { weeks: '2 Weeks', rate: '30%' },
            { weeks: '3 Weeks', rate: '40%' },
            { weeks: '4 Weeks', rate: '50%' },
          ].map((r) => (
            <View key={r.weeks} style={styles.rateItem}>
              <Text style={styles.rateWeek}>{r.weeks}</Text>
              <Text style={styles.ratePercent}>{r.rate}</Text>
            </View>
          ))}
        </View>
        <View style={styles.collateralBanner}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.accent} />
          <Text style={styles.collateralText}>Collateral Required for All Loans</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.buttons, buttonsStyle]}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/auth/register');
          }}
        >
          <LinearGradient
            colors={['#A855F7', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </LinearGradient>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/auth/login');
          }}
        >
          <Text style={styles.secondaryBtnText}>Already have an account? </Text>
          <Text style={styles.secondaryBtnLink}>Sign In</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.contactRow}>
        <Ionicons name="call" size={14} color={Colors.textMuted} />
        <Text style={styles.contactText}>+265 (0) 997 971 750  ·  +265 (0) 894 741 508</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 16,
    marginBottom: 32,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(168,85,247,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.5)',
  },
  logoText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 2,
  },
  logoSubText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'DMSans_400Regular',
    letterSpacing: 1.5,
  },
  heroSection: {
    marginBottom: 12,
  },
  heroHeadline: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'DMSans_700Bold',
    lineHeight: 50,
  },
  heroSub: {
    marginBottom: 24,
  },
  heroSubText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: 'DMSans_400Regular',
    lineHeight: 22,
  },
  rateCards: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  rateHeader: {
    marginBottom: 12,
  },
  rateBadge: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rateBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.5,
  },
  rateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  rateItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateWeek: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  ratePercent: {
    color: Colors.accent,
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  collateralBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(168,85,247,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  collateralText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  buttons: {
    gap: 12,
    marginBottom: 16,
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
  },
  secondaryBtnLink: {
    color: Colors.accent,
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statValue: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  contactText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
  },
});
