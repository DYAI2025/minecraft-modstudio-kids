# Architektur-Analyse: KidMod Studio
**Minecraft Modding Desktop App für Kinder mit AI & Voice Control**

Stand: Januar 2025
Status: Phase 2 Complete - Architektur-Review

---

## Executive Summary

**KidMod Studio** ist eine TypeScript-basierte Electron Desktop-Anwendung, die Kindern ermöglicht, Minecraft Mods zu erstellen. Die App kombiniert:
- **Visuelles Modding Interface** (React + Three.js)
- **Voice Control & TTS** (Web Speech API)
- **AI Companion** (Creeper-Charakter)
- **Minecraft Mod Export** (Fabric 1.21+)

### Technologie-Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS, Three.js
- **Backend:** Electron 28, Node.js
- **Build:** Vite 7, pnpm Monorepo
- **Modding:** Fabric Gradle, Java Code Generation

---

## 1. IST-ZUSTAND ANALYSE

### 1.1 Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON APP                              │
│  ┌──────────────────┐         ┌──────────────────────────┐  │
│  │  MAIN PROCESS    │   IPC   │   RENDERER PROCESS       │  │
│  │  (Node.js)       │◄───────►│   (React SPA)            │  │
│  │                  │         │                          │  │
│  │ • Build Service  │         │ • ProjectContext         │  │
│  │ • Help Service   │         │ • UI Components          │  │
│  │ • File I/O       │         │ • Voice Control          │  │
│  │ • Gradle Exec    │         │ • CreeperChat AI         │  │
│  └──────────────────┘         │ • 3D Preview (Three.js)  │  │
│           │                   └──────────────────────────┘  │
│           ▼                              │                  │
│  ┌──────────────────┐                   │                  │
│  │ PRELOAD BRIDGE   │                   │                  │
│  │ (window.KidMod)  │◄──────────────────┘                  │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│  CORE PACKAGES   │  │  MINECRAFT       │
│                  │  │                  │
│ • core-model     │  │ • Fabric Gradle  │
│ • exporter       │  │ • JAR Build      │
│ • testbot        │  │ • Server Test    │
└──────────────────┘  └──────────────────┘
```

### 1.2 Monorepo-Struktur

```
minecraft-modstudio-kids/
├── apps/
│   └── studio-electron/          # Hauptanwendung
│       ├── src/
│       │   ├── main/              # Electron Main Process
│       │   │   ├── index.ts       # App Lifecycle
│       │   │   ├── ipc.ts         # IPC Channels
│       │   │   ├── buildService.ts # Build Pipeline
│       │   │   └── helpService.ts  # Hilfe-System
│       │   │
│       │   ├── preload/           # IPC Bridge
│       │   │   └── bridge.ts      # window.KidMod API
│       │   │
│       │   └── renderer/          # React App
│       │       ├── App.tsx        # Main Layout
│       │       ├── state/         # State Management
│       │       │   ├── ProjectContext.tsx  # Global State
│       │       │   └── persistence.ts      # File I/O
│       │       ├── ui/            # UI Components
│       │       │   ├── CreeperChat.tsx     # AI Chat
│       │       │   ├── VoiceControl.tsx    # Voice Input
│       │       │   ├── Preview3D.tsx       # Three.js
│       │       │   ├── Library.tsx         # Item List
│       │       │   ├── EditorPanel.tsx     # Properties
│       │       │   └── BuildDialog.tsx     # Build UI
│       │       └── ai/            # AI Logic
│       │           └── commander.ts        # Command Parser
│       │
│       └── resources/
│           └── help/              # Markdown Help Docs
│
├── packages/
│   ├── core-model/               # Shared Data Model
│   │   ├── schema.ts             # Zod Schemas (Block, Item, Recipe)
│   │   ├── actions.ts            # Redux-style Actions
│   │   └── reducer.ts            # State Reducer + History
│   │
│   ├── exporter/                 # Minecraft Mod Generator
│   │   ├── index.ts              # Export Pipeline
│   │   ├── java.ts               # Java Code Generation
│   │   ├── json.ts               # JSON Configs (blockstates, models)
│   │   └── assets.ts             # Texture Handling
│   │
│   └── testbot/                  # Mod Testing
│       ├── index.ts              # Test Runner
│       └── analyzer.ts           # Log Parser
│
└── package.json                  # pnpm Workspace Root
```

**Bewertung:**
✅ **Sehr gut:** Klare Trennung zwischen App-Code und wiederverwendbaren Packages
✅ **Sehr gut:** Monorepo erlaubt schnelle Iteration ohne separate Versionierung
⚠️ **Mittel:** Nur eine App im `apps/` Ordner (Struktur für Skalierung vorbereitet)

---

## 2. KOMPONENTEN-ANALYSE

### 2.1 State Management

**Architektur:** Redux-Pattern mit React useReducer + Context API

```typescript
// Zentrale State-Struktur
AppState {
  project: Project {           // Hauptdaten
    meta: ProjectMeta
    blocks: { [id]: Block }
    items: { [id]: Item }
    recipes: { [id]: Recipe }
  }
  history: {                   // Undo/Redo Stack
    past: Project[]            // max 10 Einträge
    future: Project[]
  }
  lastAction: KidAction | null
}

