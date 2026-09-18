import React from "react";
import { StyleSheet, Text, View, ViewProps } from "react-native";
import { useColors } from "@/hooks/useColors";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
}

export function Card({ children, style, title, subtitle, headerRight, ...props }: CardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
          shadowColor: colors.primary,
        },
        style,
      ]}
      {...props}
    >
      {(title || subtitle || headerRight) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && (
              <Text style={[styles.title, { color: colors.cardForeground }]}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {subtitle}
              </Text>
            )}
          </View>
          {headerRight && <View>{headerRight}</View>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
});
