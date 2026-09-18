import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

interface ButtonProps extends PressableProps {
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "accent";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading,
  icon,
  style,
  disabled,
  onPress,
  ...props
}: ButtonProps) {
  const colors = useColors();

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          bg: colors.primary,
          text: colors.primaryForeground,
          border: colors.primary,
        };
      case "secondary":
        return {
          bg: colors.secondary,
          text: colors.secondaryForeground,
          border: colors.secondary,
        };
      case "outline":
        return {
          bg: "transparent",
          text: colors.foreground,
          border: colors.border,
        };
      case "ghost":
        return {
          bg: "transparent",
          text: colors.foreground,
          border: "transparent",
        };
      case "destructive":
        return {
          bg: colors.destructive,
          text: colors.destructiveForeground,
          border: colors.destructive,
        };
      case "accent":
        return {
          bg: colors.accent,
          text: colors.accentForeground,
          border: colors.accent,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const handlePress = (e: any) => {
    if (disabled || loading) return;
    Haptics.selectionAsync();
    onPress?.(e);
  };

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={handlePress}
      style={(state) => [
        styles.button,
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
          borderWidth: variant === "outline" ? 2 : 0,
          borderRadius: colors.radius,
          opacity: state.pressed || disabled ? 0.7 : 1,
          transform: [{ scale: state.pressed ? 0.96 : 1 }],
          shadowColor: colors.foreground,
        },
        size === "sm" && styles.sm,
        size === "md" && styles.md,
        size === "lg" && styles.lg,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={variantStyles.text} style={styles.loader} />
        ) : (
          icon
        )}
        {label && (
          <Text
            style={[
              styles.text,
              { color: variantStyles.text },
              size === "sm" && styles.textSm,
              size === "lg" && styles.textLg,
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sm: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 36 },
  md: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 48 },
  lg: { paddingHorizontal: 24, paddingVertical: 16, minHeight: 56 },
  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  textSm: { fontSize: 14 },
  textLg: { fontSize: 18 },
  loader: { marginRight: 4 },
});
