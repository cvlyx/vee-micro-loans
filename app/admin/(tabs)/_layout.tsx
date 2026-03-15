import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAdmin } from '@/contexts/AdminContext';

export default function AdminTabLayout() {
  const { pendingCount } = useAdmin();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  function AdminIcon({ name, color, badge }: { name: string; color: string; badge?: number }) {
    return (
      <View>
        <Ionicons name={name as any} size={22} color={color} />
        {badge && badge > 0 ? (
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: isDark ? 'rgba(168,85,247,0.4)' : Colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : (isDark ? '#1A0533' : Colors.white),
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(168,85,247,0.2)' : Colors.border,
          elevation: 0,
          ...(Platform.OS === 'web' ? { height: 84 } : {}),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'DMSans_500Medium',
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          ) : Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#1A0533' : Colors.white }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, focused }) => (
            <AdminIcon name={focused ? 'grid' : 'grid-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarIcon: ({ color, focused }) => (
            <AdminIcon name={focused ? 'document-text' : 'document-text-outline'} color={color} badge={pendingCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, focused }) => (
            <AdminIcon name={focused ? 'people' : 'people-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <AdminIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 0,
    right: -3,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
});
