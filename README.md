# Learn in Pomodoro

Extensão de browser: sessão de foco com temporizador e revisão rápida (flashcard / múltipla escolha) após cada sessão.

## Funcionalidades

- **Timer Pomodoro** — sessões configuráveis com contagem regressiva no service worker; notificação ao fim.
- **Quiz pós-sessão** — até 5 perguntas por rodada, 60s cada, opções embaralhadas. Respostas erradas voltam nas rodadas seguintes; só respostas corretas marcam progresso.
- **CRUD completo** — categorias (nome, cor, emoji), perguntas (múltipla escolha A/B/C/D, dificuldade) e pomodoros (nome, duração, seleção de perguntas).
- **Slugs únicos** — categorias e pomodoros têm slug (kebab-case) gerado do nome, editável manualmente, validado contra duplicatas.
- **Importação via JSON** — importe perguntas em lote com pré-visualização antes de confirmar; categorias e pomodoros inexistentes são criados automaticamente pelo slug.

## Importar Perguntas

Na tela **Importar** (menu inferior), faça upload de um arquivo `.json` com o seguinte formato:

```json
[
  {
    "categorySlug": "javascript",
    "categoryName": "JavaScript",
    "pomodoroSlug": "js-basico",
    "pomodoroName": "JS Básico",
    "pomodoroDuration": 25,
    "question": "O que é closure?",
    "options": [
      { "option": "A", "answer": "Acesso ao escopo externo" },
      { "option": "B", "answer": "Não retorna valor" },
      { "option": "C", "answer": "Um tipo de loop" },
      { "option": "D", "answer": "Um objeto global" }
    ],
    "correctAnswer": "A",
    "difficulty": "medium"
  }
]
```

- Todos os campos são obrigatórios. Limite: **2 MB**.
- `categorySlug` e `pomodoroSlug` referenciam itens existentes ou criam novos automaticamente.
- Perguntas com enunciado idêntico a uma já cadastrada aparecem com aviso na pré-visualização.
- Use `{ "option": "A", "answer": "..." }` nas opções — evita que IAs coloquem o texto da resposta em `correctAnswer`.

---

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Build com watch (regenera dist/ a cada save)
npm run dev

# Build único para produção
npm run build
```

## Como testar localmente

### Chrome / Chromium (Edge, Brave, Arc…)

1. Corre `npm run dev` — a pasta `dist/` é gerada e atualizada automaticamente
2. Abre `chrome://extensions` (ou `edge://extensions`, etc.)
3. Ativa **"Modo de programador"** (canto superior direito)
4. Clica **"Carregar sem empacotar"** → seleciona a pasta **`dist/`**
5. A extensão aparece na toolbar — clica o ícone para abrir o **Side Panel**

**Recarregar após mudanças:**
- Mudanças no side panel (React/CSS): clica o ícone de **reload ↺** na card da extensão em `chrome://extensions`
- Mudanças no `manifest.json` ou no service worker: remove a extensão e carrega-a novamente

**Inspecionar o service worker:**
- Em `chrome://extensions`, na card da extensão → clica **"Service worker"** → abre o DevTools dedicado (logs, alarms, storage)

**Ver o storage:**
- No DevTools do service worker → aba **Application** → **Storage** → **chrome.storage.local**

---

### Firefox

1. Corre `npm run build`
2. Abre `about:debugging#/runtime/this-firefox`
3. Clica **"Carregar add-on temporário"** → seleciona o ficheiro `dist/manifest.json`
4. A extensão fica ativa até fechar o Firefox (não persiste entre sessões)

> **Nota:** Firefox não suporta `chrome.sidePanel`. O suporte a Firefox fica para depois do MVP.

---

### Estrutura do build (`dist/`)

```
dist/
├── manifest.json        ← copiado da raiz
├── sidepanel.html       ← entrada do side panel
├── background.js        ← service worker
├── icons/               ← ícones da extensão
└── assets/              ← bundles JS/CSS do React
```
