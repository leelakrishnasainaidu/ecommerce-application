import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { Product, WishlistContextType } from "@/constants/types";
import { dummyWishlist } from "@/assets/assets";

const WishListContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {

    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchWishlist = async () => {
        setLoading(true);
        setWishlist(dummyWishlist);
        setLoading(false);
    }

    const toggleWishlist = async (product: Product) => {
        setWishlist((prev) => {
            const exists = prev.find((p) => p._id === product._id);
            if (exists) {
                return prev.filter((p) => p._id !== product._id);
            }
            return [...prev, product];
        })
    }

    const isInWishlist = (productId: string) => {
        return wishlist.some((p) => p._id === productId);
    }

    useEffect(() => {
        fetchWishlist();
    }, []);

    return (
        <WishListContext.Provider value={{ wishlist, loading, isInWishlist, toggleWishlist }}>
            {children}
        </WishListContext.Provider>
    )
}

export function useWishlist() {
    const context = useContext(WishListContext);
    if (context === undefined) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
}