// UI State (getrennt!)
UIState {
  activeId: string | null
  activeType: 'block' | 'item' | 'recipe'
  voiceState: 'idle' | 'listening' | 'processing'
  transcript: string | null
}
```

**Actions:**
- `CREATE_BLOCK/ITEM/RECIPE`
- `UPDATE_BLOCK/ITEM/RECIPE`
- `DELETE_BLOCK/ITEM/RECIPE`
- `UPDATE_META`
- `UNDO/REDO`
- `LOAD_PROJECT`

**Bewertung:**
✅ **Sehr gut:** Immutable State Updates
✅ **Sehr gut:** Trennung von Daten- und UI-State
✅ **Sehr gut:** History-Management mit Limit (verhindert Memory Leaks)
⚠️ **Mittel:** Keine Middleware für async Actions (derzeit nicht nötig)
⚠️ **Mittel:** Keine Persistenz-Layer für Auto-Save (manuelles Speichern)

### 2.2 Voice & AI Integration

**Komponenten:**

1. **VoiceControl.tsx** (Push-to-Talk)
   - Web Speech Recognition API
   - Spacebar-Aktivierung
   - Aktuell: Mock-Implementierung (Random Phrases)
   - Sprache: Deutsch (`de-DE`)

2. **CreeperChat.tsx** (AI Companion)
   - **TTS:** `window.speechSynthesis` (Browser native)
   - **STT:** `webkitSpeechRecognition` (Chrome/Edge)
   - **NLU:** Lokaler Regex-Parser (commander.ts)
   - **Action Dispatch:** Direkt an ProjectContext

**AI Commander Logic:**
```typescript
// packages/exporter/src/ai/commander.ts
processUserCommand(text: string): CommandResult {
  // Pattern Matching:
  // "Erstelle einen Block namens Diamant" → CREATE_BLOCK
  // "Erstelle ein Schwert namens Excalibur" → CREATE_ITEM
  // "Hilfe" → Hilfe-Suche

  return { message: string, action?: KidAction }
}
```

**Bewertung:**
✅ **Gut:** Browser-native APIs (keine Dependencies)
✅ **Gut:** Direkte Integration mit State Management
⚠️ **Schwach:** Regex-basiertes NLU (sehr limitiert)
⚠️ **Schwach:** Kein echtes LLM integriert (trotz Onboarding-UI)
⚠️ **Schwach:** Mock Voice Control (nicht produktiv nutzbar)

### 2.3 Minecraft Mod Export Pipeline

**Workflow:**
```
1. EXPORT (10%)
   Project Data → Gradle Scaffold + Generated Files

2. BUILD (30-70%)
   Gradle compileJava → JAR File

3. TEST (70-90%)
   Minecraft Server Start → Log Analysis

4. COMPLETE (100%)
   Success/Error Report
