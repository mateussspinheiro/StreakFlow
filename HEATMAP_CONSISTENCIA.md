# Heatmap de Consistência

## Diagnóstico e integração

O StreakFlow usa um documento v3 em `localStorage` (`streakflow_data`), com
`habits`, `completions` e preferências. `completions` já contém um `CheckIn` por
hábito/data, com status, valor, snapshot de acompanhamento (`tracking`), horário
e observação opcionais. O store valida e migra dados antigos antes de expô-los
pelo `useStreakFlow` (`useSyncExternalStore`). O heatmap somente lê esses dados.

As páginas Dashboard, Histórico e Progresso delegam a `DashboardContent`, que
encaminha os dados para seus painéis. O calendário foi colocado no início de
`ProgressPanel`. O Dashboard recebe uma prévia dos últimos 30 dias depois da
lista de hábitos, com link para `/progresso`. Os indicadores, gráfico de barras,
insights e acompanhamento semanal existentes foram mantidos.

O gráfico anterior era específico de `ProgressPanel`; não havia um calendário
reutilizável. Foram reutilizados `Modal`, `NumericProgress`, `CheckInStatusBadge`,
`Icon`, tokens de tema, `formatDate`, `getTracking`, `dateKey` e `isDateKey`.
Nenhuma rota, autenticação, persistência, regra de check-in, streak ou
configuração do Amplify foi alterada. Não há dependências novas.

## Regra de consolidação

O status histórico é a fonte de verdade. Não se recalcula um check-in usando a
meta atual do hábito. O resultado tem a seguinte precedência:

| Estado | Condição | Nível | Identificação visual |
| --- | --- | --- | --- |
| Vários hábitos concluídos | Pelo menos 2 `completed` | 4 | Roxo mais intenso, dois checks |
| Hábito concluído | 1 `completed` | 3 | Roxo forte, check |
| Progresso parcial | Nenhuma conclusão e ao menos 1 `partial` | 2 | Roxo intermediário, círculo parcial |
| Descanso planejado | Todos os registros são `planned_rest` | Estado próprio | Listras, borda tracejada e pausa |
| Sem conclusão | Outros dias com registros: `pending`, `postponed`, `skipped`, inclusive misturados com descanso | 1 | Roxo suave, ponto |
| Sem registro | Nenhum check-in | 0 | Neutro, traço |

Descanso tem `level: 0` apenas como valor numérico neutro; a UI usa `state: rest`
para diferenciá-lo de ausência. Descansos em dias mistos continuam descritos no
label, no detalhe e no resumo. Um status antigo `planned_rest` sem campos
opcionais também é apresentado como descanso; isso não altera sua interpretação
pela regra existente de streak. O helper `getHabitStreaks` segue inalterado:
descanso autorizado conecta conclusões sem aumentar a sequência.

A taxa diária é `completed / (total de check-ins − planned_rest) × 100`.
Quando não há denominador, ela fica ausente (`null`), nunca um falso 0% de falha.
Essa taxa descreve **registros**, e não todos os hábitos previstos no dia.
Valores acima da meta continuam concluídos; os detalhes preservam valor real,
meta e unidade salvos naquele dia. Legados sem medição não recebem valores ou
metas inventados. `skipped` permanece visível como registro anterior não realizado.

## Filtros e resumo

- Períodos inclusivos de 30, 90 (padrão), 180 e 365 **dias**, terminando hoje.
  São janelas móveis em dias, não meses civis.
- Todos os hábitos ou um hábito específico. Calendário, resumo e modal usam
  exatamente o mesmo recorte. O Dashboard mostra todos os hábitos em 30 dias.
- Dias com progresso: ao menos um `completed` ou `partial`.
- Percentual de dias com progresso: dias com progresso ÷ dias do período.
- Dias com conclusão: ao menos um `completed`.
- Dias com descanso: ao menos um `planned_rest`, inclusive dias mistos.
- Total de check-ins: todos os status do recorte.

O período inteiro é exibido, inclusive dias anteriores ao primeiro hábito.
Ausência de dados gera orientação textual e um calendário vazio, sem simulações.
O resumo não é uma nova streak e não substitui metas semanais.

## Datas, arquitetura e desempenho

`heatmap.ts` concentra `groupCheckInsByDate`, `getDailyHeatmapSummary`,
`getHeatmapRange`, `buildHeatmapCalendar` e `summarizeHeatmap`, além de tipos e
labels. O agrupamento ocorre uma vez por recálculo. A montagem percorre os dias
do intervalo e seus registros. Não há loops de busca sobre todo o histórico em
cada célula. Os cálculos são memoizados por registros, filtros, início da semana
e dia atual. O estado guarda somente filtros e interação, nunca uma cópia dos
check-ins. Os helpers são puros e não escrevem no store.

