import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Header } from '@/components/Header';
import { useListJobs, useClaimJob, useGetCurrentUser, useStartJob } from '@workspace/api-client-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { getListJobsQueryKey, getGetDashboardQueryKey } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';

export default function BoardScreen() {
  const colors = useColors();
  const { data: jobs, isLoading, refetch, isRefetching } = useListJobs();
  const { data: userProfile } = useGetCurrentUser();
  const queryClient = useQueryClient();
  const claimJob = useClaimJob();
  const startJob = useStartJob();
  const router = useRouter();

  const isChild = userProfile?.user.role === 'child';
  const isParent = userProfile?.user.role === 'parent';

  const handleClaim = (jobId: string) => {
    claimJob.mutate({ jobId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      }
    });
  };

  const handleStart = (jobId: string) => {
    startJob.mutate({ jobId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      }
    });
  };

  const availableJobs = jobs?.filter(j => j.status === 'to_do') || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Job Board" 
        rightAction={
          isParent ? (
            <Button 
              size="sm" 
              label="New Job" 
              onPress={() => router.push('/job/new')} 
            />
          ) : null
        }
      />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {!availableJobs.length && !isLoading && (
          <EmptyState
            icon={<Feather name="clipboard" size={32} color={colors.mutedForeground} />}
            title="No jobs available"
            description={isParent ? "Create some jobs for your children to claim." : "Check back later for new opportunities to earn points."}
          />
        )}

        {availableJobs.map((job) => (
          <Card key={job.id} style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.jobTitle, { color: colors.foreground }]}>{job.title}</Text>
                {job.description ? (
                  <Text style={[styles.jobDescription, { color: colors.mutedForeground }]}>
                    {job.description}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.pointsBadge, { backgroundColor: `${colors.accent}15` }]}>
                <Text style={[styles.pointsText, { color: colors.accent }]}>{job.points} pts</Text>
              </View>
            </View>

            <View style={styles.jobFooter}>
              <Badge 
                label={job.type === 'board' ? 'Open to anyone' : 'Assigned'} 
                variant="outline"
              />
              
              {isChild && job.type === 'board' && (
                <Button 
                  label="Claim Job" 
                  size="sm" 
                  onPress={() => handleClaim(job.id)}
                  loading={claimJob.isPending}
                />
              )}
              {isChild && job.type === 'assigned' && job.assignedChildId === userProfile.user.childId && (
                <Button
                  label="Start Job"
                  size="sm"
                  onPress={() => handleStart(job.id)}
                  loading={startJob.isPending}
                />
              )}
            </View>
          </Card>
        ))}
      </ScrollView>
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
  jobDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginTop: 4,
  },
  pointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  pointsText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
});
