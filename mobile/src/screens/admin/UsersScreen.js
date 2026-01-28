import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../config';

const UsersScreen = () => (
    <View style={styles.container}>
        <Text style={styles.placeholder}>User Management</Text>
        <Text style={styles.hint}>All users will appear here</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    placeholder: { fontSize: 20, fontWeight: '600', color: COLORS.text },
    hint: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 }
});

export default UsersScreen;
