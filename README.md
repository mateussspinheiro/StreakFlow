# StreakFlow

> **Transforme constância em progresso.**

O **StreakFlow** é uma aplicação web para acompanhamento de hábitos pessoais através de um sistema de **streaks**, inspirado em aplicações que utilizam sequências de dias consecutivos como forma de motivação.

O usuário poderá cadastrar hábitos, registrar diariamente as atividades realizadas e acompanhar sua evolução ao longo do tempo.

O projeto está sendo desenvolvido na disciplina de **Programação Web**.

---

## Sobre o projeto

A proposta do StreakFlow é oferecer uma forma simples e visual de acompanhar hábitos do dia a dia, como:

* beber água;
* estudar;
* praticar exercícios;
* ler;
* meditar;
* realizar outras atividades pessoais.

Cada vez que um hábito é concluído, o usuário poderá registrar sua realização.

O sistema será responsável por acompanhar a quantidade de dias consecutivos em que aquele hábito foi realizado, formando um **streak**.

Exemplo:

```text
Segunda     ✅
Terça       ✅
Quarta      ✅
Quinta      ✅

🔥 Streak atual: 4 dias
```

---

## Principais funcionalidades

O sistema está sendo planejado para possuir as seguintes funcionalidades:

* Cadastro de usuários;
* Login e autenticação;
* Cadastro de hábitos;
* Edição de hábitos;
* Exclusão de hábitos;
* Registro diário de atividades;
* Cálculo automático de streak;
* Histórico de hábitos;
* Visualização do progresso;
* Dashboard com resumo das atividades;
* Maior streak alcançado;
* Interface responsiva.

---

## Tecnologias

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js

### Cloud

A infraestrutura do projeto utilizará serviços da AWS.

* AWS Amplify — hospedagem do frontend;
* AWS Lambda — execução do backend;
* Amazon API Gateway — API REST;
* Amazon DynamoDB — armazenamento dos dados.

### Outras ferramentas

* Git
* GitHub
* Google Search Console

---

## Arquitetura

A aplicação seguirá uma arquitetura web baseada na separação entre frontend, backend e banco de dados.

```text
                USUÁRIO
                   │
                   ▼
        ┌────────────────────┐
        │   AWS Amplify      │
        │                    │
        │ HTML + CSS + JS    │
        └─────────┬──────────┘
                  │
                  │ HTTPS / JSON
                  ▼
        ┌────────────────────┐
        │    API Gateway     │
        └─────────┬──────────┘
                  │
                  ▼
        ┌────────────────────┐
        │     AWS Lambda     │
        │      Node.js       │
        └─────────┬──────────┘
                  │
                  ▼
        ┌────────────────────┐
        │      DynamoDB      │
        └────────────────────┘
```

Essa abordagem permite manter o frontend separado das regras de negócio e do armazenamento de dados.

---

## Serverless

O StreakFlow utilizará uma arquitetura **serverless**.

Nesse modelo, não será necessário manter um servidor próprio funcionando continuamente.

As funções do backend poderão ser executadas utilizando **AWS Lambda**, sendo acionadas apenas quando houver uma requisição.

Exemplo:

```text
Usuário marca um hábito
          │
          ▼
     API Gateway
          │
          ▼
      AWS Lambda
          │
          ▼
       DynamoDB
```

Essa arquitetura proporciona vantagens como:

* escalabilidade;
* menor gerenciamento de infraestrutura;
* pagamento baseado no uso;
* integração com outros serviços AWS.

---

## Segurança

O projeto seguirá o **Princípio do Privilégio Mínimo**.

Isso significa que cada usuário ou serviço terá acesso somente às informações e operações necessárias para realizar sua função.

Por exemplo:

* cada usuário poderá acessar somente seus próprios hábitos;
* o frontend não terá acesso direto ao banco de dados;
* as regras de negócio serão verificadas no backend;
* funções AWS terão apenas as permissões necessárias.

---

## Regras de negócio