```

**Generatoren:**

| Generator | Output | Qualität |
|-----------|--------|----------|
| `java.ts` | `ModRegistry.java` | ✅ Vollständig |
| `json.ts` | Blockstates, Models, Lang | ✅ Vollständig |
| `assets.ts` | Texture Data URIs | ⚠️ Prozedural (kein Import) |

**Bewertung:**
✅ **Sehr gut:** Vollständige Mod-Generation ohne manuelle Schritte
✅ **Sehr gut:** Progress Streaming über IPC
✅ **Gut:** Template-basierter Ansatz (Scaffold)
⚠️ **Mittel:** Keine Fehlerbehandlung für Build-Fehler (nur Logging)
⚠️ **Mittel:** TestBot noch nicht voll implementiert

### 2.4 3D Preview (Three.js)

**Implementation:**
- **Blöcke:** BoxGeometry mit prozeduralen Texturen
- **Items:** PlaneGeometry (2D Sprite)
- **Texturen:** Canvas-generiert (rock, wood, gem)
- **Controls:** OrbitControls + Auto-Rotation
- **Luminanz:** Emissive Materials

**Bewertung:**
✅ **Gut:** Echtzeitvorschau ohne externe Assets
✅ **Gut:** Lightweight (prozedural)
⚠️ **Mittel:** Keine Textur-Import-Funktion
⚠️ **Mittel:** Begrenzte Material-Typen (3 Prozeduren)

---

## 3. MODULARITÄTS-BEWERTUNG

### 3.1 Package-Struktur
**Score: 8/10** ⭐⭐⭐⭐⭐⭐⭐⭐

**Stärken:**
- ✅ Klare Verantwortlichkeiten pro Package
- ✅ `core-model` ist framework-agnostisch (reine TS Logic)
- ✅ `exporter` und `testbot` sind testbar isoliert
- ✅ Workspace-Links über `workspace:^` Protocol

**Schwächen:**
- ⚠️ Keine expliziten Package-Boundaries (tsconfig paths)
- ⚠️ `docs-mcp` Package existiert, aber nicht aktiv genutzt

### 3.2 Komponenten-Architektur
**Score: 6/10** ⭐⭐⭐⭐⭐⭐

**Stärken:**
- ✅ React Components sind klein (<200 Zeilen meist)
- ✅ Custom Hooks für Wiederverwendung (`useProject`)
- ✅ Provider-Pattern für Dependency Injection

**Schwächen:**
- ⚠️ CreeperChat.tsx macht zu viel (Chat UI + TTS/STT + Command Processing)
- ⚠️ Keine Komponenten-Library (jede Datei importiert Tailwind direkt)
- ⚠️ Duplizierung von UI-Patterns (Buttons, Inputs)

### 3.3 IPC-Architektur
**Score: 9/10** ⭐⭐⭐⭐⭐⭐⭐⭐⭐

**Stärken:**
- ✅ Context Isolation aktiviert (Security)
- ✅ Typed Bridge Interface (`bridge.d.ts`)
- ✅ Klare API-Trennung (File I/O vs. Build vs. Help)

**Schwächen:**
- ⚠️ Preload Sandbox deaktiviert (Kommentar: "temporary")

### 3.4 Datenfluss
**Score: 7/10** ⭐⭐⭐⭐⭐⭐⭐

```
User Input
  ↓
UI Component (onClick, Voice, Chat)
  ↓
dispatch(KidAction)
  ↓
rootReducer (Immutable Update)
  ↓
ProjectContext Re-Render
  ↓
