import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartsApi } from './api';

interface CartItem {
  product: string; // product ID
  quantity: number;
  price?: number; // Prix au moment de l'ajout (optionnel)
}

interface CartState {
  items: CartItem[];
  syncing: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  getTotalItems: () => number;
  getItems: () => CartItem[];
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      syncing: false,
      
      // Synchroniser le panier avec le backend
      syncCart: async () => {
        const { items } = get();
        const token = localStorage.getItem('token');
        
        if (!token) {
          // Pas connecté, on garde juste le localStorage
          return;
        }

        if (get().syncing) return;
        
        set({ syncing: true });
        try {
          await cartsApi.sync({
            items: items.map(item => ({
              product: item.product,
              quantity: item.quantity
            }))
          });
        } catch (error) {
          console.error('Error syncing cart:', error);
          // On continue même en cas d'erreur
        } finally {
          set({ syncing: false });
        }
      },

      // Charger le panier depuis le backend
      loadCart: async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
          return;
        }

        try {
          const res = await cartsApi.getMy();
          if (res.data && res.data.items) {
            set({
              items: res.data.items.map((item: any) => ({
                product: item.product._id || item.product,
                quantity: item.quantity,
                price: item.price
              }))
            });
          }
        } catch (error) {
          console.error('Error loading cart:', error);
        }
      },

      addItem: async (productId: string, quantity: number = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.product === productId);
          let newItems;
          
          if (existingItem) {
            newItems = state.items.map(item =>
              item.product === productId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            newItems = [...state.items, { product: productId, quantity }];
          }
          
          return { items: newItems };
        });
        
        // Synchroniser avec le backend
        await get().syncCart();
      },

      removeItem: async (productId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.product !== productId),
        }));
        
        // Synchroniser avec le backend
        await get().syncCart();
      },

      updateQuantity: async (productId: string, quantity: number) => {
        if (quantity <= 0) {
          await get().removeItem(productId);
          return;
        }
        
        set((state) => ({
          items: state.items.map(item =>
            item.product === productId
              ? { ...item, quantity }
              : item
          ),
        }));
        
        // Synchroniser avec le backend
        await get().syncCart();
      },

      clearCart: async () => {
        set({ items: [] });
        
        // Synchroniser avec le backend
        await get().syncCart();
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

