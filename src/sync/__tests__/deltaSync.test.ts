import { runDeltaSync } from '../deltaSync';
import { syncApi } from '../../api/sync';
import { useSyncStore } from '../../store/useSyncStore';
import { syncHelpers } from '../syncHelpers';

// Mock dependencies
jest.mock('../../api/sync', () => ({
    syncApi: {
        getEvents: jest.fn(),
        getArtists: jest.fn(),
        getActs: jest.fn(),
    },
}));

jest.mock('../../store/useSyncStore', () => ({
    useSyncStore: {
        getState: jest.fn(),
    },
}));

jest.mock('../syncHelpers', () => ({
    syncHelpers: {
        processEntityUpdates: jest.fn(),
    },
}));

describe('runDeltaSync', () => {
    let setSyncing: jest.Mock;
    let setLastSyncTimestamp: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        
        setSyncing = jest.fn();
        setLastSyncTimestamp = jest.fn();

        (useSyncStore.getState as jest.Mock).mockReturnValue({
            lastSyncTimestamp: { events: 100, artists: 200, acts: 300 },
            setLastSyncTimestamp,
            setSyncing,
        });

        // Mock API responses
        (syncApi.getEvents as jest.Mock).mockResolvedValue({
            data: { data: [{ id: 1 }], sync_timestamp: 101 }
        });
        (syncApi.getArtists as jest.Mock).mockResolvedValue({
            data: { data: [{ id: 2 }], sync_timestamp: 201 }
        });
        (syncApi.getActs as jest.Mock).mockResolvedValue({
            data: { data: [{ id: 3 }], sync_timestamp: 301 }
        });
    });

    it('should set syncing true at start and false at end', async () => {
        await runDeltaSync();
        expect(setSyncing).toHaveBeenCalledWith(true);
        expect(setSyncing).toHaveBeenCalledWith(false);
    });

    it('should fetch updates with correct timestamps', async () => {
        await runDeltaSync();
        expect(syncApi.getEvents).toHaveBeenCalledWith(100, expect.any(Object));
        expect(syncApi.getArtists).toHaveBeenCalledWith(200, expect.any(Object));
        expect(syncApi.getActs).toHaveBeenCalledWith(300, expect.any(Object));
    });

    it('should process updates in correct order (Events -> Artists -> Acts)', async () => {
        const order: string[] = [];
        (syncHelpers.processEntityUpdates as jest.Mock).mockImplementation(async (entity) => {
            order.push(entity);
        });

        await runDeltaSync();

        expect(order).toEqual(['events', 'artists', 'acts']);
    });

    it('should update timestamps after successful processing', async () => {
        await runDeltaSync();
        expect(setLastSyncTimestamp).toHaveBeenCalledWith('events', 101);
        expect(setLastSyncTimestamp).toHaveBeenCalledWith('artists', 201);
        expect(setLastSyncTimestamp).toHaveBeenCalledWith('acts', 301);
    });

    it('should handle partial failures (if one fetch fails, the whole sync fails)', async () => {
        (syncApi.getArtists as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

        await expect(runDeltaSync()).rejects.toThrow('Fetch failed');
        expect(setSyncing).toHaveBeenCalledWith(false);
    });
});
