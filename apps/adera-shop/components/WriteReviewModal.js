import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WriteReviewModal = ({ visible, onClose, onSubmit, existingReview, submitting }) => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (visible) {
      setRating(existingReview?.rating || 0);
      setComment(existingReview?.comment || '');
    }
  }, [visible, existingReview]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }
    const success = await onSubmit(rating, comment);
    if (success) {
      onClose();
    } else {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    }
  };

  const displayRating = hoverRating || rating;

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            {existingReview ? 'Edit Review' : 'Write a Review'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Star Rating */}
          <View style={styles.ratingSection}>
            <Text style={[styles.ratingLabel, { color: theme.colors.text.primary }]}>Your Rating</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  onPressIn={() => setHoverRating(star)}
                  onPressOut={() => setHoverRating(0)}
                  style={styles.starBtn}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={star <= displayRating ? 'star' : 'star-outline'}
                    size={44}
                    color={star <= displayRating ? '#FFB300' : theme.colors.outline}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {displayRating > 0 && (
              <Text style={[styles.ratingText, { color: theme.colors.primary }]}>
                {ratingLabels[displayRating]}
              </Text>
            )}
          </View>

          {/* Comment */}
          <View style={styles.commentSection}>
            <Text style={[styles.commentLabel, { color: theme.colors.text.primary }]}>Your Review (Optional)</Text>
            <TextInput
              style={[
                styles.commentInput,
                {
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.surfaceContainer,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
              placeholder="Share your experience with this product..."
              placeholderTextColor={theme.colors.text.secondary}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: theme.colors.text.secondary }]}>
              {comment.length}/500
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor: rating > 0 ? theme.colors.primary : theme.colors.surfaceVariant,
                opacity: submitting ? 0.6 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={[
                  styles.submitText,
                  { color: rating > 0 ? '#fff' : theme.colors.text.secondary },
                ]}
              >
                {existingReview ? 'Update Review' : 'Submit Review'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { flex: 1, padding: 20, gap: 32 },
  ratingSection: { alignItems: 'center', gap: 12 },
  ratingLabel: { fontSize: 18, fontWeight: '700' },
  starsRow: { flexDirection: 'row', gap: 8 },
  starBtn: { padding: 4 },
  ratingText: { fontSize: 16, fontWeight: '700' },
  commentSection: { gap: 8 },
  commentLabel: { fontSize: 16, fontWeight: '700' },
  commentInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    minHeight: 140,
    lineHeight: 22,
  },
  charCount: { fontSize: 12, textAlign: 'right' },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  submitText: { fontSize: 16, fontWeight: '700' },
});

export default WriteReviewModal;
