import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { CONFIG } from '../constants/Config';

// Ports and IP are now managed via .env -> Config.js
const BASE_URL = CONFIG.API_URL;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        const storedDairyId = await AsyncStorage.getItem('dairyId');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Prefer stored dairyId from session, fallback to hardcoded default
        config.headers['X-Dairy-ID'] = storedDairyId || CONFIG.DAIRY_ID;

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for consistent error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        let errorMessage = 'An unexpected error occurred';

        if (error.response) {
            // Priority: backend message -> status specific message -> generic fallback
            const data = error.response.data;
            errorMessage = data?.message || data?.error || errorMessage;

            if (error.response.status === 401) {
                errorMessage = 'Session expired. Please sign in again.';
            } else if (error.response.status === 403) {
                errorMessage = 'Access denied. Insufficient permissions.';
            } else if (error.response.status === 404) {
                errorMessage = 'The requested resource was not found.';
            } else if (error.response.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            }
        } else if (error.request) {
            errorMessage = 'Connection issue. Please check your internet.';
        } else {
            errorMessage = error.message;
        }

        // Return standardized error object
        return Promise.reject({
            ...error,
            userMessage: errorMessage
        });
    }
);

export default api;
