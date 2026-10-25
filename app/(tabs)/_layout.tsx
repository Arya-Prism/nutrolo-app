import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

import { C } from "@/components/diet-ui";

export default function TabLayout() {
  const bottomPadding = Platform.OS === "web" ? 10 : 18;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.green,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800", marginTop: 1 },
        tabBarIconStyle: { marginTop: 2 },
        tabBarStyle: {
          height: 61 + bottomPadding,
          paddingTop: 7,
          paddingBottom: bottomPadding,
          backgroundColor: "#FBFCF9",
          borderTopColor: C.line,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="wb-sunny" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "AI plan",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="auto-awesome" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Food log",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="restaurant-menu" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
