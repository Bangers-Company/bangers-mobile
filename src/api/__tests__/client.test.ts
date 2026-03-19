import axios from 'axios';
import apiClient from '../client';
import { useAuthStore } from '../../store/useAuthStore';

// Mock everything needed
jest.mock('axios', () => {
    const mockAxiosInstance = {
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        },
        create: jest.fn().mockReturnThis(),
    };
    return {
        create: jest.fn(() => mockAxiosInstance),
        post: jest.fn(),
        default: {
            create: jest.fn(() => mockAxiosInstance),
            post: jest.fn(),
        }
    };
});

jest.mock('../../store/useAuthStore', () => ({
    useAuthStore: {
        getState: jest.fn(),
    },
}));

describe('apiClient', () => {
    let requestInterceptor: any;
    let responseInterceptorSuccess: any;
    let responseInterceptorError: any;

    beforeAll(() => {
        // Since apiClient is the result of axios.create(), and we mocked it...
        // it should have the mocked interceptors.
        requestInterceptor = (apiClient.interceptors.request.use as jest.Mock).mock.calls[0][0];
        responseInterceptorSuccess = (apiClient.interceptors.response.use as jest.Mock).mock.calls[0][0];
        responseInterceptorError = (apiClient.interceptors.response.use as jest.Mock).mock.calls[0][1];
    });

    it('should add Authorization header when accessToken exists', async () => {
        (useAuthStore.getState as jest.Mock).mockReturnValue({
            session: { accessToken: 'test-token' }
        });

        const config = { headers: {} } as any;
        const result = await requestInterceptor(config);
        expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('should unwrap Laravel "data" wrapper', () => {
        const response = {
            data: { data: { id: 123 } }
        };
        const result = responseInterceptorSuccess(response);
        expect(result.data).toEqual({ id: 123 });
    });

    it('should handle 401 error and trigger logout on refresh failure', async () => {
        const error = {
            config: { _retry: false, headers: {} },
            response: { status: 401 }
        };

        const mockLogout = jest.fn();
        (useAuthStore.getState as jest.Mock).mockReturnValue({
            session: { refreshToken: 'refresh-token' },
            logout: mockLogout
        });

        (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Refresh failed'));

        try {
            await responseInterceptorError(error);
        } catch (e) {
            // expected
        }

        expect(mockLogout).toHaveBeenCalled();
    });
});
