import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../../context';
import { useMessages } from '../../hooks';
import { useBookingRoom, useChat } from '../../hooks/useSocket';
import { sendMessage, sendTypingIndicator, markMessagesRead } from '../../services/socket';
import { COLORS } from '../../config';

const ChatScreen = ({ route }) => {
    const { bookingId, booking } = route.params;
    const { user } = useAuth();
    const { messages: initialMessages, loading } = useMessages(bookingId);
    const { messages, typingUsers, initMessages } = useChat(bookingId);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef();
    const typingTimeoutRef = useRef(null);

    // Join booking room
    useBookingRoom(bookingId);

    // Initialize messages from API
    useEffect(() => {
        if (initialMessages.length > 0) {
            initMessages(initialMessages);
        }
    }, [initialMessages, initMessages]);

    // Mark messages as read
    useEffect(() => {
        if (messages.length > 0) {
            const unreadIds = messages
                .filter(m => m.sender?._id !== user?._id && !m.readBy?.some(r => r.user === user?._id))
                .map(m => m._id);

            if (unreadIds.length > 0) {
                markMessagesRead(bookingId, unreadIds);
            }
        }
    }, [messages, bookingId, user]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        sendMessage(bookingId, inputText.trim());
        setInputText('');
        sendTypingIndicator(bookingId, false);
    };

    const handleTextChange = (text) => {
        setInputText(text);

        // Send typing indicator
        if (text.length > 0) {
            sendTypingIndicator(bookingId, true);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
                sendTypingIndicator(bookingId, false);
            }, 2000);
        }
    };

    const renderMessage = ({ item }) => {
        const isOwnMessage = item.sender?._id === user?._id;
        const isSystemMessage = item.messageType === 'system';

        if (isSystemMessage) {
            return (
                <View style={styles.systemMessage}>
                    <Text style={styles.systemText}>{item.content}</Text>
                </View>
            );
        }

        return (
            <View style={[styles.messageBubble, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
                {!isOwnMessage && (
                    <Text style={styles.senderName}>{item.sender?.name}</Text>
                )}
                <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
                    {item.content}
                </Text>
                <Text style={[styles.timestamp, isOwnMessage && styles.ownTimestamp]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => item._id || `msg-${index}`}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No messages yet</Text>
                        <Text style={styles.emptyHint}>Start the conversation!</Text>
                    </View>
                }
            />

            {typingUsers.length > 0 && (
                <View style={styles.typingIndicator}>
                    <Text style={styles.typingText}>
                        {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </Text>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={inputText}
                    onChangeText={handleTextChange}
                    multiline
                    maxLength={2000}
                />
                <TouchableOpacity
                    style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                >
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    messagesList: { padding: 16, paddingBottom: 8 },
    messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 8 },
    ownMessage: { alignSelf: 'flex-end', backgroundColor: COLORS.primary },
    otherMessage: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
    senderName: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginBottom: 4 },
    messageText: { fontSize: 16, color: COLORS.text },
    ownMessageText: { color: '#fff' },
    timestamp: { fontSize: 10, color: COLORS.textSecondary, marginTop: 4, alignSelf: 'flex-end' },
    ownTimestamp: { color: 'rgba(255,255,255,0.7)' },
    systemMessage: { alignSelf: 'center', backgroundColor: COLORS.border, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, marginVertical: 8 },
    systemText: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
    typingIndicator: { paddingHorizontal: 16, paddingVertical: 4 },
    typingText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },
    inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'flex-end' },
    input: { flex: 1, backgroundColor: COLORS.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 100 },
    sendButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginLeft: 8 },
    sendButtonDisabled: { opacity: 0.5 },
    sendButtonText: { color: '#fff', fontWeight: '600' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { fontSize: 16, color: COLORS.textSecondary },
    emptyHint: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }
});

export default ChatScreen;
