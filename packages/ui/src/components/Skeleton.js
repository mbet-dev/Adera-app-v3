import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../ThemeProvider';

/**
 * Base pulsing skeleton block. Pure RN Animated — no reanimated dependency.
 */
export const SkeletonBlock = ({ width = '100%', height = 16, radius = 8, style }) => {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityLabel="Loading"
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: theme.colors.surfaceContainerHigh || theme.colors.surfaceContainer,
          opacity,
        },
        style,
      ]}
    />
  );
};

/** Multi-line text skeleton. */
export const SkeletonText = ({ lines = 3, widths, gap = 8, lineHeight = 14 }) => {
  const resolved = widths || Array.from({ length: lines }, (_, i) => (i === lines - 1 ? '60%' : '100%'));
  return (
    <View style={{ gap }}>
      {resolved.map((w, i) => (
        <SkeletonBlock key={i} width={w} height={lineHeight} radius={6} />
      ))}
    </View>
  );
};

/** Card-shaped skeleton with a title bar and text lines. */
export const SkeletonCard = ({ lines = 2, style, padding = 18 }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surfaceContainer,
          borderRadius: 18,
          padding,
          gap: 10,
        },
        style,
      ]}
    >
      <SkeletonBlock width="45%" height={16} />
      <SkeletonText lines={lines} lineHeight={12} />
    </View>
  );
};

/** Dashboard-shaped skeleton: greeting, wallet card, quick tiles, stats, parcel cards. */
export const DashboardSkeleton = () => {
  const theme = useTheme();
  return (
    <View style={{ gap: 24, paddingTop: 16 }}>
      {/* Greeting row */}
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBlock width="50%" height={20} />
          <SkeletonBlock width="70%" height={13} />
        </View>
        <SkeletonBlock width={44} height={44} radius={22} />
      </View>

      {/* Wallet card */}
      <View style={[styles.wallet, { backgroundColor: theme.gradients.wallet[0] }]}>
        <View style={styles.row}>
          <View style={{ gap: 6 }}>
            <SkeletonBlock width={110} height={15} radius={6} style={{ backgroundColor: 'rgba(255,255,255,0.35)' }} />
            <SkeletonBlock width={160} height={11} radius={6} style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
          </View>
          <SkeletonBlock width={28} height={28} radius={14} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
        </View>
        <SkeletonBlock
          width={150}
          height={30}
          radius={8}
          style={{ backgroundColor: 'rgba(255,255,255,0.35)', marginTop: 14 }}
        />
        <View style={[styles.row, { marginTop: 16, gap: 10 }]}>
          {[0, 1, 2].map((i) => (
            <SkeletonBlock
              key={i}
              width={92}
              height={32}
              radius={14}
              style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
            />
          ))}
        </View>
      </View>

      {/* Quick actions */}
      <View style={{ gap: 12 }}>
        <SkeletonBlock width={130} height={18} />
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} height={84} radius={18} style={{ flexBasis: '47%' }} />
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={{ gap: 12 }}>
        <SkeletonBlock width={120} height={18} />
        <View style={styles.grid}>
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} height={92} radius={16} style={{ flexBasis: '30%' }} />
          ))}
        </View>
      </View>

      {/* Parcel cards */}
      <View style={{ gap: 12 }}>
        <SkeletonBlock width={140} height={18} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </View>
    </View>
  );
};

/** Parcel list skeleton (history / recent parcels). */
export const ParcelListSkeleton = ({ count = 3 }) => (
  <View style={{ gap: 14 }}>
    {Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={i} lines={3} />
    ))}
  </View>
);

/** Two-column product grid skeleton (Market discovery). */
export const ProductGridSkeleton = ({ count = 6 }) => {
  const theme = useTheme();
  return (
    <View style={[styles.productGrid, { backgroundColor: theme.colors.background }]}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.productCard,
            { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outlineVariant },
          ]}
        >
          <SkeletonBlock height={120} radius={0} />
          <View style={{ padding: 10, gap: 8 }}>
            <SkeletonBlock width="90%" height={14} />
            <SkeletonBlock width="60%" height={12} />
            <SkeletonBlock width="40%" height={16} />
          </View>
        </View>
      ))}
    </View>
  );
};

/** Product detail skeleton: gallery, title, price, action buttons. */
export const ProductDetailSkeleton = () => {
  const theme = useTheme();
  return (
    <View style={{ gap: 18 }}>
      <SkeletonBlock height={260} radius={16} />
      <View style={{ gap: 10 }}>
        <SkeletonBlock width="80%" height={24} />
        <View style={styles.row}>
          <SkeletonBlock width={110} height={26} />
          <SkeletonBlock width={70} height={18} />
        </View>
      </View>
      <SkeletonText lines={4} lineHeight={13} />
      <View style={[styles.row, { gap: 12 }]}>
        <SkeletonBlock height={52} radius={14} style={{ flex: 1 }} />
        <SkeletonBlock height={52} radius={14} style={{ flex: 1 }} />
      </View>
      <SkeletonBlock width="35%" height={18} />
      <SkeletonCard lines={2} />
      <View style={{ backgroundColor: theme.colors.surfaceContainer, borderRadius: 18, padding: 18, gap: 10 }}>
        <SkeletonBlock width="50%" height={16} />
        <SkeletonBlock width="80%" height={13} />
        <SkeletonBlock width="70%" height={13} />
      </View>
    </View>
  );
};

/** Order list skeleton (order history). */
export const OrderListSkeleton = ({ count = 3 }) => (
  <View style={{ gap: 14 }}>
    {Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={i} lines={3} />
    ))}
  </View>
);

/** Tracking result skeleton: timeline card with event rows. */
export const TrackResultSkeleton = () => {
  const theme = useTheme();
  return (
    <View style={{ gap: 14 }}>
      <View style={{ backgroundColor: theme.colors.surfaceContainer, borderRadius: 18, padding: 18, gap: 12 }}>
        <View style={styles.row}>
          <SkeletonBlock width="45%" height={18} />
          <SkeletonBlock width={86} height={24} radius={12} />
        </View>
        <SkeletonText lines={2} lineHeight={13} />
        <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant, marginVertical: 4 }} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.row}>
            <SkeletonBlock width={34} height={34} radius={17} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBlock width="55%" height={13} />
              <SkeletonBlock width="35%" height={11} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  wallet: { borderRadius: 20, padding: 22 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, paddingTop: 8 },
  productCard: { width: '48%', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
});

export default SkeletonBlock;
