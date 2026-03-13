import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { LucideChevronLeft, LucideShield } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const PrivacyPolicyScreen = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <LucideChevronLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.iconContainer}>
                    <LucideShield size={48} color="#3b82f6" />
                </View>

                <Text style={styles.lastUpdated}>Last Updated: March 2024</Text>

                <Text style={styles.sectionTitle}>1. Data Collection for Delivery</Text>
                <Text style={styles.paragraph}>
                    As a delivery partner for Dhenu, we collect information necessary to facilitate logistics and track delivery progress.
                </Text>

                <Text style={styles.sectionTitle}>2. Location Tracking (Critical)</Text>
                <Text style={styles.paragraph}>
                    We collect your real-time location data when the app is in use or running in the background during your delivery shift. This is mandatory to:
                    {"\n"}• Provide customers with accurate delivery ETAs.
                    {"\n"}• Verify successful delivery at the customer's doorstep.
                    {"\n"}• Optimize delivery routes for better efficiency.
                </Text>

                <Text style={styles.sectionTitle}>3. Information Sharing</Text>
                <Text style={styles.paragraph}>
                    Your name, mobile number, and real-time location are shared with the customers whose orders you are assigned to deliver. This is to ensure safety and transparency in the delivery process.
                </Text>

                <Text style={styles.sectionTitle}>4. Data Security</Text>
                <Text style={styles.paragraph}>
                    We implement standard security measures to protect your personal data from unauthorized access or disclosure, in compliance with the Indian Information Technology Act and DPDP Act.
                </Text>

                <Text style={styles.sectionTitle}>5. Contact Support</Text>
                <Text style={styles.paragraph}>
                    For any privacy-related concerns or data access requests, please contact the Dhenu Admin team through the support channel.
                </Text>

                <View style={styles.footerSpace} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backBtn: {
        padding: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    content: { flex: 1, padding: 20 },
    iconContainer: { alignItems: 'center', marginVertical: 20 },
    lastUpdated: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3b82f6',
        marginTop: 20,
        marginBottom: 10,
    },
    paragraph: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 22,
        marginBottom: 15,
    },
    footerSpace: { height: 50 }
});

export default PrivacyPolicyScreen;
