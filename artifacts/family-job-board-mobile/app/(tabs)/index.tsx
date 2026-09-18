import React from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Header } from '@/components/Header';
import { useGetDashboard, useGetCurrentUser, useStartJob, useCompleteJob } from '@workspace/api-client-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { getGetDashboardQueryKey, getListJobsQueryKey } from '@workspace/api-client-react';
import * as Haptics from 'expo-haptics';

export default function TodayScreen() {
  const colors = useColors();
  const { data: dashboard, isLoading, refetch, isRefetching } = useGetDashboard();
  const { data: userProfile } = useGetCurrentUser();
  const queryClient = useQueryClient();
  const startJob = useStartJob();
  const completeJob = useCompleteJob();
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const isChild = userProfile?.user.role === 'child';

  const handleStart = (jobId: string) => {
    startJob.mutate({ jobId }, {
      onSuccess: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
      }
    });
  };

  const handleComplete = (jobId: string) => {
    completeJob.mutate({ jobId }, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessMessage('Done! Sent to your parent for review.');
        setTimeout(() => setSuccessMessage(null), 2600);
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Today" />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {successMessage && (
          <View style={[styles.successBanner, { backgroundColor: colors.secondary }]}>
            <Feather name="check-circle" size={22} color={colors.secondaryForeground} />
            <Text style={[styles.successText, { color: colors.secondaryForeground }]}>{successMessage}</Text>
          </View>
        )}
        {dashboard && (
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={[styles.statValue, { color: colors.primaryForeground }]}>{dashboard.today.outstanding}</Text>
              <Text style={[styles.statLabel, { color: colors.primaryForeground }]}>Ready to go</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
              <Text style={[styles.statValue, { color: colors.accentForeground }]}>{dashboard.today.completed}</Text>
              <Text style={[styles.statLabel, { color: colors.accentForeground }]}>Crushed it</Text>
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
        
        {!dashboard?.recentJobs?.length && !isLoading && (
          <EmptyState
            icon={<Feather name="activity" size={32} color={colors.mutedForeground} />}
            title="No activity yet"
            description="Jobs will appear here as they are claimed and worked on."
          />
        )}

        {dashboard?.recentJobs?.map((job) => {
          const childId = userProfile?.user.childId;
          const isMyJob = isChild && Boolean(childId) &&
            (job.claimedByChildId === childId || job.assignedChildId === childId);
          
          return (
            <Card key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.jobTitle, { color: colors.foreground }]}>{job.title}</Text>
                  <Text style={[styles.jobChild, { color: colors.mutedForeground }]}>
                    {job.claimedByChildName || job.assignedChildName || 'Unassigned'}
                  </Text>
                </View>
                <View style={[styles.pointsBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.pointsText, { color: colors.accent }]}>{job.points} pts</Text>
                </View>
              </View>

              <View style={styles.jobFooter}>
                <Badge 
                  label={job.status.replace(/_/g, ' ').toUpperCase()} 
                  variant={job.status === 'completed' || job.status === 'ready_for_review' ? 'default' : 'secondary'}
                />
                
                {isMyJob && (
                  <View style={styles.actions}>
                    {job.status === 'claimed' && (
                      <Button 
                        label="Start" 
                        size="sm" 
                        onPress={() => handleStart(job.id)}
                        loading={startJob.isPending}
                      />
                    )}
                    {job.status === 'in_progress' && (
                      <Button 
                        label="Finish" 
                        size="sm" 
                        onPress={() => handleComplete(job.id)}
                        loading={completeJob.isPending}
                      />
                    )}
                    {job.status === 'changes_requested' && (
                      <Button 
                        label="Restart" 
                        size="sm" 
                        onPress={() => handleStart(job.id)}
                        loading={startJob.isPending}
                      />
                    )}
                  </View>
                )}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },
  jobCard: {
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  jobChild: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  pointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    marginBottom: 18,
  },
  successText: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
});
