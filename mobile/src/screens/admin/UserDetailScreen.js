import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../config';

const UserDetailScreen = () => (
    <View style={styles.container}>
        <Text style={styles.placeholder}>User Details</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    placeholder: { fontSize: 20, fontWeight: '600', color: COLORS.text }
});

export default UserDetailScreen;
