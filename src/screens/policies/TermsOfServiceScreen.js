import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { LucideChevronLeft, LucideScale } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const TermsOfServiceScreen = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <LucideChevronLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Service</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.iconContainer}>
                    <LucideScale size={48} color="#3b82f6" />
                </View>

                <Text style={styles.lastUpdated}>Last Updated: March 2024</Text>

                <Text style={styles.sectionTitle}>1. Relationship with Dhenu</Text>
                <Text style={styles.paragraph}>
                    By registering as a delivery partner, you acknowledge that you are an independent contractor and not an employee of Dhenu. You have the flexibility to choose your shifts as per availability.
                </Text>

                <Text style={styles.sectionTitle}>2. Delivery Standards</Text>
                <Text style={styles.paragraph}>
                    {"\n"}• You must deliver products within the allotted time slots.
                    {"\n"}• You must handle dairy products with care to maintain hygiene and prevent leakage.
                    {"\n"}• You must use the Dhenu App to record every successful or failed delivery in real-time.
                </Text>

                <Text style={styles.sectionTitle}>3. Professional Conduct</Text>
                <Text style={styles.paragraph}>
                    You agree to behave professionally with customers and dairy staff. Any reports of misconduct, theft, or deliberate delivery failures will lead to immediate termination of your partnership.
                </Text>

                <Text style={styles.sectionTitle}>4. Vehicle and Safety</Text>
                <Text style={styles.paragraph}>
                    You are responsible for maintaining your vehicle and ensuring you have a valid driving license and insurance as per Indian law. Dhenu is not liable for any accidents or traffic violations during your shift.
                </Text>

                <Text style={styles.sectionTitle}>5. Termination</Text>
                <Text style={styles.paragraph}>
                    Either party can terminate this arrangement with [7 days] notice. Dhenu reserves the right to suspend your account immediately for any breach of these terms.
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

export default TermsOfServiceScreen;
