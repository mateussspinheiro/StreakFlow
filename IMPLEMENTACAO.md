# StreakFlow — evolução de produto

> Este relatório descreve a evolução visual anterior. A extensão atual dos registros, incluindo quantidades, metas diárias e descanso planejado, está documentada em [CHECKIN_INTELIGENTE.md](CHECKIN_INTELIGENTE.md). O roteamento está descrito em [ROUTING_DEPLOY.md](ROUTING_DEPLOY.md).

A aplicação existente foi evoluída sem recriar o projeto, instalar dependências ou alterar Vite, Tailwind, ESLint, scripts ou configuração de deploy nesta etapa. React Router, autenticação simulada e persistência centralizada foram preservados.

## Executar

Dentro de `StreakFlow/`:

```sh
npm run dev
npm run build
npm run lint
npm test
```

## Arquivos criados nesta evolução

| Arquivo | Responsabilidade |
| --- | --- |
| `src/components/BrandLogo.tsx` | Logo completa, versão compacta e mascote SVG original. |
| `src/components/Modal.tsx` | Dialog nativo com foco contido, retorno de foco, Escape e bloqueio de rolagem. Reutilizado no drawer e confirmações. |
| `src/components/Feedback.tsx` | Mensagens acessíveis de sucesso/erro e celebração discreta. |
| `src/components/CheckInForm.tsx` | Cadastro, edição e remoção confirmada de um check-in. |
| `src/components/DayOverview.tsx` | Cards do dia, barra de progresso e sequência com mascote. |
| `src/components/HabitList.tsx` | Cards de hábitos, filtros e ações. |
| `src/components/HistoryPanel.tsx` | Histórico detalhado com filtros e edição. |
| `src/components/ProgressPanel.tsx` | Indicadores, gráfico recente e metas por hábito. |
| `src/components/EmptyState.tsx` | Estados vazios consistentes. |
| `src/lib/checkins.ts` | Rótulos compartilhados de status/esforço e formatação de datas. |
| `src/lib/insights.ts` | Insights matemáticos, com critérios de dados suficientes. |
| `src/lib/useTheme.ts` | Aplicação do tema salvo e acompanhamento da preferência do sistema. |

## Arquivos modificados nesta evolução

- `src/App.tsx`: tema global e títulos das páginas públicas.
- `src/components/AuthLayout.tsx`: logo e superfícies com suporte a temas.
- `src/components/BrandPanel.tsx`: integração da identidade SVG.
- `src/components/DashboardContent.tsx`: coordenação das páginas, modais, feedback, perfil e configurações; blocos extraídos para componentes menores.
- `src/components/HabitForm.tsx`: duração estimada, categorias e cores limitadas à paleta.
- `src/components/SettingsForm.tsx`: seções Hábitos/Aparência e seleção Claro/Escuro/Sistema.
- `src/components/Sidebar.tsx`: navegação desktop fixa, header compacto e drawer móvel.
- `src/layouts/DashboardLayout.tsx`: layout responsivo e atalho para o conteúdo.
- `src/lib/streakflow.ts`: modelo v3, compatibilidade, operações de check-in e métricas por status.
- `src/lib/types.ts`: tipos de check-in, tema, duração estimada e data de entrada.
- `src/pages/Landing.tsx`: identidade, textos de check-in e integração com temas.
- `src/index.css`: tokens, componentes visuais, temas, responsividade e microinterações.
- `public/favicon.svg`: símbolo original do StreakFlow.
- `index.html`: título e descrição do produto.
- `tests/habits.test.mjs`: adaptação dos registros migrados ao formato atual.
- `tests/streakflow.test.mjs`: cobertura de check-ins, migração v2, temas, validação e insights.
- `IMPLEMENTACAO.md`: este relatório.

O diretório já continha outras alterações não commitadas de etapas anteriores; elas foram preservadas. As listas acima descrevem especificamente esta evolução.

## Funcionalidades e experiência

### Identidade e design system

Logo original em SVG com símbolo de chama, versão compacta e mascote discretamente expressivo. Integração na landing, navegação, autenticação e favicon. Cores semânticas, fundos, bordas, raios e sombra centralizados em variáveis CSS. Claro, escuro e sistema abrangem páginas públicas, área autenticada, campos, modais, mensagens e gráficos; o painel de marca da autenticação permanece uma área escura intencional em ambos os temas.

### Dashboard

Saudação conforme o horário local e data atual; cards de hábitos ativos, conclusões, percentual diário, maior streak atual e recorde. Barra real de progresso e estado “Dia concluído” somente quando existe pelo menos um hábito e todos foram concluídos. Sem comparações ou valores inventados.

### Check-ins

“Registrar” abre um formulário com status Concluído/Parcial/Ignorado, esforço opcional de 1 a 5, horário local, duração opcional de 1 a 1440 minutos e observação de até 500 caracteres. Esforço usa botões visuais; clicar novamente limpa a escolha. A data e o horário inicial são fixados ao abrir o formulário, evitando mudar a data involuntariamente se o modal atravessar meia-noite.

Salvar atualiza os dados compartilhados, fecha o modal e mostra feedback. Aumento de streak anima a chama por 280 ms. É possível editar registros de hoje ou antigos pelo histórico. Desfazer exige confirmação dentro do modal. A exclusão de hábito também usa um modal próprio e remove seus registros associados. Falhas de persistência mantêm o formulário aberto e os dados anteriores intactos.

### Hábitos

