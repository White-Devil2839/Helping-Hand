import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context';
import { COLORS } from '../../config';

const LoginScreen = ({ navigation }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationError, setValidationError] = useState('');
    const { requestOtp, error } = useAuth();

    const validatePhone = (number) => {
        // Remove spaces and dashes
        const cleaned = number.replace(/[\s-]/g, '');

        if (!cleaned) {
            return { valid: false, error: 'Phone number is required' };
        }

        if (cleaned.length < 10) {
            return { valid: false, error: 'Phone number must be at least 10 digits' };
        }

        if (cleaned.length > 15) {
            return { valid: false, error: 'Phone number is too long' };
        }

        // Check if it contains only digits (with optional + prefix)
        if (!/^\+?\d+$/.test(cleaned)) {
            return { valid: false, error: 'Phone number should contain only digits' };
        }

        return { valid: true, formatted: cleaned.startsWith('+') ? cleaned : `+${cleaned}` };
    };

    const handleRequestOtp = async () => {
        setValidationError('');

        const validation = validatePhone(phone);
        if (!validation.valid) {
            setValidationError(validation.error);
            return;
        }

        setLoading(true);
        try {
            await requestOtp(validation.formatted);
            navigation.navigate('Otp', { phone: validation.formatted });
        } catch (err) {
            // Error handled in context
        } finally {
            setLoading(false);
        }
    };

    const displayError = validationError || error;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <Text style={styles.title}>Welcome to{'\n'}Helping Hand</Text>
                <Text style={styles.subtitle}>Get help with everyday tasks from trusted helpers</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={[styles.input, displayError && styles.inputError]}
                        placeholder="+1234567890"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={(text) => {
                            setPhone(text);
                            setValidationError('');
                        }}
                        maxLength={15}
                    />
                    <Text style={styles.inputHint}>Include country code (e.g., +1234567890)</Text>
                </View>

                {displayError && <Text style={styles.error}>{displayError}</Text>}

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleRequestOtp}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Sending...' : 'Get OTP'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.testInfo}>
                    <Text style={styles.testTitle}>Test Accounts (OTP: 123456)</Text>
                    <Text style={styles.testAccount}>Admin: +1234567890</Text>
                    <Text style={styles.testAccount}>Customer: +1234567891</Text>
                    <Text style={styles.testAccount}>Helper: +1234567892</Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center'
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 40
    },
    inputContainer: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 8,
        fontWeight: '500'
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 16,
        fontSize: 16
    },
    inputError: {
        borderColor: COLORS.danger
    },
    inputHint: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 6
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10
    },
    buttonDisabled: {
        opacity: 0.6
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
    error: {
        color: COLORS.danger,
        marginBottom: 10,
        fontSize: 14
    },
    testInfo: {
        marginTop: 30,
        padding: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    testTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8
    },
    testAccount: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 4
    }
});

export default LoginScreen;
