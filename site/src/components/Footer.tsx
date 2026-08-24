import { Link } from 'react-router-dom';
import { Gamepad2, Mail, Shield, Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-ink-900/50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-neon-500/15 border border-neon-500/30">
                <Gamepad2 className="h-5 w-5 text-neon-400" />
              </div>
              <span className="font-display text-lg font-bold text-white">
                Nexus<span className="text-neon-400">Store</span>
              </span>
            </div>
            <p className="text-sm text-ink-300 max-w-xs">
              A loja gamer definitiva. Recargas, contas, skins e mais — com entrega rápida e segura.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Loja</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/loja" className="link">Todos os produtos</Link></li>
              <li><Link to="/categorias" className="link">Categorias</Link></li>
              <li><Link to="/loja?sort=destaques" className="link">Destaques</Link></li>
              <li><Link to="/loja?sort=ofertas" className="link">Ofertas</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Conta</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/cadastro" className="link">Criar conta</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Confiança</h4>
            <ul className="space-y-2 text-sm text-ink-300">
              <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-neon-400" /> Pagamento seguro via PIX</li>
              <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent-400" /> Entrega em até 12 horas</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-neon-400" /> Suporte 24/7 via chat</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-400">© {new Date().getFullYear()} NexusStore. Todos os direitos reservados.</p>
          <div className="flex gap-4 text-xs text-ink-400">
            <Link to="/termos" className="hover:text-neon-300 transition">Termos de Privacidade</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
