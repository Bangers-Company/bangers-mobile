import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, History, UserPlus, UserCheck, Clock, Users, ShieldAlert, ShieldCheck } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import {
    Avatar,
    Button,
    Text,
    TouchableRipple,
    useTheme,
    ActivityIndicator,
    IconButton,
} from "react-native-paper";
import ContentLoader, { Rect } from "react-content-loader/native";
import { useAuthStore } from "../../src/store/useAuthStore";
import { resolveMediaUrl } from "../../src/utils/format";
import {
    EventCard,
} from "../../src/components/event/EventCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageContainer } from "../../src/components/PageContainer";
import { useUser } from "../../src/hooks/useUser";
import { useFriendshipStatus, useFriendshipActions } from "../../src/hooks/useFriendship";
import { useQueryClient } from "@tanstack/react-query";

export default function PublicProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const currentUser = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();

    const { data: profileUser, isLoading: userLoading, error: userError, refetch: refetchUser } = useUser(id);
    const { data: friendshipStatus = "none", isLoading: friendshipLoading } = useFriendshipStatus(id);
    const { sendRequest, acceptRequest, removeFriend } = useFriendshipActions(id);

    const [actionLoading, setActionLoading] = useState(false);

    const handleRefresh = useCallback(async () => {
        await Promise.all([
            refetchUser(),
            queryClient.invalidateQueries({ queryKey: ['friendship', id] })
        ]);
    }, [id, refetchUser, queryClient]);

    const handleFriendAction = async () => {
        if (!id || actionLoading) return;
        setActionLoading(true);
        try {
            if (friendshipStatus === "none") {
                await sendRequest.mutateAsync();
            } else if (friendshipStatus === "pending_received") {
                await acceptRequest.mutateAsync();
            } else if (friendshipStatus === "friends") {
                await removeFriend.mutateAsync();
            }
        } catch (e) {
            console.error("Failed friend action", e);
        } finally {
            setActionLoading(false);
        }
    };

    if (userLoading && !profileUser) {
        return (
            <PageContainer style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </PageContainer>
        );
    }

    if (userError || !profileUser) {
        return (
            <PageContainer style={styles.center}>
                <Text variant="titleMedium" style={{ color: theme.colors.error }}>
                    {(userError as any)?.message || "User not found"}
                </Text>
                <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 16 }}>Go Back</Button>
            </PageContainer>
        );
    }

    const rawAttending = profileUser.upcoming_events;
    const attendingEvents = Array.isArray(rawAttending) ? rawAttending : (rawAttending as any)?.data || [];

    const rawPast = profileUser.past_events;
    const pastEvents = Array.isArray(rawPast) ? rawPast : (rawPast as any)?.data || [];

    const stats = {
        upcoming: attendingEvents.length,
        past: pastEvents.length,
        friendsCount: profileUser.friends_count || 0
    };

    return (
        <PageContainer withPadding={false} withSafeArea={false}>
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={userLoading} onRefresh={handleRefresh} />}
            >
            <View style={[styles.header, { paddingTop: insets.top + 40 }]}>
                <IconButton
                    icon="arrow-left"
                    style={[styles.backButton, { top: insets.top }]}
                    onPress={() => router.back()}
                />
                <View style={styles.profileHeader}>
                    {profileUser.profile_media_url ? (
                        <Avatar.Image
                            size={100}
                            source={{ uri: resolveMediaUrl(profileUser.profile_media_url) || undefined }}
                        />
                    ) : (
                        <Avatar.Text
                            size={100}
                            label={profileUser.first_name?.charAt(0) || "U"}
                            style={{ backgroundColor: theme.colors.primary }}
                        />
                    )}
                    <View style={styles.profileInfo}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text variant="headlineMedium" style={styles.userName}>
                                {profileUser.first_name} {profileUser.last_name}
                            </Text>
                            {profileUser.roles?.some((r: any) => (typeof r === 'string' ? r === 'admin' : r?.name === 'admin')) && (
                                <ShieldAlert size={24} color={theme.colors.error} />
                            )}
                            {!profileUser.roles?.some((r: any) => (typeof r === 'string' ? r === 'admin' : r?.name === 'admin')) &&
                                profileUser.roles?.some((r: any) => (typeof r === 'string' ? r === 'moderator' : r?.name === 'moderator')) && (
                                    <ShieldCheck size={24} color={theme.colors.primary} />
                                )}
                        </View>
                        <Text variant="titleMedium" style={styles.userEmail}>
                            @{profileUser.username}
                        </Text>

                        {currentUser && currentUser.id !== id && (
                            <Button
                                mode={friendshipStatus === "friends" ? "outlined" : "contained"}
                                onPress={handleFriendAction}
                                loading={actionLoading || sendRequest.isPending || acceptRequest.isPending || removeFriend.isPending}
                                disabled={friendshipStatus === "pending_sent"}
                                icon={
                                    friendshipStatus === "none" ? () => <UserPlus size={18} color="white" /> :
                                        friendshipStatus === "friends" ? () => <UserCheck size={18} color={theme.colors.primary} /> :
                                            friendshipStatus === "pending_received" ? () => <UserCheck size={18} color="white" /> :
                                                () => <Clock size={18} color="white" />
                                }
                                style={styles.friendButton}
                            >
                                {friendshipStatus === "none" ? "Add Friend" :
                                    friendshipStatus === "friends" ? "Friends" :
                                        friendshipStatus === "pending_received" ? "Accept Request" :
                                            "Request Sent"}
                            </Button>
                        )}
                    </View>
                </View>

                {profileUser.bio && (
                    <Text variant="bodyLarge" style={styles.bioText}>{profileUser.bio}</Text>
                )}

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Calendar size={24} color={theme.colors.primary} style={{ marginBottom: 4 }} />
                        <Text variant="titleMedium" style={styles.statValue}>{stats.upcoming}</Text>
                        <Text variant="labelSmall" style={styles.statLabel}>Events</Text>
                    </View>
                    <View style={styles.statItem}>
                        <History size={24} color={theme.colors.primary} style={{ marginBottom: 4 }} />
                        <Text variant="titleMedium" style={styles.statValue}>{stats.past}</Text>
                        <Text variant="labelSmall" style={styles.statLabel}>Past</Text>
                    </View>
                    <TouchableRipple onPress={() => {
                        if (friendshipStatus === "friends" || id === currentUser?.id) {
                            router.push(`/friends/${id}` as any);
                        }
                    }}>
                        <View style={styles.statItem}>
                            <Users size={24} color={theme.colors.primary} style={{ marginBottom: 4 }} />
                            <Text variant="titleMedium" style={styles.statValue}>{stats.friendsCount}</Text>
                            <Text variant="labelSmall" style={styles.statLabel}>Friends</Text>
                        </View>
                    </TouchableRipple>
                </View>
            </View>

            <View style={styles.section}>
                <Text variant="titleLarge" style={styles.sectionTitle}>Upcoming Events</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {attendingEvents.length > 0 ? (
                        attendingEvents.map((event: any) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                variant="horizontal"
                                style={{ marginRight: 16 }}
                                onPress={(e: any) => router.push(`/event/${e.id}` as any)}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No upcoming events</Text>
                    )}
                </ScrollView>
            </View>

            <View style={styles.section}>
                <Text variant="titleLarge" style={styles.sectionTitle}>Past Events</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {pastEvents.length > 0 ? (
                        pastEvents.map((event: any) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                variant="horizontal"
                                style={{ marginRight: 16 }}
                                onPress={(e: any) => router.push(`/event/${e.id}` as any)}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No past events</Text>
                    )}
                </ScrollView>
            </View>
            <View style={{ height: 100 }} />
            </ScrollView>
        </PageContainer>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    backButton: { position: "absolute", left: 8, zIndex: 10 },
    header: { padding: 24, paddingBottom: 16 },
    profileHeader: { flexDirection: "row", alignItems: "center", gap: 24, paddingBottom: 16 },
    profileInfo: { flex: 1, gap: 4 },
    userName: { fontWeight: "800", letterSpacing: -0.5 },
    userEmail: { opacity: 0.6, marginBottom: 8 },
    friendButton: { marginTop: 8, alignSelf: "flex-start", borderRadius: 8 },
    bioText: { marginTop: 12, opacity: 0.8, lineHeight: 22 },
    statsContainer: { flexDirection: "row", justifyContent: "space-around", marginTop: 24, backgroundColor: "rgba(0,0,0,0.03)", padding: 20, borderRadius: 24 },
    statItem: { alignItems: "center" },
    statValue: { fontWeight: "bold" },
    statLabel: { opacity: 0.5, textTransform: "uppercase", fontSize: 10 },
    section: { paddingHorizontal: 24, marginTop: 32 },
    sectionTitle: { fontWeight: "bold", marginBottom: 16, marginLeft: 4 },
    horizontalScroll: { paddingRight: 24, minHeight: 130 },
    emptyText: { opacity: 0.5, fontStyle: "italic", paddingVertical: 12 },
});