Cards com categoria, descrição, meta semanal, duração estimada, status de hoje, streak e conclusões dos últimos 7 dias. Filtros por nome, categoria e status. Cores limitadas a roxo, violeta, azul-arroxeado e cinza. O formulário existente continua em um painel de criação/edição.

### Histórico e progresso

Histórico mostra data, horário quando conhecido, status, duração, esforço e observação; filtros por todos/7/30 dias, hábito e data específica. Ordenação por data e horário mais recentes.

Progresso mostra total de check-ins, conclusões completas, taxa de conclusão, streak atual e melhor streak, gráfico de 7/14/30 dias e metas da semana por hábito. A taxa significa `check-ins concluídos / todos os check-ins`; não presume que dias sem registro foram concluídos. O gráfico diário usa hábitos existentes naquela data e somente conclusões completas.

Insights sem IA externa: o hábito mais consistente exige sete dias de existência dentro da janela e não escolhe arbitrariamente um vencedor em empates. A comparação percentual usa os últimos sete dias contra os sete anteriores, considerando somente hábitos existentes nas duas janelas; exige denominador anterior maior que zero. Sem amostra suficiente, a interface pede mais registros.

### Perfil e configurações

Perfil mostra inicial, nome, e-mail, entrada no produto, hábitos ativos, total de check-ins e melhor streak. Contas antigas não possuíam data de entrada: isso aparece como informação não registrada, sem inventar uma data. Novos cadastros recebem a data local real. Editar nome/e-mail preserva credenciais.

Configurações agrupadas em Conta, Hábitos, Aparência e Sobre seus dados. Preferências persistem, incluindo tema e início da semana. Lembretes e resumo semanal continuam somente como preferências, sem envio fictício. Exportação inclui os check-ins completos e não inclui credenciais.

### Acessibilidade e responsividade

Labels, foco visível, estados pressionados, roles de feedback, botões reais, dialog nativo e respeito a `prefers-reduced-motion`. Sidebar fixa no desktop; header e drawer no mobile, fechado ao navegar. Cards, formulários e gráficos se reorganizam por largura. Gráficos longos mantêm rolagem contida no próprio painel.

## Modelo principal

Os nomes seguem o inglês já usado no projeto; textos da interface permanecem em português.

```ts
type Profile = { name: string; email: string }

type User = {
  profile: Profile
  salt: number[]
  verifier: string
  joinedAt?: string
}

type Habit = {
  id: number
  title: string
  description: string
  category: string
  weeklyGoal: number
  createdAt: string
  estimatedMinutes?: number
  color?: 'purple' | 'violet' | 'indigo' | 'gray'
}

type CheckIn = {
  id: string
  habitId: number
  date: string
  time?: string
  status: 'completed' | 'partial' | 'skipped'
  effort?: 1 | 2 | 3 | 4 | 5
  durationMinutes?: number
  note?: string
}

type Settings = {
  compact: boolean
  habitReminders: boolean
  weeklySummary: boolean
  firstDayOfWeek: 0 | 1
  theme: 'light' | 'dark' | 'system'
}
```

O documento `streakflow_data` passa à versão 3. O nome de coleção `completions` e o alias de tipo `Completion = CheckIn` são mantidos para compatibilidade com os serviços existentes. Não há uma segunda coleção concorrente. `streakflow_logged` continua exclusivamente para a sessão simulada.

IDs de check-in usam `habitId:date`, garantindo um único registro por hábito/data e edição sem duplicação. Parciais e ignorados são preservados no histórico, mas não contam para streak, recordes, metas ou percentual diário. Um dia sem conclusão interrompe a sequência; enquanto o dia atual estiver em aberto, a sequência pode terminar ontem. Nenhum status congela artificialmente o streak.

## Compatibilidade

- Documentos v2 são normalizados em memória para v3. Conclusões antigas viram `completed`, com ID determinístico e sem horário/esforço/duração/nota inventados.
- A próxima gravação válida persiste o documento v3; apenas ler não sobrescreve o documento v2 original.
- Conta, verificador da senha, perfil, hábitos, datas, sessão e preferências antigas são preservados.
- A migração anterior de sessionStorage continua disponível, preservando suas chaves originais.
- Arquivos inválidos ou armazenamento bloqueado geram erro visível; não são substituídos silenciosamente por um cadastro vazio.

## Verificação realizada

- `npm run build`: passou, incluindo TypeScript e bundle de produção.
- `npm run lint`: passou, sem erros.
- `npm test`: 12 testes passaram.
- Cobertura de serviços: cadastro/login/logout, CRUD, idempotência, check-in com esforço/duração/nota, edição entre todos os status, remoção, atualização dos indicadores, perfil, persistência de preferências/tema, migração, dados inválidos, falhas de gravação e critérios dos insights.

**Limitação concreta:** a ferramenta de navegador retornou uma lista vazia de navegadores conectados. Portanto, os fluxos clicados no navegador e a inspeção visual em **320, 375, 768, 1024 e 1440 px não foram executados**. Responsividade e acessibilidade foram revisadas no código, mas ainda exigem a conferência visual/interativa nessas larguras. Não confundir testes dos serviços com testes de interface ponta a ponta.

## Etapas futuras

- Autenticação real, autorização no servidor e suporte a várias contas.
- API e banco de dados com isolamento por usuário.
- Sincronização e backup entre dispositivos.
- Recuperação de senha por e-mail.
- Entrega real de lembretes/resumos, com consentimento e infraestrutura adequados.
- Validar o deploy remoto e a reescrita SPA do Amplify; nenhuma configuração remota foi alterada.

A aplicação continua transparente: os dados são locais, não estão sincronizados com nuvem e a autenticação é apenas uma demonstração.
