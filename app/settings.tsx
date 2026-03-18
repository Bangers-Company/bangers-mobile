import { useRouter } from "expo-router";
import {
  LogOut,
  Bell as Notifications,
  Palette,
  Shield,
  User
} from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  Divider,
  IconButton,
  SegmentedButtons,
  Switch,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../src/components/PageContainer";
import { useAuthStore } from "../src/store/useAuthStore";
import { useUIStore } from "../src/store/useUIStore";
import { addAlpha, COLORS } from "../src/utils/theme";

const ACCENT_COLORS = [
  "#a60df2", // Primary Purple
  "#2196F3", // Blue
  "#F44336", // Red
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#00BCD4", // Cyan
  "#8BC34A", // Light Green
  "#FF5722", // Deep Orange
  "#607D8B", // Blue Grey
];

const AnimatedSection = ({
  isExpanded,
  children,
}: {
  isExpanded: boolean;
  children: React.ReactNode;
}) => {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);
  const MAX_HEIGHT = 400; 

  React.useEffect(() => {
    height.value = withTiming(isExpanded ? MAX_HEIGHT : 0, { duration: 300 });
    opacity.value = withTiming(isExpanded ? 1 : 0, { duration: 300 });
  }, [isExpanded, height, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: "hidden",
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        {children}
      </View>
    </Animated.View>
  );
};

export default function SettingsScreen() {
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  
  const {
    themeMode,
    isAmoled,
    accentColor,
    setThemeMode,
    setIsAmoled,
    setAccentColor
  } = useUIStore();

  const logout = useAuthStore((state) => state.logout);

  const [expandedSection, setExpandedSection] = useState<string | null>(
    "appearance",
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  const isSystemDark = systemColorScheme === "dark";
  const isDarkActive =
    themeMode === "system" ? isSystemDark : themeMode === "dark";

  const renderSection = (
    id: string,
    title: string,
    icon: React.ReactNode,
    children: React.ReactNode,
  ) => {
    const isExpanded = expandedSection === id;
    return (
      <View style={styles.section}>
        <TouchableRipple
          onPress={() => toggleSection(id)}
          rippleColor="rgba(0, 0, 0, .1)"
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWrapper}>
              {icon}
              <Text variant="titleLarge" style={styles.sectionTitle}>
                {title}
              </Text>
            </View>
            <IconButton
              icon={isExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              iconColor={theme.colors.onSurfaceVariant}
            />
          </View>
        </TouchableRipple>
        <AnimatedSection isExpanded={isExpanded}>
          <View style={styles.sectionContent}>{children}</View>
        </AnimatedSection>
        <Divider style={styles.divider} />
      </View>
    );
  };

  return (
    <PageContainer withPadding={false}>
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: "transparent",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backButtonCircular,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <IconButton icon="arrow-left" onPress={() => router.back()} />
        </TouchableOpacity>

        <Text variant="titleLarge" style={styles.headerTitle}>
          Settings
        </Text>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottom + 100 },
        ]}
      >
        {/* Appearance */}
        {renderSection(
          "appearance",
          "Appearance",
          <Palette size={24} color={theme.colors.primary} />,
          <View style={styles.appearanceContent}>
            <View
              style={[
                styles.settingRow,
                { flexDirection: "column", alignItems: "flex-start", gap: 12 },
              ]}
            >
              <View>
                <Text variant="bodyLarge" style={styles.settingLabel}>
                  Theme Mode
                </Text>
                <Text variant="bodySmall" style={styles.settingSubtext}>
                  Choose your preferred look
                </Text>
              </View>
              <SegmentedButtons
                value={themeMode}
                onValueChange={(val) => setThemeMode(val as any)}
                buttons={[
                  { value: "system", label: "System" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            <View style={styles.settingRow}>
              <View>
                <Text variant="bodyLarge" style={styles.settingLabel}>
                  AMOLED Mode
                </Text>
                <Text variant="bodySmall" style={styles.settingSubtext}>
                  Pure black for OLED screens
                </Text>
              </View>
              <Switch
                value={isAmoled}
                onValueChange={(val) => {
                  setIsAmoled(val);
                }}
                disabled={!isDarkActive}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.accentSection}>
              <Text variant="bodyLarge" style={styles.settingLabel}>
                Accent Color
              </Text>
              <View style={styles.colorGrid}>
                {ACCENT_COLORS.map((color) => {
                  const isSelected = (accentColor || COLORS.primary) === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setAccentColor(color)}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        isSelected && [
                          styles.selectedColorCircle,
                          { borderColor: theme.colors.onSurface },
                        ],
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[styles.selectionRing, { borderColor: color }]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>,
        )}

        {/* Notifications */}
        {renderSection(
          "notifications",
          "Notifications",
          <Notifications size={24} color={theme.colors.primary} />,
          <Text variant="bodyMedium" style={styles.placeholderText}>
            Manage your alerts, push notifications, and email preferences.
          </Text>,
        )}

        {/* Account */}
        {renderSection(
          "account",
          "Account",
          <User size={24} color={theme.colors.primary} />,
          <Text variant="bodyMedium" style={styles.placeholderText}>
            Update your email, password, and subscription details.
          </Text>,
        )}

        {/* Privacy */}
        {renderSection(
          "privacy",
          "Privacy",
          <Shield size={24} color={theme.colors.primary} />,
          <Text variant="bodyMedium" style={styles.placeholderText}>
            Control your visibility and security settings.
          </Text>,
        )}

        <TouchableRipple
          style={[
            styles.logoutButton,
            {
              backgroundColor: addAlpha(theme.colors.error, 0.1),
              borderColor: addAlpha(theme.colors.error, 0.2),
            },
          ]}
          onPress={handleLogout}
          rippleColor={addAlpha(theme.colors.error, 0.2)}
        >
          <View style={styles.logoutContent}>
            <LogOut size={20} color={theme.colors.error} />
            <Text style={[styles.logoutText, { color: theme.colors.error }]}>
              Logout
            </Text>
          </View>
        </TouchableRipple>
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    zIndex: 10,
    borderBottomWidth: 0,
  },
  backButtonCircular: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
    flex: 1,
  },
  scrollContent: { padding: 16 },
  section: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  sectionTitleWrapper: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionTitle: { fontWeight: "600" },
  sectionContent: { paddingBottom: 16, paddingLeft: 36 },
  divider: { opacity: 0.1 },
  appearanceContent: { paddingTop: 8 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  settingLabel: { fontWeight: "600" },
  settingSubtext: { opacity: 0.6 },
  segmentedButtons: { width: "100%" },
  accentSection: { marginTop: 8 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 12, maxWidth: 240 },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  selectedColorCircle: { borderWidth: 2, transform: [{ scale: 1.2 }] },
  selectionRing: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 22,
    borderWidth: 2,
    opacity: 0.5,
  },
  placeholderText: { opacity: 0.6, lineHeight: 20 },
  logoutButton: { marginTop: 32, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  logoutText: { fontWeight: "700", fontSize: 16 },
});
