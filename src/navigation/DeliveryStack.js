import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/delivery/DashboardScreen';
import HolidayScreen from '../screens/delivery/HolidayScreen';
import ShiftSummaryScreen from '../screens/delivery/ShiftSummaryScreen';
import RequirementsScreen from '../screens/delivery/RequirementsScreen';
import PrivacyPolicyScreen from '../screens/policies/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/policies/TermsOfServiceScreen';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

const DeliveryStack = () => {
    const { logout } = useAuth();

    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    headerRight: () => (
                        <TouchableOpacity onPress={logout}>
                            <Text style={{ color: 'red', fontWeight: 'bold' }}>Logout</Text>
                        </TouchableOpacity>
                    ),
                    title: 'Dhenu Deliveries'
                }}
            />
            <Stack.Screen name="Holiday" component={HolidayScreen} options={{ title: 'Holiday' }} />
            <Stack.Screen name="Requirements" component={RequirementsScreen} options={{ title: 'Requirements' }} />
            <Stack.Screen name="ShiftSummary" component={ShiftSummaryScreen} options={{ title: 'End Shift' }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

export default DeliveryStack;
