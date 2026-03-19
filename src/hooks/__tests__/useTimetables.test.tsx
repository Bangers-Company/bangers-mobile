import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useToggleAttendance } from '../useTimetables';
import { timetablesApi } from '../../api/timetables';
import { useAuthStore } from '../../store/useAuthStore';

// Mock dependencies
jest.mock('../../api/timetables', () => ({
    timetablesApi: {
        toggleAttend: jest.fn(),
    },
}));

jest.mock('../../store/useAuthStore', () => ({
    useAuthStore: {
        getState: jest.fn(() => ({ user: { id: 'u1' } })),
    },
}));

describe('useToggleAttendance', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        jest.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    it('should perform optimistic update and then reconcile with server data', async () => {
        const initialTimetable = {
            id: 't1',
            entries: [{ id: 'e1', is_attending: false, count: 5 }]
        };
        queryClient.setQueryData(['timetable', 'personal', 't1'], initialTimetable);

        (timetablesApi.toggleAttend as jest.Mock).mockResolvedValue({
            data: { is_attending: true, count: 10 } // Server says 10
        });

        const { result } = renderHook(() => useToggleAttendance(), { wrapper });

        // Trigger mutation
        result.current.mutate({
            id: 't1',
            entryId: 'e1',
            isGroup: false,
            type: 'personal',
            targetId: 't1'
        });

        // Check optimistic state (immediately after trigger)
        // Note: count logic in cacheUpdates adds 1 for optimistic
        const optimisticData: any = queryClient.getQueryData(['timetable', 'personal', 't1']);
        expect(optimisticData.entries[0].is_attending).toBe(true);
        expect(optimisticData.entries[0].count).toBe(6);

        // Wait for success
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        // Check final state (server data 10)
        const finalData: any = queryClient.getQueryData(['timetable', 'personal', 't1']);
        expect(finalData.entries[0].is_attending).toBe(true);
        expect(finalData.entries[0].count).toBe(10);
    });

    it('should rollback on error', async () => {
        const initialTimetable = {
            id: 't1',
            entries: [{ id: 'e1', is_attending: false, count: 5 }]
        };
        queryClient.setQueryData(['timetable', 'personal', 't1'], initialTimetable);

        (timetablesApi.toggleAttend as jest.Mock).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useToggleAttendance(), { wrapper });

        result.current.mutate({
            id: 't1',
            entryId: 'e1',
            isGroup: false,
            type: 'personal',
            targetId: 't1'
        });

        // Check optimistic
        expect(queryClient.getQueryData<any>(['timetable', 'personal', 't1']).entries[0].is_attending).toBe(true);

        // Wait for error
        await waitFor(() => expect(result.current.isError).toBe(true));

        // Check rollback
        const rolledBackData: any = queryClient.getQueryData(['timetable', 'personal', 't1']);
        expect(rolledBackData.entries[0].is_attending).toBe(false);
        expect(rolledBackData.entries[0].count).toBe(5);
    });
});
