import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LucideCheckCircle, LucideLogOut } from 'lucide-react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ShiftSummaryScreen = ({ navigation }) => {
    const { logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        delivered: 0,
        bottles: 0,
        cash: 0 // Placeholder if we had cash tracking
    });

    useEffect(() => {
        fetchShiftStats();
    }, []);

    const fetchShiftStats = async () => {
        try {
            // Re-using my-orders endpoint to calc stats client side for now
            // Ideally backend aggregation endpoint
            const res = await api.get('/order-service/delivery-boy/my-orders');
            const deliveries = res.data.data || res.data;

            const total = deliveries.length;
            const delivered = deliveries.filter(d => d.order_status === 'delivered').length;

            // Assuming we fetch bottle return orders or if we store bottle count on original order
            // Since we store bottle return as a separate order type 'bottle_collect', we need to check if 'my-orders' returns those.
            // Current 'my-orders' in controller returns ALL orders for the rider.

            // Filter "bottle_collect" orders created today
            const bottleOrders = deliveries.filter(d => d.order_type === 'bottle_collect');
            const bottles = bottleOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);

            setStats({
                total,
                delivered,
                bottles,
                cash: 0
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Stats Unavailable', error.userMessage || 'We couldn\'t calculate your shift stats right now.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'End Shift',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', onPress: logout, style: 'destructive' }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <LucideCheckCircle size={64} color="#22c55e" style={styles.icon} />
                <Text style={styles.title}>Dhenu Shift Complete</Text>
                <Text style={styles.subtitle}>Great job! Here is your shift summary.</Text>

                <View style={styles.statsCard}>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Total Assigned</Text>
                        <Text style={styles.statValue}>{stats.total}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Delivered</Text>
                        <Text style={styles.statValue}>{stats.delivered}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Bottles Collected</Text>
                        <Text style={styles.statValue}>{stats.bottles}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LucideLogOut size={20} color="#fff" />
                    <Text style={styles.logoutText}>End Shift & Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -50,
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 40,
        textAlign: 'center',
    },
    statsCard: {
        backgroundColor: '#fff',
        width: '100%',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 40,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
    },
    statLabel: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    logoutBtn: {
        flexDirection: 'row',
        backgroundColor: '#ef4444',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        gap: 10,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    logoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ShiftSummaryScreen;
