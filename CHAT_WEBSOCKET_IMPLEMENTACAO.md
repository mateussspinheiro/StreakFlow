# Assistente IA — API Gateway WebSocket + AWS Lambda + Google Gemini

Avaliação 08 e 09. Um usuário autenticado no Amazon Cognito abre uma conexão WebSocket autenticada com o API Gateway, envia uma pergunta, a Lambda consulta o Google Gemini e devolve a resposta pela API de gerenciamento de conexões do API Gateway.

## Fluxo

```text
Navegador (streakflow / Amplify Hosting)
   │ 1. login Cognito → access token (Amplify Auth)
   │ 2. wss://api.mateus-pinheiro.feliz.web.ufersa.dev.br/?token=<access token>
   ▼
API Gateway (WebSocket)
   │ $connect   → Lambda valida o token (assinatura JWKS, emissor, client_id, token_use=access, exp) → 200 ou 401
   │ $default   → Lambda recebe {"type":"ask","id","question"}
   ▼
AWS Lambda streakflow-chat ──► Google Gemini (generateContent)
   │ PostToConnection (API de gerenciamento de conexões)
   ▼
Navegador recebe {"type":"processing"} e {"type":"answer","answer","model"} e mostra na página /assistente
```

O navegador não permite cabeçalhos personalizados no handshake WebSocket, por isso o token vai na query string `token`. O token é o **access token** do Cognito (dura 1 hora por padrão, é renovado pelo SDK e não é gravado pelo app).

## Arquivos

| Arquivo | Papel |
|---|---|
| `aws/lambda/streakflow-chat/index.mjs` | Lambda única para `$connect`, `$disconnect` e `$default`. Sem dependências: usa `fetch`/`crypto` do Node e o AWS SDK v3 do runtime. |
| `src/lib/chat.ts` | Protocolo, URL autenticada, interpretação das mensagens do servidor (funções puras). |
| `src/lib/useChatSocket.ts` | Hook que abre/fecha o WebSocket, obtém o token e controla estado. |
| `src/lib/auth.ts` | Nova função `getAccessToken()`. |
| `src/pages/Assistente.tsx` | Página protegida `/assistente` (item “Assistente IA” no menu). |
| `tests/chat.test.mjs` | Testes da Lambda (token, rotas, Gemini, erros) e do cliente. |

Protocolo (rota `$default`; a expressão de seleção de rota é `$request.body.action` e as mensagens não têm `action`, então sempre caem no `$default`):

```json
// cliente → servidor
{ "type": "ask", "id": "uuid", "question": "Como manter um hábito de leitura?" }
// servidor → cliente
{ "type": "processing", "id": "uuid" }
{ "type": "answer", "id": "uuid", "answer": "...", "model": "gemini-2.5-flash" }
{ "type": "error", "id": "uuid", "message": "..." }
```

## Configuração na AWS (região us-east-1)

