import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],

  addItem: (product, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((item) => item.id === product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            id: product.id,
            name: product.name,
            price: Number(product.price) || 0,
            image: product.images?.[0] || null,
            shopId: product.shop_id,
            shopName: product.shop_name || 'Shop',
            quantity,
            stock: product.stock_quantity ?? 99,
          },
        ],
      };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((item) => item.id !== productId) };
      }
      return {
        items: state.items.map((item) =>
          item.id === productId ? { ...item, quantity: Math.min(quantity, item.stock) } : item,
        ),
      };
    }),

  clearCart: () => set({ items: [] }),

  get itemCount() {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  get totalAmount() {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  getTotalAmount: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));

export default useCartStore;
