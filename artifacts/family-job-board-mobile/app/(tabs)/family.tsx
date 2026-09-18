import React from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Header } from '@/components/Header';
import { useGetCurrentUser, useListChildren } from '@workspace/api-client-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { useClerk } from '@clerk/expo';
import { useRouter } from 'expo-router';

export default function FamilyScreen() {
  const colors = useColors();
  const { data: userProfile, isLoading, refetch, isRefetching } = useGetCurrentUser();
  const { data: children } = useListChildren();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = () => {
    signOut().then(() => {
      router.replace('/(auth)/sign-in');
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Family" />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar name={userProfile?.user.name || 'User'} size={64} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>
                {userProfile?.user.name}
              </Text>
              <Text style={[styles.profileRole, { color: colors.mutedForeground }]}>
                {userProfile?.user.role === 'parent' ? 'Parent' : 'Child'}
              </Text>
            </View>
          </View>
        </Card>

        {userProfile?.family && (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 0 }]}>
              {userProfile.family.name}
            </Text>
            
            {userProfile.user.role === 'parent' && (
              <View style={[styles.codeContainer, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.codeLabel, { color: colors.mutedForeground }]}>Join Code:</Text>
                <Text style={[styles.codeValue, { color: colors.foreground }]}>{userProfile.family.joinCode}</Text>
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.foreground, fontSize: 16 }]}>
              Children
            </Text>
            
            {children?.map((child) => (
              <View key={child.id} style={[styles.childRow, { borderBottomColor: colors.border }]}>
                <Avatar name={child.name} size={40} />
                <View style={styles.childInfo}>
                  <Text style={[styles.childName, { color: colors.foreground }]}>{child.name}</Text>
                  {userProfile.user.role === 'parent' && (
                    <Text style={[styles.childId, { color: colors.mutedForeground }]}>ID: {child.id}</Text>
                  )}
                </View>
                {!child.linked && userProfile.user.role === 'parent' && (
                  <Text style={[styles.unlinkedText, { color: colors.destructive }]}>Unlinked</Text>
                )}
              </View>
            ))}
          </Card>
        )}

        <View style={styles.actionsContainer}>
          <Button 
            label="Sign Out" 
            variant="outline" 
            onPress={handleSignOut} 
            style={styles.signOutButton}
          />
        </View>
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
  profileCard: {
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 4,
  },
  profileRole: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginBottom: 16,
    marginTop: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  codeLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  codeValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  childInfo: {
    flex: 1,
    marginLeft: 12,
  },
  childName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  childId: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  unlinkedText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  actionsContainer: {
    marginTop: 32,
    marginBottom: 40,
  },
  signOutButton: {
    borderWidth: 1,
  },
});
