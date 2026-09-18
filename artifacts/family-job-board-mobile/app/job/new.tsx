import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useCreateJob, useGetCurrentUser, useListChildren } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListChildrenQueryKey, getListJobsQueryKey } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

export default function NewJobScreen() {
  const colors = useColors();
  const router = useRouter();
  const createJob = useCreateJob();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: isProfileLoading } = useGetCurrentUser();
  const isParent = profile?.user.role === 'parent';
  const { data: children } = useListChildren({
    query: { enabled: isParent, queryKey: getListChildrenQueryKey() }
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('10');
  const [isAssigned, setIsAssigned] = useState(false);
  const [assignedChildId, setAssignedChildId] = useState<string | null>(null);
  const [dailyRuns, setDailyRuns] = useState<1 | 2>(1);

  React.useEffect(() => {
    if (!isProfileLoading && profile && !isParent) router.replace('/');
  }, [isParent, isProfileLoading, profile, router]);

  const handleSubmit = () => {
    createJob.mutate({
      data: {
        title,
        description: description || null,
        points: parseInt(points, 10) || 10,
        type: isAssigned && assignedChildId ? 'assigned' : 'board',
        assignedChildId: isAssigned ? assignedChildId : null,
        dailyRuns: isAssigned ? 1 : dailyRuns,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        router.back();
      }
    });
  };

  if (isProfileLoading || !profile || !isParent) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Create Job" 
        rightAction={
          <Button 
            variant="ghost" 
            label="Cancel" 
            onPress={() => router.back()} 
          />
        }
      />
      
      <KeyboardAwareScrollViewCompat 
        contentContainerStyle={styles.content}
        bottomOffset={20}
      >
        <Input
          label="Job Title"
          placeholder="e.g. Empty dishwasher"
          value={title}
          onChangeText={setTitle}
        />
        
        <Input
          label="Description (Optional)"
          placeholder="Add details..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }}
        />

        <Input
          label="Points Value"
          placeholder="10"
          value={points}
          onChangeText={setPoints}
          keyboardType="numeric"
        />

        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, { color: colors.foreground }]}>Assign to specific child</Text>
          <Switch 
            value={isAssigned}
            onValueChange={setIsAssigned}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>

        {isAssigned && (
          <View style={styles.childrenList}>
            {children?.map(child => (
              <Button
                key={child.id}
                label={child.name}
                variant={assignedChildId === child.id ? 'primary' : 'outline'}
                onPress={() => setAssignedChildId(child.id)}
                style={styles.childButton}
              />
            ))}
          </View>
        )}

        {!isAssigned && (
          <View style={styles.runsSection}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>Runs today</Text>
            <Text style={[styles.runsHelp, { color: colors.mutedForeground }]}>
              Two runs can be claimed separately by different children.
            </Text>
            <View style={styles.runsButtons}>
              <Button
                label="Once"
                variant={dailyRuns === 1 ? 'primary' : 'outline'}
                onPress={() => setDailyRuns(1)}
                style={styles.childButton}
                testID="daily-runs-once"
              />
              <Button
                label="Twice"
                variant={dailyRuns === 2 ? 'primary' : 'outline'}
                onPress={() => setDailyRuns(2)}
                style={styles.childButton}
                testID="daily-runs-twice"
              />
            </View>
          </View>
        )}

        <Button
          label="Create Job"
          onPress={handleSubmit}
          loading={createJob.isPending}
          disabled={!title || !points || (isAssigned && !assignedChildId)}
          style={styles.submitButton}
        />
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  switchLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  childrenList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  runsSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  runsHelp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  runsButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  childButton: {
    flexGrow: 1,
  },
  submitButton: {
    marginTop: 24,
  }
});