UI Update (Library, Editor, Preview)
```

**Stärken:**
- ✅ Unidirektionaler Datenfluss (Redux-Pattern)
- ✅ Single Source of Truth (ProjectContext)

**Schwächen:**
- ⚠️ Keine Optimierung (React.memo, useMemo)
- ⚠️ Gesamter State wird bei jeder Action neu gerendert

### 3.5 Testbarkeit
**Score: 4/10** ⭐⭐⭐⭐

**Stärken:**
- ✅ Vitest Setup vorhanden
- ✅ Reducer ist pure Function (einfach testbar)

**Schwächen:**
- ❌ Keine Tests im Repository gefunden
- ❌ UI-Komponenten stark gekoppelt (schwer zu mocken)
- ❌ IPC-Calls nicht abstrahiert (keine Testability Layer)

---

## 4. STÄRKEN & SCHWÄCHEN

### 4.1 Architektur-Stärken

✅ **Klare Trennung Main/Renderer Process**
   - Security durch Context Isolation
   - Klare API über Preload Bridge

✅ **Monorepo mit Package-Struktur**
   - Schnelle Iteration
   - Wiederverwendbare Module

✅ **Immutable State Management**
   - Vorhersagbarer Datenfluss
   - Undo/Redo "gratis"

✅ **Code Generation Pipeline**
   - Vollautomatische Mod-Erstellung
   - Template-basiert (wartbar)

✅ **TypeScript Throughout**
   - Type Safety auf allen Ebenen
   - Gute IDE-Unterstützung

✅ **Browser-native APIs**
   - Keine Heavy Dependencies für Voice/TTS
   - Cross-Platform (Chrome/Edge)

### 4.2 Architektur-Schwächen

❌ **Fehlende echte AI-Integration**
   - Onboarding-UI existiert, aber kein LLM Backend
   - Regex-basiertes NLU ist nicht skalierbar

❌ **Mock Voice Control**
   - Aktuell nur Random-Phrase-Generator
   - Keine echte Sprachsteuerung

❌ **Monolithische UI-Komponenten**
   - CreeperChat macht zu viel auf einmal
   - Keine Komponenten-Library für Wiederverwendung

❌ **Keine Persistenz-Strategie**
   - Nur manuelles Speichern
   - Kein Auto-Save, kein Crash Recovery

❌ **Fehlende Tests**
   - Vitest konfiguriert, aber keine Tests
   - Hohe Regressions-Gefahr

❌ **Keine Error Boundaries**
   - React Error Boundaries fehlen
   - Ein Fehler kann ganze App crashen

❌ **Performance nicht optimiert**
   - Keine Memoization
   - Kompletter Re-Render bei jeder Action

---

## 5. ARCHITEKTUR-VORSCHLÄGE

### 🏗️ VORSCHLAG 1: CLEAN ARCHITECTURE MIT FEATURE SLICES

**Ziel:** Modulare, wartbare, testbare Architektur für nachhaltige Entwicklung

#### Neue Struktur:

```
apps/studio-electron/src/
├── main/                          # Electron Main (wie bisher)
├── preload/                       # IPC Bridge (wie bisher)
│
└── renderer/
    ├── app/                       # App Root
    │   ├── App.tsx
    │   └── providers/             # Global Providers
    │       ├── ProjectProvider.tsx
    │       └── ToastProvider.tsx
    │
    ├── features/                  # Feature Slices
    │   ├── voice/                 # Voice Control Feature
    │   │   ├── components/
    │   │   │   ├── VoiceButton.tsx
    │   │   │   └── VoiceIndicator.tsx
    │   │   ├── hooks/
    │   │   │   └── useVoiceRecognition.ts
    │   │   ├── services/
    │   │   │   ├── SpeechRecognitionService.ts
    │   │   │   └── TextToSpeechService.ts
    │   │   └── types.ts
    │   │
    │   ├── ai-companion/          # Creeper Chat Feature
    │   │   ├── components/
    │   │   │   ├── CreeperChat.tsx
    │   │   │   ├── CreeperAvatar.tsx
    │   │   │   └── MessageList.tsx
    │   │   ├── hooks/
    │   │   │   └── useChatMessages.ts
    │   │   ├── services/
    │   │   │   ├── CommandParser.ts
    │   │   │   ├── LLMService.ts (NEU!)
    │   │   │   └── HelpSearchService.ts
    │   │   └── types.ts
    │   │
    │   ├── mod-editor/            # Haupteditor
    │   │   ├── components/
    │   │   │   ├── Library.tsx
    │   │   │   ├── EditorPanel.tsx
    │   │   │   └── PropertyEditor.tsx
    │   │   ├── hooks/
    │   │   │   ├── useSelection.ts
    │   │   │   └── useProjectActions.ts
    │   │   └── types.ts
    │   │
    │   ├── preview-3d/            # 3D Vorschau
    │   │   ├── components/
    │   │   │   └── Preview3D.tsx
    │   │   ├── services/
    │   │   │   ├── TextureGenerator.ts
    │   │   │   └── SceneManager.ts
    │   │   └── types.ts
    │   │
    │   └── build/                 # Build Pipeline
    │       ├── components/
    │       │   └── BuildDialog.tsx
    │       ├── hooks/
    │       │   └── useBuildPipeline.ts
    │       └── types.ts
    │
    ├── shared/                    # Shared Code
    │   ├── ui/                    # UI Component Library
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Dialog.tsx
    │   │   └── Toast.tsx
    │   ├── hooks/                 # Generic Hooks
    │   │   ├── useLocalStorage.ts
    │   │   └── useDebounce.ts
    │   └── utils/                 # Utility Functions
    │       ├── validation.ts
    │       └── formatting.ts
    │
    └── core/                      # Business Logic
        ├── state/                 # State Management
        │   ├── store.ts           # Redux/Zustand Store
        │   └── slices/            # State Slices
        │       ├── projectSlice.ts
        │       ├── uiSlice.ts
        │       └── historySlice.ts
        │
        └── services/              # Core Services
            ├── ProjectService.ts  # CRUD Operations
            ├── PersistenceService.ts # Auto-Save
            └── ValidationService.ts
