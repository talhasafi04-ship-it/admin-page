/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { Layout } from './components/Layout';
import { ProductsList } from './components/products/ProductsList';
import { ProductForm } from './components/products/ProductForm';
import { CategoriesList } from './components/categories/CategoriesList';
import { CategoryForm } from './components/categories/CategoryForm';
import { OrdersList } from './components/orders/OrdersList';
import { OrderDetail } from './components/orders/OrderDetail';
import { CustomersList } from './components/customers/CustomersList';
import { CustomerDetail } from './components/customers/CustomerDetail';
import { TransactionsList } from './components/transactions/TransactionsList';
import { SettingsLayout } from './components/settings/SettingsLayout';
import { GeneralSettings } from './components/settings/GeneralSettings';
import { ShippingSettings } from './components/settings/ShippingSettings';
import { ReportsView } from './components/reports/ReportsView';
import { CouponsList } from './components/coupons/CouponsList';
import { MessagesList } from './components/messages/MessagesList';
import { MessageDetail } from './components/messages/MessageDetail';
import { Login } from './components/auth/Login';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<ProductsList />} />
              <Route path="/products/:id" element={<ProductForm />} />
              <Route path="/categories" element={<CategoriesList />} />
              <Route path="/categories/:id" element={<CategoryForm />} />
              <Route path="/orders" element={<OrdersList />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/customers" element={<CustomersList />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/payments" element={<TransactionsList />} />
              <Route path="/coupons" element={<CouponsList />} />
              <Route path="/messages" element={<MessagesList />} />
              <Route path="/messages/:id" element={<MessageDetail />} />
              <Route path="/reports" element={<ReportsView />} />
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<GeneralSettings />} />
                <Route path="shipping" element={<ShippingSettings />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
