import { useRouter } from "expo-router";
import {
    Search as SearchIcon,
    ShieldAlert,
    ShieldCheck,
    SlidersHorizontal,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import {
    Avatar,
    Button,
    Checkbox,
    Divider,
    IconButton,
    Searchbar,
    Surface,
    Text,
    TouchableRipple,
    useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EventHorizontalCard } from "../../src/components/event/EventHorizontalCard";
import { resolveMediaUrl, getUserDisplayName } from "../../src/utils/format";

import { addAlpha } from "../../src/utils/theme";
import { useSearch } from "../../src/hooks/useSearch";
import { useDebounce } from "../../src/hooks/useDebounce";

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [entities, setEntities] = useState<string[]>(["events", "artists", "acts", "users"]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: results, isLoading: loading } = useSearch(debouncedSearchQuery, entities);

  useEffect(() => {
    // Perform any side effects when results change if needed
  }, [results]);

  const onToggleEntity = (entity: string) => {
    setEntities(prev => 
      prev.includes(entity) 
        ? prev.filter(e => e !== entity) 
        : [...prev, entity]
    );
  };


  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: 16 }]}>
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Search..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[
              styles.searchBar,
              { backgroundColor: addAlpha(theme.colors.onSurface, 0.05) },
            ]}
            iconColor={theme.colors.primary}
            loading={loading}
            placeholderTextColor={theme.colors.outline}
          />
          <IconButton
            icon={() => (
              <SlidersHorizontal size={20} color={theme.colors.primary} />
            )}
            onPress={() => setShowFilters(true)}
            style={[
              styles.filterButton,
              { backgroundColor: addAlpha(theme.colors.primary, 0.1) },
            ]}
          />
        </View>
      </View>

      <FlashList
        data={(() => {
          if (!results) return [];
          const items: any[] = [];
          if (results.events?.data?.length) {
            items.push({ type: 'header', title: 'Events' });
            items.push(...results.events.data.map((e: any) => ({ ...e, itemType: 'event' })));
          }
          if (results.artists?.data?.length) {
            items.push({ type: 'header', title: 'Artists' });
            items.push(...results.artists.data.map((a: any) => ({ ...a, itemType: 'artist' })));
          }
          if (results.acts?.data?.length) {
            items.push({ type: 'header', title: 'Acts' });
            items.push(...results.acts.data.map((a: any) => ({ ...a, itemType: 'act' })));
          }
          if (results.users?.data?.length) {
            items.push({ type: 'header', title: 'Users' });
            items.push(...results.users.data.map((u: any) => ({ ...u, itemType: 'user' })));
          }
          return items;
        })()}
        keyExtractor={(item, index) => item.type === 'header' ? `header-${item.title}` : `item-${item.itemType}-${item.id || index}`}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {item.title}
              </Text>
            );
          }

          const type = item.itemType;
          return (
            <View style={styles.itemWrapper}>
              {type === "event" ? (
                <EventHorizontalCard
                  event={item}
                  onPress={(ev) => router.push(`/event/${ev.id}` as any)}
                />
              ) : type === "user" ? (
                <Surface
                  style={[
                    styles.artistCard,
                    { backgroundColor: theme.colors.surface },
                  ]}
                  elevation={1}
                >
                  <TouchableRipple
                    onPress={() => router.push(`/user/${item.id}` as any)}
                    style={styles.artistRipple}
                    rippleColor="rgba(0,0,0,0.05)"
                  >
                    <View
                      style={[
                        styles.artistContent,
                        { flexDirection: "row", alignItems: "center", gap: 16 },
                      ]}
                    >
                      {resolveMediaUrl(item.profile_media_url) ? (
                        <Avatar.Image
                          size={40}
                          source={{
                            uri: resolveMediaUrl(item.profile_media_url)!,
                          }}
                        />
                      ) : (
                        <Avatar.Text
                          size={40}
                          label={getUserDisplayName(item).charAt(0).toUpperCase()}
                          style={{ backgroundColor: theme.colors.primary }}
                          color="#ffffff"
                        />
                      )}

                      <View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                            {getUserDisplayName(item)}
                          </Text>

                          {item.roles?.some((r: any) =>
                            typeof r === "string"
                              ? r === "admin"
                              : r?.name === "admin",
                          ) && (
                            <ShieldAlert size={16} color={theme.colors.error} />
                          )}
                          {!item.roles?.some((r: any) =>
                            typeof r === "string"
                              ? r === "admin"
                              : r?.name === "admin",
                          ) &&
                            item.roles?.some((r: any) =>
                              typeof r === "string"
                                ? r === "moderator"
                                : r?.name === "moderator",
                            ) && (
                              <ShieldCheck
                                size={16}
                                color={theme.colors.primary}
                              />
                            )}
                        </View>
                        <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                          @{item.username}
                        </Text>
                      </View>
                    </View>
                  </TouchableRipple>
                </Surface>
              ) : (
                <Surface
                  style={[
                    styles.artistCard,
                    { backgroundColor: theme.colors.surface },
                  ]}
                  elevation={1}
                >
                  <TouchableRipple
                    onPress={() => {}}
                    style={styles.artistRipple}
                    rippleColor="rgba(0,0,0,0.05)"
                  >
                    <View style={styles.artistContent}>
                      <Text variant="titleMedium">{item.name}</Text>
                      <Text variant="bodySmall" style={{ opacity: 0.6 }}>
                        {type === "artist" ? item.genre : "Festival Act"}
                      </Text>
                    </View>
                  </TouchableRipple>
                </Surface>
              )}
            </View>
          );
        }}
        estimatedItemSize={80}
        getItemType={(item) => item.type === 'header' ? 'header' : item.itemType}
        contentContainerStyle={styles.scrollContent}
        ListEmptyComponent={
          searchQuery.length > 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge">
                No results found for &quot;{searchQuery}&quot;
              </Text>
            </View>
          ) : !searchQuery.length ? (
            <View style={styles.emptyContainer}>
              <SearchIcon
                size={64}
                color={theme.colors.outlineVariant}
                style={{ marginBottom: 16 }}
              />
              <Text
                variant="headlineSmall"
                style={{ color: theme.colors.outline }}
              >
                Search Bangers
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Find events, artists, and acts
              </Text>
            </View>
          ) : null
        }
      />

      {/* Filter Modal (Bottom Drawer) */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        >
          <Surface
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.elevation.level2 },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Filters
              </Text>
              <IconButton icon="close" onPress={() => setShowFilters(false)} />
            </View>
            <Divider style={styles.modalDivider} />

            <View style={styles.filterSection}>
              <Text variant="labelLarge" style={styles.filterLabel}>
                Search Entities
              </Text>
              <View style={styles.checkboxRow}>
                <Checkbox.Item
                  label="Events"
                  status={entities.includes("events") ? "checked" : "unchecked"}
                  onPress={() => onToggleEntity("events")}
                />
                <Checkbox.Item
                  label="Artists"
                  status={
                    entities.includes("artists") ? "checked" : "unchecked"
                  }
                  onPress={() => onToggleEntity("artists")}
                />
                <Checkbox.Item
                  label="Acts"
                  status={entities.includes("acts") ? "checked" : "unchecked"}
                  onPress={() => onToggleEntity("acts")}
                />
                <Checkbox.Item
                  label="Users"
                  status={entities.includes("users") ? "checked" : "unchecked"}
                  onPress={() => onToggleEntity("users")}
                />
              </View>
            </View>

            <Button
              mode="contained"
              onPress={() => setShowFilters(false)}
              style={styles.applyButton}
            >
              Apply Filters
            </Button>
            <View style={{ height: insets.bottom + 20 }} />
          </Surface>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchBar: {
    flex: 1,
    borderRadius: 16,
    elevation: 0,
  },
  filterButton: {
    borderRadius: 12,
    margin: 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: "800",
    marginBottom: 12,
    opacity: 0.5,
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1,
  },
  itemWrapper: {
    marginBottom: 12,
  },
  artistCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  artistRipple: {
    padding: 16,
  },
  artistContent: {
    gap: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptySubtext: {
    opacity: 0.6,
    textAlign: "center",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontWeight: "800",
  },
  modalDivider: {
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontWeight: "700",
    marginBottom: 8,
    opacity: 0.7,
  },
  checkboxRow: {
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 16,
    overflow: "hidden",
  },
  applyButton: {
    borderRadius: 16,
    paddingVertical: 8,
  },
});
