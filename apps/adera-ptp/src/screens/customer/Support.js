import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeArea, AppBar, Card, Button, TextInput, useTheme } from '@adera/ui';
import { supabase, useAuth } from '@adera/auth';

const QUICK_TOPICS = [
  { id: 'missing', label: 'Missing parcel', icon: 'package-variant-closed-remove' },
  { id: 'damaged', label: 'Damaged item', icon: 'package-variant' },
  { id: 'payment', label: 'Payment issue', icon: 'credit-card-refund' },
  { id: 'other', label: 'Something else', icon: 'dots-horizontal' },
];

const FAQS = [
  {
    id: 'track',
    question: 'How do I track my parcel?',
    answer:
      'Open the Track tab and enter your tracking ID (e.g. ADE20250110-3). You will see live status updates as the parcel moves through our hubs.',
  },
  {
    id: 'payment-methods',
    question: 'Which payment methods are supported?',
    answer:
      'You can pay with cash on drop-off (COD), your Adera Wallet balance, or any card / mobile money through Chapa.',
  },
  {
    id: 'cancel',
    question: 'Can I cancel a parcel?',
    answer:
      'Parcels can be cancelled for free while status is "Created". After drop-off, contact concierge support and we will attempt retrieval for a small fee.',
  },
];

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
});

/**
 * Support — customer concierge screen.
 *
 * Messages are written to the notifications table with type='support', which
 * is exactly the queue the staff Support screen reads and answers from, so a
 * submitted request shows up for staff without any extra wiring.
 */
const Support = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();

  const [topic, setTopic] = useState('other');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  const fetchMyTickets = useCallback(async () => {
    if (!user?.id) return;
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, created_at, read_at')
        .eq('user_id', user.id)
        .eq('type', 'support')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setMyTickets(data);
      } else {
        setMyTickets([]);
      }
    } catch (_e) {
      setMyTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => fetchMyTickets(), 0);
    return () => clearTimeout(timer);
  }, [fetchMyTickets]);

  const handleSubmit = useCallback(async () => {
    const text = message.trim();
    if (!text) {
      Alert.alert('Message required', 'Tell us what happened and we will get back to you.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to contact support.');
      return;
    }

    setSending(true);
    try {
      const topicLabel = QUICK_TOPICS.find((t) => t.id === topic)?.label || 'Support request';
      const { error } = await supabase.from('notifications').insert([
        {
          user_id: user.id,
          title: `Support: ${topicLabel}`,
          body: text,
          type: 'support',
        },
      ]);

      if (error) throw error;

      setMessage('');
      Alert.alert(
        'Message sent',
        'Our concierge team has received your request and will reply here and by email within a few hours.'
      );
      fetchMyTickets();
    } catch (error) {
      console.error('[Support] Submit error:', error);
      Alert.alert(
        'Could not send',
        error?.message || 'Something went wrong while sending your message. Please try again.'
      );
    } finally {
      setSending(false);
    }
  }, [message, topic, user, fetchMyTickets]);

  const renderComposer = () => (
    <Card style={styles.card} elevation={1}>
      <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>How can we help?</Text>
      <Text style={[styles.cardCaption, { color: theme.colors.onSurfaceVariant }]}>
        Pick a topic and describe the issue — concierge replies within a few hours, 24/7.
      </Text>

      <View style={styles.topicRow}>
        {QUICK_TOPICS.map((item) => {
          const isActive = topic === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.topicChip,
                {
                  backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceVariant,
                },
              ]}
              onPress={() => setTopic(item.id)}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={16}
                color={isActive ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.topicText,
                  { color: isActive ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        label="Describe your issue"
        value={message}
        onChangeText={setMessage}
        placeholder="e.g. Parcel ADE20250110-3 shows delivered but I never received it"
        multiline
        numberOfLines={4}
        style={styles.messageInput}
      />

      <Button
        title="Send to Concierge"
        onPress={handleSubmit}
        loading={sending}
        disabled={sending || !message.trim()}
        leftIcon="send"
      />
    </Card>
  );

  const renderTickets = () => (
    <Card style={styles.card} elevation={1}>
      <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Your recent requests</Text>
      {myTickets.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          {loadingTickets ? 'Loading…' : 'No requests yet. We hope you never need us — but we are here 24/7.'}
        </Text>
      ) : (
        myTickets.map((ticket) => (
          <View
            key={ticket.id}
            style={[styles.ticketRow, { borderTopColor: theme.colors.outlineVariant }]}
          >
            <View style={styles.ticketHeader}>
              <Text style={[styles.ticketTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {ticket.title || 'Support request'}
              </Text>
              <View
                style={[
                  styles.ticketStatus,
                  { backgroundColor: ticket.read_at ? '#E8F5E9' : theme.colors.secondaryContainer },
                ]}
              >
                <Text
                  style={[
                    styles.ticketStatusText,
                    { color: ticket.read_at ? '#2E7D32' : theme.colors.onSecondaryContainer },
                  ]}
                >
                  {ticket.read_at ? 'Answered' : 'Open'}
                </Text>
              </View>
            </View>
            <Text
              style={[styles.ticketBody, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {ticket.body}
            </Text>
            <Text style={[styles.ticketDate, { color: theme.colors.onSurfaceVariant }]}>
              {formatDateTime(ticket.created_at)}
            </Text>
          </View>
        ))
      )}
    </Card>
  );

  const renderFaq = () => (
    <Card style={styles.card} elevation={1}>
      <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Quick answers</Text>
      {FAQS.map((faq) => {
        const isOpen = openFaq === faq.id;
        return (
          <TouchableOpacity
            key={faq.id}
            style={[styles.faqRow, { borderTopColor: theme.colors.outlineVariant }]}
            onPress={() => setOpenFaq(isOpen ? null : faq.id)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQuestion, { color: theme.colors.onSurface }]}>{faq.question}</Text>
              <MaterialCommunityIcons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
            {isOpen && (
              <Text style={[styles.faqAnswer, { color: theme.colors.onSurfaceVariant }]}>
                {faq.answer}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </Card>
  );

  return (
    <SafeArea edges={['top', 'bottom']}>
      <AppBar title="Support" onBack={() => navigation?.goBack?.()} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderComposer()}
        {renderTickets()}
        {renderFaq()}
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  card: { padding: 18, borderRadius: 18, gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardCaption: { fontSize: 13, lineHeight: 18 },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  topicText: { fontSize: 13, fontWeight: '600' },
  messageInput: { minHeight: 96 },
  emptyText: { fontSize: 14, lineHeight: 20 },
  ticketRow: { borderTopWidth: 1, borderTopStyle: 'solid', paddingTop: 12, gap: 4 },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  ticketTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  ticketStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  ticketStatusText: { fontSize: 11, fontWeight: '600' },
  ticketBody: { fontSize: 13, lineHeight: 18 },
  ticketDate: { fontSize: 12 },
  faqRow: { borderTopWidth: 1, borderTopStyle: 'solid', paddingVertical: 12, gap: 6 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  faqQuestion: { fontSize: 14, fontWeight: '600', flex: 1 },
  faqAnswer: { fontSize: 13, lineHeight: 20 },
});

export default Support;
