import { KidAction } from './actions';
import { Project } from './schema';

export interface AppState {
  project: Project;
  lastAction?: KidAction | null;
  history: {
    past: Project[];
    future: Project[];
  };
}

export const INITIAL_STATE: AppState = {
  project: {
    meta: { modId: 'untitled', name: 'Untitled Mod', version: '1.0.0' },
    blocks: {},
    items: {},
    recipes: {},
  },
  lastAction: null,
  history: {
    past: [],
    future: [],
  },
};

const HISTORY_LIMIT = 10;

function projectReducer(state: Project, action: KidAction): Project {
    // ... (unchanged actions)
    switch (action.type) {
        case 'UPDATE_META': return { ...state, meta: { ...state.meta, ...action.payload } };
        case 'CREATE_BLOCK': return { ...state, blocks: { ...state.blocks, [action.payload.id]: action.payload } };
        case 'UPDATE_BLOCK': return state.blocks[action.payload.id] ? { ...state, blocks: { ...state.blocks, [action.payload.id]: { ...state.blocks[action.payload.id], ...action.payload.update } } } : state;
        case 'DELETE_BLOCK': { const n={...state.blocks}; delete n[action.payload.id]; return {...state, blocks:n}; }
        case 'CREATE_ITEM': return { ...state, items: { ...state.items, [action.payload.id]: action.payload } };
        case 'UPDATE_ITEM': return state.items[action.payload.id] ? { ...state, items: { ...state.items, [action.payload.id]: { ...state.items[action.payload.id], ...action.payload.update } } } : state;
        case 'DELETE_ITEM': { const n={...state.items}; delete n[action.payload.id]; return {...state, items:n}; }
        case 'CREATE_RECIPE': return { ...state, recipes: { ...state.recipes, [action.payload.id]: action.payload } };
        case 'UPDATE_RECIPE': return state.recipes[action.payload.id] ? { ...state, recipes: { ...state.recipes, [action.payload.id]: { ...state.recipes[action.payload.id], ...action.payload.update } } } : state;
        case 'DELETE_RECIPE': { const n={...state.recipes}; delete n[action.payload.id]; return {...state, recipes:n}; }
        default: return state;
    }
}

export function rootReducer(state: AppState = INITIAL_STATE, action: KidAction): AppState {
  if (action.type === 'UNDO') {
    const { past, future } = state.history;
    if (past.length === 0) return state;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    return {
      project: previous,
      lastAction: { type: 'UNDO' } as any, // Pseudo action
      history: {
        past: newPast,
        future: [state.project, ...future],
      },
    };
  }

  if (action.type === 'REDO') {
    const { past, future } = state.history;
    if (future.length === 0) return state;

    const next = future[0];
    const newFuture = future.slice(1);

    return {
      project: next,
      lastAction: { type: 'REDO' } as any,
      history: {
        past: [...past, state.project],
        future: newFuture,
      },
    };
  }

  if (action.type === 'LOAD_PROJECT') {
    return {
        project: action.payload as any, 
        lastAction: action,
        history: { past: [], future: [] }
    };
  }

  const newProject = projectReducer(state.project, action);

  if (newProject === state.project) return state;

  const newPast = [...state.history.past, state.project];
  if (newPast.length > HISTORY_LIMIT) {
    newPast.shift();
  }

  return {
    project: newProject,
    lastAction: action,
    history: {
      past: newPast,
      future: [], 
    },
  };
}