### 1. Chave do Gemini
Gere uma chave em Google AI Studio (https://aistudio.google.com/apikey). Ela fica **somente** na variável de ambiente da Lambda; nunca no frontend nem no Git.

### 2. Lambda `streakflow-chat`
1. Lambda → Criar função → *Criar do zero*. Nome `streakflow-chat`, runtime **Node.js 22.x** (ou 20.x), arquitetura x86_64.
2. Função de execução: no AWS Academy use a **LabRole** existente. Fora do Academy, uma role com `AWSLambdaBasicExecutionRole` + permissão `execute-api:ManageConnections` em `arn:aws:execute-api:us-east-1:<conta>:<api-id>/*/POST/@connections/*`.
3. Na aba Código, apague o `index.mjs` padrão, cole o conteúdo de `aws/lambda/streakflow-chat/index.mjs` e clique em **Deploy**. Handler: `index.handler`.
4. Configuração → Variáveis de ambiente:
   - `COGNITO_USER_POOL_ID` = o mesmo valor de `VITE_COGNITO_USER_POOL_ID`
   - `COGNITO_CLIENT_ID` = o mesmo valor de `VITE_COGNITO_CLIENT_ID`
   - `GEMINI_API_KEY` = chave do passo 1
   - `GEMINI_MODEL` (opcional) = padrão `gemini-3.8-flash`; troque se o Google descontinuar o modelo
   - `GEMINI_THINKING_LEVEL` (opcional) = padrão `low` (respostas mais rápidas); `none` desativa o parâmetro
5. Configuração → Configuração geral → **Tempo limite 1 min**, memória 256 MB.

### 3. API Gateway WebSocket
1. API Gateway → Criar API → **WebSocket API** → Nome `streakflow-chat`, expressão de seleção de rota `$request.body.action`.
2. Rotas: adicionar **$connect**, **$disconnect** e **$default**.
3. Integração de cada rota: **Lambda** → `streakflow-chat` (o console adiciona a permissão de invocação).
4. Estágio: `production`, com implantação automática.
5. Anote a URL `wss://<api-id>.execute-api.us-east-1.amazonaws.com/production` para testes.

### 4. Domínio `api.mateus-pinheiro.feliz.web.ufersa.dev.br`
1. ACM (us-east-1) → Solicitar certificado público para `api.mateus-pinheiro.feliz.web.ufersa.dev.br`, validação por DNS; crie o CNAME de validação no mesmo provedor DNS usado para o domínio do StreakFlow e espere o status *Emitido*.
2. API Gateway → **Nomes de domínio personalizados** → Criar: `api.mateus-pinheiro.feliz.web.ufersa.dev.br`, endpoint **Regional**, TLS 1.2, certificado do passo anterior.
3. Aba **Mapeamentos de API** → API `streakflow-chat`, estágio `production`, caminho **vazio**.
4. No DNS, crie `api.mateus-pinheiro.feliz.web.ufersa.dev.br` apontando (CNAME, ou registro A *alias* se for Route 53) para o **Nome de domínio do API Gateway** (`d-xxxx.execute-api.us-east-1.amazonaws.com`) — não para a URL execute-api da API.

A Lambda responde pelo endpoint `https://<api-id>.execute-api.us-east-1.amazonaws.com/production`, montado com `apiId` e `stage` do evento, então funciona também quando o cliente entra pelo domínio personalizado.

### 5. Frontend
- Local: em `.env.local` adicione `VITE_CHAT_WS_URL=wss://api.mateus-pinheiro.feliz.web.ufersa.dev.br` e reinicie `npm run dev`.
- Amplify: Hosting → Variáveis de ambiente → adicione `VITE_CHAT_WS_URL` com o mesmo valor e faça um novo build (o valor é embutido no build pelo Vite).
- A regra SPA de rewrite já existente (ver `ROUTING_DEPLOY.md`) cobre `/assistente`.

### 6. Teste rápido sem navegador (opcional)
```bash
npx wscat -c "wss://api.mateus-pinheiro.feliz.web.ufersa.dev.br/?token=<ACCESS_TOKEN>"
> {"type":"ask","id":"teste1","question":"Dê uma dica para beber mais água"}
```
Sem token ou com token inválido o handshake falha com **401**. Logs: CloudWatch → `/aws/lambda/streakflow-chat` (“Conexão WebSocket autorizada”, “Pergunta recebida pela Lambda”, “Resposta do Gemini enviada”). O token nunca é registrado no log.

## Roteiro das evidências (DevTools)

1. Entre no StreakFlow publicado e abra **Assistente IA** (`/assistente`).
2. `F12` → aba **Network/Rede** → filtro **WS** → recarregue a página (`F5`).
3. Clique na requisição `?token=...`:
   - **Headers**: *Request URL* `wss://api.mateus-pinheiro.feliz.web.ufersa.dev.br/?token=...` e *Status Code* **101 Switching Protocols** → conexão estabelecida.
4. Envie uma pergunta. Na aba **Messages/Mensagens** da mesma requisição aparecem:
   - ↑ `{"type":"ask",...}` (enviada pelo navegador);
   - ↓ `{"type":"processing",...}` e ↓ `{"type":"answer","answer":"...","model":"..."}` (enviadas pela Lambda via API de gerenciamento de conexões).
   - Opcional: mostrar os logs no CloudWatch com o mesmo `id`.
5. Print da página com a resposta exibida e a barra de endereços do navegador visível.

**Atenção ao endereço do frontend:** a atividade pede a barra de endereços no formato `SEUNOME.NOMEGRUPO.web.ufersa.dev.br`. Hoje o app está em `streakflow.mateus-pinheiro.feliz.web.ufersa.dev.br`. Se for preciso usar exatamente `mateus-pinheiro.feliz.web.ufersa.dev.br`, adicione esse domínio no Amplify (Domain management) e, para o login com Google funcionar nele, inclua a URL nas *Allowed callback/sign-out URLs* do App Client no Cognito e nas listas `redirectSignIn`/`redirectSignOut` de `src/lib/amplify.ts`. Login por e-mail e senha não depende disso.

## Segurança e limites
- Sem token válido não há conexão; mensagens no `$default` só chegam de conexões autorizadas no `$connect`.
- A chave do Gemini fica só na Lambda; a URL do Gemini não contém a chave (vai no cabeçalho `x-goog-api-key`).
- Perguntas limitadas a 1000 caracteres; erros do Gemini viram mensagem genérica para o usuário.
- O token aparece na URL do WebSocket (visível no DevTools do próprio usuário e possivelmente em logs de acesso, se forem ativados). É uma limitação do WebSocket em navegador; o token é de curta duração.
- O assistente **não** lê hábitos nem check-ins (que continuam no `localStorage`) e não guarda histórico: recarregar a página limpa a conversa.
- Conexões WebSocket do API Gateway fecham após ~10 min ociosas ou 2 h no total; a página mostra *Desconectado* e o botão **Reconectar**.
