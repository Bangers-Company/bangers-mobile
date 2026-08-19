import {
  Divider,
  Popover,
  PopoverBackdrop,
  PopoverBody,
  PopoverContent,
  Pressable,
  Switch,
  Text
} from "@gluestack-ui/themed";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  LogOut,
  Bell as Notifications,
  Palette,
  Shield,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../src/components/PageContainer";
import { useAppTheme } from "../src/context/ThemeProvider";
import { useAuthStore } from "../src/store/useAuthStore";
import { useSettingsStore } from "../src/store/useSettingsStore";
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
  const [measuredHeight, setMeasuredHeight] = useState(0);

  React.useEffect(() => {
    height.value = withTiming(isExpanded ? measuredHeight : 0, { duration: 300 });
    opacity.value = withTiming(isExpanded ? 1 : 0, { duration: 300 });
  }, [isExpanded, measuredHeight, height, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: "hidden",
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View
        onLayout={(e) => setMeasuredHeight(e.nativeEvent.layout.height)}
        style={{ position: "absolute", top: 0, left: 0, right: 0 }}
      >
        {children}
      </View>
    </Animated.View>
  );
};

export default function SettingsScreen() {
  const { bottom } = useSafeAreaInsets();
  const theme = useAppTheme();
  const router = useRouter();
  const systemColorScheme = useColorScheme();

  const { t } = useTranslation();
  const {
    themeMode,
    isAmoled,
    accentColor,
    setThemeMode,
    setIsAmoled,
    setAccentColor
  } = useUIStore();

  const { 
    language, 
    setLanguage, 
    notificationsEnabled, 
    setNotificationsEnabled,
    notificationMinutesBefore,
    setNotificationMinutesBefore
  } = useSettingsStore();

  const logout = useAuthStore((state) => state.logout);

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [langMenuVisible, setLangMenuVisible] = useState(false);
  const [notifMinutesMenuVisible, setNotifMinutesMenuVisible] = useState(false);

  const languages = [
    { code: "en", label: t("settings.general.english") },
    { code: "nl", label: t("settings.general.dutch") },
    { code: "fr", label: t("settings.general.french") },
    { code: "de", label: t("settings.general.german") },
    { code: "es", label: t("settings.general.spanish") },
    { code: "it", label: t("settings.general.italian") },
  ];

  const currentLanguageLabel = languages.find(l => l.code === language)?.label || language;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleLogout = async () => {
    try {
      const { getDb, runExclusive } = await import("../src/database/sqlite");
      await runExclusive(async () => {
        const db = await getDb();
        await db.execAsync(`
          DELETE FROM user_event_attendance;
          DELETE FROM favorites;
        `);
      });
    } catch (e) {
      console.error("Failed to clear local data on logout:", e);
    }
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
        <Pressable
          onPress={() => toggleSection(id)}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWrapper}>
              {icon}
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {title}
              </Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={24} color={theme.colors.onSurface} />
            ) : (
              <ChevronDown size={24} color={theme.colors.onSurface} />
            )}
          </View>
        </Pressable>
        <AnimatedSection isExpanded={isExpanded}>
          <View style={styles.sectionContent}>{children}</View>
        </AnimatedSection>
        <Divider style={styles.divider} />
      </View>
    );
  };

  return (
    <PageContainer withPadding={false}>
      <View style={[styles.topBar, { backgroundColor: "transparent", borderBottomWidth: 0, borderWidth: 0, elevation: 0, shadowOpacity: 0 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButtonCircular, { backgroundColor: theme.colors.surface }]}
        >
          <ArrowLeft size={20} color={theme.colors.onSurface} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {t("settings.title")}
        </Text>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottom + 100 },
        ]}
      >
        {/* General */}
        {renderSection(
          "general",
          t("settings.general.title"),
          <Globe size={24} color={theme.colors.primary} />,
          <View style={styles.appearanceContent}>
            <View style={[styles.settingRow, { flexDirection: "column", alignItems: "flex-start", gap: 12 }]}>
              <View>
                <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>
                  {t("settings.general.language")}
                </Text>
              </View>

              <Popover
                isOpen={langMenuVisible}
                onClose={() => setLangMenuVisible(false)}
                trigger={(triggerProps) => (
                  <Pressable
                    {...triggerProps}
                    onPress={() => setLangMenuVisible(true)}
                    style={[
                      styles.dropdownTrigger,
                      {
                        backgroundColor: addAlpha(theme.colors.onSurface, 0.05),
                        borderColor: addAlpha(theme.colors.onSurface, 0.1),
                      },
                    ]}
                  >
                    <View style={styles.dropdownInner}>
                      <Text style={{ color: theme.colors.onSurface }}>{currentLanguageLabel}</Text>
                      <ChevronDown size={20} color={theme.colors.onSurface} />
                    </View>
                  </Pressable>
                )}
              >
                <PopoverBackdrop />
                <PopoverContent style={{ backgroundColor: theme.colors.surface, borderRadius: 12, width: 220 }}>
                  <PopoverBody>
                    {languages.map((lang) => (
                      <Pressable
                        key={lang.code}
                        onPress={() => {
                          setLanguage(lang.code);
                          setLangMenuVisible(false);
                        }}
                        style={styles.popoverItem}
                      >
                        <Text style={{ color: theme.colors.onSurface, flex: 1 }}>{lang.label}</Text>
                        {language === lang.code && <Check size={18} color={theme.colors.primary} />}
                      </Pressable>
                    ))}
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </View>
          </View>,
        )}

        {/* Appearance */}
        {renderSection(
          "appearance",
          t("settings.appearance.title") || "Appearance",
          <Palette size={24} color={theme.colors.primary} />,
          <View style={styles.appearanceContent}>
            <View style={[styles.settingRow, { flexDirection: "column", alignItems: "flex-start", gap: 12 }]}>
              <View>
                <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>
                  {t("settings.appearance.themeTitle") || "Theme Mode"}
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.onSurface }]}>
                  {t("settings.appearance.themeSubtitle") || "Choose your preferred look"}
                </Text>
              </View>

              <View style={styles.themeSelectorRow}>
                {(["system", "light", "dark"] as const).map((mode) => (
                  <Pressable
                    key={mode}
                    onPress={() => setThemeMode(mode)}
                    style={[
                      styles.themeBtn,
                      themeMode === mode && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={{ color: themeMode === mode ? "#fff" : theme.colors.onSurface, fontWeight: "600", fontSize: 13, textTransform: "capitalize" }}>
                      {mode}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>
                  {t("settings.appearance.amoledTitle") || "AMOLED Mode"}
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.onSurface }]}>
                  {t("settings.appearance.amoledSubtitle") || "Pure black for OLED screens"}
                </Text>
              </View>
              <Switch
                value={isAmoled}
                onValueChange={(val) => setIsAmoled(val)}
                isDisabled={!isDarkActive}
              />
            </View>

            <View style={styles.accentSection}>
              <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>
                {t("settings.appearance.accentTitle") || "Accent Color"}
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
                        <View style={[styles.selectionRing, { borderColor: color }]} />
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
          t("settings.notifications.title") || "Notifications",
          <Notifications size={24} color={theme.colors.primary} />,
          <View style={styles.appearanceContent}>
            <View style={styles.settingRow}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>
                  {t("settings.notifications.enabled")}
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.onSurface }]}>
                  {t("settings.notifications.enabledSubtitle")}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            </View>

            <View style={[styles.settingRow, { flexDirection: "column", alignItems: "flex-start", gap: 12 }]}>
              <View>
                <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>
                  {t("settings.notifications.minutesBefore")}
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.colors.onSurface }]}>
                  {t("settings.notifications.minutesBeforeSubtitle", { minutes: notificationMinutesBefore })}
                </Text>
              </View>

              <Popover
                isOpen={notifMinutesMenuVisible}
                onClose={() => setNotifMinutesMenuVisible(false)}
                trigger={(triggerProps) => (
                  <Pressable
                    {...triggerProps}
                    onPress={() => setNotifMinutesMenuVisible(true)}
                    isDisabled={!notificationsEnabled}
                    style={[
                      styles.dropdownTrigger,
                      {
                        backgroundColor: addAlpha(theme.colors.onSurface, 0.05),
                        borderColor: addAlpha(theme.colors.onSurface, 0.1),
                        opacity: notificationsEnabled ? 1 : 0.5,
                      },
                    ]}
                  >
                    <View style={styles.dropdownInner}>
                      <Text style={{ color: theme.colors.onSurface }}>
                        {t("settings.notifications.minutes", { count: notificationMinutesBefore })}
                      </Text>
                      <ChevronDown size={20} color={theme.colors.onSurface} />
                    </View>
                  </Pressable>
                )}
              >
                <PopoverBackdrop />
                <PopoverContent style={{ backgroundColor: theme.colors.surface, borderRadius: 12, width: 220 }}>
                  <PopoverBody>
                    {[5, 10, 15, 20, 25, 30].map((mins) => (
                      <Pressable
                        key={mins}
                        onPress={() => {
                          setNotificationMinutesBefore(mins);
                          setNotifMinutesMenuVisible(false);
                        }}
                        style={styles.popoverItem}
                      >
                        <Text style={{ color: theme.colors.onSurface, flex: 1 }}>
                          {t("settings.notifications.minutes", { count: mins })}
                        </Text>
                        {notificationMinutesBefore === mins && <Check size={18} color={theme.colors.primary} />}
                      </Pressable>
                    ))}
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </View>
          </View>,
        )}

        {/* Account */}
        {renderSection(
          "account",
          t("settings.account.title") || "Account",
          <User size={24} color={theme.colors.primary} />,
          <Text style={[styles.placeholderText, { color: theme.colors.onSurface }]}>
            {t("settings.account.description") || "Update your email, password, and subscription details."}
          </Text>,
        )}

        {/* Privacy */}
        {renderSection(
          "privacy",
          t("settings.privacy.title") || "Privacy",
          <Shield size={24} color={theme.colors.primary} />,
          <Text style={[styles.placeholderText, { color: theme.colors.onSurface }]}>
            {t("settings.privacy.description") || "Control your visibility and security settings."}
          </Text>,
        )}

        <Pressable
          style={[
            styles.logoutButton,
            {
              backgroundColor: "rgba(255,82,82,0.1)",
              borderColor: "rgba(255,82,82,0.2)",
            },
          ]}
          onPress={handleLogout}
        >
          <View style={styles.logoutContent}>
            <LogOut size={20} color="#ff5252" />
            <Text style={[styles.logoutText, { color: "#ff5252" }]}>
              {t("common.logout") || "Logout"}
            </Text>
          </View>
        </Pressable>
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
    zIndex: 10,
    borderBottomWidth: 0,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  backButtonCircular: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
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
  sectionTitle: { fontWeight: "600", fontSize: 16 },
  sectionContent: { paddingBottom: 16, paddingLeft: 36 },
  divider: { opacity: 0.1 },
  appearanceContent: { paddingTop: 8 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  settingLabel: { fontWeight: "600", fontSize: 15 },
  settingSubtext: { opacity: 0.6, fontSize: 13 },
  themeSelectorRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  themeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "rgba(150,150,150,0.15)",
  },
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
  placeholderText: { opacity: 0.6, lineHeight: 20, fontSize: 14 },
  logoutButton: { marginTop: 32, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  logoutText: { fontWeight: "700", fontSize: 16 },
  dropdownTrigger: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  dropdownInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 16,
    paddingRight: 12,
    height: 48,
  },
  popoverItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});

