import { Tabs } from 'expo-router';
import { Image, View } from 'react-native';

const icons = {
  map: require('../../assets/icons8-user-location-64.png'),
  profile: require('../../assets/icons8-user-default-64.png'),
  settings: require('../../assets/icons8-settings-64.png'),
};

function TabIcon({ source, focused }: { source: number; focused: boolean }) {
  return (
    <View
      style={
        focused
          ? {
              shadowColor: '#7B5EA7',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 8,
              elevation: 6,
            }
          : undefined
      }
    >
      <Image source={source} style={{ width: 34, height: 34 }} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { height: 80 },
        tabBarIconStyle: { marginTop: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => <TabIcon source={icons.map} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon source={icons.profile} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon source={icons.settings} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
