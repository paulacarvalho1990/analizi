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
- `button_click`: clique em botão, botão com `role="button"` ou botão de formulário.
- `whatsapp_contact`: clique em botão/link do WhatsApp.

Para marcar botões existentes de login ou cadastro, adicione um atributo ao botão:

```html
<button data-analizi-event="sign_up">Criar conta</button>
<button data-analizi-event="login">Entrar</button>
```

Não são coletados IP, conteúdo de formulários, senhas, e-mails ou telefones. A localização geográfica (Cidade, Estado/Região e País) é identificada de forma anônima pela borda da Cloudflare (`request.cf`) sem armazenar o endereço IP do visitante. A origem é identificada por UTM quando presente; sem UTM, o rastreador usa o referenciador ou marca o acesso como direto.
