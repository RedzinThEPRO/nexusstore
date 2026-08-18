import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AIAssistant } from '@/components/AIAssistant';
import { seedIfEmpty } from '@/lib/store';

import { HomePage } from '@/pages/HomePage';
import { StorePage } from '@/pages/StorePage';
import { ProductPage } from '@/pages/ProductPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { OrdersPage } from '@/pages/OrdersPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { TermsPage } from '@/pages/TermsPage';

import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminProducts } from '@/pages/admin/AdminProducts';
import { AdminCategories } from '@/pages/admin/AdminCategories';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminDeliveries } from '@/pages/admin/AdminDeliveries';
import { AdminCustomers } from '@/pages/admin/AdminCustomers';
import { AdminMessages } from '@/pages/admin/AdminMessages';
import { AdminReviews } from '@/pages/admin/AdminReviews';
import { AdminAnalytics } from '@/pages/admin/AdminAnalytics';
import { AdminLogs } from '@/pages/admin/AdminLogs';
import { AdminCoupons } from '@/pages/admin/AdminCoupons';
import { AdminConfig } from '@/pages/admin/AdminConfig';
import { AdminTerms } from '@/pages/admin/AdminTerms';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function App() {
  useEffect(() => {
    seedIfEmpty();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/loja" element={<StorePage />} />
                <Route path="/produto/:slug" element={<ProductPage />} />
                <Route path="/categorias" element={<CategoriesPage />} />
                <Route path="/carrinho" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<RegisterPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="/pedidos" element={<OrdersPage />} />
                <Route path="/pedido/:orderId" element={<OrderDetailPage />} />
                <Route path="/termos" element={<TermsPage />} />

                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="pedidos" element={<AdminOrders />} />
                  <Route path="entregas" element={<AdminDeliveries />} />
                  <Route path="produtos" element={<AdminProducts />} />
                  <Route path="categorias" element={<AdminCategories />} />
                  <Route path="cupons" element={<AdminCoupons />} />
                  <Route path="clientes" element={<AdminCustomers />} />
                  <Route path="mensagens" element={<AdminMessages />} />
                  <Route path="avaliacoes" element={<AdminReviews />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="logs" element={<AdminLogs />} />
                  <Route path="config" element={<AdminConfig />} />
                  <Route path="termos" element={<AdminTerms />} />
                </Route>

                <Route path="*" element={<HomePage />} />
              </Routes>
            </main>
            <Footer />
            <AIAssistant />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
