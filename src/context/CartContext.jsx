import { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (product) => {
        const productId = product._id || product.id;
        setCartItems(prev => {
            const existing = prev.find(item => (item._id || item.id) === productId);
            if (existing) {
                return prev.map(item =>
                    (item._id || item.id) === productId ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1, id: productId }]; // Ensure id exists
        });
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => (item._id || item.id) !== id));
    };

    const updateQuantity = (id, delta) => {
        setCartItems(prev => prev.map(item => {
            if ((item._id || item.id) === id) {
                const newQty = item.quantity + delta;
                if (newQty < 1) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const clearCart = () => setCartItems([]);

    const total = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cartItems]);

    const totalItems = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }, [cartItems]);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, total, totalItems }}>
            {children}
        </CartContext.Provider>
    );
};
