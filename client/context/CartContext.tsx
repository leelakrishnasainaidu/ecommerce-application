import { createContext, ReactNode, useContext, useState, useEffect, useCallback } from "react";
import { Product } from "@/constants/types";
import { cartApi } from "@/constants/api";
import { useAuth } from "@clerk/clerk-expo";

export type CartItem = {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    size: string;
    price: number;
}

type CartContextType = {
    cartItems: CartItem[],
    addToCart: (product: Product, size: string) => Promise<void>,
    removeFromCart: (productId: string, size: string) => Promise<void>,
    updateQuantity: (productId: string, quantity: number, size: string) => Promise<void>,
    clearCart: () => Promise<void>,
    cartTotal: number,
    itemCount: number,
    isLoading: boolean,
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const mapCart = (cart: any): CartItem[] => {
    return (cart?.items || []).map((item: any) => ({
        id: item.product?._id,
        productId: item.product?._id,
        product: item.product,
        quantity: item.quantity,
        size: item?.size || "M",
        price: item.price,
    }));
}

export function CartProvider({ children }: { children: ReactNode }) {

    const { isSignedIn, getToken } = useAuth();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCart = useCallback(async () => {
        if (!isSignedIn) {
            setCartItems([]);
            return;
        }
        setIsLoading(true);
        try {
            const token = await getToken();
            const res = await cartApi.get(token);
            setCartItems(mapCart(res.data));
        }
        catch (error) {
            console.error("Failed to fetch cart:", error);
        }
        finally {
            setIsLoading(false);
        }
    }, [isSignedIn, getToken]);

    const addToCart = async (product: Product, size: string) => {
        try {
            const token = await getToken();
            const res = await cartApi.add(token, { productId: product._id, quantity: 1, size });
            setCartItems(mapCart(res.data));
        }
        catch (error) {
            console.error("Failed to add to cart:", error);
            throw error;
        }
    }

    const removeFromCart = async (productId: string, size: string) => {
        try {
            const token = await getToken();
            const res = await cartApi.remove(token, productId, size);
            setCartItems(mapCart(res.data));
        }
        catch (error) {
            console.error("Failed to remove from cart:", error);
        }
    }

    const updateQuantity = async (productId: string, quantity: number, size: string = 'M') => {
        if (quantity <= 0) {
            await removeFromCart(productId, size);
            return;
        }
        try {
            const token = await getToken();
            const res = await cartApi.update(token, productId, quantity, size);
            setCartItems(mapCart(res.data));
        }
        catch (error) {
            console.error("Failed to update cart item:", error);
        }
    }

    const clearCart = async () => {
        try {
            const token = await getToken();
            await cartApi.clear(token);
            setCartItems([]);
        }
        catch (error) {
            console.error("Failed to clear cart:", error);
        }
    }

    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount, isLoading }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
