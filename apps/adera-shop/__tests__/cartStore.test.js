import useCartStore from '../store/cartStore';

// Reset the store before each test
beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe('Cart Store', () => {
  const mockProduct = {
    id: 'prod-1',
    name: 'Test Product',
    price: 250,
    images: ['https://example.com/image.jpg'],
    shop_id: 'shop-1',
    shop_name: 'Test Shop',
    stock_quantity: 10,
  };

  const mockProduct2 = {
    id: 'prod-2',
    name: 'Another Product',
    price: 100,
    images: [],
    shop_id: 'shop-2',
    shop_name: 'Shop 2',
    stock_quantity: 5,
  };

  describe('addItem', () => {
    it('adds a new item to the cart', () => {
      useCartStore.getState().addItem(mockProduct);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('prod-1');
      expect(items[0].name).toBe('Test Product');
      expect(items[0].quantity).toBe(1);
    });

    it('increments quantity for existing items', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('adds different items separately', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(2);
    });

    it('respects custom quantity', () => {
      useCartStore.getState().addItem(mockProduct, 3);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });
  });

  describe('removeItem', () => {
    it('removes an item from the cart', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().removeItem('prod-1');
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('only removes the specified item', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      useCartStore.getState().removeItem('prod-1');
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].id).toBe('prod-2');
    });
  });

  describe('updateQuantity', () => {
    it('updates quantity for an item', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity('prod-1', 5);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('removes item when quantity is 0', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity('prod-1', 0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('removes item when quantity is negative', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity('prod-1', -1);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('caps quantity at stock level', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity('prod-1', 100);
      expect(useCartStore.getState().items[0].quantity).toBe(10); // stock_quantity
    });
  });

  describe('clearCart', () => {
    it('clears all items', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      useCartStore.getState().clearCart();
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('getItemCount', () => {
    it('returns 0 for empty cart', () => {
      expect(useCartStore.getState().getItemCount()).toBe(0);
    });

    it('returns total quantity of all items', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      expect(useCartStore.getState().getItemCount()).toBe(2);
    });

    it('returns sum of quantities when items have multiple quantities', () => {
      useCartStore.getState().addItem(mockProduct, 3);
      useCartStore.getState().addItem(mockProduct2, 2);
      expect(useCartStore.getState().getItemCount()).toBe(5);
    });
  });

  describe('getTotalAmount', () => {
    it('returns 0 for empty cart', () => {
      expect(useCartStore.getState().getTotalAmount()).toBe(0);
    });

    it('returns correct total', () => {
      useCartStore.getState().addItem(mockProduct); // 250
      useCartStore.getState().addItem(mockProduct2); // 100
      expect(useCartStore.getState().getTotalAmount()).toBe(350);
    });

    it('calculates total with multiple quantities', () => {
      useCartStore.getState().addItem(mockProduct, 2); // 250 * 2 = 500
      useCartStore.getState().addItem(mockProduct2, 3); // 100 * 3 = 300
      expect(useCartStore.getState().getTotalAmount()).toBe(800);
    });
  });
});
