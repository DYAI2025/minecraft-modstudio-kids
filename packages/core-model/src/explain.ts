import { AppState } from './reducer'; // import direct to avoid cycle
import { KidAction } from './actions';

export function explainLastAction(state: AppState): string {
  if (!state.lastAction) {
    return "Ssss... Ich warte auf deine Befehle!";
  }

  return explainAction(state.lastAction);
}

export function explainAction(action: KidAction): string {
  switch (action.type) {
    case 'CREATE_BLOCK':
      return `Cool! Ein neuer Block namens "${action.payload.name}" wurde erschaffen.`;
    case 'UPDATE_BLOCK':
      return `Ich habe den Block "${action.payload.id}" für dich angepasst.`;
    case 'DELETE_BLOCK':
      return `Zack! Der Block "${action.payload}" ist weg.`;
      
    case 'CREATE_ITEM':
      return `Ein neues Item "${action.payload.name}"! Das wird sicher nützlich.`;
    case 'UPDATE_ITEM':
      return `Das Item "${action.payload.id}" sieht jetzt anders aus.`;
    case 'DELETE_ITEM':
      return `Ich habe das Item "${action.payload}" in Lava geworfen. Weg ist es!`;

    case 'CREATE_RECIPE':
      return `Lecker! Ein neues Rezept wurde hinzugefügt.`;
    
    case 'LOAD_PROJECT':
      return `Willkommen zurück bei "${action.payload.name}"!`;

    default:
      return "Ich beobachte dich...";
  }
}
