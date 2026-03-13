
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { USER_TYPES } from '../constants';

import LoginScreen from '../screens/auth/LoginScreen';
import DeliveryStack from './DeliveryStack';
import SupplierStack from '../screens/supplier/SupplierStack';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    // Auth Stack
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : (
                    // Main Stack based on Role
                    user?.role === USER_TYPES.DELIVERY ? (
                        <Stack.Screen name="DeliveryRoot" component={DeliveryStack} />
                    ) : user?.role === USER_TYPES.SUPPLIER ? (
                        <Stack.Screen name="SupplierRoot" component={SupplierStack} />
                    ) : (
                        <Stack.Screen name="UnknownRole" component={() => (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text>Unknown Role: {user?.role}</Text>
                            </View>
                        )} />
                    )
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
