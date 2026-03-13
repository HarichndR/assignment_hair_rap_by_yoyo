import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LucidePackage, LucideShoppingBag, LucideRefreshCcw, LucideCalendar, LucideSun, LucideMoon, LucideLayoutGrid } from 'lucide-react-native';
import api from '../../services/api';

const RequirementsScreen = () => {
    const [requirements, setRequirements] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [shift, setShift] = useState('all'); // all | morning | evening

    const fetchRequirements = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/order-service/orders/requirements/delivery-boy', {
                params: { shift: shift !== 'all' ? shift : undefined }
            });
            setRequirements(response.data.data || []);
        } catch (error) {
            console.error('[RequirementsScreen] Fetch error:', error);
            Alert.alert('Load Failed', error.userMessage || 'We couldn\'t load the requirements list. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchRequirements();
        }, [shift])
    );

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <LucidePackage size={24} color="#3b82f6" />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.productName}>{item.product.name}</Text>
                <View style={styles.badgeRow}>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{item.product.type || 'Item'}</Text>
                    </View>
                    <Text style={styles.variantText}>
                        {item.product.quantity} {item.product.unit}
                    </Text>
                </View>
            </View>
            <View style={styles.quantityContainer}>
                <Text style={styles.quantityValue}>{item.totalQuantity}</Text>
                <Text style={styles.totalLabel}>Total Packs</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Shift Filter */}
            <View style={styles.filterContainer}>
                {[
                    { id: 'all', label: 'All', icon: LucideLayoutGrid },
                    { id: 'morning', label: 'Morning', icon: LucideSun },
                    { id: 'evening', label: 'Evening', icon: LucideMoon }
                ].map(s => (
                    <TouchableOpacity
                        key={s.id}
                        style={[styles.filterBtn, shift === s.id && styles.activeFilterBtn]}
                        onPress={() => setShift(s.id)}
                    >
                        <s.icon size={16} color={shift === s.id ? '#fff' : '#64748b'} style={{ marginRight: 6 }} />
                        <Text style={[styles.filterBtnText, shift === s.id && styles.activeFilterText]}>{s.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.dateHeader}>
                <LucideCalendar size={16} color="#64748b" />
                <Text style={styles.dateText}>{new Date().toDateString()}</Text>
            </View>

            <FlatList
                data={requirements}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={fetchRequirements} tintColor="#3b82f6" />
                }
                ListEmptyComponent={
                    !isLoading && (
                        <View style={styles.emptyContainer}>
                            <LucideShoppingBag size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No requirements for this shift.</Text>
                        </View>
                    )
                }
            />

            <View style={styles.footer}>
                <Text style={styles.footerNote}>Check these items and their quantities before starting your delivery.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        gap: 10
    },
    filterBtn: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    activeFilterBtn: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    filterBtnText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '700'
    },
    activeFilterText: {
        color: '#fff',
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 8,
    },
    dateText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500'
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoContainer: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    typeBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
    },
    variantText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    categoryText: {
        fontSize: 12,
        color: '#94a3b8',
        textTransform: 'capitalize'
    },
    quantityContainer: {
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: 70,
    },
    quantityValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2563eb',
    },
    totalLabel: {
        fontSize: 10,
        color: '#3b82f6',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    unitText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600'
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 12,
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 16,
    },
    footer: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    footerNote: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        fontStyle: 'italic'
    }
});

export default RequirementsScreen;
