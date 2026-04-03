# Regras de Negócio — PomodoLearn

Documento de referência das regras de negócio da aplicação. Independente de plataforma (web, desktop, mobile).

---

## Sumário

1. [Entidades e Estrutura de Dados](#1-entidades-e-estrutura-de-dados)
2. [Categorias](#2-categorias)
3. [Perguntas](#3-perguntas)
4. [Pomodoros (Sessões de Estudo)](#4-pomodoros-sessões-de-estudo)
5. [Timer](#5-timer)
6. [Ciclo de Quiz](#6-ciclo-de-quiz)
7. [Integração Timer + Quiz](#7-integração-timer--quiz)
8. [Progresso e Conclusão](#8-progresso-e-conclusão)
9. [Notificações](#9-notificações)
10. [Validações Gerais](#10-validações-gerais)

---

## 1. Entidades e Estrutura de Dados

A aplicação é composta por quatro entidades principais:

| Entidade | Descrição |
|---|---|
| **Categoria** | Agrupa perguntas por tema. Possui nome, identificador visual (emoji + cor). |
| **Pergunta** | Questão de múltipla escolha com 4 alternativas. Pertence a uma categoria. |
| **Pomodoro** | Sessão de estudo que combina um conjunto de perguntas com uma duração de tempo. |
| **Timer** | Controla o estado do contador de tempo de um pomodoro ativo. |

### Relacionamentos

- Uma **Categoria** pode ter zero ou mais **Perguntas**.
- Uma **Pergunta** pertence a no máximo uma **Categoria**. Pode ficar sem categoria.
- Um **Pomodoro** referencia um conjunto de **Perguntas** e uma **Categoria** de contexto.
- O **Timer** está sempre associado ao **Pomodoro** ativo no momento.

---

## 2. Categorias

### Criação

- O campo **nome** é obrigatório e não pode ser vazio.
- A aplicação gera automaticamente um **slug** a partir do nome (sem acentos, em minúsculas, palavras separadas por hífen).
- O **slug** deve ser único entre todas as categorias.
- Cada categoria deve ter exatamente um **emoji** selecionado de uma lista de opções predefinidas.
- Cada categoria deve ter exatamente uma **cor** selecionada de uma paleta de cores predefinidas.

### Edição

- Nome, emoji e cor podem ser alterados a qualquer momento.
- O slug é atualizado automaticamente quando o nome muda, a menos que o usuário o tenha editado manualmente.
- Ao editar o slug manualmente, a sincronização automática com o nome é desativada.
- A unicidade do slug é validada novamente ao salvar.

### Exclusão

- Categorias podem ser excluídas sem restrição.
- Ao excluir uma categoria, as perguntas associadas **não são excluídas**; elas ficam sem categoria atribuída.

---

## 3. Perguntas

### Estrutura

- Cada pergunta possui: texto da pergunta, exatamente **4 alternativas** (A, B, C, D), a **resposta correta** (uma das 4) e um nível de **dificuldade**.
- Níveis de dificuldade aceitos: `fácil`, `médio`, `difícil`.
- A dificuldade padrão é `médio` quando não especificada.

### Criação

- O **texto da pergunta** é obrigatório e não pode ser vazio.
- As **4 alternativas** devem ter conteúdo (não podem estar vazias).
- A **resposta correta** deve ser selecionada antes de salvar.
- A pergunta deve ser atribuída a uma **categoria** (obrigatório ao criar, mas pode ser removida depois).

### Edição

- Todos os campos podem ser editados a qualquer momento.
- Não há restrição de unicidade no texto da pergunta (duplicatas são permitidas).
- A categoria pode ser trocada mesmo que a pergunta já esteja incluída em um ou mais pomodoros.

### Exclusão

- Perguntas podem ser excluídas a qualquer momento.
- Ao excluir uma pergunta, ela é automaticamente removida de todos os pomodoros que a referenciam.

---

## 4. Pomodoros (Sessões de Estudo)

### Estrutura

- Cada pomodoro possui: nome, slug único, categoria de contexto, lista de perguntas selecionadas e duração (em minutos).

### Criação

- O **nome** é obrigatório e não pode ser vazio.
- A aplicação gera automaticamente um **slug** a partir do nome (mesma lógica das categorias).
- O **slug** deve ser único entre todos os pomodoros.
- Pelo menos **1 pergunta** deve ser selecionada para que o pomodoro possa ser salvo.
- A **duração padrão** é de 25 minutos.
- A duração mínima é de **1 minuto**.

### Seleção de Perguntas

- As perguntas são selecionadas por categoria: ao escolher uma categoria, são exibidas as perguntas disponíveis.
- É possível selecionar perguntas individualmente ou todas de uma vez.
- Ao trocar a categoria dentro do formulário de criação/edição, a seleção de perguntas é **reiniciada**.
- A busca/filtro de perguntas por texto é disponível dentro do formulário.

### Edição

- Nome, perguntas, categoria e duração podem ser alterados a qualquer momento.
- A unicidade do slug é revalidada ao salvar.
- Não é possível salvar um pomodoro sem perguntas.

### Exclusão

- Pomodoros podem ser excluídos a qualquer momento, mesmo com o timer em execução.
- A exclusão **não remove** as perguntas associadas.
- Se o pomodoro excluído era o ativo, o sistema seleciona automaticamente outro pomodoro disponível.

### Navegação entre Pomodoros

- O usuário pode navegar entre pomodoros (anterior/próximo).
- Se o timer estiver em execução, trocar de pomodoro exige **confirmação explícita**.
- Ao confirmar a troca durante execução, o timer é reiniciado e a sessão atual é perdida.

---

## 5. Timer

### Estados do Timer

O timer pode estar em um dos três estados:

| Estado | Descrição |
|---|---|
| `idle` | Timer parado e pronto para iniciar uma nova sessão. |
| `focusing` | Timer em contagem regressiva durante a sessão de estudo. |
| `quiz_pending` | Sessão encerrada; perguntas de revisão disponíveis para o usuário responder. |

### Transições de Estado

```
idle → focusing         (usuário inicia o timer manualmente)
focusing → quiz_pending (timer chega ao fim naturalmente)
focusing → quiz_pending (usuário encerra a sessão manualmente)
quiz_pending → idle     (todas as perguntas respondidas)
focusing → idle         (usuário reinicia o timer)
```

### Iniciar

- O timer só pode ser iniciado no estado `idle`.
- Só é possível iniciar se houver pelo menos uma pergunta **não respondida** no pomodoro ativo.
- A ação é bloqueada se o pomodoro estiver **concluído** (todas as perguntas respondidas).

### Pausar

- Disponível apenas durante o estado `focusing`.
- Ao pausar, o tempo restante é preservado para retomada posterior.

### Retomar

- Disponível apenas no estado `focusing` com o timer pausado.
- Retoma a contagem a partir do tempo restante salvo no momento da pausa.

### Encerrar Manualmente (Pular)

- Disponível durante o estado `focusing`.
- Ao encerrar manualmente, o timer transita imediatamente para `quiz_pending`, sem aguardar o tempo acabar.

### Reiniciar

- Disponível quando o timer foi iniciado (estados `focusing` ou após pausa).
- Retorna o timer ao estado `idle`, descartando a sessão em andamento.
- O progresso de respostas desta sessão não é salvo.

### Conclusão Automática

- Quando o timer chega a zero, ele transita automaticamente para `quiz_pending`.
- Uma notificação é disparada ao usuário.

---

## 6. Ciclo de Quiz

O quiz é exibido quando o timer entra no estado `quiz_pending`.

### Seleção das Perguntas do Round

- A cada round, são selecionadas as perguntas do pomodoro ativo que **ainda não foram respondidas**.
- O limite por round é de **5 perguntas**.
- O conjunto de perguntas de um round é fixado no início do round e não muda durante a sua execução.

### Responder uma Pergunta

- O usuário tem **60 segundos** para responder cada pergunta.
- O usuário seleciona uma das 4 alternativas. A seleção pode ser trocada antes de confirmar.
- Após selecionar, o usuário deve **confirmar a resposta** para avançar.
- Após confirmar, a resposta **não pode mais ser alterada**.
- O feedback visual é exibido imediatamente: a alternativa correta é destacada em verde; a alternativa errada selecionada, em vermelho.

### Timeout por Pergunta

- Se o tempo de 60 segundos esgotar **sem confirmação**, a pergunta é avançada automaticamente sem ser registrada como respondida.
- Se o tempo esgotar **após a confirmação**, a pergunta é avançada automaticamente para a próxima.

### Avanço entre Perguntas

- Após confirmar a resposta (ou após timeout), o usuário pode avançar para a próxima pergunta.
- O timer de 60 segundos é reiniciado a cada nova pergunta.

### Fim do Round

- O round termina quando todas as perguntas do round foram respondidas ou expiraram.
- Ao fim do round, um novo timer de 25 minutos é iniciado automaticamente.
- Um novo round de quiz será gerado ao fim deste novo timer, com as perguntas ainda não respondidas.

### Ciclos Repetidos

- Os ciclos (timer → quiz → timer → quiz) se repetem até que **todas** as perguntas do pomodoro sejam respondidas corretamente.
- Perguntas que expiraram (timeout) **não são marcadas como respondidas** e reaparecem nos rounds seguintes.

---

## 7. Integração Timer + Quiz

### Quando o Quiz Aparece

- O quiz é exibido **somente** quando o timer entra em `quiz_pending`:
  - Ao fim natural do timer.
  - Ao encerrar manualmente a sessão.

### Bloqueios Durante o Quiz

- Durante o quiz (`quiz_pending`), **toda a navegação da aplicação fica bloqueada**.
- O usuário só pode interagir com as telas de gestão (categorias, perguntas, pomodoros) **fora do estado `quiz_pending`**.

### Edição Durante Sessão

- Categorias, perguntas e pomodoros **podem ser editados** enquanto o timer está em `focusing`.
- Alterações nas perguntas de um pomodoro (adicionar, remover) têm efeito no **próximo round**, não no round atual.

---

## 8. Progresso e Conclusão

### Rastreamento de Respostas

- As perguntas respondidas corretamente são registradas por pomodoro.
- O progresso persiste entre sessões (não é resetado ao fechar a aplicação).

### Definição de Conclusão

Um pomodoro é considerado **concluído** quando todas as perguntas associadas a ele foram respondidas corretamente pelo menos uma vez.

### Ao Concluir

- A aplicação exibe uma mensagem de conclusão.
- O timer fica bloqueado para iniciar enquanto o pomodoro estiver concluído.

### Reiniciar Ciclo

- O usuário pode reiniciar o ciclo manualmente a qualquer momento.
- Ao reiniciar, o histórico de respostas do pomodoro é apagado e o ciclo começa do zero.

---

## 9. Notificações

### Quando São Disparadas

- Uma notificação é enviada quando o timer chega ao fim naturalmente (transição de `focusing` → `quiz_pending`).
- Notificações **não são disparadas** quando o encerramento é manual.

### Conteúdo

- A notificação informa que a sessão foi encerrada e que há perguntas de revisão disponíveis.

### Comportamento ao Interagir

- Ao interagir com a notificação, a aplicação é aberta/trazida para o primeiro plano.

---

## 10. Validações Gerais

### Slugs

- Gerados automaticamente a partir do nome da entidade.
- Regras: somente letras minúsculas, números e hífens; sem acentos; sem espaços.
- Devem ser únicos dentro do mesmo tipo de entidade (categorias e pomodoros têm espaços de slug separados).

### Tabela de Validações por Entidade

| Entidade | Campo | Regra |
|---|---|---|
| Categoria | nome | Obrigatório, não vazio |
| Categoria | slug | Único entre categorias |
| Categoria | emoji | Deve ser da lista de emojis permitidos |
| Categoria | cor | Deve ser da paleta de cores predefinidas |
| Pergunta | texto | Obrigatório, não vazio |
| Pergunta | alternativas | Exatamente 4, todas não vazias |
| Pergunta | resposta correta | Uma das 4 alternativas (A, B, C ou D) |
| Pergunta | dificuldade | `fácil`, `médio` ou `difícil` (padrão: `médio`) |
| Pomodoro | nome | Obrigatório, não vazio |
| Pomodoro | slug | Único entre pomodoros |
| Pomodoro | perguntas | Mínimo 1 pergunta |
| Pomodoro | duração | Inteiro positivo, mínimo 1 minuto |
| Timer | fase | `idle`, `focusing` ou `quiz_pending` |
