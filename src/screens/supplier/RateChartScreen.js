import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';

const RateChartScreen = () => {
    const [loading, setLoading] = useState(true);
    const [rates, setRates] = useState([]);
    const [activeType, setActiveType] = useState('Cow'); // Cow | Buffalo

    useEffect(() => {
        fetchRates();
    }, [activeType]);

    const fetchRates = async () => {
        try {
            setLoading(true);
            const category = (activeType === 'Cow' || activeType === 'Buffalo') ? 'Milk' : activeType;
            const response = await api.get(`/procurement-service/rate-chart`, {
                params: { type: activeType, category }
            });
            setRates(response.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch rates:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.rateRow}>
            {item.category === 'Milk' || !item.category ? (
                <>
                    <Text style={styles.cell}>{item.fat?.toFixed(1) || '-'}</Text>
                    <Text style={styles.cell}>{item.snf?.toFixed(1) || '-'}</Text>
                </>
            ) : (
                <Text style={[styles.cell, { flex: 2, textAlign: 'left', paddingLeft: 10 }]}>{item.product_name}</Text>
            )}
            <Text style={[styles.cell, styles.rateCell]}>₹{item.rate?.toFixed(2)}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Dhenu Rate Chart</Text>
                <Text style={styles.subtitle}>Current Rate Chart for Suppliers</Text>
            </View>

            <View style={styles.toggleContainer}>
                {['Cow', 'Buffalo', 'Vegetable'].map(t => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.toggleBtn, activeType === t && styles.activeToggle]}
                        onPress={() => setActiveType(t)}
                    >
                        <Text style={[styles.toggleText, activeType === t && styles.activeText]}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.tableHeader}>
                {(activeType === 'Cow' || activeType === 'Buffalo') ? (
                    <>
                        <Text style={styles.headerCell}>FAT</Text>
                        <Text style={styles.headerCell}>SNF</Text>
                    </>
                ) : (
                    <Text style={[styles.headerCell, { flex: 2, textAlign: 'left', paddingLeft: 10 }]}>PRODUCT</Text>
                )}
                <Text style={styles.headerCell}>Rate (₹)</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={rates}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No rates found for {activeType} milk</Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    toggleContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    toggleBtn: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#e2e8f0',
    },
    activeToggle: {
        backgroundColor: '#4f46e5',
    },
    toggleText: {
        fontWeight: '600',
        color: '#64748b',
    },
    activeText: {
        color: 'white',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#e0e7ff',
        borderTopWidth: 1,
        borderTopColor: '#c7d2fe',
    },
    headerCell: {
        flex: 1,
        fontWeight: '700',
        color: '#3730a3',
        textAlign: 'center',
    },
    rateRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: 'white',
    },
    cell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        color: '#334155',
    },
    rateCell: {
        fontWeight: 'bold',
        color: '#059669',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 16,
    }
});

export default RateChartScreen;
