import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import CustomerDeliveryGroup from '../../components/CustomerDeliveryGroup';
import { LucideSearch, LucideTruck, LucideHistory, LucidePackage, LucideFilter, LucideSortAsc, LucideSun, LucideMoon, LucideLayoutGrid } from 'lucide-react-native';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DashboardScreen = () => {
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // active | history
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterShift, setFilterShift] = useState('all'); // all | morning | evening
    const [sortBy, setBy] = useState('sequence'); // sequence | name

    const navigation = useNavigation();

    const fetchDeliveries = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/delivery-service/my-deliveries');
            setDeliveries(response.data.data || response.data || []);
        } catch (error) {
            console.log('Fetch error:', error);
            Alert.alert('Unable to load deliveries', error.userMessage || 'We encountered a connection issue. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDeliveries();
        }, [])
    );

    const handleUpdate = () => {
        fetchDeliveries();
    };

    const processedList = useMemo(() => {
        let filtered = deliveries.filter(d => {
            if (activeTab === 'active') {
                return d.order_status === 'confirmed' || d.order_status === 'picked_up';
            }
            return d.order_status === 'delivered' || d.order_status === 'failed';
        });

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(d =>
                d.customer_id?.name?.toLowerCase().includes(q) ||
                d.address?.street?.toLowerCase().includes(q)
            );
        }

        if (filterShift !== 'all') {
            filtered = filtered.filter(d => d.shift?.toLowerCase() === filterShift);
        }

        const groups = {};
        filtered.forEach(d => {
            const custId = d.customer_id?._id || d.customer_id;
            if (!groups[custId]) {
                groups[custId] = {
                    id: custId,
                    customer: d.customer_id,
                    deliveries: [],
                    sequence: d.customer_id?.delivery_sequence || 0,
                    name: d.customer_id?.name || 'Unknown'
                };
            }
            groups[custId].deliveries.push(d);
        });

        const result = Object.values(groups);

        if (sortBy === 'sequence') {
            result.sort((a, b) => a.sequence - b.sequence);
        } else {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }

        return result;
    }, [deliveries, activeTab, searchQuery, filterShift, sortBy]);

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.locInfo}>
                    <Text style={styles.welcome}>Hello, {user?.name?.split(' ')[0]}</Text>
                    <Text style={styles.date}>{new Date().toDateString()}</Text>
                </View>
                <View style={styles.topIcons}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => setShowFilters(!showFilters)}>
                        <LucideFilter size={20} color={filterShift !== 'all' ? '#3b82f6' : '#64748b'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => setBy(sortBy === 'sequence' ? 'name' : 'sequence')}>
                        <LucideSortAsc size={20} color={sortBy === 'name' ? '#3b82f6' : '#64748b'} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <LucideSearch size={18} color="#94a3b8" />
                    <TextInput
                        placeholder="Search customer or street..."
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {showFilters && (
                <View style={styles.filterBar}>
                    {[
                        { id: 'all', label: 'All', icon: LucideLayoutGrid },
                        { id: 'morning', label: 'Morning', icon: LucideSun },
                        { id: 'evening', label: 'Evening', icon: LucideMoon }
                    ].map(s => (
                        <TouchableOpacity
                            key={s.id}
                            onPress={() => setFilterShift(s.id)}
                            style={[styles.filterPill, filterShift === s.id && styles.activeFilter]}
                        >
                            <s.icon size={14} color={filterShift === s.id ? '#fff' : '#64748b'} style={{ marginRight: 6 }} />
                            <Text style={[styles.filterText, filterShift === s.id && styles.activeFilterText]}>
                                {s.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.tabBar}>
                <TouchableOpacity
                    onPress={() => setActiveTab('active')}
                    style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                >
                    <LucideTruck size={18} color={activeTab === 'active' ? '#3b82f6' : '#94a3b8'} />
                    <Text style={[styles.tabLabel, activeTab === 'active' && styles.activeTabText]}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('history')}
                    style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                >
                    <LucideHistory size={18} color={activeTab === 'history' ? '#3b82f6' : '#94a3b8'} />
                    <Text style={[styles.tabLabel, activeTab === 'history' && styles.activeTabText]}>History</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.mainActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Requirements')}>
                    <LucidePackage size={18} color="#fff" />
                    <Text style={styles.actionText}>Pickup Requirements</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#64748b' }]} onPress={() => navigation.navigate('ShiftSummary')}>
                    <Text style={styles.actionText}>End Shift</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={processedList}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchDeliveries} />}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <CustomerDeliveryGroup
                        group={item}
                        onRefresh={handleUpdate}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No deliveries found</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 10, backgroundColor: '#fff' },
    welcome: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
    date: { fontSize: 13, color: '#64748b', marginTop: 2 },
    topIcons: { flexDirection: 'row', gap: 15 },
    iconBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 10 },
    searchContainer: { paddingHorizontal: 20, paddingBottom: 10, backgroundColor: '#fff' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 45 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1e293b' },
    filterBar: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 15, gap: 10, backgroundColor: '#fff' },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    activeFilter: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    filterText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
    activeFilterText: { color: '#fff' },
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff' },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
    activeTab: { borderBottomWidth: 3, borderBottomColor: '#3b82f6' },
    tabLabel: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
    activeTabText: { color: '#3b82f6' },
    mainActions: { flexDirection: 'row', padding: 15, gap: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#3b82f6', gap: 8 },
    actionText: { color: '#fff', fontWeight: '700' },
    list: { padding: 15 },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#94a3b8', fontSize: 15, textAlign: 'center' },
});

export default DashboardScreen;
