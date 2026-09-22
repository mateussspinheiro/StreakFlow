# Check-in inteligente — segunda etapa

## Diagnóstico

A aplicação já possuía hábitos, check-ins completos/parciais/ignorados, modal de registro e serviços centralizados. `HabitList` e as páginas recebem dados de `useStreakFlow`; `DashboardContent` coordena as ações. `streakflow.ts` persiste um documento versionado em `localStorage`, separado da chave de sessão. `habits.ts` contém as funções originais de datas e streak. Esses componentes foram reutilizados.

Faltavam tipos de acompanhamento, progresso numérico, metas diárias, unidades, intensidade e regras de descanso planejado. A alteração é incremental: não modifica roteamento, autenticação ou deploy, nem instala dependências. Não houve commit ou push.

## Arquivos criados

- `src/lib/tracking.ts`: validação, configuração, status automático, percentual, incrementos, unidades e feedback.
- `src/lib/consistency.ts`: adaptação de streak para descanso planejado, reutilizando as funções anteriores quando não há descansos.
- `src/components/NumericProgress.tsx`: valor/meta, percentual real e barra limitada a 100%.
- `src/components/CheckInStatusBadge.tsx`: indicação de status com ícone e texto.
- `tests/helpers/store.mjs`: ambiente de teste compartilhado com armazenamento isolado e relógio controlável.
- `tests/tracking.test.mjs`: testes dos novos comportamentos.
- `CHECKIN_INTELIGENTE.md`: este relatório.

## Arquivos modificados

- `src/lib/types.ts`, `streakflow.ts`, `checkins.ts`, `insights.ts`.
- `src/components/HabitForm.tsx`, `CheckInForm.tsx`, `HabitList.tsx`, `DashboardContent.tsx`, `DayOverview.tsx`, `HistoryPanel.tsx`, `ProgressPanel.tsx`, `Icon.tsx`.
- `src/index.css`: apenas estilos dos controles/progresso/status novos.
- `tests/streakflow.test.mjs`: extrai o ambiente compartilhado; mantém os oito testes e suas verificações.
- `IMPLEMENTACAO.md`: referência para esta etapa.

## Modelos finais

```ts
type TrackingType = 'binary' | 'quantity' | 'duration' | 'qualitative'

type TrackingConfig = {
  trackingType: TrackingType
  target?: number
  unit?: string
  allowPlannedRest: boolean
}

type Habit = {
  id: number
  title: string
  category: string
  description: string
  weeklyGoal: number
  createdAt: string
  estimatedMinutes?: number
  color?: 'purple' | 'violet' | 'indigo' | 'gray'
} & Partial<TrackingConfig>

type CheckInStatus =
  | 'pending'
  | 'partial'
  | 'completed'
  | 'postponed'
  | 'planned_rest'
  | 'skipped' // Compatibilidade com registros anteriores.

type CheckIn = {
  id: string
  habitId: number
  date: string
  time?: string
  status: CheckInStatus
  effort?: 1 | 2 | 3 | 4 | 5
  durationMinutes?: number
  note?: string
  value?: number
  tracking?: TrackingConfig
  intensity?: 'light' | 'moderate' | 'intense'
}
```

O valor diário fica exclusivamente no check-in; o percentual é calculado, sem manter outra fonte de estado no hábito. A coleção persistida continua chamada `completions`, com o alias `Completion = CheckIn`. Os campos são uma extensão compatível do documento v3, sem segunda coleção ou migração destrutiva.

`tracking` captura tipo, meta, unidade e permissão de descanso no primeiro registro de cada dia. Edições posteriores de nome/meta/unidade/tipo não reinterpretam registros já existentes. Isso também vale para o registro de hoje: sua configuração permanece original. Novas configurações valem para dias ainda sem registro. Editar um registro antigo preserva sua meta original.

## Tipos de acompanhamento

| Tipo | Configuração | Registro |
| --- | --- | --- |
| Sim / Não | Sem meta numérica | Botão de conclusão rápida; modal para revisar ou adicionar detalhes |
| Quantidade | Meta diária e unidade | Incrementos no card, total manual no modal e conclusão pela meta |
| Duração | Meta diária em `min` | Mesma lógica numérica, com `+15 min` e `+30 min` |
| Status | Sem meta numérica | Concluído, parcial, adiado, pendente e descanso quando habilitado; duração, intensidade e nota opcionais |

As unidades são strings de até 30 caracteres, com sugestões `ml`, `L`, `páginas`, `min`, `km`, `repetições` e `vezes`. Novas unidades não exigem alterar o esquema. Atalhos especiais: ml +250/+500; L +0,25/+0,5 com rótulos +250/+500 ml; páginas +1/+5; minutos +15/+30. Demais unidades usam +1 e permitem entrada manual.

As ações no card persistem imediatamente. No modal, os atalhos alteram o rascunho e o botão Salvar confirma. Entrada manual substitui o total; incremento soma. Concluir atinge a meta sem reduzir um valor que já a ultrapassou. Uma única chave `habitId:YYYY-MM-DD` impede duplicação do registro diário. Ações rápidas consultam o estado atual no serviço, evitando somar sobre um valor antigo do componente.

## Status e validação

