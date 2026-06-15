# Integração Mercado Pago — Campanha Elizama

Arquitetura mínima: Vercel Serverless Functions + Mercado Pago Checkout Pro.
A landing page permanece estática; os endpoints em `/api` rodam no servidor.

---

## 1. Estrutura

```
elizama-mp/
├── api/
│   ├── create-preference.js   → cria a preferência de pagamento
│   └── webhook.js              → recebe confirmação de pagamento
├── public/
│   ├── elizama-landing.html    → copiar a landing page existente aqui
│   ├── donate-integration.js   → script que chama /api/create-preference
│   ├── sucesso.html
│   ├── pendente.html
│   └── erro.html
├── supabase-schema.sql         → opcional, persistência das doações
├── package.json
└── .env.example
```

---

## 2. Pré-requisitos

| Item | Onde obter |
|---|---|
| Conta Mercado Pago verificada | mercadopago.com.br |
| Access Token + Public Key | developers.mercadopago.com.br/panel/app |
| Conta Vercel | vercel.com |
| (Opcional) Projeto Supabase | app.supabase.com |

---

## 3. Passos de configuração

### 3.1 Credenciais Mercado Pago
1. Acesse o **Painel de Desenvolvedores** → crie uma aplicação.
2. Copie **Access Token** e **Public Key** do modo **Teste** primeiro.
3. Em **Webhooks**, configure a URL `https://SEU_DOMINIO/api/webhook` e copie o **Secret** gerado.

### 3.2 Variáveis de ambiente (Vercel)
No painel do projeto Vercel → *Settings* → *Environment Variables*, adicionar:

- `MP_ACCESS_TOKEN`
- `MP_PUBLIC_KEY`
- `MP_WEBHOOK_SECRET`
- `SITE_URL` (ex.: `https://elizama.vercel.app`)
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (se for usar persistência)

### 3.3 Deploy
```bash
npm install
vercel
```
Ou via GitHub: importar o repositório na Vercel — o deploy detecta `/api` automaticamente como funções serverless.

### 3.4 Integrar na landing page
1. Copie `elizama-landing.html` para `/public`.
2. Inclua antes de `</body>`:
   ```html
   <script src="/donate-integration.js"></script>
   ```
3. **Remova** a função `doareRedir()` antiga (já existente no `<script>` da landing) — a nova vem do arquivo incluído.

---

## 4. Teste end-to-end (sandbox)

1. Com credenciais `TEST-...`, a resposta de `/api/create-preference` retorna `sandbox_init_point`.
2. Use um **comprador de teste** (criado em *Suas integrações > Usuários de teste*) para simular o pagamento.
3. Verifique no log da função `webhook.js` (Vercel → Functions → Logs) se a notificação chegou e o status mudou para `approved`.

---

## 5. Ir para produção

1. Trocar `MP_ACCESS_TOKEN` e `MP_PUBLIC_KEY` para as credenciais de **produção**.
2. Confirmar que `SITE_URL` aponta para o domínio final (https, sem `/` final).
3. Reconfigurar a URL de webhook no painel MP para o domínio de produção.

---

## 6. Pontos críticos — não pular

| Risco | Mitigação |
|---|---|
| Access Token exposto no frontend | Toda chamada à API do MP ocorre em `/api/*` (servidor). Nunca colocar o token em HTML/JS público. |
| Webhook falso | `MP_WEBHOOK_SECRET` configurado → assinatura validada em `webhook.js`. Sem isso, qualquer um pode simular "pagamento aprovado". |
| Doação recorrente | Checkout Pro **não** cobre assinaturas. Requer **Preapproval API** + tokenização via Bricks — escopo separado, não incluído neste MVP. O toggle "doar mensalmente" está bloqueado até essa fase. |
| Barra de progresso / meta | Sem Supabase, os valores de "arrecadado" continuam estáticos (placeholders `—`). A view `vw_meta_campanha` em `supabase-schema.sql` resolve isso, mas exige implementar a gravação no `create-preference.js` e `webhook.js` (comentários `// (Opcional, recomendado)` indicam onde). |
| Atribuição de embaixador | O parâmetro `?emb=` na URL é capturado e enviado como `metadata.embaixador` — só é persistido se a gravação no Supabase for implementada. |
| Taxas Mercado Pago para causas sociais | Verificar elegibilidade ao programa de ONGs/causas sociais no painel MP — pode reduzir taxa do Pix a zero. Não está automático; requer solicitação. |

---

## 7. Próximos incrementos (fora deste MVP)

- Implementar gravação Supabase em `create-preference.js` (status `pending`) e `webhook.js` (atualização de status).
- Expor endpoint público `/api/meta` lendo `vw_meta_campanha` para alimentar a barra de progresso e o card de crowdfunding na landing.
- Doação recorrente via Preapproval API + Mercado Pago Bricks (Card Form).
- Painel simples de embaixadores (ranking por `embaixador` na tabela `doacoes`).
