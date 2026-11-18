# Rastreador Analizi

Instalação por site:

```html
<script async src="https://analizi.carvalhopaula1990.workers.dev/tracker.js" data-site="ANLZXXXXX-A"></script>
```

O código deve ser instalado antes de `</head>` em todas as páginas. O identificador `ANLZXXXXX-A` é gerado para cada site cadastrado.

## Eventos enviados automaticamente

- `session_start`: primeira interação após 30 minutos sem atividade.
- `first_visit`: primeira visita daquele navegador.
- `page_view`: carregamento ou abertura de uma página.
- `button_click`: clique em botão, botão com `role="button"`, botão de formulário ou link interno.
- `media_click`: clique em imagem ou vídeo, inclusive quando estiverem dentro de um link. O evento preserva o destino do link e as coordenadas para o heatmap.
- `whatsapp_contact`: clique em botão/link do WhatsApp.
- `add_to_cart`: botão "Adicionar ao carrinho" (texto ou classes padrão de WooCommerce/Shopify).
- `schedule_click`: link para agenda online (Calendly, Cal.com, Google Agenda, Doctoralia e similares).
- `booking_click`: link para motor de reservas (Booking, Airbnb, Omnibees, Sympla, OpenTable e similares).
- Clique em `tel:` continua como `button_click` com `contact_intent: telefone` e entra nas conversões como `telefone`.

### Resultados detectados pela URL

Contam uma vez por sessão e página (recarregar não duplica):

- `cart_view`: `/carrinho`, `/cart`, `/sacola`.
- `checkout_start`: `/checkout`, `/finalizar-compra` (além do clique em "Finalizar compra").
- `purchase`: `/pedido-confirmado`, `/order-received`, `/checkout/success`... `/obrigado` genérico só conta como compra se a sessão passou por carrinho ou checkout.
- `subscription`: `/assinatura-confirmada`, `/subscription/success`, `/upgrade/success`...
- `booking`: `/reserva-confirmada` (tipo `reserva`) ou `/agendamento-confirmado`, `/consulta-agendada` (tipo `agendamento`).

Para marcar botões existentes de login ou cadastro, adicione um atributo ao botão:

```html
<button data-analizi-event="sign_up">Criar conta</button>
<button data-analizi-event="login">Entrar</button>
```

Não são coletados IP, conteúdo de formulários, senhas, e-mails ou telefones. A localização geográfica (Cidade, Estado/Região e País) é identificada de forma anônima pela borda da Cloudflare (`request.cf`) sem armazenar o endereço IP do visitante. A origem é identificada por UTM quando presente; sem UTM, o rastreador usa o referenciador ou marca o acesso como direto.
