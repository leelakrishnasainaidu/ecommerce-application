import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { HeaderProps } from '@/constants/types'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants'
import { useRouter } from 'expo-router'

export default function Header({ title, showBack, showSearch, showCart, showMenu, showLogo }: HeaderProps) {

    const router = useRouter()

    return (
        <View className='bg-white flex-row items-center justify-between px-4 py-3'>
            {/* left side */}
            <View className='flex-row items-center flex-1'>
                {showBack && (
                    <TouchableOpacity onPress={() => router} className='mr-3'>
                        <Ionicons name='arrow-back' size={24} color={COLORS.primary} />
                    </TouchableOpacity>

                )}

                {showMenu && (
                    <TouchableOpacity className='mr-3'>
                        <Ionicons name='menu-outline' size={28} color={COLORS.primary} />
                    </TouchableOpacity>
                )}

                {showLogo ? (
                    <View className='flex-1'>
                    <Image source={require("@/assets/logo.png")} style={{ width: "100%", height: 24 }} resizeMode='contain'/>
            </View>
            ) :(
            <Text></Text>
                )}
        </View>
            {/* right side */ }
    <View>

    </View>
        </View >
    )
}