```

#### Vorteile:

✅ **Feature-basierte Organisation**
   - Alle Dateien zu einem Feature sind zusammen
   - Einfaches Hinzufügen/Entfernen von Features
   - Team kann parallel an Features arbeiten

✅ **Klare Abhängigkeitsrichtung**
   ```
   Features → Shared → Core
   (Features dürfen nicht untereinander importieren)
   ```

✅ **Testbarkeit**
   - Services sind isoliert testbar
   - Hooks können mit React Testing Library getestet werden
   - Klare Mocking-Punkte (Service-Interfaces)

✅ **Wiederverwendbare UI-Komponenten**
   - Shared UI Library verhindert Duplizierung
   - Konsistentes Design
   - Storybook-ready

#### Migration Strategy:

1. **Phase 1:** Shared UI Library aufbauen (Button, Input, Dialog)
2. **Phase 2:** Services extrahieren (Voice, AI, Build)
3. **Phase 3:** Features in Slices organisieren
4. **Phase 4:** Tests für Services schreiben

---

### 🧠 VORSCHLAG 2: LLM-BACKEND MIT LOKALEM + CLOUD-HYBRID

**Ziel:** Echte AI-Integration für intelligente Sprach-Befehle und Code-Generierung

#### Architektur:

```
┌─────────────────────────────────────────────────────────┐
│                   RENDERER PROCESS                       │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  AI Service Layer (Abstraction)                │    │
│  │                                                 │    │
│  │  interface AIProvider {                        │    │
│  │    suggest(prompt, context): Promise<Suggestion>│   │
│  │    parseCommand(text): Promise<Command>        │    │
│  │  }                                              │    │
│  └────────────────────────────────────────────────┘    │
│           │                    │                        │
│           ▼                    ▼                        │
│  ┌────────────────┐   ┌────────────────────────┐      │
│  │ LOCAL PROVIDER │   │  CLOUD PROVIDER        │      │
│  │                │   │                        │      │
│  │ • ONNX Runtime │   │ • Anthropic Claude API │      │
│  │ • Phi-3.5 Mini │   │ • OpenAI API (fallback)│      │
│  │ • Offline      │   │ • Internet Required    │      │
│  └────────────────┘   └────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  MAIN PROCESS      │
         │                    │
         │ • Model Download   │
         │ • Model Cache      │
         │ • API Key Vault    │
         └────────────────────┘
```

#### Implementation:

**1. AI Service Interface:**
```typescript
// renderer/core/services/AIService.ts
interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;

  // Natural Language Understanding
  parseCommand(text: string, context: ProjectContext): Promise<{
    intent: 'create' | 'update' | 'delete' | 'help' | 'navigate';
    entities: Record<string, string>;
    confidence: number;
    action?: KidAction;
  }>;

  // Code Suggestions
  suggestModCode(prompt: string, context: ProjectContext): Promise<{
    code: string;
    explanation: string;
  }>;

  // Conversational AI
  chat(message: string, history: Message[]): Promise<string>;
}

class AIService {
  private provider: AIProvider;

  constructor() {
    // Wähle Provider basierend auf Onboarding-Settings
    const mode = getStoredAIMode(); // 'local' | 'cloud'

    this.provider = mode === 'local'
      ? new LocalLLMProvider()
      : new CloudLLMProvider();
  }

  async processVoiceCommand(transcript: string): Promise<CommandResult> {
    const parsed = await this.provider.parseCommand(transcript, getProjectContext());
    return {
      message: generateReply(parsed),
      action: parsed.action,
      confidence: parsed.confidence
    };
  }
}
```

**2. Local LLM Provider (Phi-3.5 Mini via ONNX):**
```typescript
// renderer/features/ai-companion/services/LocalLLMProvider.ts
import * as ort from 'onnxruntime-web';

class LocalLLMProvider implements AIProvider {
  private session: ort.InferenceSession | null = null;

  async isAvailable(): Promise<boolean> {
    // Check if model is downloaded in userData
    const modelPath = await window.KidMod.getModelPath('phi-3.5-mini');
    return modelPath !== null;
  }

