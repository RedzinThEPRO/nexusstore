import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';

interface Msg { role: 'ai' | 'user'; text: string; }

const SUGGESTIONS = [
  'Como faço uma compra?',
  'Quanto tempo leva a entrega?',
  'Como funciona o pagamento via PIX?',
  'Preciso de ID do Free Fire?',
];

function aiReply(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('compra') || q.includes('comprar')) return 'Para comprar: navegue pela loja, adicione produtos ao carrinho, finalize o checkout e pague via PIX. A entrega é confirmada automaticamente após o pagamento.';
  if (q.includes('entrega') || q.includes('demora')) return 'A entrega é realizada em até 12 horas após a confirmação do pagamento. Você acompanha tudo pelo chat de entrega.';
  if (q.includes('pix') || q.includes('pagamento')) return 'O pagamento é via PIX: após o checkout, geramos um QR Code e um código copia-e-cola. O pedido é confirmado automaticamente quando o pagamento é detectado.';
  if (q.includes('free fire') || q.includes('id')) return 'O ID do Free Fire é solicitado apenas no checkout de produtos da categoria Free Fire. Ele é enviado automaticamente no chat de entrega para o administrador.';
  if (q.includes('pedido') || q.includes('status')) return 'Você pode acompanhar seus pedidos em "Meus Pedidos". Cada pedido tem um chat privado com a equipe para acompanhamento da entrega.';
  if (q.includes('conta') || q.includes('cadastro')) return 'Para criar uma conta, basta e-mail, senha e nome de usuário. Os dados complementares (nome, CPF, data de nascimento) são preenchidos no checkout.';
  return 'Posso ajudar com compras, pagamentos via PIX, entregas, pedidos e funcionamento da loja. Tente perguntar sobre um desses temas!';
}

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: 'Olá! Sou o assistente Nexus AI. Como posso ajudar você hoje?' },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: 'user', text }]);
    setInput('');
    setTimeout(() => {
      setMessages(m => [...m, { role: 'ai', text: aiReply(text) }]);
    }, 500);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-neon-500 text-ink-950 shadow-glow-lg hover:scale-105 transition animate-pulse-glow">
          <Bot className="h-7 w-7" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm animate-slide-in">
          <div className="glass-strong rounded-2xl shadow-card overflow-hidden flex flex-col" style={{ height: 480 }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-neon-500/5">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-neon-500/15 border border-neon-500/30">
                  <Sparkles className="h-4 w-4 text-neon-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Nexus AI</p>
                  <p className="text-[10px] text-success-400">● Online</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-ink-300 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'bg-neon-500 text-ink-950'
                      : 'bg-ink-800 text-ink-100 border border-white/5'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {messages.length <= 1 && (
                <div className="pt-2">
                  <p className="text-[10px] text-ink-400 mb-2 uppercase tracking-wider">Sugestões</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => send(s)}
                        className="text-xs rounded-full px-3 py-1.5 bg-ink-800 border border-white/10 text-ink-200 hover:border-neon-500/40 hover:text-neon-300 transition">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-3">
              <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  placeholder="Digite sua pergunta..."
                  className="input py-2 text-sm" />
                <button type="submit" className="btn-primary px-3 py-2">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
