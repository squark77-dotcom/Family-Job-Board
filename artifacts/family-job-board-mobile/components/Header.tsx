import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

interface HeaderProps {
  title: string;
  rightAction?: React.ReactNode;
}

export function Header({ title, rightAction }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  
  return (
    <View 
      style={[
        styles.container, 
        { 
          paddingTop: insets.top || (Platform.OS === 'web' ? 24 : 0),
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {rightAction && <View>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    zIndex: 10,
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
  }
});
