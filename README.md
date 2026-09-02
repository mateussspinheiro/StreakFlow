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
