import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const HolidayScreen = () => {
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');
    const navigation = useNavigation();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!date || !reason) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        if (!user?._id) { // NOTE: Verify if it's user._id or user.userId. Checking AuthContext.js: user is JSON.parse(storedUser).
            // Usually mongoose obj has _id.
            Alert.alert("Error", "User not identified");
            return;
        }

        setIsLoading(true);
        try {
            await api.patch(`/user-service/delivery-boys/${user._id}/availability`, {
                is_available: false,
                reason: reason // Backend doesn't explicitly store reason in updateAvailability but good to send
            });
            Alert.alert("Success", "Holiday request submitted!");
            navigation.goBack();
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to submit request");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Dhenu Holiday Request</Text>

            <Text style={styles.label}>Date (DD-MM-YYYY)</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g 20-02-2026"
                value={date}
                onChangeText={setDate}
            />

            <Text style={styles.label}>Reason</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Why do you need a leave?"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitText}>Submit Request</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#fafafa',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#2563EB',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default HolidayScreen;
