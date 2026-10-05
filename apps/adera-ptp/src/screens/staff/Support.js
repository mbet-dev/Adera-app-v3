import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea, useTheme } from '@adera/ui';
import { supabase } from '@adera/auth';

/**
 * Support — staff ticket queue backed by the notifications table
 * (support requests land there as type='support' in-app messages until a
 * dedicated tickets table ships). Includes an inline "Broadcast notice"
 * composer that pushes an announcement to every user — a real staff action.
 */
const Support = () => {
  const theme = useTheme();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcast, setBroadcast] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const loadTickets = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, created_at, read_at, user_id')
        .eq('type', 'support')
        .order('created_at', { ascending: false })
        .limit(30);
      if (!error && data) {
        setTickets(data);
      } else {
        setTickets([]);
      }
    } catch (e) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const priorityOf = (createdAt) => {
    const hours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
    if (hours > 24) return { label: 'High', color: '#F44336' };
    if (hours > 6) return { label: 'Medium', color: '#FF9800' };
    return { label: 'Low', color: '#4CAF50' };
  };

  const sendBroadcast = async () => {
    const text = broadcast.trim();
    if (!text || sending) return;
    setSending(true);
    setSent(false);
    try {
      const { data: users, error } = await supabase.from('users').select('id').limit(1000);
      if (!error && users && users.length > 0) {
        const rows = users.map((u) => ({
          user_id: u.id,
          title: 'Adera Notice',
          body: text,
          type: 'broadcast',
        }));
        await supabase.from('notifications').insert(rows);
      }
      setBroadcast('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (e) {
      // keep the composer open on failure
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeArea style={styles.container} withBottomNav>
      <AppBar title="Support Tickets" subtitle={`${tickets.length} open`} />

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        <Card style={styles.broadcastCard}>
          <Text variant="titleMedium" style={styles.broadcastTitle}>
            Broadcast Notice
          </Text>
          <Text variant="bodySmall" style={[styles.broadcastHint, { color: theme.colors.text.secondary }]}>
            Send an announcement to all Adera users.
          </Text>
          <TextInput
            value={broadcast}
            onChangeText={setBroadcast}
            placeholder="e.g. Scheduled maintenance tonight 02:00–03:00 EAT"
            placeholderTextColor={theme.colors.text.disabled}
            multiline
            style={[styles.broadcastInput, { borderColor: theme.colors.outline, color: theme.colors.text.primary }]}
          />
          <TouchableOpacity
            onPress={sendBroadcast}
            disabled={sending || !broadcast.trim()}
            style={[
              styles.broadcastButton,
              { backgroundColor: theme.colors.primary, opacity: sending || !broadcast.trim() ? 0.5 : 1 },
            ]}
          >
            <Text style={styles.broadcastButtonText}>{sending ? 'Sending…' : sent ? 'Sent ✓' : 'Send to all users'}</Text>
          </TouchableOpacity>
        </Card>

        <Text variant="titleLarge" style={styles.title}>
          Open Tickets
        </Text>

        {tickets.map((ticket) => {
          const p = priorityOf(ticket.created_at);
          return (
            <Card key={ticket.id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text variant="titleMedium" style={styles.ticketTitle} numberOfLines={1}>
                  {ticket.title || 'Support request'}
                </Text>
                <Text variant="bodySmall" style={[styles.priority, { color: p.color }]}>
                  {p.label}
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.issue} numberOfLines={3}>
                {ticket.body}
              </Text>
              <Text variant="bodySmall" style={[styles.time, { color: theme.colors.text.secondary }]}>
                {new Date(ticket.created_at).toLocaleString()}
                {ticket.read_at ? ' · read' : ' · unread'}
              </Text>
            </Card>
          );
        })}

        {!loading && tickets.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
              No open support tickets.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  broadcastCard: { padding: 16, marginBottom: 20, borderRadius: 16 },
  broadcastTitle: { fontWeight: '600', marginBottom: 4 },
  broadcastHint: { marginBottom: 10 },
  broadcastInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 64,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  broadcastButton: { borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  broadcastButtonText: { color: '#fff', fontWeight: '700' },
  title: { fontWeight: 'bold', marginBottom: 12 },
  ticketCard: { padding: 16, marginBottom: 8, borderRadius: 14 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ticketTitle: { flex: 1, fontWeight: '600', marginRight: 8 },
  priority: { fontWeight: '700' },
  issue: { marginBottom: 6 },
  time: {},
  emptyCard: { padding: 28, borderRadius: 14 },
});

export default Support;
