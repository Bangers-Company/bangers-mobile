import { syncApi } from "../api/sync";
import { useSyncStore } from "../store/useSyncStore";
import { syncHelpers } from "./syncHelpers";

export const runDeltaSync = async (signal?: AbortSignal) => {
  const { lastSyncTimestamp, setLastSyncTimestamp, setSyncing } =
    useSyncStore.getState();

  setSyncing(true);
  try {
    // Run all fetches in parallel for speed
    const [eventsResponse, artistsResponse, actsResponse] = await Promise.all([
      syncApi.getEvents(lastSyncTimestamp.events || undefined, { signal }),
      syncApi.getArtists(lastSyncTimestamp.artists || undefined, { signal }),
      syncApi.getActs(lastSyncTimestamp.acts || undefined, { signal }),
    ]);

    // Process results SEQUENTIALLY to ensure referential integrity
    // Order: Events -> Artists -> Acts
    if (eventsResponse.data?.data && eventsResponse.data.data.length > 0) {
      await syncHelpers.processEntityUpdates("events", eventsResponse.data.data);
    }
    if (eventsResponse.data?.sync_timestamp) {
      setLastSyncTimestamp("events", eventsResponse.data.sync_timestamp);
    }

    if (artistsResponse.data?.data && artistsResponse.data.data.length > 0) {
      await syncHelpers.processEntityUpdates("artists", artistsResponse.data.data);
    }
    if (artistsResponse.data?.sync_timestamp) {
      setLastSyncTimestamp("artists", artistsResponse.data.sync_timestamp);
    }

    if (actsResponse.data?.data && actsResponse.data.data.length > 0) {
      await syncHelpers.processEntityUpdates("acts", actsResponse.data.data);
    }
    if (actsResponse.data?.sync_timestamp) {
      setLastSyncTimestamp("acts", actsResponse.data.sync_timestamp);
    }
  } catch (error) {
    console.error("Delta Sync failed:", error);
    throw error;
  } finally {
    setSyncing(false);
  }
};
