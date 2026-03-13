import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import api from '../services/api';
import { CONFIG } from '../constants/Config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expoPushToken, setExpoPushToken] = useState(null);

    useEffect(() => {
        loadUser();
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
    }, []);

    const loadUser = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');

            if (storedToken && storedUser) {
                const userObj = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(userObj);
                if (expoPushToken && userObj.notifications_enabled !== false) {
                    registerTokenWithBackend(userObj._id, expoPushToken);
                }
            }
        } catch (error) {
            console.log('Failed to load user', error);
        } finally {
            setIsLoading(false);
        }
    };

    const registerForPushNotificationsAsync = async () => {
        let token;
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Expo Push Token:', token);
        return token;
    };

    const registerTokenWithBackend = async (userId, pushToken) => {
        try {
            await api.post('/notification-service/fcm/register', {
                userId,
                token: pushToken,
                deviceType: 'android',
                deviceId: 'delivery-device-placeholder'
            });
            console.log('Push token registered with backend');
        } catch (error) {
            console.error('Failed to register push token with backend:', error);
        }
    };

    const unregisterTokenWithBackend = async (userId, pushToken) => {
        try {
            await api.delete('/notification-service/fcm/unregister', {
                data: { userId, token: pushToken }
            });
            console.log('Push token unregistered');
        } catch (error) {
            console.error('Failed to unregister push token:', error);
        }
    };

    const updateProfile = async (data) => {
        try {
            const response = await api.patch('/user-service/auth/me', data);
            const updatedUser = { ...user, ...response.data.data.user };
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            return { success: true };
        } catch (error) {
            console.error('Update profile error:', error);
            return {
                success: false,
                message: error.userMessage || 'Failed to update profile'
            };
        }
    };

    const requestOTP = async (mobile) => {
        try {
            const response = await api.post('/notification-service/otp/send', {
                mobile,
                type: 'login'
            });
            return {
                success: true,
                message: response.data?.message || 'OTP sent successfully'
            };
        } catch (error) {
            console.log('Request OTP error:', error);
            return {
                success: false,
                message: error.userMessage || 'Failed to send OTP'
            };
        }
    };

    const verifyOTP = async (mobile, otp) => {
        try {
            const verifyResponse = await api.post('/notification-service/otp/verify', {
                mobile,
                otp
            });

            if (!verifyResponse.data?.success) {
                return {
                    success: false,
                    message: verifyResponse.data?.message || 'Invalid OTP'
                };
            }

            const loginResponse = await api.post('/user-service/auth/login', {
                mobile
            });

            const { token, user } = loginResponse.data.data;

            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            setToken(token);
            setUser(user);

            if (expoPushToken) {
                await registerTokenWithBackend(user._id, expoPushToken);
            }

            return { success: true };
        } catch (error) {
            console.log('Verify OTP error:', error);
            return {
                success: false,
                message: error.userMessage || 'Login failed'
            };
        }
    };

    const loginWithPassword = async (mobile, password) => {
        try {
            console.log(`[Auth] Attempting login for ${mobile} with dairy ${CONFIG.DAIRY_ID} at ${CONFIG.API_URL}`);
            console.log('[Auth] Payload:', { mobile, password: '***', role: 'delivery_boy', dairy_id: CONFIG.DAIRY_ID });

            const response = await api.post('/user-service/auth/login', {
                mobile,
                password,
                role: 'delivery_boy',
                dairy_id: CONFIG.DAIRY_ID
            });

            console.log('[Auth] Login response:', response.status, response.data);

            // detailed logging for debugging
            console.log('[Auth] Response keys:', Object.keys(response.data));

            // Check for success status (API returns { status: 'success', ... } or { success: true, ... })
            const isSuccess = response.data?.success === true || response.data?.status === 'success';

            if (!isSuccess) {
                throw new Error(response.data?.message || 'Login failed');
            }

            const { token, user } = response.data.data;

            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            setToken(token);
            setUser(user);

            if (expoPushToken) {
                await registerTokenWithBackend(user._id, expoPushToken);
            }

            return { success: true };
        } catch (error) {
            console.error('[Auth] Login error full:', error);
            if (error.code === 'ECONNABORTED') {
                console.error('[Auth] Request timed out');
            }
            if (error.response) {
                console.error('[Auth] Error Response Data:', JSON.stringify(error.response.data, null, 2));
                console.error('[Auth] Error Response Status:', error.response.status);
            } else if (error.request) {
                console.error('[Auth] Error Request (No Response):', error.request);
                console.error('[Auth] Is network connected? Check API URL.');
            } else {
                console.error('[Auth] Error Message:', error.message);
            }

            return {
                success: false,
                message: error.userMessage || "Login failed"
            };
        }
    };

    const logout = async () => {
        try {
            if (user && expoPushToken) {
                await unregisterTokenWithBackend(user._id, expoPushToken);
            }
        } catch (error) {
            console.error('Logout unregister error:', error);
        }

        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            requestOTP,
            verifyOTP,
            loginWithPassword,
            updateProfile,
            unregisterTokenWithBackend,
            logout,
            isAuthenticated: !!token,
            expoPushToken
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