  async parseCommand(text: string, context: ProjectContext) {
    // Prompt Engineering für Command Parsing
    const prompt = `
      Du bist ein Minecraft Mod Assistant. Parse den Befehl:
      Befehl: "${text}"

      Kontext:
      - Projekt hat ${Object.keys(context.blocks).length} Blöcke
      - Projekt hat ${Object.keys(context.items).length} Items

      Antworte im JSON-Format:
      {
        "intent": "create" | "update" | "delete" | "help",
        "entityType": "block" | "item" | "recipe",
        "entityName": "...",
        "properties": {...}
      }
    `;

    const result = await this.runInference(prompt);
    return parseJSONResponse(result);
  }

  private async runInference(prompt: string): Promise<string> {
    // ONNX Runtime Inference
    if (!this.session) {
      const modelPath = await window.KidMod.getModelPath('phi-3.5-mini');
      this.session = await ort.InferenceSession.create(modelPath);
    }

    // Tokenize + Run + Decode
    const tokens = tokenize(prompt);
    const output = await this.session.run({ input_ids: tokens });
    return decode(output.logits);
  }
}
```

**3. Cloud LLM Provider (Anthropic Claude):**
```typescript
// renderer/features/ai-companion/services/CloudLLMProvider.ts
class CloudLLMProvider implements AIProvider {
  private apiKey: string;

