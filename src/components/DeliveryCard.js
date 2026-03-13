import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Modal, TextInput } from 'react-native';
import { LucideMapPin, LucideCheckCircle, LucideNavigation, LucideXCircle, LucideMinus, LucidePlus, LucidePhone, LucidePackage } from 'lucide-react-native';
import api from '../services/api';

const DeliveryCard = ({ delivery, onUpdateStatus, minimal = false }) => {
    const [bottlesReturned, setBottlesReturned] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [failReason, setFailReason] = useState('');
    const [loading, setLoading] = useState(false);

    if (!delivery) return null;

    const customer = delivery.customer_id || {};
    const customerName = customer.name || 'Unknown';
    const customerMobile = customer.mobile || 'N/A';
    const addressObj = customer.address || delivery.address || {};
    const addressStr = [
        addressObj.line1,
        addressObj.line2,
        addressObj.city,
        addressObj.pincode
    ].filter(Boolean).join(', ');

    const deliveryInstructions = customer.delivery_instructions || '';

    const deliveryStatus = delivery.order_status || 'pending';
    const items = [{ name: delivery.product_id?.name, qty: delivery.quantity, unit: delivery.unit }];

    const updateStatus = async (newStatus, extraData = {}) => {
        setLoading(true);
        try {
            await api.patch(`/delivery-service/deliveries/${delivery._id}/status`, {
                status: newStatus,
                ...extraData
            });
            Alert.alert('Success', `Status updated to ${newStatus.replace('_', ' ')}`);
            if (onUpdateStatus) onUpdateStatus();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const handlePickup = () => {
        if (loading) return;
        updateStatus('picked_up');
    };

    const handleSuccess = () => {
        if (loading) return;
        updateStatus('delivered', { bottles_returned: bottlesReturned });
    };

    const handleFail = () => {
        if (loading) return;
        if (!failReason.trim()) {
            Alert.alert('Required', 'Please enter a reason for failure');
            return;
        }
        updateStatus('failed', { failure_reason: failReason });
        setModalVisible(false);
    };

    const openMap = () => {
        const query = encodeURIComponent(addressStr);
        const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        Linking.openURL(url);
    };

    const callCustomer = () => {
        if (customerMobile) {
            Linking.openURL(`tel:${customerMobile}`);
        } else {
            Alert.alert('No Number', 'Customer mobile number not available');
        }
    };

    return (
        <View style={[styles.card, minimal && styles.minimalCard]}>
            {/* Header - Only in full mode */}
            {!minimal && (
                <View style={styles.header}>
                    <View>
                        <Text style={styles.customerName}>{customerName}</Text>
                        <Text style={styles.orderId}>#{delivery.order_number?.slice(-6)}</Text>
                    </View>
                    <Text style={[styles.status, {
                        color: deliveryStatus === 'delivered' ? 'green' : deliveryStatus === 'failed' ? 'red' : 'orange'
                    }]}>
                        {deliveryStatus.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>
            )}

            {/* Customer Details - Only in full mode */}
            {!minimal && (
                <View style={styles.detailsContainer}>
                    <TouchableOpacity style={styles.row} onPress={openMap}>
                        <LucideMapPin size={16} color="#666" style={{ marginRight: 5 }} />
                        <Text style={styles.address}>{addressStr || 'No Address Provided'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.row} onPress={callCustomer}>
                        <LucidePhone size={16} color="#2563EB" style={{ marginRight: 5 }} />
                        <Text style={styles.phone}>Call Customer</Text>
                    </TouchableOpacity>
                    {deliveryInstructions ? (
                        <View style={[styles.row, styles.instructionRow]}>
                            <LucidePackage size={16} color="#059669" style={{ marginRight: 5 }} />
                            <Text style={styles.instructions}>Note: {deliveryInstructions}</Text>
                        </View>
                    ) : null}
                </View>
            )}

            {/* Items */}
            <View style={[styles.itemsContainer, minimal && styles.minimalItems]}>
                {items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                        <Text style={[styles.itemText, minimal && styles.minimalItemText]}>
                            • {item.qty} {item.unit || ''} {item.name}
                        </Text>
                        {minimal && (
                            <Text style={[styles.statusMini, {
                                color: deliveryStatus === 'delivered' ? '#059669' : deliveryStatus === 'failed' ? '#dc2626' : '#d97706'
                            }]}>
                                {deliveryStatus.toUpperCase()}
                            </Text>
                        )}
                    </View>
                ))}
            </View>

            {/* Actions based on Status */}
            {deliveryStatus !== 'delivered' && deliveryStatus !== 'failed' && (
                <View>
                    {/* If Confirmed, show Pickup */}
                    {deliveryStatus === 'confirmed' && (
                        <TouchableOpacity
                            style={[styles.button, styles.pickupButton]}
                            onPress={handlePickup}
                            disabled={loading}
                        >
                            <LucidePackage size={18} color="#fff" />
                            <Text style={styles.buttonText}>Pick Up Order</Text>
                        </TouchableOpacity>
                    )}

                    {/* If Picked Up, show Deliver/Fail */}
                    {deliveryStatus === 'picked_up' && (
                        <View>
                            {/* Bottle Stepper */}
                            <View style={styles.bottleRow}>
                                <Text style={styles.bottleLabel}>Bottles Returned:</Text>
                                <View style={styles.stepper}>
                                    <TouchableOpacity
                                        onPress={() => setBottlesReturned(Math.max(0, bottlesReturned - 1))}
                                        style={styles.stepBtn}
                                    >
                                        <LucideMinus size={16} color="#333" />
                                    </TouchableOpacity>
                                    <Text style={styles.bottleCount}>{bottlesReturned}</Text>
                                    <TouchableOpacity
                                        onPress={() => setBottlesReturned(bottlesReturned + 1)}
                                        style={styles.stepBtn}
                                    >
                                        <LucidePlus size={16} color="#333" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.actions}>
                                <TouchableOpacity style={[styles.button, styles.failButton]} onPress={() => setModalVisible(true)}>
                                    <LucideXCircle size={18} color="#D32F2F" />
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.button, styles.mapButton]} onPress={openMap}>
                                    <LucideNavigation size={18} color="#007AFF" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, styles.deliverButton]}
                                    onPress={handleSuccess}
                                    disabled={loading}
                                >
                                    <LucideCheckCircle size={18} color="#fff" />
                                    <Text style={styles.deliverText}>{loading ? '...' : 'Delivered'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Allow calling map/phone even if pending? Yes, above */}
                </View>
            )}

            {/* Failure Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reason for Failure</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Door Locked, Customer Unavailable"
                            value={failReason}
                            onChangeText={setFailReason}
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleFail} style={[styles.modalBtn, styles.confirmFailBtn]}>
                                <Text style={styles.confirmText}>Confirm Failed</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        alignItems: 'flex-start'
    },
    customerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827'
    },
    orderId: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2
    },
    status: {
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#F3F4F6',
        overflow: 'hidden'
    },
    detailsContainer: {
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 12
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    address: {
        color: '#4B5563',
        fontSize: 14,
        flex: 1,
        lineHeight: 20
    },
    phone: {
        color: '#2563EB',
        fontSize: 14,
        fontWeight: '500'
    },
    itemsContainer: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    itemText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#334155'
    },
    bottleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    bottleLabel: {
        fontSize: 14,
        color: '#333',
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
    },
    stepBtn: {
        padding: 10,
    },
    bottleCount: {
        paddingHorizontal: 12,
        fontSize: 16,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    pickupButton: {
        backgroundColor: '#2563EB',
        width: '100%'
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8
    },
    failButton: {
        backgroundColor: '#FEF2F2',
        flex: 1,
        borderWidth: 1,
        borderColor: '#FECACA'
    },
    mapButton: {
        backgroundColor: '#EFF6FF',
        flex: 1,
        borderWidth: 1,
        borderColor: '#BFDBFE'
    },
    deliverButton: {
        backgroundColor: '#22c55e',
        flex: 3,
        gap: 8,
    },
    deliverText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
        fontSize: 16
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 15,
    },
    modalBtn: {
        padding: 10,
    },
    cancelText: {
        color: '#666',
        fontSize: 16
    },
    confirmFailBtn: {
        backgroundColor: '#D32F2F',
        borderRadius: 6,
        paddingHorizontal: 16
    },
    confirmText: {
        color: '#fff',
        fontWeight: '600'
    },
    // Minimal Overrides
    minimalCard: {
        padding: 0,
        marginBottom: 8,
        elevation: 0,
        shadowOpacity: 0,
        backgroundColor: 'transparent'
    },
    minimalItems: {
        marginBottom: 8,
        padding: 8,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    minimalItemText: {
        fontSize: 13,
        color: '#1e293b'
    },
    statusMini: {
        fontSize: 10,
        fontWeight: '800'
    },
    instructionRow: {
        backgroundColor: '#ecfdf5',
        padding: 8,
        borderRadius: 6,
        marginTop: 4,
    },
    instructions: {
        fontSize: 13,
        color: '#059669',
        fontWeight: '600',
        flex: 1,
    }
});

export default DeliveryCard;


