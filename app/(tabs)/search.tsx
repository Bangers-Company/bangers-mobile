import { useRouter } from "expo-router";
import {
  Search as SearchIcon,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  Music2,
  Calendar,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput as RNTextInput,
} from "react-native";
import {
  Avatar,
  Button,
  Checkbox,
  IconButton,
  Searchbar,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EventHorizontalCard } from "../../src/components/event/EventHorizontalCard";
import { Image as ExpoImage } from "expo-image";
import { resolveMediaUrl, getUserDisplayName, getUserAvatarUrl } from "../../src/utils/format";
import { addAlpha } from "../../src/utils/theme";
import { useSearch } from "../../src/hooks/useSearch";
import { useDebounce } from "../../src/hooks/useDebounce";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import { useSharedScroll } from "../../src/hooks/useSharedScroll";

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollOffset = useSharedScroll();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [entities, setEntities] = useState<string[]>(["events", "artists", "acts", "users"]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: results, isLoading: loading } = useSearch(debouncedSearchQuery, entities);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (ev) => {
      scrollOffset.value = ev.contentOffset.y;
    },
  });

  const onToggleEntity = (entity: string) => {
    setEntities(prev => 
      prev.includes(entity) 
        ? prev.filter(e => e !== entity) 
        : [...prev, entity]
    );
  };

  const getSearchResultItems = () => {
    if (!results) return [];
    const items: any[] = [];
    if (results.events?.data?.length) {
      items.push({ type: 'header', title: 'Events', icon: Calendar });
      items.push(...results.events.data.map((e: any) => ({ ...e, itemType: 'event' })));
    }
    if (results.artists?.data?.length) {
      items.push({ type: 'header', title: 'Artists', icon: Music2 });
      items.push(...results.artists.data.map((a: any) => ({ ...a, itemType: 'artist' })));
    }
    if (results.acts?.data?.length) {
      items.push({ type: 'header', title: 'Acts', icon: Sparkles });
      items.push(...results.acts.data.map((a: any) => ({ ...a, itemType: 'act' })));
    }
    if (results.users?.data?.length) {
      items.push({ type: 'header', title: 'Users', icon: User });
      items.push(...results.users.data.map((u: any) => ({ ...u, itemType: 'user' })));
    }
    return items;
  };

  const searchItems = getSearchResultItems();

  return (
    <View style={styles.container}>
      {/* Sleek Search Header */}
      <View style={[styles.header, { paddingTop: 12 }]}>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBarContainer,
              {
                backgroundColor: addAlpha(theme.colors.surface, 0.85),
                borderColor: addAlpha(theme.colors.outline, 0.15),
              },
            ]}
          >
            <SearchIcon size={18} color={theme.colors.primary} style={{ marginRight: 10 }} />
            <RNTextInput
              placeholder="Search events, artists, users..."
              placeholderTextColor={addAlpha(theme.colors.onSurface, 0.5)}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[
                styles.nativeInput,
                { color: theme.colors.onSurface },
              ]}
            />
            {loading && <IconButton icon="loading" size={16} iconColor={theme.colors.primary} style={{ margin: 0 }} />}
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            style={[
              styles.filterButton,
              {
                backgroundColor: addAlpha(theme.colors.primary, 0.14),
                borderColor: addAlpha(theme.colors.primary, 0.3),
              },
            ]}
          >
            <SlidersHorizontal size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Filter Badges */}
        <View style={styles.entityBadgesRow}>
          {["events", "artists", "acts", "users"].map((ent) => {
            const isSelected = entities.includes(ent);
            return (
              <TouchableOpacity
                key={ent}
                onPress={() => onToggleEntity(ent)}
                style={[
                  styles.entityPill,
                  isSelected
                    ? {
                        backgroundColor: addAlpha(theme.colors.primary, 0.16),
                        borderColor: theme.colors.primary,
                      }
                    : {
                        backgroundColor: addAlpha(theme.colors.surface, 0.6),
                        borderColor: addAlpha(theme.colors.outline, 0.12),
                      },
                ]}
              >
                <Text
                  style={[
                    styles.entityText,
                    {
                      color: isSelected
                        ? theme.colors.primary
                        : addAlpha(theme.colors.onSurface, 0.6),
                    },
                  ]}
                >
                  {ent}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {searchItems.length > 0 ? (
          searchItems.map((item, index) => {
            if (item.type === 'header') {
              const HeaderIcon = item.icon || Sparkles;
              return (
                <View key={`header-${item.title}`} style={styles.sectionHeaderRow}>
                  <HeaderIcon size={16} color={theme.colors.primary} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    {item.title}
                  </Text>
                </View>
              );
            }

            const type = item.itemType;
            return (
              <View key={`item-${type}-${item.id || index}`} style={styles.itemWrapper}>
                {type === "event" ? (
                  <EventHorizontalCard
                    event={item}
                    onPress={(ev) => router.push(`/event/${ev.id}` as any)}
                  />
                ) : type === "user" ? (
                  <Surface
                    style={[
                      styles.resultCard,
                      {
                        backgroundColor: addAlpha(theme.colors.surface, 0.85),
                        borderColor: addAlpha(theme.colors.outline, 0.12),
                      },
                    ]}
                    elevation={0}
                  >
                    <TouchableRipple
                      onPress={() => router.push(`/user/${item.id}` as any)}
                      style={styles.cardRipple}
                      rippleColor="rgba(0,0,0,0.05)"
                    >
                      <View style={styles.userRowContent}>
                        {getUserAvatarUrl(item) ? (
                          <ExpoImage
                            source={{ uri: getUserAvatarUrl(item)! }}
                            style={{ width: 44, height: 44, borderRadius: 14 }}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <Avatar.Text
                            size={44}
                            label={getUserDisplayName(item).charAt(0).toUpperCase()}
                            style={{ backgroundColor: theme.colors.primary, borderRadius: 14 }}
                            color="#ffffff"
                          />
                        )}

                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "800" }}>
                              {getUserDisplayName(item)}
                            </Text>

                            {item.roles?.some((r: any) =>
                              typeof r === "string" ? r === "admin" : r?.name === "admin",
                            ) && <ShieldAlert size={16} color={theme.colors.error} />}
                            {!item.roles?.some((r: any) =>
                              typeof r === "string" ? r === "admin" : r?.name === "admin",
                            ) &&
                              item.roles?.some((r: any) =>
                                typeof r === "string" ? r === "moderator" : r?.name === "moderator",
                              ) && <ShieldCheck size={16} color={theme.colors.primary} />}
                          </View>
                          <Text variant="bodySmall" style={{ color: addAlpha(theme.colors.onSurface, 0.5) }}>
                            @{item.username}
                          </Text>
                        </View>
                      </View>
                    </TouchableRipple>
                  </Surface>
                ) : (
                  <Surface
                    style={[
                      styles.resultCard,
                      {
                        backgroundColor: addAlpha(theme.colors.surface, 0.85),
                        borderColor: addAlpha(theme.colors.outline, 0.12),
                      },
                    ]}
                    elevation={0}
                  >
                    <TouchableRipple
                      onPress={() => {}}
                      style={styles.cardRipple}
                      rippleColor="rgba(0,0,0,0.05)"
                    >
                      <View style={styles.artistRowContent}>
                        <View
                          style={[
                            styles.artistIconBox,
                            { backgroundColor: addAlpha(theme.colors.primary, 0.12) },
                          ]}
                        >
                          <Music2 size={18} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "800" }}>
                            {item.name}
                          </Text>
                          <Text variant="bodySmall" style={{ color: addAlpha(theme.colors.onSurface, 0.5) }}>
                            {type === "artist" ? item.genre || "Artist" : "Festival Act"}
                          </Text>
                        </View>
                      </View>
                    </TouchableRipple>
                  </Surface>
                )}
              </View>
            );
          })
        ) : searchQuery.length > 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={{ color: addAlpha(theme.colors.onSurface, 0.7) }}>
              No results found for &quot;{searchQuery}&quot;
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <SearchIcon
              size={56}
              color={addAlpha(theme.colors.primary, 0.4)}
              style={{ marginBottom: 14 }}
            />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "800" }}>
              Explore Festivals & Artists
            </Text>
            <Text variant="bodySmall" style={{ color: addAlpha(theme.colors.onSurface, 0.5), textAlign: "center", marginTop: 4 }}>
              Search for your favorite events, acts, or friends
            </Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <Surface style={[styles.modalContent, { backgroundColor: theme.colors.surface }]} elevation={4}>
            <Text variant="titleLarge" style={{ fontWeight: "900", marginBottom: 16 }}>
              Filter Search Categories
            </Text>
            {["events", "artists", "acts", "users"].map((ent) => (
              <TouchableOpacity
                key={ent}
                onPress={() => onToggleEntity(ent)}
                style={styles.checkboxRow}
              >
                <Checkbox
                  status={entities.includes(ent) ? "checked" : "unchecked"}
                  onPress={() => onToggleEntity(ent)}
                  color={theme.colors.primary}
                />
                <Text style={{ textTransform: "capitalize", fontWeight: "700", marginLeft: 8 }}>
                  {ent}
                </Text>
              </TouchableOpacity>
            ))}
            <Button
              mode="contained"
              onPress={() => setShowFilters(false)}
              style={{ marginTop: 20, borderRadius: 12 }}
              buttonColor={theme.colors.primary}
            >
              Done
            </Button>
          </Surface>
        </View>
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
    paddingBottom: 8,
    gap: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBarContainer: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  nativeInput: {
    flex: 1,
    height: 46,
    fontSize: 14,
    paddingVertical: 0,
    marginVertical: 0,
    textAlignVertical: "center",
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  entityBadgesRow: {
    flexDirection: "row",
    gap: 8,
  },
  entityPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  entityText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "900",
    fontSize: 15,
  },
  itemWrapper: {
    marginBottom: 10,
  },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardRipple: {
    padding: 12,
  },
  userRowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  artistRowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  artistIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    padding: 24,
    borderRadius: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
});
