import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { CartProvider } from '@/context/CartContext';
import { PublicHeader } from '@/components/PublicHeader';
import { Footer } from '@/components/Footer';
import { AIAssistant } from '@/components/AIAssistant';
import { seedIfEmpty } from '@/lib/store';
import { HomePage } from '@/pages/HomePage';
import { StorePage } from '@/pages/StorePage';
import { ProductPage } from '@/pages/ProductPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { TermsPage } from '@/pages/TermsPage';
import { SupportPage } from '@/pages/SupportPage';

function ScrollToTop() { const { pathname } = useLocation(); useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior }); }, [pathname]); return null; }
export function App() { useEffect(() => { seedIfEmpty(); }, []); return <BrowserRouter><CartProvider><ScrollToTop /><div className="flex min-h-screen flex-col"><PublicHeader /><main className="flex-1"><Routes><Route path="/" element={<HomePage />} /><Route path="/loja" element={<StorePage />} /><Route path="/produto/:slug" element={<ProductPage />} /><Route path="/categorias" element={<CategoriesPage />} /><Route path="/carrinho" element={<CartPage />} /><Route path="/checkout" element={<CheckoutPage />} /><Route path="/suporte" element={<SupportPage />} /><Route path="/termos" element={<TermsPage />} /></Routes></main><Footer /><AIAssistant /></div></CartProvider></BrowserRouter>; }
export default App;
