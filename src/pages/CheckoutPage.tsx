import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getCouponByCode } from '@/lib/api';
import { uid } from '@/lib/store';
import { formatBRL, validateCPF, getAge, formatCPFInput } from '@/lib/format';
import type { OrderItem } from '@/types';
import { EmptyState, Toast } from '@/components/ui';
import { ShoppingCart, Shield, Zap, CheckCircle2, Copy, QrCode, ArrowRight, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user, updateMyProfile } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [cpf, setCpf] = useState(user?.cpf ?? '');
  const [birthDate, setBirthDate] = useState(user?.birth_date ?? '');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [orderId, setOrderId] = useState('');
  const [pixCopied, setPixCopied] = useState(false);
  const [pixCode, setPixCode] = useState('');
  const [pixQr, setPixQr] = useState('');
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [toast, setToast] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (!supabase || step !== 'payment' || !orderId) return;
    let active = true;
    const check = async () => {
      const { data } = await supabase.from('orders').select('payment_status').eq('id', orderId).maybeSingle();
      if (active && data?.payment_status === 'PAID') {
        clear();
        setStep('success');
      }
    };
    void check();
    const timer = window.setInterval(check, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [step, orderId, clear]);

  if (!user) {
    navigate('/login?redirect=/checkout');
    return null;
  }

  if (items.length === 0 && step !== 'success') {
    return <EmptyState icon={<ShoppingCart className="h-12 w-12" />} title="Carrinho vazio"
      action={<Link to="/loja" className="btn-primary">Ir à loja</Link>} />;
  }

  const discount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const applyCoupon = () => {
    setCouponError('');
    const c = getCouponByCode(couponCode.trim());
    if (!c) { setCouponError('Cupom inválido ou expirado.'); setAppliedCoupon(null); return; }
    if (c.min_order && subtotal < c.min_order) {
      setCouponError(`Pedido mínimo de ${formatBRL(c.min_order)} para este cupom.`);
      setAppliedCoupon(null); return;
    }
    const d = c.type === 'PERCENT' ? (subtotal * c.value) / 100 : c.value;
    setAppliedCoupon({ code: c.code, discount: d });
    setToast('Cupom aplicado!');
  };

  const validateForm = () => {
    if (!firstName.trim() || !lastName.trim()) return 'Informe nome e sobrenome.';
    if (!cpf.trim()) return 'Informe seu CPF.';
    if (!validateCPF(cpf)) return 'CPF inválido. Verifique os dígitos.';
    if (!birthDate) return 'Informe sua data de nascimento.';
    const age = getAge(birthDate);
    if (age < 16) return 'Você precisa ter pelo menos 16 anos para comprar.';
    if (age > 120) return 'Data de nascimento inválida.';
    if (!termsAccepted) return 'Você precisa aceitar os Termos de Privacidade para continuar.';
    return null;
  };

  const placeOrder = async () => {
    const err = validateForm();
    if (err) { setToast(err); return; }

    // Save profile data
    updateMyProfile({ first_name: firstName, last_name: lastName, cpf, birth_date: birthDate });

    // Create order
    const orderItems: OrderItem[] = items.map(i => ({
      id: uid('oi'), product_id: i.product.id, product_name: i.product.name,
      product_image: i.product.images[0] ?? '', price: i.product.promo_price ?? i.product.price,
      quantity: i.quantity, free_fire_id: i.free_fire_id,
    }));

    if (supabase) {
      setCreatingPayment(true);
      const { data, error } = await supabase.functions.invoke('evopay-create-charge', { body: { couponCode: appliedCoupon?.code, items: orderItems.map(i => ({ product_id: i.product_id, quantity: i.quantity, free_fire_id: i.free_fire_id })), customer: { name: `${firstName} ${lastName}`, document: cpf, email: user.email } } });
      setCreatingPayment(false);
      if (error || data?.error) { setToast(data?.error || error?.message || 'Não foi possível gerar o PIX.'); return; }
      setOrderId(data.orderId);
      setPixCode(data?.pixCode || data?.qrCodeText || ''); setPixQr(data?.pixQr || data?.qrCodeBase64 || data?.qrCodeUrl || '');
    } else {
      setToast('Pagamento indisponível: configure o Supabase para processar pedidos.');
      return;
    }
    setStep('payment');
  };

  const copyPix = () => {
    navigator.clipboard.writeText(pixCode || `00020126360014BR.GOV.BCB.PIX0114nexus@store.com5204000053039865802BR5913NEXUSSTORE6009SAOPAULO62070503***6304${orderId.slice(-6)}`);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  // ---- Success step ----
  if (step === 'success') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="grid h-20 w-20 mx-auto place-items-center rounded-full bg-success-500/15 border border-success-500/30 mb-6 animate-fade-in">
          <CheckCircle2 className="h-10 w-10 text-success-400" />
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-3">Compra realizada com sucesso!</h1>
        <p className="text-ink-200 mb-2">Pedido <span className="text-neon-300 font-mono">#{orderId.slice(-8).toUpperCase()}</span></p>
        <p className="text-ink-300 mb-6">Pagamento confirmado via PIX. A entrega será realizada em até 12 horas.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to={`/pedido/${orderId}`} className="btn-primary">Ver entrega <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/pedidos" className="btn-outline">Meus pedidos</Link>
          <Link to="/loja" className="btn-ghost">Continuar comprando</Link>
        </div>
      </div>
    );
  }

  // ---- Payment step ----
  if (step === 'payment') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="font-display text-3xl font-bold text-white mb-6">Pagamento via PIX</h1>
        <div className="card p-6 text-center">
          <div className="grid h-48 w-48 mx-auto place-items-center rounded-2xl bg-white p-4 mb-4">
            <QrCode className="h-40 w-40 text-ink-950" />
          </div>
          <p className="text-3xl font-bold text-neon-300 mb-1">{formatBRL(total)}</p>
          <p className="text-sm text-ink-300 mb-4">Pedido #{orderId.slice(-8).toUpperCase()}</p>

          <div className="flex items-center gap-2 card p-3 mb-4 text-left">
            <code className="flex-1 text-xs text-ink-200 truncate">00020126360014BR.GOV.BCB.PIX0114nexus@store.com...</code>
            <button onClick={copyPix} className="btn-outline py-1.5 px-3 text-xs">
              {pixCopied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {pixCopied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="chip-warning">Aguardando pagamento</span>
          </div>
          <p className="text-xs text-ink-400 mt-3">
            Em produção, o pagamento é confirmado automaticamente pelo webhook do gateway PIX.
          </p>
        </div>
      </div>
    );
  }

  // ---- Form step ----
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-3xl font-bold text-white mb-6">Finalizar Compra</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Form */}
        <div className="space-y-6">
          {/* Account info */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Conta</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Usuário</label><p className="text-sm text-white">{user.username}</p></div>
              <div><label className="label">E-mail</label><p className="text-sm text-white truncate">{user.email}</p></div>
            </div>
          </div>

          {/* Personal data */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Dados pessoais</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nome *</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Sobrenome *</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">CPF *</label>
                <input value={cpf} onChange={e => setCpf(formatCPFInput(e.target.value))} placeholder="000.000.000-00" className="input" maxLength={14} />
              </div>
              <div>
                <label className="label">Data de nascimento *</label>
                <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="input" />
              </div>
            </div>
          </div>

          {/* Coupon */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Cupom de desconto</h3>
            <div className="flex gap-2">
              <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Digite o cupom" className="input" />
              <button onClick={applyCoupon} className="btn-outline">Aplicar</button>
            </div>
            {couponError && <p className="text-xs text-danger-400 mt-2">{couponError}</p>}
            {appliedCoupon && <p className="text-xs text-success-400 mt-2">Cupom {appliedCoupon.code} aplicado: -{formatBRL(appliedCoupon.discount)}</p>}
          </div>

          {/* Terms acceptance */}
          <div className="card p-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded accent-neon-500 shrink-0" />
              <span className="text-sm text-ink-200">
                Li e aceito os{' '}
                <Link to="/termos" target="_blank" className="text-neon-300 hover:text-neon-200 underline">Termos de Privacidade e Segurança</Link>
                {' '}da NexusStore.
              </span>
            </label>
          </div>
        </div>

        {/* Summary */}
        <div className="card p-5 h-fit sticky top-20">
          <h3 className="text-sm font-semibold text-white mb-4">Seu pedido</h3>
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {items.map(i => (
              <div key={i.product.id} className="flex items-center gap-2 text-sm">
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-ink-900 shrink-0">
                  {i.product.images[0] ? <img src={i.product.images[0]} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-ink-500 m-2" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs truncate">{i.product.name}</p>
                  <p className="text-ink-400 text-xs">x{i.quantity}</p>
                </div>
                <span className="text-neon-300 text-xs font-semibold">{formatBRL((i.product.promo_price ?? i.product.price) * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm border-t border-white/10 pt-3">
            <div className="flex justify-between text-ink-200"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-success-400"><span>Desconto</span><span>-{formatBRL(discount)}</span></div>}
            <div className="flex justify-between text-white font-bold border-t border-white/10 pt-2"><span>Total</span><span>{formatBRL(total)}</span></div>
          </div>
          <button onClick={placeOrder} className="btn-primary w-full mt-5 py-3">
            Pagar via PIX <ArrowRight className="h-4 w-4" />
          </button>
          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-ink-400">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Seguro</span>
            <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> Rápido</span>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} type="info" onClose={() => setToast('')} />}
    </div>
  );
}
