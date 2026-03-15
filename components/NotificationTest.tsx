import React from 'react';
import { View, Button, Alert } from 'react-native';
import { sendNotification } from '../services/NotificationService';

export default function NotificationTest() {
  const testNotification = async () => {
    try {
      await sendNotification(
        'Test Notification',
        'This is a test notification from Phoenix Loan App',
        'success'
      );
      Alert.alert('Success', 'Notification sent! Check your notification panel.');
    } catch (error) {
      Alert.alert('Error', `Failed to send notification: ${(error as Error).message}`);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button
        title="Test Local Notification"
        onPress={testNotification}
        color="#6B21A8"
      />
    </View>
  );
}