- Sem registro, o estado visual é **Pendente**, com valor zero.
- Valor zero salvo: `pending`.
- Valor positivo abaixo da meta: `partial`.
- Valor igual ou maior que a meta: `completed`, independentemente de um status manual incorreto.
- Abaixo da meta, uma escolha explícita `postponed` ou `planned_rest` pode preservar o valor parcial e registrar a decisão do dia. Um novo incremento retoma o status calculado pelo valor.
- `planned_rest` exige permissão capturada na configuração do registro.
- `skipped` permanece disponível apenas para revisar registros anteriores; não é oferecido em um novo check-in.

Valores negativos, NaN, infinito e tipos inválidos são rejeitados antes da gravação. O limite de valor/meta é 1 bilhão; a meta mínima é 0,000001. Duração opcional continua entre 1 e 1440 minutos inteiros; observação continua limitada a 500 caracteres. Para acompanhamento de duração, o tempo realizado está em `value` com unidade `min`, evitando duplicar a medição em `durationMinutes`.

Exemplo: 3000 ml para meta de 2500 ml armazena **3000**, exibe **120%** e mantém a barra em **100%**. Campo numérico de progresso vazio equivale a zero; meta vazia é inválida. Datas continuam no calendário local, inclusive ao registrar à noite ou atravessar meia-noite com um modal aberto.

## Streak e indicadores

As funções originais de streak não foram alteradas. `getHabitStreaks` encapsula a extensão:

- Concluído soma uma realização à sequência.
- Descanso planejado autorizado conecta as realizações, sem somar um dia concluído.
- Exemplo: concluído → descanso → concluído resulta em sequência **2**.
- Descansos sozinhos não criam sequência e não preenchem dias sem registro.
- Pendente, parcial, adiado e ignorado não sustentam a sequência quando o dia já terminou.
- Mantida a regra anterior: hoje ainda não concluído pode conservar a sequência terminada ontem.

Dashboard e gráfico diário excluem descansos permitidos do denominador. Se todos os hábitos estiverem em descanso, o dashboard mostra “Descanso planejado”, sem inventar uma conclusão. Taxa de conclusão exclui descansos; metas semanais contam somente conclusões e não são reduzidas automaticamente. O ranking de consistência também exclui os dias de descanso da taxa, mantendo a exigência de sete dias de observação.

## Compatibilidade e histórico

Hábitos sem `trackingType` assumem `binary` e sem permissão de descanso. Check-ins anteriores sem `tracking` mantêm a semântica antiga, sem inferir meta, valor, unidade ou intensidade. Migrações existentes v2/sessionStorage permanecem. Dados inválidos são preservados com erro visível; falhas de gravação não atualizam silenciosamente a interface.

Histórico mostra status, valor/meta original, percentual, duração, intensidade e observação, quando presentes. IDs e datas já permitem agrupamento futuro por dia, heatmap, somas por unidade e resumo semanal. Quantidades de unidades diferentes não devem ser somadas sem conversão explícita.

## Testes e validação

Os 16 testes anteriores são preservados. Foram adicionados 17 testes, cobrindo os 12 cenários mínimos pedidos e também conversão L/ml, duração, intensidade, neutralidade de descanso, alterações de configuração em dias diferentes, armazenamento inválido e falhas de gravação.

- Teste de horário usa `America/Sao_Paulo`: 22/09 às 23h45 permanece em `2026-09-22`, embora UTC já esteja em 23/09.
- Os testes verificam integração dos serviços com os indicadores e persistência após nova leitura, sem exigir navegador.
- A ferramenta de navegador retornou uma lista vazia. A conferência visual/interativa não foi executada nesta sessão.

Resultados finais: `npm test` aprovado com 33 testes (16 anteriores e 17 novos), `npm run lint` aprovado e `npm run build` aprovado. `git diff --check` não encontrou erros de whitespace.

## Conferência manual antes de publicar

1. Criar Água com 2500 ml; incrementar até 1500 (60%), concluir e ultrapassar a meta.
2. Repetir com 2,5 L; conferir +250 ml = 0,25 L e persistência após F5.
3. Criar leitura de 30 páginas e estudo de 60 min; usar atalhos e corrigir manualmente os totais.
4. Criar um hábito Sim/Não e concluir diretamente pelo card.
5. Criar Academia como Status, habilitar descanso; registrar duração/intensidade/nota e testar adiado/descanso.
6. Editar meta/unidade depois do primeiro registro; confirmar que o histórico e o registro de hoje mantêm a configuração anterior.
7. Conferir histórico, dashboard, progresso, edição/remoção e logout; navegar também pelas rotas e pela 404 existentes.
8. Conferir teclado, foco, Escape, campos decimais e quebra de linha dos atalhos em celular/tablet/desktop, nos dois temas.

Persistência permanece local e pode sofrer com limpeza dos dados do navegador; mudanças simultâneas em abas não têm transação distribuída. Nenhum backend, heatmap, resumo semanal completo, XP, ranking novo, push ou IA foi implementado. A animação de marca preexistente não recebeu um novo sistema de animação.

## Próxima etapa sugerida — não implementada

Construir o heatmap a partir de `date` e `status`, diferenciando parcial, conclusão e descanso neutro. Depois, acrescentar resumo semanal com somas de `value` agrupadas por unidade e considerando a meta capturada em cada dia.
