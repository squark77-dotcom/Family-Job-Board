import React from "react";
import { StyleSheet, Text, View, ViewProps } from "react-native";
import { useColors } from "@/hooks/useColors";

interface BadgeProps extends ViewProps {
  label: string;
  variant?: "default" | "secondary" | "outline" | "destructive" | "accent";
}

export function Badge({ label, variant = "default", style, ...props }: BadgeProps) {
  const colors = useColors();

  const getVariantStyles = () => {
    switch (variant) {
      case "default":
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

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
          borderWidth: variant === "outline" ? 1 : 0,
        },
        style,
      ]}
      {...props}
    >
      <Text style={[styles.text, { color: variantStyles.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
});
