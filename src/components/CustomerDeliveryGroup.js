import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ScrollView, Linking } from 'react-native';
import { LucideChevronDown, LucideChevronUp, LucideInfo, LucideMilk, LucideIndianRupee, LucideNavigation, LucidePhone, LucideCheckCircle } from 'lucide-react-native';
import DeliveryCard from './DeliveryCard';
import api from '../services/api';

const CustomerDeliveryGroup = ({ group, onRefresh }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [bottleModal, setBottleModal] = useState(false);
    const [paymentModal, setPaymentModal] = useState(false);

    // Collection State
    const [bottleQty, setBottleQty] = useState('');
    const [paymentAmt, setPaymentAmt] = useState('');
    const [pNotes, setPNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const customer = group.customer || {};
    const hasActiveDeliveries = group.deliveries.some(d => d.order_status === 'confirmed' || d.order_status === 'picked_up');

    const handleCollectBottle = async () => {
        if (isLoading) return;
        if (!bottleQty || isNaN(bottleQty)) return Alert.alert('Invalid', 'Enter valid quantity');

        setIsLoading(true);
        try {
            const prodId = group.deliveries[0]?.product_id?._id || group.deliveries[0]?.product_id;

            await api.post('/order-service/bottles/entry', {
                customer_id: group.id,
                product_id: prodId,
                quantity: bottleQty,
                transaction_type: 'returned',
                notes: 'Collected by delivery agent'
            });
            Alert.alert('Success', 'Bottle collection recorded');
            setBottleModal(false);
            setBottleQty('');
            if (onRefresh) onRefresh();
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to record');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCollectPayment = async () => {
        if (isLoading) return;
        if (!paymentAmt || isNaN(paymentAmt)) return Alert.alert('Invalid', 'Enter valid amount');

        setIsLoading(true);
        try {
            await api.post('/payment-service/collect', {
                customer_id: group.id,
                amount: paymentAmt,
                payment_method: 'cash',
                notes: pNotes || 'Manual collection'
            });
            Alert.alert('Success', 'Payment collected successfully');
            setPaymentModal(false);
            setPaymentAmt('');
            setPNotes('');
            if (onRefresh) onRefresh();
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || err.message || 'Payment failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeliverAll = async () => {
        if (isLoading) return;
        const pending = group.deliveries.filter(d => d.order_status === 'confirmed' || d.order_status === 'picked_up');
        if (pending.length === 0) return;

        setIsLoading(true);
        try {
            await Promise.all(pending.map(d =>
                api.patch(`/delivery-service/deliveries/${d._id}/status`, {
                    status: 'delivered'
                })
            ));
            Alert.alert('Success', `All ${pending.length} items marked as delivered`);
            if (onRefresh) onRefresh();
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to deliver some items');
        } finally {
            setIsLoading(false);
        }
    };
    const handleNavigate = () => {
        const addr = customer.address || {};
        const query = encodeURIComponent(`${addr.house_no || ''} ${addr.street || ''} ${addr.area || ''} ${addr.city || ''}`.trim());
        const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        Linking.openURL(url).catch(err => Alert.alert('Error', 'Could not open maps'));
    };

    return (
        <View style={styles.card}>
            {/* Main Summary Header */}
            <TouchableOpacity
                style={styles.header}
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.7}
            >
                <View style={styles.headerLeft}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{group.name[0]}</Text>
                        {hasActiveDeliveries && <View style={styles.activeDot} />}
                    </View>
                    <View>
                        <Text style={styles.name}>{group.name}</Text>
                        <Text style={styles.count}>{group.deliveries.length} Items Today • {group.deliveries[0]?.shift}</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={handleNavigate} style={{ marginRight: 15 }}>
                        <LucideNavigation size={22} color="#3b82f6" />
                    </TouchableOpacity>
                    {isExpanded ? <LucideChevronUp size={20} color="#64748b" /> : <LucideChevronDown size={20} color="#64748b" />}
                </View>
            </TouchableOpacity>

            {/* Quick Actions Strip */}
            <View style={styles.actionsStrip}>
                {hasActiveDeliveries && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={handleDeliverAll} disabled={isLoading}>
                        <LucideCheckCircle size={16} color="#fff" />
                        <Text style={[styles.actionText, { color: '#fff' }]}>Deliver All</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => setBottleModal(true)}>
                    <LucideMilk size={16} color="#3b82f6" />
                    <Text style={styles.actionText}>Bottle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setPaymentModal(true)}>
                    <LucideIndianRupee size={16} color="#059669" />
                    <Text style={styles.actionText}>Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleNavigate}>
                    <LucideNavigation size={16} color="#3b82f6" />
                    <Text style={styles.actionText}>Navigate</Text>
                </TouchableOpacity>
            </View>

            {/* Expanded List */}
            {isExpanded && (
                <View style={styles.expandedContent}>
                    <View style={styles.infoRow}>
                        <LucideInfo size={14} color="#64748b" />
                        <Text style={styles.infoText}>{customer.address?.house_no}, {customer.address?.street}</Text>
                    </View>

                    {group.deliveries.map(d => (
                        <DeliveryCard
                            key={d._id}
                            delivery={d}
                            onUpdateStatus={onRefresh}
                            minimal={true}
                        />
                    ))}
                </View>
            )}

            {/* Bottle Modal */}
            <Modal visible={bottleModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Bottle Collection</Text>
                        <TextInput
                            placeholder="Number of bottles..."
                            keyboardType="numeric"
                            style={styles.modalInput}
                            value={bottleQty}
                            onChangeText={setBottleQty}
                            autoFocus
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity onPress={() => setBottleModal(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCollectBottle} disabled={isLoading} style={styles.confirmBtn}>
                                <Text style={styles.confirmText}>{isLoading ? '...' : 'Record'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Payment Modal */}
            <Modal visible={paymentModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Cash Collection</Text>
                        <TextInput
                            placeholder="Amount in ₹"
                            keyboardType="numeric"
                            style={styles.modalInput}
                            value={paymentAmt}
                            onChangeText={setPaymentAmt}
                            autoFocus
                        />
                        <TextInput
                            placeholder="Notes (optional)"
                            style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                            value={pNotes}
                            onChangeText={setPNotes}
                            multiline
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity onPress={() => setPaymentModal(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCollectPayment} disabled={isLoading} style={[styles.confirmBtn, { backgroundColor: '#059669' }]}>
                                <Text style={styles.confirmText}>{isLoading ? '...' : 'Collect'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 15, padding: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontWeight: '800', color: '#3b82f6' },
    activeDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fff' },
    name: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    count: { fontSize: 12, color: '#64748b', fontWeight: '500' },
    actionsStrip: { flexDirection: 'row', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', paddingVertical: 8, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: '#e2e8f0' },
    actionText: { fontSize: 11, fontWeight: '700', color: '#1e293b' },
    expandedContent: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15, backgroundColor: '#f8fafc', padding: 8, borderRadius: 8 },
    infoText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 30 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 15 },
    modalInput: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 15, color: '#1e293b' },
    modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    cancelBtn: { padding: 10 },
    cancelText: { color: '#64748b', fontWeight: '600' },
    confirmBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: '#3b82f6' },
    confirmText: { color: '#fff', fontWeight: '700' }
});

export default CustomerDeliveryGroup;
