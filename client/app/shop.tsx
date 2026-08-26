import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Product } from '@/constants/types';
import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { FlatList, TextInput } from 'react-native-gesture-handler';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import ProductCard from '@/components/ProductCard';
import { productsApi } from '@/constants/api';
import { useLocalSearchParams } from 'expo-router';

const PAGE_SIZE = 10;

export default function Shop() {

    const { category } = useLocalSearchParams<{ category?: string }>();

    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);


    const fetchProducts = async (pageNumber = 1) => {
        if (pageNumber === 1) {
            setLoading(true);
        }
        else {
            setLoadingMore(true);
        }
        try {
            const res = await productsApi.list({ page: pageNumber, limit: PAGE_SIZE, category, search: search || undefined });
            if (pageNumber === 1) {
                setProducts(res.data);
            }
            else {
                setProducts(prev => [...prev, ...res.data]);
            }
            setHasMore(res.pagination.page < res.pagination.pages);
            setPage(pageNumber);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
        finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    const loadMore = () => {
        if (!loadingMore && !loading && hasMore) {
            fetchProducts(page + 1);
        }
    }

    useEffect(() => {
        fetchProducts(1);
    }, [category])

    const handleSearchSubmit = () => {
        fetchProducts(1);
    }

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <Header title='Shop' showBack showCart />
            <View className="flex-row gap-2 mb-3 mx-4 my-2">
                {/* Search bar */}
                <View className='bg-white flex-row items-center border border-gray-100 rounded-xl flex-1'>
                    <Ionicons name='search' className="ml-4" size={20} color={COLORS.secondary} />
                    <TextInput
                        className='flex-1 ml-2 text-primary px-4 py-3'
                        placeholder='Search products...'
                        returnKeyType='search'
                        placeholderTextColor={COLORS.secondary}
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={handleSearchSubmit}
                    />
                </View>

                {/* Filter icon */}
                <TouchableOpacity className='bg-gray-800 w-12 h-12 items-center justify-center rounded-xl'>
                    <Ionicons name='options-outline' size={24} color='white' />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList data={products}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                    renderItem={({ item }) => (
                        <ProductCard product={item} />
                    )}

                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loadingMore ? (
                            <View className='py-4'>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            </View>
                        ) : null
                    }

                    ListEmptyComponent={
                        !loading && (
                            <View className='flex-1 items-center justify-center py-20'>
                                <Text className='text-secondary'>
                                    No products found
                                </Text>
                            </View>
                        )
                    }
                />

            )}
        </SafeAreaView>
    )
}