  async parseCommand(text: string, context: ProjectContext) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022', // Schnell + günstig
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Parse Minecraft mod command: "${text}"\nContext: ${JSON.stringify(context)}\nReturn JSON with intent, entity, properties.`
        }]
      })
    });

    const data = await response.json();
    return JSON.parse(data.content[0].text);
  }
}
```

#### Vorteile:

✅ **Offline-Fähigkeit**
   - Lokales Modell läuft ohne Internet
   - Wichtig für Schulen/Kinder ohne ständige Verbindung

✅ **Datenschutz**
   - Keine Projekdaten verlassen das Gerät (Local Mode)
   - Eltern können Cloud Mode deaktivieren

✅ **Besseres NLU**
   - LLM versteht komplexe Befehle ("Erstelle mir ein rotes Schwert mit 10 Schaden")
   - Kann Kontext aus Projekt berücksichtigen

✅ **Skalierbar**
   - Neue Provider einfach hinzufügbar (z.B. Ollama, LM Studio)
   - Interface-basiert (Dependency Injection)

#### Technologie-Empfehlungen:

| Komponente | Technologie | Begründung |
|------------|-------------|------------|
| **Local Model** | Phi-3.5 Mini (3.8B) | Klein genug für Consumer-PCs, gutes NLU |
| **Runtime** | ONNX Runtime Web | Browser-kompatibel, gute Performance |
| **Cloud API** | Claude 3.5 Haiku | Schnell, günstig, gutes Deutsch |
| **Model Download** | HuggingFace Hub API | Große Model-Auswahl, gute CDN |
| **Storage** | Electron userData | Sichere lokale Model-Persistierung |

---

### ⚡ VORSCHLAG 3: PERFORMANCE & PERSISTENCE LAYER

**Ziel:** Schnelle, zuverlässige App mit Auto-Save und optimiertem Rendering

#### 3.1 State Management Optimierung

**Problem:** Kompletter Re-Render bei jeder Action

**Lösung:** Zustand mit Selectors + Memoization

```typescript
// Option A: Zustand (empfohlen für neue Architektur)
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ProjectStore {
  // State
  project: Project;
  history: History;
  ui: UIState;

  // Selectors (memoized)
  getBlock: (id: string) => Block | undefined;
  getBlockCount: () => number;

  // Actions
  createBlock: (block: Block) => void;
  updateBlock: (id: string, update: Partial<Block>) => void;
  deleteBlock: (id: string) => void;

  undo: () => void;
  redo: () => void;
}

const useProjectStore = create<ProjectStore>()(
  devtools((set, get) => ({
    project: INITIAL_PROJECT,
    history: { past: [], future: [] },
    ui: INITIAL_UI_STATE,

    // Memoized Selectors
    getBlock: (id) => get().project.blocks[id],
    getBlockCount: () => Object.keys(get().project.blocks).length,

    // Optimized Actions
    createBlock: (block) => set(state => {
      // Immer-basiertes Update (optional mit immer library)
      const newBlocks = { ...state.project.blocks, [block.id]: block };
      return {
        project: { ...state.project, blocks: newBlocks },
        history: {
          past: [...state.history.past, state.project].slice(-10),
          future: []
        }
      };
    })
  }))
);

// Usage in Components (nur Re-Render bei Änderung):
function Library() {
  const blockCount = useProjectStore(state => state.getBlockCount());
  const createBlock = useProjectStore(state => state.createBlock);

  // Re-renders nur wenn blockCount sich ändert!
}
```

**Vorteile:**
- ✅ Komponenten rendern nur bei tatsächlichen Änderungen
- ✅ DevTools Integration (Redux DevTools)
- ✅ Einfacheres API als Context + useReducer

#### 3.2 Auto-Save mit Persistence Layer

```typescript
// renderer/core/services/PersistenceService.ts
class PersistenceService {
  private saveQueue: Project[] = [];
  private isSaving = false;

  constructor(
    private workspaceDir: string,
    private debounceMs = 2000
  ) {
    // Auto-Save bei State-Änderungen
    useProjectStore.subscribe(
      (state) => state.project,
      (project) => this.queueSave(project)
    );

    // Backup bei Window Close
    window.addEventListener('beforeunload', () => this.flushQueue());
  }

  private async queueSave(project: Project) {
    this.saveQueue = [project]; // Nur letzten Stand speichern

    if (!this.isSaving) {
      setTimeout(() => this.processSaveQueue(), this.debounceMs);
    }
  }

  private async processSaveQueue() {
    if (this.saveQueue.length === 0) return;

    this.isSaving = true;
    const project = this.saveQueue.pop()!;

    try {
      // Speichere in primary location
      await window.KidMod.saveProject(this.workspaceDir, project);

      // Speichere Backup (rotierend)
      await this.saveBackup(project);

    } catch (error) {
      console.error('Auto-Save failed:', error);
      // Zeige Toast
      useToastStore.getState().addToast({
        type: 'error',
        message: 'Auto-Speichern fehlgeschlagen'
      });
    } finally {
      this.isSaving = false;
    }
  }

  private async saveBackup(project: Project) {
    const timestamp = Date.now();
    const backupPath = `${this.workspaceDir}/.backups/project-${timestamp}.json`;

    await window.KidMod.saveProject(backupPath, project);

    // Behalte nur letzte 5 Backups
    await this.cleanupOldBackups();
  }

  async recoverFromCrash(): Promise<Project | null> {
    // Lade neuestes Backup
    const backups = await window.KidMod.listBackups(this.workspaceDir);
    if (backups.length === 0) return null;

    const latest = backups.sort((a, b) => b.timestamp - a.timestamp)[0];
    return await window.KidMod.loadProject(latest.path);
  }
}
```

**Vorteile:**
- ✅ Keine Daten-Verluste bei Crashes
- ✅ Kein manuelles Speichern nötig
- ✅ Debounced (verhindert Disk-Thrashing)
- ✅ Backup-Rotation (Crash Recovery)

#### 3.3 React Performance Optimierung

```typescript
// Memoization für teure Komponenten
const Preview3D = React.memo(({ block }: { block: Block }) => {
  // Three.js Rendering
  const scene = useMemo(() => createScene(block), [block.id, block.texture]);

  return <Canvas>{scene}</Canvas>;
});

// Virtualized Lists für große Item-Listen
import { FixedSizeList } from 'react-window';

function Library({ items }: { items: Item[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={60}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ItemRow item={items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}

// Lazy Loading für Features
const CreeperChat = React.lazy(() => import('./features/ai-companion/CreeperChat'));
const BuildDialog = React.lazy(() => import('./features/build/BuildDialog'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {showChat && <CreeperChat />}
      {showBuild && <BuildDialog />}
    </Suspense>
  );
}
```

#### 3.4 IPC Performance

```typescript
// Batching von IPC Calls
class IPCBatcher {
  private queue: IPCCall[] = [];
  private timer: NodeJS.Timeout | null = null;

  queueCall(call: IPCCall) {
    this.queue.push(call);

    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 16); // 60 FPS
    }
  }

  private async flush() {
    const batch = this.queue;
    this.queue = [];
    this.timer = null;

    // Sende alle Calls in einem IPC Message
    await window.KidMod.batchExecute(batch);
  }
}

// Usage: Build Progress nicht bei jedem 1% update
const buildProgress = useRef(0);
const updateProgress = useCallback((progress: number) => {
  // Update nur alle 5%
  if (Math.abs(progress - buildProgress.current) >= 5) {
    buildProgress.current = progress;
    forceUpdate();
  }
}, []);
```

**Vorteile:**
- ✅ Smooth UI (keine Lags bei großen Projekten)
- ✅ Weniger IPC Overhead
- ✅ Schnelleres App-Start (Lazy Loading)

---

## 6. EMPFOHLENER ARCHITEKTUR-ROADMAP

### Phase 1: Foundation (Woche 1-2)
1. ✅ Shared UI Component Library aufbauen
2. ✅ Service Layer extrahieren (Voice, AI, Build)
3. ✅ Tests für Services schreiben (Vitest)
4. ✅ ESLint + Prettier Setup

### Phase 2: State Management (Woche 3-4)
1. ✅ Zustand Migration (oder Redux Toolkit)
2. ✅ Auto-Save implementieren
3. ✅ Backup & Recovery System
4. ✅ Performance Optimierung (Memoization)

### Phase 3: AI Integration (Woche 5-8)
1. ✅ AI Service Interface definieren
2. ✅ Cloud Provider (Claude API) implementieren
3. ✅ Local Provider (ONNX + Phi-3.5) implementieren
4. ✅ Onboarding-Workflow fertigstellen
5. ✅ Voice Control mit echtem LLM NLU

### Phase 4: Polish (Woche 9-10)
1. ✅ Error Boundaries
2. ✅ Loading States
3. ✅ Toast System verbessern
4. ✅ E2E Tests (Playwright)

### Phase 5: Documentation (Woche 11-12)
1. ✅ Architecture Decision Records (ADR)
2. ✅ Component Documentation (Storybook)
3. ✅ API Documentation
4. ✅ User Guide

---

## 7. TECHNOLOGIE-STACK EMPFEHLUNGEN

### Aktuell behalten:
- ✅ **Electron + React + TypeScript** (solide Basis)
- ✅ **Vite** (schnell, modern)
- ✅ **pnpm Monorepo** (effizient)
- ✅ **Three.js** (3D Vorschau)
- ✅ **Tailwind CSS** (schnelle Entwicklung)

### Hinzufügen (Priorität):

#### 🔴 Hoch
- **Zustand** oder **Redux Toolkit** (State Management)
- **React Error Boundary** (Fehlerbehandlung)
- **ONNX Runtime Web** (Lokale AI)
- **@anthropic-ai/sdk** (Cloud AI)

#### 🟡 Mittel
- **react-window** (Virtualized Lists)
- **Storybook** (Component Library)
- **Playwright** (E2E Tests)
- **immer** (Immutable Updates)

#### 🟢 Niedrig
- **Sentry** (Error Tracking)
- **electron-updater** (Auto-Updates)
- **i18next** (Internationalisierung)

### Entfernen/Ersetzen:
- ❌ **Mock Voice Control** → Echte Web Speech API Integration
- ❌ **Regex Commander** → LLM-basiertes NLU

---

## 8. ZUSAMMENFASSUNG

### Aktuelle Bewertung: 7/10 ⭐⭐⭐⭐⭐⭐⭐

**Stärken:**
- Solide technische Basis (Electron, React, TypeScript)
- Gute Package-Struktur (Monorepo)
- Funktionierende Mod-Export-Pipeline
- Klare IPC-Architektur

**Kritische Lücken:**
- Keine echte AI-Integration (trotz UI)
- Fehlende Tests
- Keine Auto-Save
- Performance nicht optimiert

### Empfohlene Architektur-Richtung:

**🏆 Hybrid-Ansatz:**
1. **Clean Architecture mit Feature Slices** (Vorschlag 1)
   - Für langfristige Wartbarkeit und Skalierung

2. **LLM-Hybrid-Backend** (Vorschlag 2)
   - Lokales Modell (Offline) + Cloud API (Online)
   - Echte Voice-AI-Steuerung

3. **Performance Layer** (Vorschlag 3)
   - Auto-Save mit Backups
   - Optimiertes State Management
   - React Performance Optimierungen

### Geschätzter Aufwand:
- **Full Implementation:** 10-12 Wochen (1 Entwickler)
- **MVP (nur AI + Auto-Save):** 4-6 Wochen
- **Maintenance:** ~20% Code Coverage mit Tests

### Resultat:
Eine **schlanke, moderne, nachhaltige** Desktop-App für Kinder, die:
- ✅ Offline funktioniert (Local AI)
- ✅ Keine Daten verliert (Auto-Save)
- ✅ Schnell läuft (Performance-optimiert)
- ✅ Testbar ist (80%+ Code Coverage)
- ✅ Wartbar bleibt (Clean Architecture)

---

**Erstellt:** Januar 2025
**Autor:** Claude (Architektur-Analyse)
**Version:** 1.0
