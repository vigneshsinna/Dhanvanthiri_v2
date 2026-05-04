/**
 * Cart Adapter
 * Maps new V2 cart endpoints → old frontend cart contract
 *
 * Old endpoints:                   New V2 endpoints:
 * GET  /cart                     → POST /carts (list)
 * POST /cart/items               → POST /carts/add
 * PUT  /cart/items/:itemId       → POST /carts/change-quantity
 * DELETE /cart/items/:itemId     → DELETE /carts/:id
 * DELETE /cart                   → (clear all items — remove each)
 * POST /cart/coupon              → POST /coupon-apply
 * DELETE /cart/coupon            → POST /coupon-remove
 * GET /cart/shipping-rates       → POST /shipping_cost
 */
import { headlessApi, parsePrice } from './client';
import { store } from '@/app/store';
import { setCartToken } from '@/features/cart/store/cartSlice';

interface V2CartItem {
  id: number;
  status: number;
  owner_id: number;
  user_id: number;
  product_id: number;
  product_name: string;
  product_slug?: string;
  auction_product: number;
  product_thumbnail_image: string;
  variation: string;
  price: string;
  currency_symbol: string;
  tax: string;
  shipping_cost: number;
  quantity: number;
  lower_limit: number;
  upper_limit: number;
  digital: number;
  stock: number;
}

interface V2CartGroup {
  name: string;
  owner_id: number;
  sub_total: string;
  cart_items: V2CartItem[];
}

interface V2CartSummary {
  sub_total: string;
  tax: string;
  shipping_cost: string;
  discount: string;
  grand_total: string;
  grand_total_value: number;
  coupon_code: string;
  coupon_applied: boolean;
}

function cartContext() {
  const state = store.getState();
  const userId = state.auth.user?.id ?? null;
  const tempUserId = state.cart.cartToken ?? localStorage.getItem('cart_token') ?? null;

  if (userId) {
    return { user_id: userId };
  }

  if (tempUserId) {
    return { temp_user_id: tempUserId };
  }

  return {};
}

function unwrapCartGroups(payload: any): V2CartGroup[] {
  const data = payload?.data?.data ?? payload?.data ?? payload;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function unwrapCartSummary(payload: any): V2CartSummary | undefined {
  return payload?.data?.data ?? payload?.data ?? payload;
}

// Normalize V2 cart group structure to flat cart expected by old frontend
function normalizeCart(groups: V2CartGroup[], summary?: V2CartSummary, cartToken?: string | null) {
  const items = groups.flatMap(group =>
    group.cart_items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: parsePrice(item.price),
      unit_price: parsePrice(item.price),
      lineTotal: parsePrice(item.price) * item.quantity,
      line_total: parsePrice(item.price) * item.quantity,
      product: {
        id: item.product_id,
        name: item.product_name,
        slug: item.product_slug || '',
        primaryImageUrl: item.product_thumbnail_image,
        primary_image_url: item.product_thumbnail_image,
      },
      variant: item.variation
        ? { id: item.id, sku: item.variation, name: item.variation }
        : null,
      isInStock: item.stock > 0,
      // Extra v2 fields
      _v2: {
        ownerId: item.owner_id,
        lowerLimit: item.lower_limit,
        upperLimit: item.upper_limit,
        tax: 'Rs 0.00',
        shippingCost: 0,
        digital: item.digital,
      },
    }))
  );

  const subtotal = summary
    ? parsePrice(summary.sub_total)
    : items.reduce((sum, i) => sum + i.lineTotal, 0);

  const normalized = {
    data: {
      data: {
        items,
        coupon: summary?.coupon_applied
          ? { code: summary.coupon_code, type: 'fixed', value: parsePrice(summary.discount) }
          : null,
        subtotal,
        discount_amount: summary ? parsePrice(summary.discount) : 0,
        shipping_cost: null,
        tax_amount: null,
        grand_total: summary ? parsePrice(summary.grand_total) : subtotal,
        item_count: items.reduce((sum, i) => sum + i.quantity, 0),
        // Preserve groups for checkout (new backend uses seller-grouped carts)
        _v2Groups: groups,
      },
    },
  };

  if (cartToken !== undefined) {
    (normalized.data.data as any).cart_token = cartToken;
  }

  return normalized;
}

