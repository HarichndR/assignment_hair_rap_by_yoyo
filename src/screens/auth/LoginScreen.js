import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, TouchableOpacity, Modal, FlatList, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { CONFIG } from '../../constants/Config';

const COUNTRIES = [
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+1', name: 'USA/Canada', flag: '🇺🇸' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
];

const LoginScreen = () => {
    const [country, setCountry] = useState(COUNTRIES[0]);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { loginWithPassword } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!mobile || !password) {
            Alert.alert('Error', 'Please enter both mobile number and password');
            return;
        }

        setIsLoading(true);
        // Clean mobile number - remove spaces
        const cleanMobile = mobile.replace(/\s/g, '');
        const result = await loginWithPassword(cleanMobile, password);
        setIsLoading(false);

        if (!result.success) {
            Alert.alert('Login Failed', result.message);
        }
    };

    const renderCountryItem = ({ item }) => (
        <TouchableOpacity
            style={styles.countryItem}
            onPress={() => {
                setCountry(item);
                setShowCountryModal(false);
            }}
        >
            <Text style={styles.countryFlag}>{item.flag}</Text>
            <Text style={styles.countryName}>{item.name}</Text>
            <Text style={styles.countryCodeText}>{item.code}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.inner}>
                        <View style={styles.header}>
                            {/* App Logo */}
                            <Image source={require('../../../assets/images/logo.jpeg')} style={styles.logo} />
                            <Text style={styles.badgeText}>Delivery Partner</Text>

                            <Text style={styles.title}>Dhenu Milk Partner</Text>
                            <Text style={styles.subtitle}>Sign in to manage your deliveries</Text>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Mobile Number</Text>
                                <View style={styles.phoneRow}>
                                    <TouchableOpacity
                                        style={styles.countryPicker}
                                        onPress={() => setShowCountryModal(true)}
                                    >
                                        <Text style={styles.countryPickerText}>{country.flag} {country.code}</Text>
                                    </TouchableOpacity>
                                    <TextInput
                                        style={styles.phoneInput}
                                        placeholder="Mobile number"
                                        placeholderTextColor="#9CA3AF"
                                        value={mobile}
                                        onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, ''))}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.passwordRow}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Enter password"
                                        placeholderTextColor="#9CA3AF"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                                onPress={handleLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Sign In</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.forgotButton}
                                onPress={() => Alert.alert('Contact Admin', 'Please contact your manager to reset your password.')}
                            >
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                PARTNER ID: {CONFIG.DAIRY_ID ? '...' + CONFIG.DAIRY_ID.slice(-6) : 'N/A'}
                            </Text>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            <Modal
                visible={showCountryModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Country</Text>
                            <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                                <Text style={styles.closeButton}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={COUNTRIES}
                            keyExtractor={(item) => item.code}
                            renderItem={renderCountryItem}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Light gray background
    },
    keyboardView: {
        flex: 1,
    },
    inner: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    badgeText: {
        backgroundColor: '#DBEAFE',
        color: '#1E40AF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
        marginBottom: 20,
        overflow: 'hidden',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    phoneRow: {
        flexDirection: 'row',
        height: 50,
    },
    countryPicker: {
        width: 80,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: -1, // overlap border
    },
    countryPickerText: {
        fontSize: 16,
        color: '#111827',
    },
    phoneInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#111827',
    },
    passwordRow: {
        flexDirection: 'row',
        height: 50,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#111827',
        height: '100%',
    },
    eyeButton: {
        paddingHorizontal: 16,
    },
    eyeIcon: {
        fontSize: 18,
    },
    loginButton: {
        backgroundColor: '#2563EB',
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#93C5FD',
        shadowOpacity: 0,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    forgotButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    forgotText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '500',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '50%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    closeButton: {
        color: '#2563EB',
        fontSize: 16,
        fontWeight: '600',
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    countryFlag: {
        fontSize: 24,
        marginRight: 16,
    },
    countryName: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
    },
    countryCodeText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: '#E5E7EB',
    }
});

export default LoginScreen;