Datas são `YYYY-MM-DD` locais: parsing ao meio-dia local, `setDate` para navegar
e `dateKey` para serializar. Não há conversão UTC nem soma de milissegundos por
dia. Colunas são semanas; linhas respeitam domingo/segunda das configurações.
Preenchimento de alinhamento usa `null`, sem criar dias extras ou futuros.

## Interação, acessibilidade e mobile

- Cada dia é um botão com `aria-label`, `title`, símbolo e cor. Hoje recebe um
  ponto e `aria-current="date"`. Meses e dias da semana orientam o calendário.
- Uma única parada de Tab no calendário. Setas percorrem os dias/semanas;
  Home/End vão aos extremos; Enter/Espaço abre o modal; Escape oculta o detalhe.
- Hover/foco apresenta data, contagem de todos os status e taxa em uma área
  estável junto ao calendário. A legenda descreve os seis estados.
- O modal reutiliza o diálogo nativo existente com foco contido, fechamento
  por Escape e retorno ao botão de origem. Traz nome, status, valor/meta/unidade,
  horário, duração, intensidade e observação quando disponíveis.
- Mobile tem filtros empilhados, resumo em duas colunas, células de 28 px,
  legenda com quebra de linha e rolagem horizontal dentro do calendário.
  A prévia do Dashboard empilha texto/calendário em telas estreitas.
- Temas claro/escuro e preferência por movimento reduzido são respeitados.

## Arquivos

Criados: `src/lib/heatmap.ts`, `src/components/ConsistencyHeatmap.tsx`,
`src/components/ConsistencyHeatmap.css`, `src/components/HeatmapCalendar.tsx`,
`src/components/HeatmapCalendar.css`, `tests/heatmap.test.mjs`,
`tests/heatmap-ui.test.mjs` e este documento.

Modificados: `src/components/ProgressPanel.tsx`,
`src/components/DashboardContent.tsx` e `tests/helpers/store.mjs`.

## Validação e roteiro manual

Executar `npm test`, `npm run lint` e `npm run build` na pasta StreakFlow.
Validação concluída: **77 testes aprovados** (51 anteriores + 20 de dados do
heatmap + 6 de UI), lint sem erros e build de produção aprovado. No ambiente
Windows desta sessão, testes e build precisaram executar fora do sandbox para
permitir os subprocessos Node/Vite (`spawn EPERM` no ambiente restrito).
Não houve alteração dos comandos ou das dependências do projeto.

Não foi possível realizar a inspeção visual/interativa: o provedor de navegador
não estava disponível na sessão. O roteiro abaixo registra a verificação manual
complementar, especialmente para toque, layout responsivo e foco no diálogo.

Os testes de dados cobrem intervalos, agrupamento, todos os estados e misturas,
filtros, limites de intensidade, labels, taxa, migração, quatro tipos de hábito,
supermeta, preservação do snapshot, imutabilidade, streak, bissexto, virada de ano
e noite no fuso de São Paulo. Os testes de UI verificam renderização e semântica;
não substituem uma inspeção em navegador.

Verificar manualmente:

1. Criar check-ins com diferentes status e abrir os dias por mouse/toque.
2. Alternar os quatro períodos e Todos/um hábito, conferindo cards e detalhes.
3. Conferir valor acima da meta e observação; alterar a meta do hábito e verificar
   que os detalhes antigos ainda usam a meta salva.
4. Navegar com Tab, setas, Home/End, Enter/Espaço e Escape; confirmar retorno de
   foco ao fechar o modal, inclusive em dias alcançados por rolagem.
5. Verificar telas de 320/375/768 px e desktop, nos temas claro e escuro, com
   365 dias e nomes longos; somente o calendário deve rolar horizontalmente.
6. Alternar primeiro dia da semana; verificar ausência de registros, descanso
   exclusivo, dias mistos e manutenção dos dados após recarga.

## Próxima etapa

O Resumo Semanal pode consumir `buildHeatmapCalendar` com sete dias locais e
`summarizeHeatmap` para apresentar atividade, conclusões e descanso. Comparações
entre semanas devem explicitar períodos incompletos e mudanças no conjunto de
hábitos. Resumo Semanal completo, exportação adicional, backend, notificações e
gamificação não fazem parte desta etapa.
