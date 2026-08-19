import { useAuthStore, registerLogoutCallback } from '../useAuthStore';
import * as SecureStore from 'expo-secure-store';

// Reset the store before each test
const initialState = useAuthStore.getState();

describe('useAuthStore', () => {
    beforeEach(() => {
        useAuthStore.setState(initialState, true);
        jest.clearAllMocks();
    });

    it('should initialize with null session and user', () => {
        const state = useAuthStore.getState();
        expect(state.session).toBeNull();
        expect(state.user).toBeNull();
    });

    it('should setAuth sessions and user', () => {
        const session = { accessToken: 'at', refreshToken: 'rt' };
        const user = { id: '1', email: 'test@test.com' } as any;

        useAuthStore.getState().setAuth(session, user);

        const state = useAuthStore.getState();
        expect(state.session).toEqual(session);
        expect(state.user).toEqual(user);
    });

    it('should updateAccessToken correctly', () => {
        const session = { accessToken: 'old', refreshToken: 'rt' };
        useAuthStore.setState({ session });

        useAuthStore.getState().updateAccessToken('new');

        const state = useAuthStore.getState();
        expect(state.session?.accessToken).toBe('new');
        expect(state.session?.refreshToken).toBe('rt');
    });

    it('should updateFriendsCount correctly', () => {
        const user = { id: '1', friends_count: 5 } as any;
        useAuthStore.setState({ user });

        useAuthStore.getState().updateFriendsCount(2);
        expect(useAuthStore.getState().user?.friends_count).toBe(7);

        useAuthStore.getState().updateFriendsCount(-1);
        expect(useAuthStore.getState().user?.friends_count).toBe(6);
    });

    it('should handle logout and trigger callbacks', async () => {
        const callback = jest.fn();
        registerLogoutCallback(callback);

        useAuthStore.setState({
            session: { accessToken: 'at', refreshToken: 'rt' },
            user: { id: '1' } as any
        });

        await useAuthStore.getState().logout();

        const state = useAuthStore.getState();
        expect(state.session).toBeNull();
        expect(state.user).toBeNull();
        expect(callback).toHaveBeenCalled();
    });

    it('should update user partially via setUser', () => {
        const user = { id: '1', name: 'Old', email: 'test@test.com' } as any;
        useAuthStore.setState({ user });

        useAuthStore.getState().setUser({ name: 'New' });

        const state = useAuthStore.getState();
        expect(state.user?.name).toBe('New');
        expect(state.user?.email).toBe('test@test.com');
    });
});
