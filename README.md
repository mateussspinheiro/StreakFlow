# StreakFlow

> **Transforme constância em progresso.**

O **StreakFlow** é uma aplicação web para acompanhamento de hábitos pessoais por meio de check-ins, metas, histórico, indicadores de progresso e sequências de consistência (*streaks*).

O projeto é desenvolvido na disciplina de **Programação Web** e atualmente utiliza **React, TypeScript, Vite, Tailwind CSS, AWS Amplify Hosting e Amazon Cognito**.

**Aplicação publicada:** https://streakflow.mateus-pinheiro.feliz.web.ufersa.dev.br/

---

## Visão geral

A proposta do StreakFlow é permitir um acompanhamento de hábitos mais flexível do que um simples "feito ou não feito". Cada hábito pode possuir uma forma de acompanhamento adequada ao seu objetivo, e os registros alimentam o dashboard, histórico, streaks e visualizações de progresso.

Exemplos:

- beber uma quantidade diária de água;
- estudar por determinado tempo;
- ler uma quantidade de páginas;
- praticar exercícios;
- acompanhar hábitos qualitativos;
- registrar dias de descanso planejado.

---

## Funcionalidades implementadas

### Hábitos e check-ins

- CRUD completo de hábitos;
- categoria, descrição, meta semanal e duração estimada;
- quatro tipos de acompanhamento:
  - **binário**;
  - **quantidade**;
  - **duração**;
  - **qualitativo/status**;
- estados de check-in: pendente, parcial, concluído, adiado, descanso planejado e compatibilidade com registros ignorados;
- valor realizado, meta, unidade e percentual de progresso;
- intensidade, esforço, duração e observações opcionais;
- edição e remoção de registros;
- um único check-in por hábito e dia;
- preservação da meta/unidade histórica do registro.

### Streak e progresso

- streak atual e recorde;
- descanso planejado pode conectar conclusões sem aumentar artificialmente a sequência;
- dashboard com indicadores reais;
- histórico detalhado;
- acompanhamento semanal;
- taxa de conclusão;
- insights calculados localmente.

### Heatmap de consistência

A tela de Progresso possui heatmap com:

- períodos de **30, 90, 180 e 365 dias**;
- filtro por todos os hábitos ou hábito específico;
- estados visuais para ausência, parcial, conclusão, descanso e demais registros;
- resumo de dias com progresso, conclusões, descansos e check-ins;
- detalhes por dia;
- navegação por teclado;
- suporte a temas claro e escuro;
- comportamento responsivo.

Uma prévia de 30 dias também aparece no Dashboard.

### Interface

- Landing Page;
- Login;
- Cadastro;
- Confirmação de e-mail;
- Recuperação de senha;
- Dashboard;
- Meus Hábitos;
- Histórico;
- Progresso;
- Perfil;
- Configurações;
- página 404;
- rotas públicas e protegidas;
- tema claro, escuro e sistema;
- sidebar desktop e navegação mobile;
- foco em responsividade e acessibilidade.

---

## Autenticação com Amazon Cognito

A autenticação real utiliza **Amazon Cognito** através do `aws-amplify`.

Fluxos implementados:

- cadastro;
- confirmação por código enviado por e-mail;
- reenvio de código;
- login por e-mail e senha;
- restauração de sessão;
- recuperação e redefinição de senha;
- logout;
- leitura de nome e e-mail;
- atualização de atributos do perfil quando permitida;
- proteção de rotas privadas.

A sessão é verificada antes de liberar a área autenticada. Tokens são administrados pelo SDK do Amplify e não são persistidos manualmente pela aplicação.

---

## Login com Google

O StreakFlow também possui login federado com **Google**, intermediado pelo Cognito.

```text
StreakFlow
   ↓
Amazon Cognito
   ↓
Google
   ↓
Amazon Cognito
   ↓
StreakFlow autenticado
```

A integração utiliza:

- `signInWithRedirect({ provider: 'Google' })`;
- OAuth 2.0 Authorization Code;
- PKCE gerenciado pelo Amplify;
- escopos `openid`, `email` e `profile`;
- retorno à rota protegida solicitada;
- fallback para `/dashboard`;
- tratamento de cancelamento e erros OAuth.

---

## Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- React Router

### AWS
- AWS Amplify Hosting
- Amazon Cognito
- Amplify Auth (`aws-amplify`)

### Qualidade
- Git
- GitHub
- ESLint
- Node Test Runner
- TypeScript
- fluxo GitHub → Amplify

---

## Arquitetura atual

```text
                         Usuário
                            │
                            ▼
                  AWS Amplify Hosting
                            │
                React + TypeScript + Vite
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
        Amazon Cognito               localStorage
              │                           │
     cadastro / login / sessão      hábitos / check-ins
              │                     histórico / progresso
              ▼
            Google
```

O Cognito cuida da identidade. Os hábitos e check-ins ainda são armazenados localmente no navegador.

> **Importante:** Lambda, API Gateway e DynamoDB não fazem parte da arquitetura implementada atualmente. Eles permanecem como possibilidades de evolução.

---

## Persistência de dados

Os hábitos, check-ins, histórico e configurações são armazenados no `localStorage`, em um documento versionado:

```text
streakflow_data
```

### Limitação atual

A autenticação identifica o usuário pelo Cognito, porém os dados de hábitos ainda pertencem ao navegador, não ao `sub` do usuário.

Consequências:

