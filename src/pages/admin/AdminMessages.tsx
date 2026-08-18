import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDeliveries, getMessagesByDelivery, getProfiles } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/format';
import { EmptyState } from '@/components/ui';
import { MessageCircle, ChevronRight } from 'lucide-react';

export function AdminMessages() {
  const deliveries = getDeliveries();
  const [tick, setTick] = useState(0);
  void tick;

  useEffect(() => {
    const i = setInterval(() => setTick(t => t +1), 2000);
    return () => clearInterval(i);
  }, []);

  const chats = deliveries.map(d => {
    const messages = getMessagesByDelivery(d.id);
    const unread = messages.filter(m => m.sender_role === 'customer' && !m.read).length;
    const last = messages[messages.length - 1];
    const customer = getProfiles().find(p => p.id === d.user_id);
    return { delivery: d, unread, last, customer, messageCount: messages.length };
  }).sort((a, b) => (b.last?.created_at ?? '').localeCompare(a.last?.created_at ?? ''));

  const pendingChats = chats.filter(c => c.delivery.status !== 'COMPLETED');
  const activeChats = chats.filter(c => c.delivery.status === 'COMPLETED');

  if (chats.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-6">Mensagens</h1>
        <EmptyState icon={<MessageCircle className="h-12 w-12" />} title="Nenhuma mensagem"
          desc="Os chats de entrega aparecerão aqui." />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-6">Mensagens</h1>

      {pendingChats.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-ink-300 mb-2 uppercase tracking-wider">Em atendimento</h3>
          <div className="space-y-2 mb-6">
            {pendingChats.map(c => <ChatRow key={c.delivery.id} {...c} />)}
          </div>
        </>
      )}

      {activeChats.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-ink-300 mb-2 uppercase tracking-wider">Concluídos</h3>
          <div className="space-y-2">
            {activeChats.map(c => <ChatRow key={c.delivery.id} {...c} />)}
          </div>
        </>
      )}
    </div>
  );
}

function ChatRow({ delivery, unread, last, customer, messageCount }: {
  delivery: ReturnType<typeof getDeliveries>[0]; unread: number; last: ReturnType<typeof getMessagesByDelivery>[0] | undefined;
  customer: ReturnType<typeof getProfiles>[0] | undefined; messageCount: number;
}) {
  return (
    <Link to={`/pedido/${delivery.order_id}`} className="card p-3 flex items-center gap-3 hover:border-neon-500/30 transition group">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-neon-500/15 text-neon-300 font-bold shrink-0">
        {(customer?.username ?? '?').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">{customer?.username ?? '—'}</p>
          <span className="text-xs text-ink-400">{delivery.product_name}</span>
        </div>
        <p className="text-xs text-ink-400 truncate">
          {last ? `${last.sender_role === 'admin' ? 'Você' : 'Cliente'}: ${last.content}` : 'Nenhuma mensagem ainda'}
        </p>
        <p className="text-[10px] text-ink-400 mt-0.5">
          {last ? timeAgo(last.created_at) : formatDate(delivery.created_at)} · {messageCount} msg(s)
        </p>
      </div>
      {unread > 0 && <span className="chip-accent">{unread} nova(s)</span>}
      <ChevronRight className="h-4 w-4 text-ink-400 group-hover:text-neon-300" />
    </Link>
  );
}
