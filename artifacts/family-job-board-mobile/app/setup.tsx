import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { useCreateFamily, useJoinFamily, useGetCurrentUser } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Image } from 'expo-image';
import { SETUP_CHOICES, type SetupMode } from './setup-options';

export default function SetupScreen() {
  const [mode, setMode] = useState<'choose' | SetupMode>('choose');
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={styles.logo} 
          contentFit="contain" 
        />
        <Text style={[styles.title, { color: colors.foreground }]}>Welcome to Choremate</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Choose how you want to get started.
        </Text>
      </View>

      <View style={styles.modeToggle}>
        {SETUP_CHOICES.map((choice) => (
          <Button
            key={choice.mode}
            label={choice.mode === 'create' ? 'Create Family' : 'Join as a child'}
            variant={mode === choice.mode ? 'primary' : 'outline'}
            onPress={() => setMode(choice.mode)}
            style={styles.modeButton}
          />
        ))}
      </View>

      <KeyboardAwareScrollViewCompat 
        contentContainerStyle={styles.scrollContent}
        bottomOffset={20}
      >
        {mode === 'choose' ? (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Choose your path</Text>
            <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
              Pick one before setting up. Parents create a family; children join an existing family with a code.
            </Text>
          </Card>
        ) : mode === 'create' ? <CreateFamilyForm /> : <JoinFamilyForm />}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function CreateFamilyForm() {
  const [familyName, setFamilyName] = useState('');
  const [childNames, setChildNames] = useState(['']);
  const createFamily = useCreateFamily();
  const queryClient = useQueryClient();
  const router = useRouter();
  const colors = useColors();

  const handleAddChild = () => {
    if (childNames.length < 3) {
      setChildNames([...childNames, '']);
    }
  };

  const handleChildChange = (text: string, index: number) => {
    const newNames = [...childNames];
    newNames[index] = text;
    setChildNames(newNames);
  };

  const handleSubmit = () => {
    const validChildren = childNames.filter(n => n.trim() !== '').map(name => ({ name }));
    
    if (validChildren.length === 0) {
      alert("Please add at least one child");
      return;
    }

    createFamily.mutate({
      data: {
        name: familyName,
        children: validChildren,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        router.replace('/');
      },
      onError: (err: any) => {
        alert(err?.message || "Failed to create family");
      }
    });
  };

  return (
    <Card style={styles.card}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>Set up your family</Text>
      <Input
        label="Family Name"
        placeholder="e.g. The Smiths"
        value={familyName}
        onChangeText={setFamilyName}
      />
      
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Add Children</Text>
      {childNames.map((name, index) => (
        <Input
          key={index}
          placeholder={`Child ${index + 1} Name`}
          value={name}
          onChangeText={(text) => handleChildChange(text, index)}
        />
      ))}
      
      {childNames.length < 3 && (
        <Button 
          label="+ Add another child" 
          variant="ghost" 
          onPress={handleAddChild} 
          style={styles.addButton}
        />
      )}

      <Button
        label="Create Family"
        onPress={handleSubmit}
        loading={createFamily.isPending}
        disabled={!familyName || childNames[0].trim() === ''}
        style={styles.submitButton}
      />
    </Card>
  );
}

function JoinFamilyForm() {
  const [joinCode, setJoinCode] = useState('');
  const [childId, setChildId] = useState('');
  const joinFamily = useJoinFamily();
  const queryClient = useQueryClient();
  const router = useRouter();
  const colors = useColors();

  const handleSubmit = () => {
    joinFamily.mutate({
      data: {
        joinCode,
        childId
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        router.replace('/');
      },
      onError: (err: any) => {
        alert(err?.message || "Failed to join family. Make sure the child ID and join code are correct.");
      }
    });
  };

  return (
    <Card style={styles.card}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>Join an existing family</Text>
      <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
        Ask your parent for the family join code and your child ID from their Family tab.
      </Text>
      
      <Input
        label="Join Code"
        placeholder="6-12 characters"
        value={joinCode}
        onChangeText={setJoinCode}
        autoCapitalize="none"
      />
      
      <Input
        label="Your Child ID"
        placeholder="Provided by parent"
        value={childId}
        onChangeText={setChildId}
        autoCapitalize="none"
      />

      <Button
        label="Join Family"
        onPress={handleSubmit}
        loading={joinFamily.isPending}
        disabled={!joinCode || !childId}
        style={styles.submitButton}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    padding: 24,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  helpText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  addButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
});