export const cartAdapter: any = {
  async getCart() {
    // V2 uses POST /carts to list cart
    const context = cartContext();
    const responseCartToken = 'temp_user_id' in context ? context.temp_user_id : undefined;
    const [cartRes, summaryRes] = await Promise.all([
      headlessApi.post('/carts', context),
      headlessApi.post('/cart-summary', context).catch(() => null),
    ]);

    const groups = unwrapCartGroups(cartRes.data);
    const summary = summaryRes ? unwrapCartSummary(summaryRes.data) : undefined;

    return normalizeCart(groups, summary, responseCartToken);
  },

  async addItem(payload: { product_id: number; variant_id?: number; variant?: string; quantity: number }) {
    const context = cartContext();
    const res = await headlessApi.post('/carts/add', {
      id: payload.product_id,
      variant: payload.variant ?? '',
      quantity: payload.quantity,
      // The V2 backend rejects cart writes when this legacy field is empty.
      cost_matrix: 'headless-storefront',
      ...context,
    });
    const tempUserId = res.data?.data?.temp_user_id ?? res.data?.temp_user_id;
    if (tempUserId) {
      store.dispatch(setCartToken(tempUserId));
    }

    const updatedContext = cartContext();
    const responseCartToken = 'temp_user_id' in updatedContext ? updatedContext.temp_user_id : undefined;
    const [cartRes, summaryRes] = await Promise.all([
      headlessApi.post('/carts', updatedContext),
      headlessApi.post('/cart-summary', updatedContext).catch(() => null),
    ]);

    const groups = unwrapCartGroups(cartRes.data);
    const summary = summaryRes ? unwrapCartSummary(summaryRes.data) : undefined;

    return normalizeCart(groups, summary, responseCartToken);
  },

  async updateItem({ itemId, quantity }: { itemId: number; quantity: number }) {
    const res = await headlessApi.post('/carts/change-quantity', {
      id: itemId,
      quantity,
    });
    return { data: res.data };
  },

  async removeItem(itemId: number) {
    const res = await headlessApi.delete(`/carts/${itemId}`);
    return { data: res.data };
  },

  async clearCart() {
    // V2 doesn't have a "clear all" endpoint; fetch cart first, then remove each
    try {
      const cartRes = await headlessApi.post('/carts', cartContext());
      const groups = unwrapCartGroups(cartRes.data);
      const allItems = groups.flatMap(g => g.cart_items);
      await Promise.all(allItems.map(item => headlessApi.delete(`/carts/${item.id}`)));
    } catch {
      // Cart may already be empty
    }
    return { data: { message: 'Cart cleared' } };
  },

  async applyCoupon(payload: { code: string }) {
    const res = await headlessApi.post('/coupon-apply', {
      coupon_code: payload.code,
      ...cartContext(),
    });
    return { data: res.data };
  },

  async removeCoupon() {
    const res = await headlessApi.post('/coupon-remove', cartContext());
    return { data: res.data };
  },

  async shippingRates(addressId: number, state?: string) {
    // Use the storefront checkout bridge so the checkout page receives a stable home-delivery option.
    try {
      const res = await headlessApi.post('/checkout/shipping-rates', {
        address_id: addressId,
        state,
        cart_token: store.getState().cart.cartToken ?? localStorage.getItem('cart_token') ?? undefined,
      });
      const items = res.data?.data?.items || res.data?.data || [];
      return { data: { data: items } };
    } catch {
      return { data: { data: [] } };
    }
  },
};
