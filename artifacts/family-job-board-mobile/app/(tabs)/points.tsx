import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Header } from '@/components/Header';
import { useGetPoints, useGetCurrentUser, useAwardBonus, useListChildren } from '@workspace/api-client-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { getGetPointsQueryKey, getGetDashboardQueryKey } from '@workspace/api-client-react';
import { Modal, TextInput } from 'react-native';

export default function PointsScreen() {
  const colors = useColors();
  const { data: pointsData, isLoading, refetch, isRefetching } = useGetPoints();
  const { data: userProfile } = useGetCurrentUser();
  const { data: children } = useListChildren();
  
  const queryClient = useQueryClient();
  const awardBonus = useAwardBonus();

  const [bonusModalVisible, setBonusModalVisible] = useState(false);
  const [bonusPoints, setBonusPoints] = useState('10');
  const [bonusReason, setBonusReason] = useState('');
  const [bonusChildId, setBonusChildId] = useState('');

  const isParent = userProfile?.user.role === 'parent';

  const handleAwardBonus = () => {
    if (!bonusChildId) return;
    
    awardBonus.mutate({
      data: {
        childId: bonusChildId,
        points: parseInt(bonusPoints, 10),
        reason: bonusReason,
      }
    }, {
      onSuccess: () => {
        setBonusModalVisible(false);
        setBonusPoints('10');
        setBonusReason('');
        queryClient.invalidateQueries({ queryKey: getGetPointsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Contributions" 
        rightAction={
          isParent ? (
            <Button 
              size="sm" 
              label="Bonus" 
              variant="accent"
              onPress={() => {
                if (children && children.length > 0) {
                  setBonusChildId(children[0].id);
                  setBonusModalVisible(true);
                }
              }} 
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
        <Card style={styles.totalCard}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Family Total</Text>
          <Text style={[styles.totalPoints, { color: colors.accent }]}>
            {pointsData?.totalPoints || 0}
          </Text>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Leaderboard</Text>
        <View style={styles.leaderboardContainer}>
          {pointsData?.byChild.map((child, index) => (
            <Card key={child.id} style={styles.leaderboardCard}>
              <View style={styles.leaderboardRow}>
                <View style={styles.rankContainer}>
                  <Text style={[styles.rank, { color: colors.mutedForeground }]}>#{index + 1}</Text>
                  <Text style={[styles.childName, { color: colors.foreground }]}>{child.name}</Text>
                </View>
                <Text style={[styles.childPoints, { color: colors.foreground }]}>{child.totalPoints} pts</Text>
              </View>
            </Card>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Transactions</Text>
        
        {!pointsData?.transactions?.length && !isLoading && (
          <EmptyState
            icon={<Feather name="star" size={32} color={colors.mutedForeground} />}
            title="No points yet"
            description="Complete jobs to start earning points."
          />
        )}

        {pointsData?.transactions?.map((tx) => (
          <View key={tx.id} style={[styles.txRow, { borderBottomColor: colors.border }]}>
            <View style={styles.txIconContainer}>
              <Feather 
                name={tx.type === 'initiative_bonus' ? 'gift' : 'check-square'} 
                size={20} 
                color={tx.type === 'initiative_bonus' ? colors.accent : colors.primary} 
              />
            </View>
            <View style={styles.txDetails}>
              <Text style={[styles.txChild, { color: colors.foreground }]}>{tx.childName}</Text>
              <Text style={[styles.txReason, { color: colors.mutedForeground }]}>
                {tx.reason || (tx.type === 'assigned_job' ? 'Assigned Job' : 'Board Job')}
              </Text>
            </View>
            <Text style={[styles.txPoints, { color: colors.accent }]}>+{tx.points}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Bonus Modal - A simplified approach for quick UX */}
      <Modal visible={bonusModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Award Bonus Points</Text>
            
            <Text style={{color: colors.foreground, marginBottom: 8}}>Amount</Text>
            <TextInput 
              style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              value={bonusPoints}
              onChangeText={setBonusPoints}
              keyboardType="numeric"
            />

            <Text style={{color: colors.foreground, marginBottom: 8, marginTop: 12}}>Reason</Text>
            <TextInput 
              style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              value={bonusReason}
              onChangeText={setBonusReason}
              placeholder="e.g. Helping without asking"
              placeholderTextColor={colors.mutedForeground}
            />

            {/* Quick child selector */}
            <Text style={{color: colors.foreground, marginBottom: 8, marginTop: 12}}>Child</Text>
            <View style={styles.childSelector}>
              {children?.map(c => (
                <Button 
                  key={c.id}
                  label={c.name}
                  variant={bonusChildId === c.id ? 'primary' : 'outline'}
                  size="sm"
                  onPress={() => setBonusChildId(c.id)}
                  style={{flex: 1, marginHorizontal: 4}}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button label="Cancel" variant="ghost" onPress={() => setBonusModalVisible(false)} style={{flex: 1}} />
              <Button 
                label="Award" 
                variant="accent" 
                onPress={handleAwardBonus} 
                loading={awardBonus.isPending}
                disabled={!bonusPoints || !bonusReason}
                style={{flex: 1}} 
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
  totalCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  totalLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  totalPoints: {
    fontFamily: 'Inter_700Bold',
    fontSize: 48,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginBottom: 16,
    marginTop: 8,
  },
  leaderboardContainer: {
    marginBottom: 24,
  },
  leaderboardCard: {
    marginBottom: 8,
    padding: 12,
  },
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rank: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    width: 30,
  },
  childName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  childPoints: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)', // Fallback subtle bg
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txChild: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginBottom: 2,
  },
  txReason: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  txPoints: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  childSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  }
});
