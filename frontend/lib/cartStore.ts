import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  product: string; // product ID
  quantity: number;
  price?: number; // Prix au moment de l'ajout (optionnel)
}

interface CartState {
  items: CartItem[];
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getItems: () => CartItem[];
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productId: string, quantity: number = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.product === productId);
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.product === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            items: [...state.items, { product: productId, quantity }],
          };
        });
      },
      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.product !== productId),
        }));
      },
      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map(item =>
            item.product === productId
              ? { ...item, quantity }
              : item
          ),
        }));
      },
      clearCart: () => {
        set({ items: [] });
      },
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      getItems: () => {
        return get().items;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

