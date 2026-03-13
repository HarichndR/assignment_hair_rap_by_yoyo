import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import InvoiceScreen from './InvoiceScreen';
import RateChartScreen from './RateChartScreen';

const Stack = createNativeStackNavigator();

const SupplierStack = () => {
    const { logout } = useAuth();

    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Invoices"
                component={InvoiceScreen}
                options={({ navigation }) => ({
                    title: 'My Procurements',
                    headerRight: () => (
                        <TouchableOpacity onPress={logout} style={{ marginRight: 10 }}>
                            <Text style={{ color: 'red', fontWeight: 'bold' }}>Logout</Text>
                        </TouchableOpacity>
                    ),
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => navigation.navigate('RateChart')} style={{ marginLeft: 0, marginRight: 15 }}>
                            <Text style={{ color: '#4f46e5', fontWeight: 'bold' }}>Rates</Text>
                        </TouchableOpacity>
                    )
                })}
            />
            <Stack.Screen
                name="RateChart"
                component={RateChartScreen}
                options={{ title: 'Rate Chart' }}
            />
        </Stack.Navigator>
    );
};

export default SupplierStack;
