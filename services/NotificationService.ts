import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.90.50:5000/api';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Configure how notifications appear when app is in foreground (only if not Expo Go)
if (!isExpoGo) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
        }),
    });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
    // Skip push token registration in Expo Go
    if (isExpoGo) {
        console.log('Push notifications are not supported in Expo Go. Use a development build instead.');
        return null;
    }

    if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('phoenix-loans', {
            name: 'Phoenix Loan Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
            lightColor: '#A855F7',
            enableVibrate: true,
        });
    }

    try {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        return token;
    } catch (e) {
        console.error('Failed to get push token', e);
        return null;
    }
}

export async function sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, string>
) {
    // Local notifications work in Expo Go, so no need to check
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: 'default',
                data: data || {},
                priority: 'high',
            },
            trigger: null, // fire immediately
        });
    } catch (error) {
        console.error('Failed to send local notification:', error);
    }
}

export async function postNotificationToBackend(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
): Promise<void> {
    try {
        const userRaw = await AsyncStorage.getItem('@phoenix_loan:user');
        if (!userRaw) return;
        const user = JSON.parse(userRaw);

        await fetch(`${API_URL}/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user.id,
            },
            body: JSON.stringify({ title, message, type }),
        });
    } catch (e) {
        console.error('Failed to post notification to backend', e);
    }
}

export async function sendNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    data?: Record<string, string>
): Promise<void> {
    console.log('🔔 sendNotification called:', { title, message, type, isExpoGo });
    
    // Fire local push notification (shows on screen with sound)
    await sendLocalNotification(title, message, data);
    
    // Also persist to DB (only if backend is available)
    try {
        await postNotificationToBackend(title, message, type);
        console.log('✅ Notification saved to backend');
    } catch (error) {
        console.log('⚠️ Backend notification failed (local notification still worked):', (error as Error).message);
    }
}
