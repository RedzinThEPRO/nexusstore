# IA

## Assistente Nexus AI

Botão flutuante (🤖) no canto inferior direito abre um mini-chat.

### Capacidades
- Ajuda com produtos, compras, PIX, pagamentos, pedidos, entregas
- Explica o funcionamento da loja
- Responde sobre status de pedidos (dados do próprio usuário)

### Limitações
- Não inventa pagamentos ou entregas
- Não altera preços ou pedidos
- Não conclui entregas
- Não acessa dados de outros clientes
- Não executa operações administrativas

### Implementação atual
- Respostas baseadas em regras (demo)
- Para produção, conectar `AI_API_KEY` e substituir `aiReply()` por chamada à API

### Variável
```
AI_API_KEY=
```
