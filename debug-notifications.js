// Simple notification test script
import Constants from 'expo-constants';

console.log('=== NOTIFICATION DEBUG ===');
console.log('App Ownership:', Constants.appOwnership);
console.log('Is Expo Go:', Constants.appOwnership === 'expo');

// Test local notification
import * as Notifications from 'expo-notifications';

async function testLocalNotification() {
  try {
    console.log('Testing local notification...');
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test local notification',
        sound: 'default',
        priority: 'high',
      },
      trigger: null,
    });
    
    console.log('✅ Local notification scheduled successfully');
  } catch (error) {
    console.error('❌ Local notification failed:', error);
  }
}

testLocalNotification();
