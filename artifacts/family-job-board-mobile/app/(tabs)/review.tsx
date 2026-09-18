import React from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Modal } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Header } from '@/components/Header';
import { useGetCurrentUser, useListReviews, useReviewJob, getGetPointsQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { EmptyState } from '@/components/EmptyState';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { getListReviewsQueryKey, getGetDashboardQueryKey } from '@workspace/api-client-react';
import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';

export default function ReviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useGetCurrentUser();
  const isParent = profile?.user.role === 'parent';
  const { data: reviews, isLoading, refetch, isRefetching } = useListReviews({
    query: { enabled: isParent, queryKey: getListReviewsQueryKey() }
  });
  const queryClient = useQueryClient();
  const reviewJob = useReviewJob();
  const notCompletePlayer = useAudioPlayer(require('@/assets/not-complete-yet.mp3'));
  const [feedbackJobId, setFeedbackJobId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState('');

  React.useEffect(() => {
    if (!isProfileLoading && profile && !isParent) router.replace('/');
  }, [isParent, isProfileLoading, profile, router]);

  const handleReview = (jobId: string, action: 'approve' | 'request_changes' | 'reject', reason?: string) => {
    reviewJob.mutate({ 
      jobId, 
      data: { action, reason: reason?.trim() || undefined }
    }, {
      onSuccess: () => {
        if (action === 'request_changes') {
          notCompletePlayer.seekTo(0);
          notCompletePlayer.play();
        }
        setFeedbackJobId(null);
        setFeedback('');
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPointsQueryKey() });
      }
    });
  };

  if (isProfileLoading || !profile || !isParent) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Review Queue" />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {!reviews?.length && !isLoading && (
          <EmptyState
            icon={<Feather name="check-circle" size={32} color={colors.mutedForeground} />}
            title="All caught up!"
            description="There are no jobs waiting for review right now."
          />
        )}

        {reviews?.filter((review) => review.status === 'ready_for_review').map((review) => (
          <Card key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.jobTitle, { color: colors.foreground }]}>{review.jobTitle}</Text>
                <Text style={[styles.childName, { color: colors.mutedForeground }]}>
                  Completed by {review.childName}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Button 
                label="Approve" 
                variant="primary"
                onPress={() => handleReview(review.jobId, 'approve')}
                loading={reviewJob.isPending}
                style={styles.actionButton}
                icon={<Feather name="check" size={18} color={colors.primaryForeground} />}
              />
              <Button 
                label="Not Complete Yet"
                variant="outline"
                onPress={() => setFeedbackJobId(review.jobId)}
                loading={reviewJob.isPending}
                style={styles.actionButton}
                icon={<Feather name="rotate-ccw" size={18} color={colors.foreground} />}
              />
              <Button
                label="Reject"
                variant="destructive"
                onPress={() => handleReview(review.jobId, 'reject')}
                loading={reviewJob.isPending}
                style={styles.actionButton}
                icon={<Feather name="x" size={18} color={colors.destructiveForeground} />}
              />
            </View>
          </Card>
        ))}
      </ScrollView>

      <Modal
        visible={Boolean(feedbackJobId)}
        transparent
        animationType="slide"
        onRequestClose={() => setFeedbackJobId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Not Complete Yet</Text>
            <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
              Explain what needs fixing. The job stays with the same child.
            </Text>
            <Input
              label="Feedback"
              placeholder="What needs to be fixed?"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              testID="review-feedback-input"
            />
            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setFeedbackJobId(null)}
                style={styles.actionButton}
              />
              <Button
                label="Return Job"
                onPress={() => feedbackJobId && handleReview(feedbackJobId, 'request_changes', feedback)}
                disabled={!feedback.trim()}
                loading={reviewJob.isPending}
                style={styles.actionButton}
                testID="return-job-button"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  reviewCard: {
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginBottom: 4,
  },
  childName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexGrow: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalCard: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 16,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
  },
  modalDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
});
