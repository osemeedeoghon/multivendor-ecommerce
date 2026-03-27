'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('cart');
        if (saved) setCart(JSON.parse(saved));
    }, []);

    const saveCart = (newCart) => {
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    const addToCart = (product, qty = 1) => {
        const existing = cart.find(item => item.productId === product._id);
        if (existing) {
            saveCart(cart.map(item =>
                item.productId === product._id
                    ? { ...item, qty: item.qty + qty }
                    : item
            ));
        } else {
            saveCart([...cart, {
                productId: product._id,
                sellerId: product.sellerId,
                title: product.title,
                price: product.price,
                image: product.images?.[0] || null,
                qty,
            }]);
        }
    };

    const removeFromCart = (productId) => {
        saveCart(cart.filter(item => item.productId !== productId));
    };

    const updateQty = (productId, qty) => {
        if (qty < 1) return removeFromCart(productId);
        saveCart(cart.map(item =>
            item.productId === productId ? { ...item, qty } : item
        ));
    };

    const clearCart = () => saveCart([]);

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, total, itemCount }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);