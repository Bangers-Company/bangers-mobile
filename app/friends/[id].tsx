import { useLocalSearchParams, useRouter } from "expo-router";
import { ShieldAlert, ShieldCheck } from "lucide-react-native";
import React, { useState, useRef, useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View, KeyboardAvoidingView, Platform, Animated } from "react-native";
import {
    Avatar,
    Surface,
    Text,
    TouchableRipple,
    useTheme,
    IconButton,
    Searchbar,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User } from "../../src/types/user";
import { resolveMediaUrl, getUserDisplayName } from "../../src/utils/format";
import { addAlpha } from "../../src/utils/theme";


import { PageContainer } from "../../src/components/PageContainer";
import { useFriends } from "../../src/hooks/useFriends";

export default function FriendsListScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [searchQuery, setSearchQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const { data: friends = [], isLoading, error: friendsError, refetch } = useFriends(id);
    const error = friendsError ? (friendsError as any).message : null;

    const focusAnim = useRef(new Animated.Value(0)).current;

    const handleFocus = () => {
        setIsFocused(true);
        Animated.spring(focusAnim, {
            toValue: 1,
            useNativeDriver: false,
            friction: 8,
            tension: 50,
        }).start();
    };

    const handleBlur = () => {
        setIsFocused(false);
        Animated.spring(focusAnim, {
            toValue: 0,
            useNativeDriver: false,
            friction: 8,
            tension: 50,
        }).start();
    };

    const searchContainerStyle = {
        transform: [
            {
                translateY: focusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                }),
            },
        ],
        shadowOpacity: focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.15],
        }),
        shadowRadius: focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 8],
        }),
        elevation: focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 6],
        }),
    };

    const filteredFriends = useMemo(() => {
        return friends.filter((f: User) => {
            const query = searchQuery.toLowerCase();
            const firstName = (f.first_name || "").toLowerCase();
            const lastName = (f.last_name || "").toLowerCase();
            const username = (f.username || "").toLowerCase();
            return (
                firstName.includes(query) ||
                lastName.includes(query) ||
                username.includes(query)
            );
        });
    }, [friends, searchQuery]);

    const renderFriend = ({ item }: { item: User }) => {
        const isAdmin = item.roles?.some((r: any) =>
            typeof r === "string" ? r === "admin" : r?.name === "admin",
        );
        const isModerator =
            !isAdmin &&
            item.roles?.some((r: any) =>
                typeof r === "string" ? r === "moderator" : r?.name === "moderator",
            );

        return (
            <Surface
                style={[styles.friendCardSurface, { backgroundColor: theme.colors.surface }]}
                elevation={1}
            >
                <TouchableRipple
                    onPress={() => router.push(`/user/${item.id}` as any)}
                    style={styles.friendCardRipple}
                    rippleColor="rgba(0,0,0,0.05)"
                >
                    <View style={styles.friendCardContent}>
                        {resolveMediaUrl(item.profile_media_url) ? (
                            <Avatar.Image
                                size={48}
                                source={{
                                    uri: resolveMediaUrl(item.profile_media_url)!,
                                }}
                            />
                        ) : (
                            <Avatar.Text
                                size={48}
                                label={getUserDisplayName(item).charAt(0).toUpperCase()}
                                style={{ backgroundColor: theme.colors.primary }}
                                color="#ffffff"
                            />
                        )}

                        <View style={styles.friendInfo}>
                            <View style={styles.nameRow}>
                                <Text variant="titleMedium" style={[styles.friendName, { color: theme.colors.onSurface }]}>
                                    {getUserDisplayName(item)}
                                </Text>
                                {isAdmin && <ShieldAlert size={16} color={theme.colors.error} />}
                                {isModerator && <ShieldCheck size={16} color={theme.colors.primary} />}
                            </View>
                            {item.username && (
                                <Text variant="bodySmall" style={[styles.friendUsername, { color: theme.colors.onSurface, opacity: 0.6 }]}>
                                    @{item.username}
                                </Text>
                            )}
                        </View>
                    </View>
                </TouchableRipple>
            </Surface>
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <PageContainer withPadding={false} withSafeArea={false} style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <View style={styles.headerTop}>
                        <IconButton
                            icon="arrow-left"
                            iconColor={theme.colors.onSurface}
                            onPress={() => router.back()}
                            style={styles.backButton}
                        />
                        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
                            Friends
                        </Text>
                    </View>
                </View>

                {isLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : error ? (
                    <View style={styles.center}>
                        <Text style={{ color: theme.colors.error }}>{error}</Text>
                        <IconButton icon="refresh" onPress={() => refetch()} />
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
                {!isLoading && !error && friends.length > 0 && (
                    <View style={[styles.searchWrapper, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                        <Animated.View style={[styles.searchAnimatedContainer, searchContainerStyle]}>
                            <Searchbar
                                placeholder="Find a friend..."
                                onChangeText={setSearchQuery}
                                value={searchQuery}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                style={[
                                    styles.searchBar,
                                    {
                                        backgroundColor: theme.colors.surface,
                                        borderColor: isFocused ? theme.colors.primary : addAlpha(theme.colors.onSurface, 0.15),
                                        borderWidth: 1,
                                    }
                                ]}
                                inputStyle={styles.searchInput}

                                elevation={0}
                            />
                        </Animated.View>
                    </View>
                )}
            </PageContainer>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    searchWrapper: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: "transparent" },
    searchAnimatedContainer: { borderRadius: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 4 } },
    searchBar: { height: 56, borderRadius: 28 },
    searchInput: { fontSize: 16 },
    backButton: { marginRight: 8 },
    title: { fontWeight: "bold" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    listContainer: { padding: 16 },
    friendCardSurface: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
    friendCardRipple: { padding: 16 },
    friendCardContent: { flexDirection: "row", alignItems: "center", gap: 16 },
    friendInfo: { flex: 1 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    friendName: { fontWeight: "800" },
    friendUsername: { opacity: 0.6 },
});