- não há sincronização entre dispositivos;
- limpar o armazenamento do navegador pode remover os dados;
- contas diferentes no mesmo navegador podem compartilhar os mesmos dados locais;
- o isolamento real por usuário dependerá de uma futura API autenticada.

---

## Rotas

### Públicas

```text
/
/login
/cadastro
/confirmar-email
/recuperar
/termos
/privacidade
```

### Protegidas

```text
/dashboard
/meus-habitos
/historico
/progresso
/dashboard/perfil
/dashboard/configuracoes
/dashboard/novo-habito
/dashboard/editar-habito/:id
```

---

## AWS Amplify Hosting

O deploy está conectado ao GitHub.

O `amplify.yml` executa:

```text
npm ci
npm run build
```

e publica:

```text
dist/
```

Como a aplicação usa `BrowserRouter`, o Amplify precisa manter uma regra de **SPA rewrite para `/index.html`**.

Mais detalhes em [ROUTING_DEPLOY.md](./ROUTING_DEPLOY.md).

---

## Configuração local

```bash
git clone https://github.com/mateussspinheiro/StreakFlow.git
cd StreakFlow
npm install
```

Crie `.env.local` a partir de `.env.example`:

```dotenv
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
```

Depois:

```bash
npm run dev
```

OAuth local:

```text
http://localhost:5173/
```

Não versione Client Secret, Access Key, Secret Access Key, Session Token ou credenciais de LabRole.

---

## Scripts

```bash
npm run dev
npm test
npm run lint
npm run build
npm run preview
```

---

## Testes e qualidade

Após a implementação do login federado com Google:

- **85 testes automatizados aprovados**;
- **0 falhos**;
- ESLint aprovado;
- TypeScript aprovado;
- build de produção aprovado;
- testes cobrindo autenticação, rotas, hábitos, check-ins, streak, tracking e heatmap.

Os testes de autenticação usam mocks e não acessam AWS ou Google reais.

---

## Segurança

Práticas aplicadas:

- autenticação centralizada no Cognito;
- rotas privadas bloqueadas enquanto a sessão é validada;
- revalidação de sessão;
- ausência de senhas/tokens persistidos manualmente;
- variáveis de ambiente fora do Git;
- nenhum Client Secret ou credencial IAM no frontend;
- validação dos dados antes de persistir;
- tratamento amigável de erros;
- validação do destino de retorno OAuth.

---

## SEO

O `index.html` possui metadados básicos de título, descrição, idioma, viewport e favicon.

Os arquivos `robots.txt` e `sitemap.xml` ainda precisam ser atualizados para o domínio oficial antes da configuração final no Google Search Console.

---

## Estrutura

```text
StreakFlow/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── tests/
├── .env.example
├── amplify.yml
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
├── CHECKIN_INTELIGENTE.md
├── HEATMAP_CONSISTENCIA.md
├── COGNITO_IMPLEMENTACAO.md
├── GOOGLE_COGNITO_IMPLEMENTACAO.md
└── ROUTING_DEPLOY.md
```

---

## Evolução recente

Os commits mais recentes registram:

1. autenticação federada com Google;
2. integração com Amazon Cognito;
3. melhoria do gerenciamento de sessão;
4. check-ins inteligentes;
5. melhoria do roteamento SPA;
6. redesign e evolução funcional da aplicação.

---

## Status

### Implementado

- [x] Landing Page
- [x] Interface React responsiva
- [x] CRUD de hábitos
- [x] Check-in inteligente
- [x] Streak e recorde
- [x] Dashboard
- [x] Histórico
- [x] Progresso
- [x] Heatmap
- [x] Perfil e configurações
- [x] Temas
- [x] Rotas protegidas
- [x] Página 404
- [x] Amazon Cognito
- [x] Confirmação por e-mail
- [x] Recuperação de senha
- [x] Login Google via Cognito
- [x] AWS Amplify Hosting
- [x] Domínio personalizado
- [x] Testes automatizados

### Próximas evoluções

- [ ] Banco de dados remoto
- [ ] Isolamento por usuário/`sub`
- [ ] Sincronização entre dispositivos
- [ ] API autenticada
- [ ] Avaliar Lambda, API Gateway e DynamoDB
- [ ] Resumo semanal
- [ ] Atualizar `robots.txt` e `sitemap.xml`
- [ ] Otimizar/dividir o bundle principal

---

## Documentação técnica

- [IMPLEMENTACAO.md](./IMPLEMENTACAO.md)
- [CHECKIN_INTELIGENTE.md](./CHECKIN_INTELIGENTE.md)
- [HEATMAP_CONSISTENCIA.md](./HEATMAP_CONSISTENCIA.md)
- [ROUTING_DEPLOY.md](./ROUTING_DEPLOY.md)
- [COGNITO_IMPLEMENTACAO.md](./COGNITO_IMPLEMENTACAO.md)
- [GOOGLE_COGNITO_IMPLEMENTACAO.md](./GOOGLE_COGNITO_IMPLEMENTACAO.md)

---

## Objetivo acadêmico

O projeto aplica conceitos de:

- desenvolvimento frontend moderno;
- React e componentização;
- TypeScript;
- roteamento SPA;
- autenticação;
- OAuth 2.0;
- AWS;
- persistência e migração de dados;
- testes automatizados;
- acessibilidade;
- responsividade;
- Git/GitHub;
- deploy contínuo.

---

## Autor

**Mateus Pinheiro**

Projeto desenvolvido para a disciplina de **Programação Web**.
