import { eventsRepository } from '../events.repository';
import * as sqlite from '../../sqlite';

// Mock sqlite module
jest.mock('../../sqlite', () => ({
    getDb: jest.fn(),
    sanitizeParams: jest.fn(params => params),
    runExclusive: jest.fn(cb => cb()),
}));

describe('EventsRepository', () => {
    let mockDb: any;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockDb = {
            runAsync: jest.fn().mockResolvedValue({}),
            getAllAsync: jest.fn().mockResolvedValue([]),
            getFirstAsync: jest.fn().mockResolvedValue(null),
            withTransactionAsync: jest.fn(cb => cb()),
        };

        (sqlite.getDb as jest.Mock).mockResolvedValue(mockDb);
    });

    it('should upsert an event with user status', async () => {
        const event = {
            id: 'ev1',
            name: 'Test Event',
            user_status: 'going',
            banner: { url: 'banner.png' },
            start_date: '2026-01-01',
            end_date: '2026-01-02',
            version: 1,
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
        } as any;

        await eventsRepository.upsert(event);

        // Should insert into events
        expect(mockDb.runAsync).toHaveBeenCalledWith(
            expect.stringContaining('INSERT OR REPLACE INTO events'),
            expect.arrayContaining(['ev1', 'Test Event'])
        );

        // Should insert into user_event_attendance
        expect(mockDb.runAsync).toHaveBeenCalledWith(
            expect.stringContaining('INSERT OR REPLACE INTO user_event_attendance'),
            ['ev1', 'going']
        );
    });

    it('should get attending events with date filter', async () => {
        const mockRows = [
            { id: '1', name: 'Event 1', start_date: '2026-05-01', end_date: '2026-05-02' }
        ];
        mockDb.getAllAsync.mockResolvedValue(mockRows);

        const events = await eventsRepository.getAttendingEvents();

        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
            expect.stringContaining('SELECT e.* FROM events e'),
            [expect.any(String)] // now (ISO string)
        );
        expect(events).toHaveLength(1);
        expect(events[0].id).toBe('1');
    });

    it('should handle batch upsert in a transaction', async () => {
        const events = [
            { id: '1', name: 'E1' },
            { id: '2', name: 'E2' }
        ] as any;

        await eventsRepository.batchUpsert(events);

        expect(sqlite.runExclusive).toHaveBeenCalled();
        expect(mockDb.withTransactionAsync).toHaveBeenCalled();
        expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
    });
});
