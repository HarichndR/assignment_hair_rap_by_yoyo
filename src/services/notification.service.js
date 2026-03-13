import api from './api';

export const notificationService = {
    /**
     * Register FCM Token with backend
     * @param {string} token - FCM/Device Token
     */
    registerFCMToken: async (token) => {
        return api.post('/notification-service/fcm/register', { token });
    },

    /**
     * Unregister FCM Token
     * @param {string} token - FCM/Device Token
     */
    unregisterFCMToken: async (token) => {
        return api.delete('/notification-service/fcm/unregister', { data: { token } });
    }
};

export default notificationService;
