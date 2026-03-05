import { syncApi } from "../api/sync";
import { useSyncStore } from "../store/useSyncStore";
import { syncHelpers } from "./syncHelpers";

export const runDeltaSync = async () => {
  const { lastSyncTimestamp, setLastSyncTimestamp, setSyncing } =
    useSyncStore.getState();

  setSyncing(true);
  try {
    // 1. Sync Events
    const eventsResponse = await syncApi.getEvents(
      lastSyncTimestamp.events || undefined,
    );
    if (eventsResponse.data.data.length > 0) {
      await syncHelpers.processEntityUpdates(
        "events",
        eventsResponse.data.data,
      );
    }
    setLastSyncTimestamp("events", eventsResponse.data.sync_timestamp);

    // 2. Sync Artists
    const artistsResponse = await syncApi.getArtists(
      lastSyncTimestamp.artists || undefined,
    );
    if (artistsResponse.data.data.length > 0) {
      await syncHelpers.processEntityUpdates(
        "artists",
        artistsResponse.data.data,
      );
    }
    setLastSyncTimestamp("artists", artistsResponse.data.sync_timestamp);

    // 3. Sync Acts
    const actsResponse = await syncApi.getActs(
      lastSyncTimestamp.acts || undefined,
    );
    if (actsResponse.data.data.length > 0) {
      await syncHelpers.processEntityUpdates("acts", actsResponse.data.data);
    }
    setLastSyncTimestamp("acts", actsResponse.data.sync_timestamp);
  } catch (error) {
    console.error("Delta Sync failed:", error);
    throw error;
  } finally {
    setSyncing(false);
  }
};