Algumas das principais regras definidas para o sistema são:

1. Apenas usuários autenticados poderão gerenciar hábitos.
2. Cada usuário poderá acessar somente seus próprios dados.
3. Um hábito deverá possuir pelo menos um nome.
4. Um hábito poderá ser marcado como concluído apenas uma vez por dia.
5. O streak será atualizado automaticamente após o registro de uma conclusão.
6. Caso um dia esperado não seja cumprido, o streak será interrompido.
7. O sistema deverá registrar o maior streak alcançado.
8. Alterações no histórico poderão gerar um novo cálculo do streak.

---

## Estrutura atual do projeto

```text
StreakFlow/
│
├── index.html
├── styles.css
├── script.js
├── favicon.svg
├── robots.txt
├── sitemap.xml
├── amplify.yml
├── .gitignore
└── README.md
```

---

## SEO

A landing page possui configurações básicas para indexação em mecanismos de busca.

Entre elas:

* meta description;
* meta robots;
* Open Graph;
* dados estruturados;
* `robots.txt`;
* `sitemap.xml`;
* integração planejada com Google Search Console.

---

## Deploy

A landing page será hospedada utilizando **AWS Amplify Hosting**.

O repositório GitHub será conectado ao Amplify, permitindo que novas versões sejam publicadas automaticamente após atualizações na branch principal.

Fluxo:

```text
Desenvolvimento
      │
      ▼
    GitHub
      │
      ▼
AWS Amplify
      │
      ▼
Site publicado
```

---

## Status do projeto

🚧 **Em desenvolvimento**

### Concluído

* [x] Definição da proposta do projeto
* [x] Landing page inicial
* [x] Estrutura do repositório
* [x] Configuração inicial de SEO
* [x] Configuração para AWS Amplify

### Em desenvolvimento

* [ ] Interface da aplicação
* [ ] Cadastro de usuários
* [ ] Login
* [ ] CRUD de hábitos
* [ ] Registro diário
* [ ] Sistema de streak
* [ ] Dashboard
* [ ] Histórico
* [ ] API Node.js
* [ ] Integração com banco de dados
* [ ] Deploy completo

---

## Objetivo acadêmico

O projeto busca aplicar conceitos estudados na disciplina de Programação Web, incluindo:

* desenvolvimento frontend;
* desenvolvimento backend;
* APIs REST;
* arquitetura de sistemas;
* computação em nuvem;
* arquitetura serverless;
* segurança;
* versionamento com Git;
* publicação de aplicações web.

---

## Autor

**Mateus Pinheiro**

Projeto desenvolvido para a disciplina de **Programação Web**.

## Autenticação com Amazon Cognito

A aplicação atual usa React, Vite, TypeScript, Tailwind CSS 4 e React Router. A autenticação usa `aws-amplify` 6.22.1, com APIs modulares de `aws-amplify/auth` e telas próprias. As seções de backend acima descrevem o planejamento futuro.

### Executar localmente

No diretório `StreakFlow` (onde está o `vite.config.ts`):

```sh
npm install
```

Crie `.env.local` nessa mesma pasta, usando `.env.example` como modelo:

```dotenv
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
```

Preencha os dois valores com o User Pool e o app client SPA existentes em `us-east-1`. O Vite lê o arquivo na pasta da aplicação; um `.env.local` apenas na pasta pai não configura esta aplicação. Reinicie o Vite após alterar as variáveis:

```sh
npm run dev
```

`.env.local` está ignorado pelo Git. Não adicione Client Secret, Access Key, Secret Access Key, Session Token ou credenciais do LabRole. Não é necessário Identity Pool ou Hosted UI. O app client deve permitir o fluxo de senha SRP (`ALLOW_USER_SRP_AUTH`), utilizado pelo SDK, além da renovação de sessão. Para cadastrar/editar o nome, permita leitura e escrita do atributo `name` (e `email`) no app client.

### AWS Amplify Hosting

