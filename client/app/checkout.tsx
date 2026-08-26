import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'expo-router'
import { Address } from '@/constants/types'
import { addressesApi, ordersApi } from '@/constants/api'
import { useAuth } from '@clerk/clerk-expo'
import { Toast } from 'react-native-toast-message/lib/src/Toast'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants'
import Header from '@/components/Header'
import { ScrollView } from 'react-native-gesture-handler'
import { Ionicons } from '@expo/vector-icons'

export default function Checkout() {

    const { cartTotal, clearCart } = useCart()
    const { getToken } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)

    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'stripe'>('cash')

    const shipping = 2.0;
    const tax = 0;
    const total = cartTotal + shipping + tax;

    const fetchAddresses = async () => {
        try {
            const token = await getToken();
            const res = await addressesApi.list(token);
            const addrList: Address[] = res.data;
            if (addrList.length > 0) {
                // Find default or first address
                const def = addrList.find((a) => a.isDefault) || addrList[0];
                setSelectedAddress(def);
            }
        }
        catch (error) {
            console.error('Failed to fetch addresses:', error);
        }
        finally {
            setPageLoading(false);
        }
    }

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please select a shipping address'
            })
            return;
        }
        if (paymentMethod === 'stripe') {
            return Toast.show({
                type: 'error',
                text1: 'Info',
                text2: 'Stripe is not implemented yet'
            })

        }
        setLoading(true);
        try {
            const { street, city, state, zipCode, country } = selectedAddress;
            const token = await getToken();
            await ordersApi.create(token, {
                shippingAddress: { street, city, state, zipCode, country },
                paymentMethod,
            });
            await clearCart();
            router.replace('/orders')
        }
        catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Failed to Place Order',
                text2: error.message
            })
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAddresses();
    }, []);

    if (pageLoading) {
        return (
            <SafeAreaView className="flex-1 bg-surface justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>

            <Header title="Checkout" showBack />

            <ScrollView className="flex-1 px-4 mt-4">
                {/* Address Section */}
                <Text className="text-lg font-bold mb-4 text-primary">Shipping Address</Text>

                {selectedAddress ? (
                    <View className='bg-white p-4 rounded-xl mb-6 shadow-sm'>
                        <View className='flex-row justify-between items-center mb-2'>
                            <Text className='text-base font-bold'>{selectedAddress.type}</Text>
                            <TouchableOpacity onPress={() => router.push('/addresses')}>
                                <Text className='text-accent text-sm'>Change</Text>
                            </TouchableOpacity>
                        </View>
                        <Text className='text-secondary leading-5'>
                            {selectedAddress.street}, {selectedAddress.city}
                            {'\n'}
                            {selectedAddress.state}, {selectedAddress.zipCode}
                            {'\n'}
                            {selectedAddress.country}
                        </Text>
                    </View>


                ) : (
                    <TouchableOpacity className='bg-white p-6 rounded-xl mb-6 items-center justify-center border-dashed border-2 border-gray-100' onPress={() => router.push('/addresses')}>
                        <Text className="text-primary font-bold Address"> Add Address</Text>
                    </TouchableOpacity>
                )}

                {/* Payment Section */}
                <Text className="text-lg font-bold mb-4 text-primary">Payment Method</Text>
                {/* Cash on Delivery Option */}
                <TouchableOpacity className={`flex-row items-center bg-white p-4 rounded-xl mb-4 shadow-sm border-2 ${paymentMethod === 'cash' ? 'border-primary' : 'border-transparent'}`} onPress={() => setPaymentMethod('cash')}>
                    <Ionicons name="cash-outline" size={24} color={COLORS.primary} className="mr-3" />
                    <View className="flex-1 ml-3">
                        <Text className="text-base font-bold text-primary">Cash on Delivery</Text>
                        <Text className="text-secondary text-xs mt-1">Pay when you receive the order</Text>
                    </View>
                    {paymentMethod === 'cash' && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
                </TouchableOpacity>

                {/* Stripe Option */}
                <TouchableOpacity className={`flex-row items-center bg-white p-4 rounded-xl mb-4 shadow-sm border-2 ${paymentMethod === 'stripe' ? 'border-primary' : 'border-transparent'}`} onPress={() => setPaymentMethod('stripe')}>
                    <Ionicons name="card-outline" size={24} color={COLORS.primary} className="mr-3" />
                    <View className="flex-1 ml-3">
                        <Text className="text-base font-bold text-primary">Pay with card</Text>
                        <Text className="text-secondary text-xs mt-1">Credit or debit card</Text>
                    </View>
                    {paymentMethod === 'stripe' && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
                </TouchableOpacity>
            </ScrollView>


            {/* Order Summary */}
            <View className="bg-white p-4 border-t border-gray-100 shadow-lg">
                <Text className='text-lg font-bold text-primary mb-4'>Order Summary</Text>

                {/* Subtotal */}
                <View className='flex-row justify-between mb-2'>
                    <Text className='text-secondary'>Subtotal</Text>
                    <Text className='font-bold'>${cartTotal.toFixed(2)}</Text>
                </View>

                {/* Shipping */}
                <View className='flex-row justify-between mb-2'>
                    <Text className='text-secondary'>Shipping</Text>
                    <Text className='font-bold'>${shipping.toFixed(2)}</Text>
                </View>

                {/* Tax */}
                <View className='flex-row justify-between mb-4'>
                    <Text className='text-secondary'>Tax</Text>
                    <Text className='font-bold'>${tax.toFixed(2)}</Text>
                </View>

                {/* Total */}
                <View className='flex-row justify-between mb-6'>
                    <Text className='text-primary font-bold text-xl'>Total</Text>
                    <Text className='text-primary font-bold text-xl'>${total.toFixed(2)}</Text>
                </View>

                {/* Place Order Button */}
                <TouchableOpacity className={`p-4 rounded-xl items-center ${loading ? 'bg-gray-400' : 'bg-primary'}`} onPress={handlePlaceOrder} disabled={loading}>
                    {loading ? <ActivityIndicator color='white' /> : <Text className='text-white font-bold text-lg'>Place Order</Text>}

                </TouchableOpacity>

            </View>

        </SafeAreaView>
    )
}