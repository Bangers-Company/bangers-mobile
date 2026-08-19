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

    // Helper to safely extract items array and sync timestamp
    const extractSyncResult = (res: any) => {
      const payload = res?.data;
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      const syncTimestamp = payload?.sync_timestamp || res?.data?.sync_timestamp;
      return { items, syncTimestamp };
    };

    const eventsResult = extractSyncResult(eventsResponse);
    if (eventsResult.items.length > 0) {
      await syncHelpers.processEntityUpdates("events", eventsResult.items);
    }
    if (eventsResult.syncTimestamp) {
      setLastSyncTimestamp("events", eventsResult.syncTimestamp);
    }

    const artistsResult = extractSyncResult(artistsResponse);
    if (artistsResult.items.length > 0) {
      await syncHelpers.processEntityUpdates("artists", artistsResult.items);
    }
    if (artistsResult.syncTimestamp) {
      setLastSyncTimestamp("artists", artistsResult.syncTimestamp);
    }

    const actsResult = extractSyncResult(actsResponse);
    if (actsResult.items.length > 0) {
      await syncHelpers.processEntityUpdates("acts", actsResult.items);
    }
    if (actsResult.syncTimestamp) {
      setLastSyncTimestamp("acts", actsResult.syncTimestamp);
    }
  } catch (error) {
    console.error("Delta Sync failed:", error);
    throw error;
  } finally {
    setSyncing(false);
  }
};
