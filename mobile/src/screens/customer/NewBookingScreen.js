import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, Alert, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useServices, useBookingActions } from '../../hooks';
import { COLORS } from '../../config';

const NewBookingScreen = ({ route, navigation }) => {
    const preselectedService = route.params?.service;
    const { services, loading: servicesLoading } = useServices();
    const { createBooking, loading, error } = useBookingActions();

    const [selectedService, setSelectedService] = useState(preselectedService || null);
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');

    // Date/Time state
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const [scheduledDate, setScheduledDate] = useState(tomorrow);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const validateForm = () => {
        const errors = {};

        if (!selectedService) {
            errors.service = 'Please select a service';
        }

        if (!description.trim()) {
            errors.description = 'Please describe what you need help with';
        } else if (description.length < 10) {
            errors.description = 'Description must be at least 10 characters';
        }

        if (!address.trim()) {
            errors.address = 'Please enter your address';
        } else if (address.length < 5) {
            errors.address = 'Please enter a complete address';
        }

        const now = new Date();
        if (scheduledDate <= now) {
            errors.date = 'Please select a future date and time';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            const booking = await createBooking({
                serviceId: selectedService._id,
                description: description.trim(),
                location: { address: address.trim() },
                scheduledAt: scheduledDate.toISOString()
            });

            Alert.alert('Success', 'Booking created successfully!', [
                {
                    text: 'OK', onPress: () => navigation.goBack()
                }
            ]);
        } catch (err) {
            Alert.alert('Error', error || 'Failed to create booking. Please try again.');
        }
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const newDate = new Date(scheduledDate);
            newDate.setFullYear(selectedDate.getFullYear());
            newDate.setMonth(selectedDate.getMonth());
            newDate.setDate(selectedDate.getDate());
            setScheduledDate(newDate);
            setValidationErrors(prev => ({ ...prev, date: undefined }));
        }
    };

    const onTimeChange = (event, selectedTime) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const newDate = new Date(scheduledDate);
            newDate.setHours(selectedTime.getHours());
            newDate.setMinutes(selectedTime.getMinutes());
            setScheduledDate(newDate);
            setValidationErrors(prev => ({ ...prev, date: undefined }));
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            {/* Service Selection */}
            <View style={styles.section}>
                <Text style={styles.label}>Select Service *</Text>
                {servicesLoading ? (
                    <ActivityIndicator color={COLORS.primary} />
                ) : (
                    <View style={styles.servicesGrid}>
                        {services.map((service) => (
                            <TouchableOpacity
                                key={service._id}
                                style={[
                                    styles.serviceCard,
                                    selectedService?._id === service._id && styles.serviceSelected
                                ]}
                                onPress={() => {
                                    setSelectedService(service);
                                    setValidationErrors(prev => ({ ...prev, service: undefined }));
                                }}
                            >
                                <Text style={[
                                    styles.serviceName,
                                    selectedService?._id === service._id && styles.serviceNameSelected
                                ]}>{service.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                {validationErrors.service && (
                    <Text style={styles.fieldError}>{validationErrors.service}</Text>
                )}
            </View>

            {/* Description */}
            <View style={styles.section}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                    style={[styles.input, styles.textArea, validationErrors.description && styles.inputError]}
                    placeholder="Describe what you need help with..."
                    value={description}
                    onChangeText={(text) => {
                        setDescription(text);
                        setValidationErrors(prev => ({ ...prev, description: undefined }));
                    }}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
                {validationErrors.description && (
                    <Text style={styles.fieldError}>{validationErrors.description}</Text>
                )}
            </View>

            {/* Location */}
            <View style={styles.section}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                    style={[styles.input, validationErrors.address && styles.inputError]}
                    placeholder="Enter your full address"
                    value={address}
                    onChangeText={(text) => {
                        setAddress(text);
                        setValidationErrors(prev => ({ ...prev, address: undefined }));
                    }}
                />
                {validationErrors.address && (
                    <Text style={styles.fieldError}>{validationErrors.address}</Text>
                )}
            </View>

            {/* Date & Time Pickers */}
            <View style={styles.section}>
                <Text style={styles.label}>When do you need help? *</Text>
                <View style={styles.row}>
                    <TouchableOpacity
                        style={[styles.pickerButton, { flex: 1.5 }, validationErrors.date && styles.inputError]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.pickerIcon}>📅</Text>
                        <Text style={styles.pickerText}>{formatDate(scheduledDate)}</Text>
                    </TouchableOpacity>
                    <View style={{ width: 12 }} />
                    <TouchableOpacity
                        style={[styles.pickerButton, { flex: 1 }, validationErrors.date && styles.inputError]}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={styles.pickerIcon}>🕐</Text>
                        <Text style={styles.pickerText}>{formatTime(scheduledDate)}</Text>
                    </TouchableOpacity>
                </View>
                {validationErrors.date && (
                    <Text style={styles.fieldError}>{validationErrors.date}</Text>
                )}
            </View>

            {/* Date Picker Modal */}
            {showDatePicker && (
                <DateTimePicker
                    value={scheduledDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    onChange={onDateChange}
                />
            )}

            {/* Time Picker Modal */}
            {showTimePicker && (
                <DateTimePicker
                    value={scheduledDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onTimeChange}
                />
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
            >
                <Text style={styles.submitText}>
                    {loading ? 'Creating...' : 'Create Booking'}
                </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
    section: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
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
    textArea: { height: 120 },
    row: { flexDirection: 'row' },
    servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    serviceCard: {
        backgroundColor: COLORS.surface,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    serviceSelected: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}15` },
    serviceName: { fontSize: 14, color: COLORS.text },
    serviceNameSelected: { color: COLORS.primary, fontWeight: '600' },
    pickerButton: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center'
    },
    pickerIcon: { fontSize: 18, marginRight: 10 },
    pickerText: { fontSize: 15, color: COLORS.text },
    fieldError: { color: COLORS.danger, fontSize: 12, marginTop: 6 },
    error: { color: COLORS.danger, marginBottom: 16, textAlign: 'center', fontSize: 14 },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10
    },
    buttonDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});

export default NewBookingScreen;
