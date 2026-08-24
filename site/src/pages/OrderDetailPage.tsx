import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  getOrderById, getDeliveryByOrder, getMessagesByDelivery, addMessage,
  markMessagesRead, updateDelivery, addNotification, addReview, getReviewsByProduct,
  getDeliveries, updateOrder,
} from '@/lib/api';
import { uid } from '@/lib/store';
import { formatBRL, formatDate, timeAgo } from '@/lib/format';
import { EmptyState, Stars, Toast, ConfirmDialog } from '@/components/ui';
import {
  Package, Send, CheckCircle2, Truck, ChevronLeft, MessageCircle,
  Shield, Star, Clock, AlertCircle,
} from 'lucide-react';
import type { ChatMessage, Delivery, Notification, DeliveryStatus } from '@/types';

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const user = { email: '', username: 'Visitante', id: 'guest' };
  const isAdmin = false;
  const [toast, setToast] = useState('');
  const [input, setInput] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tick, setTick] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const order = orderId ? getOrderById(orderId) : undefined;

  // Force re-render periodically for realtime-like feel
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(i);
  }, []);
  void tick;

  if (!order) {
    return <EmptyState icon={<Package className="h-12 w-12" />} title="Pedido não encontrado"
      action={<Link to="/pedidos" className="btn-primary">Meus pedidos</Link>} />;
  }

  // Authorization: only owner or admin
  if (user && order.user_id !== user.id && !isAdmin) {
    return <EmptyState icon={<AlertCircle className="h-12 w-12" />} title="Acesso negado"
      desc="Você não tem permissão para ver este pedido." />;
  }

  const delivery = getDeliveryByOrder(order.id);
  const messages = delivery ? getMessagesByDelivery(delivery.id) : [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  // Mark read on view
  useEffect(() => {
    if (delivery && user) {
      const role = isAdmin ? 'admin' : 'customer';
      markMessagesRead(delivery.id, role as 'customer' | 'admin');
    }
  }, [delivery, user, isAdmin, tick]);

  const send = () => {
    if (!input.trim() || !delivery || !user) return;
    const msg: ChatMessage = {
      id: uid('msg'), delivery_id: delivery.id, sender_id: user.id,
      sender_role: isAdmin ? 'admin' : 'customer',
      content: input.trim(), created_at: new Date().toISOString(), read: false,
    };
    addMessage(msg);
    setInput('');
    setTick(t => t + 1);

    // Notify the other party
    const targetId = isAdmin ? order.user_id : 'admin-001';
    const notif: Notification = {
      id: uid('ntf'), user_id: targetId, type: 'message',
      title: isAdmin ? 'Nova mensagem do suporte' : 'Nova mensagem do cliente',
      message: input.trim().slice(0, 100), chat_id: delivery.id,
      order_id: order.id, read: false, created_at: new Date().toISOString(),
    };
    addNotification(notif);
  };

  const confirmDelivery = () => {
    if (!delivery || !user) return;
    updateDelivery(delivery.id, { status: 'COMPLETED', admin_id: user.id, completed_at: new Date().toISOString() });
    updateOrder(order.id, { status: 'DELIVERED', delivery_status: 'COMPLETED' });

    // Notify customer
    const notif: Notification = {
      id: uid('ntf'), user_id: order.user_id, type: 'delivery',
      title: 'Entrega concluída!',
      message: `Sua entrega de ${delivery.product_name} foi concluída.`,
      order_id: order.id, read: false, created_at: new Date().toISOString(),
    };
    addNotification(notif);
    setToast('Entrega confirmada!');
    setTick(t => t + 1);
  };

  const submitReview = () => {
    if (!user || !delivery) return;
    const productId = order.items[0]?.product_id;
    if (!productId) return;
    addReview({
      id: uid('rev'), product_id: productId, user_id: user.id, username: user.username,
      rating, comment: comment.trim() || undefined, created_at: new Date().toISOString(),
    });
    setReviewOpen(false);
    setComment('');
    setToast('Avaliação enviada!');
    setTick(t => t + 1);
  };

  const statusSteps: { status: DeliveryStatus; label: string; icon: React.ReactNode }[] = [
    { status: 'PENDING', label: 'Pendente', icon: <Clock className="h-4 w-4" /> },
    { status: 'IN_PROGRESS', label: 'Em andamento', icon: <Truck className="h-4 w-4" /> },
    { status: 'COMPLETED', label: 'Concluída', icon: <CheckCircle2 className="h-4 w-4" /> },
  ];
  const currentStep = delivery ? statusSteps.findIndex(s => s.status === delivery.status) : -1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link to="/pedidos" className="inline-flex items-center gap-1 text-sm text-ink-300 hover:text-neon-300 mb-4">
        <ChevronLeft className="h-4 w-4" /> Meus pedidos
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Pedido #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-ink-400">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <span className={`chip ${order.status === 'PAID' ? 'chip-success' : order.status === 'DELIVERED' ? 'chip-success' : 'chip-warning'}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="card p-5 mb-4">
        <h3 className="text-sm font-semibold text-white mb-3">Itens</h3>
        <div className="space-y-2">
          {order.items.map(it => (
            <div key={it.id} className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-ink-900 shrink-0">
                {it.product_image ? <img src={it.product_image} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-ink-500 m-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{it.product_name}</p>
                <p className="text-xs text-ink-400">x{it.quantity} · {formatBRL(it.price)}</p>
                {it.free_fire_id && <p className="text-xs text-accent-400">FF ID: {it.free_fire_id}</p>}
              </div>
              <span className="text-sm font-bold text-neon-300">{formatBRL(it.price * it.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-3 mt-3 flex justify-between text-white font-bold">
          <span>Total</span><span>{formatBRL(order.total)}</span>
        </div>
      </div>

      {/* Delivery status */}
      {delivery && (
        <div className="card p-5 mb-4">
          <h3 className="text-sm font-semibold text-white mb-4">Status da entrega</h3>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, i) => (
              <div key={step.status} className="flex flex-col items-center flex-1 relative">
                {i < statusSteps.length - 1 && (
                  <div className={`absolute top-5 left-1/2 w-full h-0.5 ${i < currentStep ? 'bg-neon-500' : 'bg-ink-700'}`} />
                )}
                <div className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 transition ${
                  i <= currentStep ? 'bg-neon-500/20 border-neon-500 text-neon-300' : 'bg-ink-850 border-ink-600 text-ink-500'
                }`}>
                  {step.icon}
                </div>
                <span className={`text-xs mt-2 ${i <= currentStep ? 'text-white' : 'text-ink-400'}`}>{step.label}</span>
              </div>
            ))}
          </div>

          {isAdmin && delivery.status !== 'COMPLETED' && (
            <div className="mt-4 flex gap-2">
              {delivery.status === 'PENDING' && (
                <button onClick={() => { updateDelivery(delivery.id, { status: 'IN_PROGRESS', admin_id: user!.id }); setTick(t => t + 1); }}
                  className="btn-outline">
                  <Truck className="h-4 w-4" /> Iniciar atendimento
                </button>
              )}
              <button onClick={() => setConfirmOpen(true)} className="btn-primary">
                <CheckCircle2 className="h-4 w-4" /> Confirmar Entrega
              </button>
            </div>
          )}
          {delivery.completed_at && (
            <p className="text-xs text-ink-400 mt-3">Concluída em {formatDate(delivery.completed_at)}</p>
          )}
        </div>
      )}

      {/* Chat */}
      {delivery ? (
        <div className="card overflow-hidden flex flex-col" style={{ height: 480 }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-ink-900/50">
            <MessageCircle className="h-5 w-5 text-neon-400" />
            <h3 className="text-sm font-semibold text-white">Chat de Entrega</h3>
            {isAdmin && <span className="chip-neon ml-auto"><Shield className="h-3 w-3" /> Modo Admin</span>}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <MessageCircle className="h-10 w-10 text-ink-500 mx-auto mb-2" />
                <p className="text-sm text-ink-400">Nenhuma mensagem ainda. Inicie a conversa!</p>
              </div>
            )}
            {messages.map(m => {
              const mine = user && m.sender_id === user.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine ? 'bg-neon-500 text-ink-950' : 'bg-ink-800 text-ink-100 border border-white/5'
                  }`}>
                    {!mine && <p className="text-[10px] font-semibold mb-0.5 opacity-70">{m.sender_role === 'admin' ? 'Suporte' : 'Cliente'}</p>}
                    <p>{m.content}</p>
                    <p className={`text-[10px] mt-1 ${mine ? 'text-ink-900/60' : 'text-ink-400'}`}>{timeAgo(m.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/10 p-3">
            <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="input py-2.5" />
              <button type="submit" className="btn-primary px-4">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Clock className="h-10 w-10 text-ink-500 mx-auto mb-2" />
          <p className="text-sm text-ink-300">A entrega será criada após a confirmação do pagamento.</p>
        </div>
      )}

      {/* Review section */}
      {delivery && delivery.status === 'COMPLETED' && order.items[0] && (
        <div className="card p-5 mt-4">
          <h3 className="text-sm font-semibold text-white mb-3">Avaliar produto</h3>
          {reviewOpen ? (
            <div className="space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRating(n)}
                    className={`text-3xl transition ${n <= rating ? 'text-accent-400' : 'text-ink-600'}`}>★</button>
                ))}
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                className="input resize-none" placeholder="Conte sua experiência..." />
              <div className="flex gap-2">
                <button onClick={submitReview} className="btn-primary"><Star className="h-4 w-4" /> Enviar avaliação</button>
                <button onClick={() => setReviewOpen(false)} className="btn-ghost">Cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setReviewOpen(true)} className="btn-outline">
              <Star className="h-4 w-4" /> Avaliar este produto
            </button>
          )}
        </div>
      )}

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmDelivery}
        title="Confirmar entrega" message="Tem certeza que deseja marcar esta entrega como concluída?"
        confirmLabel="Sim, confirmar" />

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
