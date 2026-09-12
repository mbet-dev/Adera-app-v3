import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@adera/auth/src/supabase';

const NOTIF_ICONS = {
  parcel_update: 'package-variant',
  order_update: 'shopping',
  payment: 'credit-card',
  promo: 'tag',
  system: 'information',
};

/**
 * Full-featured notification bell with real-time Supabase subscription.
 * Shows unread count badge, opens a notification panel modal.
 */
const NotificationBell = ({ size = 24, color }) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const bellColor = color || theme.colors.text.primary;
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const channelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, type, reference_id, reference_type, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.is_read).length);
    } catch (err) {
      console.error('[Shop:NotificationBell] Fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        channelRef.current = supabase
          .channel(`shop-notif:${user.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            (payload) => {
              if (!mounted) return;
              setNotifications((prev) => [payload.new, ...prev].slice(0, 30));
              setUnreadCount((prev) => prev + 1);
            },
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            (payload) => {
              if (!mounted) return;
              setNotifications((prev) => prev.map((n) => (n.id === payload.new.id ? { ...n, ...payload.new } : n)));
              setUnreadCount((prev) => Math.max(0, prev - (payload.new.is_read ? 1 : 0)));
            },
          )
          .subscribe();
      } catch {}
    };
    setup();
    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const markAsRead = useCallback(async (notifId) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notifId);
      setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', user.id).eq('is_read', false);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderNotification = ({ item }) => {
    const icon = NOTIF_ICONS[item.type] || 'bell';
    const timeAgo = getTimeAgo(item.created_at);
    return (
      <TouchableOpacity
        style={[styles.notifItem, { backgroundColor: item.is_read ? 'transparent' : theme.colors.primaryContainer + '15', borderBottomColor: theme.colors.outlineVariant }]}
        onPress={() => markAsRead(item.id)}
      >
        <View style={[styles.notifIconWrap, { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialCommunityIcons name={icon} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.notifBody, { color: theme.colors.text.secondary }]} numberOfLines={2}>{item.body}</Text>
          <Text style={[styles.notifTime, { color: theme.colors.text.secondary }]}>{timeAgo}</Text>
        </View>
        {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity style={styles.bellBtn} onPress={() => setShowPanel(true)}>
        <MaterialCommunityIcons name="bell-outline" size={size} color={bellColor} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={showPanel} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPanel(false)}>
        <View style={[styles.panelContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.panelHeader, { borderBottomColor: theme.colors.outlineVariant }]}>
            <TouchableOpacity onPress={() => setShowPanel(false)} style={styles.panelHeaderBtn}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.panelTitle, { color: theme.colors.text.primary }]}>Notifications</Text>
            {unreadCount > 0 ? (
              <TouchableOpacity onPress={markAllAsRead}>
                <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 14 }}>Mark all read</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 100 }} />
            )}
          </View>

          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={styles.notifList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.notifEmpty}>
                <MaterialCommunityIcons name="bell-off-outline" size={48} color={theme.colors.text.secondary} />
                <Text style={[styles.notifEmptyText, { color: theme.colors.text.secondary }]}>No notifications yet</Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => { setRefreshing(true); await fetchNotifications(); setRefreshing(false); }}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bellBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: '#F44336', borderRadius: 10, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  panelContainer: { flex: 1 },
  panelHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  panelHeaderBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  panelTitle: { fontSize: 17, fontWeight: '700' },
  notifList: { paddingBottom: 40 },
  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  notifIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  notifContent: { flex: 1, gap: 3 },
  notifTitle: { fontSize: 14, fontWeight: '700' },
  notifBody: { fontSize: 13, lineHeight: 18 },
  notifTime: { fontSize: 11, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  notifEmpty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  notifEmptyText: { fontSize: 15, fontWeight: '600' },
});

export default NotificationBell;
