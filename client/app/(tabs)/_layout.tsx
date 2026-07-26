import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function TabLayout() {
  return (
   <Tabs>
      <Tabs.Screen name="index" options={{
         tabBarIcon: ({color, focused})=> <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
      }}/>
      <Tabs.Screen name="cart" options={{
         tabBarIcon: ({color, focused})=> <Ionicons name={focused ? "cart" : "cart-outline"} size={26} color={color} />
      }}/>
      <Tabs.Screen name="favorites" options={{
         tabBarIcon: ({color, focused})=> <Ionicons name={focused ? "heart" : "heart-outline"} size={26} color={color} />
      }}/>
      <Tabs.Screen name="profile" options={{
         tabBarIcon: ({color, focused})=> <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
      }}/>
   </Tabs>
  )
}