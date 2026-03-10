import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import {
    Avatar,
    Text,
    TouchableRipple,
    useTheme,
    IconButton,
    Searchbar,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { friendsApi } from "../../src/api/friends";
import { User } from "../../src/types/user";

export default function FriendsListScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [friends, setFriends] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFriends = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res =
                id === "me"
                    ? await friendsApi.getFriends()
                    : await friendsApi.getUserFriends(id);

            setFriends((res as any).data.data || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load friends.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchFriends();
    }, [fetchFriends]);

    const renderFriend = ({ item }: { item: User }) => {
        return (
            <TouchableRipple
                onPress={() => router.push(`/user/${item.id}` as any)}
                style={styles.friendCardRipple}
            >
                <View style={styles.friendCard}>
                    {item.profile_media?.url ? (
                        <Avatar.Image
                            size={48}
                            source={{ uri: item.profile_media.url }}
                        />
                    ) : (
                        <Avatar.Text
                            size={48}
                            label={item.first_name.charAt(0)}
                            style={{ backgroundColor: theme.colors.primary }}
                        />
                    )}
                    <View style={styles.friendInfo}>
                        <Text variant="titleMedium" style={styles.friendName}>
                            {item.first_name} {item.last_name}
                        </Text>
                        <Text variant="bodyMedium" style={{ opacity: 0.6 }}>
                            @{item.username}
                        </Text>
                    </View>
                </View>
            </TouchableRipple>
        );
    };

    const filteredFriends = friends.filter((f) => {
        const query = searchQuery.toLowerCase();
        return (
            f.first_name.toLowerCase().includes(query) ||
            f.last_name.toLowerCase().includes(query) ||
            f.username.toLowerCase().includes(query)
        );
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerTop}>
                    <IconButton
                        icon="arrow-left"
                        onPress={() => router.back()}
                        style={styles.backButton}
                    />
                    <Text variant="titleLarge" style={styles.title}>
                        Friends
                    </Text>
                </View>
                {!loading && !error && friends.length > 0 && (
                    <Searchbar
                        placeholder="Search friends..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchBar}
                        elevation={0}
                    />
                )}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={{ color: theme.colors.error }}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredFriends}
                    keyExtractor={(item) => item.id}
                    renderItem={renderFriend}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={{ opacity: 0.5 }}>
                                {searchQuery ? "No matching friends found." : "No friends to display."}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    searchBar: {
        height: 44,
        backgroundColor: "rgba(0,0,0,0.05)",
    },
    backButton: {
        marginRight: 8,
    },
    title: {
        fontWeight: "bold",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    listContainer: {
        paddingVertical: 16,
    },
    friendCardRipple: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    friendCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontWeight: "bold",
    },
});
