# Analytics

## Dashboard Admin

A página `/admin/analytics` mostra:
- Faturamento total
- Número de vendas
- Ticket médio
- Tempo médio de entrega
- Avaliação média
- Taxa de conversão
- Gráfico de faturamento mensal (6 meses)
- Top 5 produtos mais vendidos

## Dados

Todos os dados são calculados a partir dos pedidos reais no banco/localStorage.

## Logs de Auditoria

A página `/admin/logs` registra:
- Login/logout
- Criação/edição/exclusão de produtos
- Alteração de status de produtos
- Criação/exclusão de categorias
- Início/conclusão de entregas
- Criação/edição/exclusão de cupons
- Remoção de avaliações

Nunca registra senhas ou secrets.
