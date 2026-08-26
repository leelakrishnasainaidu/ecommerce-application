import { createContext, ReactNode, useContext, useState } from "react";
import { Product, WishlistContextType } from "@/constants/types";

const WishListContext = createContext<WishlistContextType | undefined>(undefined);

// No wishlist endpoint exists on the server yet, so this stays local-only for now
export function WishlistProvider({ children }: { children: ReactNode }) {

    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading] = useState(false);

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