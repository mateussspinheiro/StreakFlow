# Roteamento e deploy do StreakFlow

## Diagnóstico e rotas

O projeto usa `react-router` 8.4.0, que já exporta BrowserRouter, Routes, Route, Link e NavLink. `react-router-dom` não está instalado e não é necessário. Há apenas um BrowserRouter, em `src/main.tsx`. `App.tsx` reúne as rotas; um layout protegido sem prefixo compartilha o sidebar e o Outlet. Nenhuma dependência foi adicionada.

Antes, `/meus-habitos` não existia e URLs desconhecidas eram redirecionadas à landing. Agora:

| URL | Página / comportamento |
| --- | --- |
| `/` | Landing |
| `/login`, `/cadastro` | Login e cadastro; autenticados seguem para `/dashboard` |
| `/dashboard` | Dashboard protegido |
| `/meus-habitos`, `/historico`, `/progresso` | Páginas protegidas correspondentes |
| `/dashboard/perfil`, `/dashboard/configuracoes` | Perfil e configurações protegidos |
| `/dashboard/novo-habito`, `/dashboard/editar-habito/:id` | Formulários protegidos existentes |
| `/recuperar`, `/termos`, `/privacidade` | Páginas públicas existentes |
| URL inexistente | Página 404; caminhos desconhecidos em `/dashboard/*` exigem login primeiro |

Compatibilidade: `/habitos` e `/dashboard/habitos` levam a `/meus-habitos`; `/dashboard/historico` a `/historico`; `/dashboard/progresso` a `/progresso`. `/perfil`, `/configuracoes` e `/novo-habito` continuam levando às respectivas rotas `/dashboard/...`. Esses redirecionamentos usam `replace`, preservam query string e fragmento, e não recarregam o documento. Sem sessão, as páginas privadas levam a `/login`.

## Configurar manualmente no AWS Amplify

`amplify.yml` já executa `npm ci`, `npm run build` e publica `dist`. Ele foi preservado: **não adicione regras de rewrite nesse arquivo**. O roteador só pode interpretar um acesso direto depois que a hospedagem entregar o HTML da SPA.

1. Entre no console AWS Amplify e selecione a aplicação que atende `streakflow.mateus-pinheiro.feliz.web.ufersa.dev.br`.
2. Abra **Hosting → Rewrites and redirects → Manage redirects**.
3. Revise as regras existentes. Preserve regras específicas de domínio e outros destinos; não duplique um fallback SPA já correto. Substitua um fallback genérico conflitante e deixe a regra SPA depois das regras específicas aplicáveis.
4. Adicione a regra abaixo e clique em **Save**.

**Source:**

```text
</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>
```

**Target:** `/index.html`  
**Type / Status:** `200 (Rewrite)`  
**Condition:** nenhuma.

Para o editor JSON, o objeto correspondente é o seguinte (insira na lista existente; não apague outras regras necessárias):

```json
{
  "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>",
  "target": "/index.html",
  "status": "200",
  "condition": null
}
```

O escape `\\` é necessário no JSON. A regra exclui as extensões listadas, preservando JS, CSS, imagens, fontes e JSON. Não use um `/<*>` indiscriminado que devolva HTML no lugar dos assets. Novas extensões estáticas fora dessa lista precisam de revisão futura.

Referências oficiais: [configuração pelo console](https://docs.aws.amazon.com/amplify/latest/userguide/creating-editing-redirects.html) e [regra recomendada para SPA](https://docs.aws.amazon.com/amplify/latest/userguide/redirect-rewrite-examples.html#redirects-for-single-page-web-apps-spa).

## Verificação antes de publicar

Execute `npm run build`, `npm run lint` e `npm test` dentro de `StreakFlow/`. Confirme que o Amplify executa o build nesse diretório e publica seu `dist`.

Após publicar o código e salvar a regra:

- Abra `/`, `/login` e `/cadastro` diretamente em uma nova aba sem sessão.
- Faça login; abra `/dashboard`, `/meus-habitos`, `/historico` e `/progresso` diretamente e pressione F5 em cada uma. A sessão local deve manter o acesso.
- Navegue pelo sidebar e use Voltar/Avançar; confira os links antigos e o item ativo.
- Saia e tente acessar cada rota privada: o destino deve ser `/login`.
- Abra uma URL inexistente: deve aparecer a página 404 da aplicação.
- Na aba Network, confirme que arquivos reais de `/assets/` e `/favicon.svg` carregam com o conteúdo correto, não com HTML. Teste também um asset inexistente: não deve receber `index.html`.

A página 404 da SPA é visual; uma URL desconhecida abrangida pelo rewrite retorna HTTP 200 com `index.html`. Uma resposta HTTP 404 real para páginas exigiria outra estratégia de hospedagem/renderização.

**Limite da entrega:** nenhuma configuração AWS foi alterada. A consulta ao domínio publicado não pôde ser concluída nesta sessão. O funcionamento remoto de F5/acesso direto depende da regra no painel e deve ser confirmado após o deploy. Não houve commit nem push automático.
