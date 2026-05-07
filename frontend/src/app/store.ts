import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/store/authSlice';
import catalogReducer from '@/features/catalog/store/catalogSlice';
import cartReducer from '@/features/cart/store/cartSlice';
import checkoutReducer from '@/features/checkout/store/checkoutSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    catalog: catalogReducer,
    cart: cartReducer,
    checkout: checkoutReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