Antes do próximo deploy, configure `VITE_COGNITO_USER_POOL_ID` e `VITE_COGNITO_CLIENT_ID` nas **Environment Variables** do app no Amplify Hosting, na branch correta. Execute um novo build/deploy: variáveis `VITE_` são incorporadas ao bundle durante o build. Mantenha a regra de rewrite SPA descrita em [ROUTING_DEPLOY.md](./ROUTING_DEPLOY.md), incluindo acesso direto a `/confirmar-email` e `/recuperar`.

Nenhuma infraestrutura AWS é criada ou alterada por esta implementação. Confirme no pool existente o login por e-mail, autocadastro, envio de códigos por e-mail e a política de senha solicitada.

### Fluxo e arquitetura

Cadastro → confirmação por e-mail → login → sessão Cognito → rotas protegidas.

- `src/lib/amplify.ts`: configuração única; variáveis ausentes mostram orientação em desenvolvimento e mensagem amigável em produção.
- `src/lib/auth.ts` + `useAuth.ts`: store externa reativa compartilhada via `useSyncExternalStore`, equivalente a um AuthProvider. Disponibiliza usuário (`sub`, username, nome, e-mail), loading, login, cadastro, confirmação/reenvio, logout, recuperação e verificação/renovação da sessão.
- A inicialização consulta `fetchAuthSession`, `getCurrentUser` e `fetchUserAttributes` antes de liberar conteúdo privado. O SDK gerencia persistência e renovação dos tokens. A sessão é reavaliada ao focar a janela, em alterações de armazenamento entre abas e a cada minuto; eventos de logout/falha de refresh bloqueiam acesso.
- `ProtectedRoute` apresenta loading e preserva URL, query e fragmento para o retorno após login. A landing permanece pública.
- Login, cadastro, confirmação e recuperação apresentam erros em português. Senhas seguem o mínimo de 8 caracteres, maiúscula, minúscula, número e especial.
- Perfil, Sidebar e saudação usam a identidade Cognito. A edição de e-mail oferece confirmação por código quando exigida pelo pool.

### Dados existentes e limites desta etapa

Nenhuma chave de hábitos, check-ins, histórico ou configurações é excluída. `streakflow_data` e as migrações de dados antigos são preservados. Os antigos verificadores locais permanecem apenas como dados legados, nunca são consultados para autenticar. As flags `streakflow_logged` e `streakflow:session` não concedem acesso e não são mais gravadas.

As contas locais antigas não são contas Cognito: é necessário cadastrar/confirmar uma conta no pool. Os hábitos existentes continuam disponíveis após entrar. Eles ainda pertencem ao navegador e são compartilhados entre contas que usem o mesmo armazenamento local; não há sincronização ou isolamento por `sub` nesta etapa. O `sub` já está disponível na sessão para uma futura migração explícita.

A proteção implementada controla a navegação da SPA. Uma futura API deverá validar os tokens no servidor e autorizar cada operação pelo `sub`; o armazenamento local não oferece autorização de dados no servidor. Não há integração de IAM/LabRole no frontend.

### Verificação

```sh
npm test
npm run lint
npm run build
```

Os testes usam mocks do SDK; não enviam e-mail nem fazem chamadas à AWS. Após configurar o ambiente, valide manualmente cadastro com recebimento de código, confirmação, login/recarga, acesso direto a `/progresso`, logout e recuperação com um e-mail de teste sob seu controle.

Referência das APIs: [documentação oficial do Amplify Auth](https://docs.amplify.aws/react/frontend/auth/sign-up/).

Se o Cognito rejeitar a escrita do atributo opcional `name` durante o cadastro, o serviço tenta cadastrar apenas com e-mail e senha. Essa tentativa só ocorre no erro explícito de atributo não autorizado; falhas de rede não repetem o cadastro automaticamente. Sem nome disponível, a interface usa a parte inicial do e-mail. Na edição do perfil, apenas atributos alterados são enviados; falta de permissão mostra uma mensagem amigável e mantém a sessão existente.
