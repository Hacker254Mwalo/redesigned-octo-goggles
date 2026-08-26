import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type BasketItem = {
  id: number;
  slug: string;
  title: string;
  price: number;
  category: string;
  quantity: number;
};

type CartContextValue = {
  items: BasketItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<BasketItem, "quantity">) => void;
  updateQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "mtaamarket-basket-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(items)); }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.price * item.quantity, 0),
    addItem: (item) => setItems(current => {
      const existing = current.find(entry => entry.id === item.id);
      return existing
        ? current.map(entry => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry)
        : [...current, { ...item, quantity: 1 }];
    }),
    updateQuantity: (id, quantity) => setItems(current => quantity <= 0 ? current.filter(item => item.id !== id) : current.map(item => item.id === id ? { ...item, quantity } : item)),
    removeItem: (id) => setItems(current => current.filter(item => item.id !== id)),
    clearCart: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
