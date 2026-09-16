import React, { useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@adera/ui';
import { AppBottomNavigation } from '@adera/ui';
import useCartStore from '../../../adera-shop/store/cartStore';

// Import Shop screens — all self-contained, no PTP screens
import MarketDiscoveryScreen from '../../../adera-shop/screens/MarketDiscoveryScreen';
import ProductDetailScreen from '../../../adera-shop/screens/ProductDetailScreen';
import ShoppingCartScreen from '../../../adera-shop/screens/ShoppingCartScreen';
import OrderHistoryScreen from '../../../adera-shop/screens/OrderHistoryScreen';
import ShopProfile from '../screens/shop/ShopProfile';

const ShopStack = createNativeStackNavigator();

/**
 * Shop content rendered as a tab screen within the NativeStack.
 * Contains the bottom tab navigator with browse/cart/orders/profile tabs.
 */
function ShopTabs({ navigation }) {
  const theme = useTheme();
  const cartItems = useCartStore((s) => s.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const routes = [
    { key: 'browse', title: 'Browse', focusedIcon: 'storefront', unfocusedIcon: 'storefront-outline' },
    { key: 'cart', title: 'Cart', focusedIcon: 'cart', unfocusedIcon: 'cart-outline', badge: cartCount > 0 ? cartCount : undefined },
    { key: 'orders', title: 'Orders', focusedIcon: 'receipt', unfocusedIcon: 'receipt-outline' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
  ];

  const getInitialIndex = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const routeIndex = routes.findIndex((route) => route.key === hash);
        if (routeIndex >= 0) return routeIndex;
      }
    }
    return 0;
  };

  const [index, setIndex] = useState(getInitialIndex);

  const renderScene = ({ route, jumpTo }) => {
    switch (route.key) {
      case 'browse':
        return (
          <MarketDiscoveryScreen
            navigation={{
              navigate: (screen, params) => {
                if (screen === 'productDetail') {
                  navigation.navigate('productDetail', params);
                } else {
                  jumpTo(screen);
                }
              },
              goBack: () => {},
            }}
          />
        );
      case 'cart':
        return (
          <ShoppingCartScreen
            navigation={{
              navigate: (screen) => {
                // 'orderHistory' from old screens, 'orders' from new tab key
                if (screen === 'orderHistory' || screen === 'orders') {
                  jumpTo('orders');
                } else {
                  jumpTo(screen);
                }
              },
              goBack: () => jumpTo('browse'),
            }}
          />
        );
      case 'orders':
        return (
          <OrderHistoryScreen
            navigation={{
              navigate: (screen) => jumpTo(screen),
              goBack: () => jumpTo('browse'),
            }}
          />
        );
      case 'profile':
        return (
          <ShopProfile
            navigation={{
              navigate: (screen) => jumpTo(screen),
              goBack: () => jumpTo('browse'),
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppBottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
}

/**
 * Dedicated Shop Navigator with bottom tabs.
 * Completely independent from PTP navigation.
 *
 * Uses a NativeStack so that ProductDetailScreen can be pushed
 * on top of the tab bar from the Browse tab.
 */
const ShopNavigator = () => {
  return (
    <View style={styles.container}>
      <ShopStack.Navigator screenOptions={{ headerShown: false }}>
        <ShopStack.Screen name="ShopTabs" component={ShopTabs} />
        <ShopStack.Screen name="productDetail" component={ProductDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </ShopStack.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default ShopNavigator;
