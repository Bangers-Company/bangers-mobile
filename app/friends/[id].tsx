import { useLocalSearchParams, useRouter } from "expo-router";
import { ShieldAlert, ShieldCheck } from "lucide-react-native";
import React, { useState, useRef, useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View, KeyboardAvoidingView, Platform, Animated } from "react-native";
import {
    Avatar,
    Text,
    TouchableRipple,
    useTheme,
    IconButton,
    Searchbar,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User } from "../../src/types/user";
import { resolveMediaUrl } from "../../src/utils/format";
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
            return (
                f.first_name.toLowerCase().includes(query) ||
                f.last_name.toLowerCase().includes(query) ||
                f.username.toLowerCase().includes(query)
            );
        });
    }, [friends, searchQuery]);

    const renderFriend = ({ item }: { item: User }) => {
        return (
            <TouchableRipple
                onPress={() => router.push(`/user/${item.id}` as any)}
                style={styles.friendCardRipple}
            >
                <View style={styles.friendCard}>
                    {item.profile_media_url ? (
                        <Avatar.Image
                            size={48}
                            source={{ uri: resolveMediaUrl(item.profile_media_url) || undefined }}
                        />
                    ) : (
                        <Avatar.Text
                            size={48}
                            label={item.first_name?.charAt(0) || "U"}
                            style={{ backgroundColor: theme.colors.primary }}
                        />
                    )}
                    <View style={styles.friendInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text variant="titleMedium" style={styles.friendName}>
                                {item.first_name} {item.last_name}
                            </Text>
                            {item.roles?.some((r: any) => (typeof r === 'string' ? r === 'admin' : r?.name === 'admin')) && (
                                <ShieldAlert size={16} color={theme.colors.error} />
                            )}
                            {!item.roles?.some((r: any) => (typeof r === 'string' ? r === 'admin' : r?.name === 'admin')) &&
                                item.roles?.some((r: any) => (typeof r === 'string' ? r === 'moderator' : r?.name === 'moderator')) && (
                                    <ShieldCheck size={16} color={theme.colors.primary} />
                                )}
                        </View>
                        <Text variant="bodyMedium" style={{ opacity: 0.6 }}>
                            @{item.username}
                        </Text>
                    </View>
                </View>
            </TouchableRipple>
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <PageContainer withPadding={false} style={styles.container}>
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
                                        backgroundColor: isFocused ? theme.colors.surface : "rgba(0,0,0,0.04)",
                                        borderColor: isFocused ? theme.colors.primary : "transparent",
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
    listContainer: { paddingVertical: 16 },
    friendCardRipple: { paddingHorizontal: 16, paddingVertical: 12 },
    friendCard: { flexDirection: "row", alignItems: "center", gap: 16 },
    friendInfo: { flex: 1 },
    friendName: { fontWeight: "bold" },
});
