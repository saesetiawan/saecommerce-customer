"use client";

import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { getAccessToken } from "@/app/services/auth.service";
import { getCartItems } from "@/app/services/cart.service";
import {
    AUTH_CHANGED_EVENT,
    CART_CHANGED_EVENT,
} from "@/app/lib/cart-events";

type CartContextValue = {
    cartCount: number;
    isLoadingCartCount: boolean;
    refreshCartCount: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartCount, setCartCount] = useState(0);
    const [isLoadingCartCount, setIsLoadingCartCount] = useState(false);

    const refreshCartCount = useCallback(async () => {
        const accessToken = getAccessToken();

        if (!accessToken) {
            setCartCount(0);
            return;
        }

        setIsLoadingCartCount(true);

        try {
            const items = await getCartItems();
            const nextCount = items.reduce((total, item) => {
                return total + Math.max(item.quantity, 0);
            }, 0);

            setCartCount(nextCount);
        } catch {
            setCartCount(0);
        } finally {
            setIsLoadingCartCount(false);
        }
    }, []);

    useEffect(() => {
        void refreshCartCount();

        const handleChange = () => {
            void refreshCartCount();
        };

        window.addEventListener(CART_CHANGED_EVENT, handleChange);
        window.addEventListener(AUTH_CHANGED_EVENT, handleChange);
        window.addEventListener("focus", handleChange);

        return () => {
            window.removeEventListener(CART_CHANGED_EVENT, handleChange);
            window.removeEventListener(AUTH_CHANGED_EVENT, handleChange);
            window.removeEventListener("focus", handleChange);
        };
    }, [refreshCartCount]);

    const value = useMemo(
        () => ({
            cartCount,
            isLoadingCartCount,
            refreshCartCount,
        }),
        [cartCount, isLoadingCartCount, refreshCartCount],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error("useCart must be used inside CartProvider");
    }

    return context;
}
