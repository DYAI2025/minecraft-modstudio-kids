import React from 'react';
import { useProject } from '../state/ProjectContext';
import { Box, Package, ScrollText, Plus } from 'lucide-react';
import './Library.css';

export function Library() {
  const { state, ui, setSelection, dispatch } = useProject();

  const handleCreate = (type: 'block' | 'item' | 'recipe') => {
    // Generate a temporary ID or prompt? For Flux, we dispatch CREATE.
    // MVP: Random ID and then user edits it.
    const id = `${type}_${Date.now()}`; // simple ID
    if (type === 'block') {
        dispatch({ type: 'CREATE_BLOCK', payload: { id, name: 'New Block', type: 'block', properties: {}, texture: { type: 'procedural', value: 'rock' } } as any });
    } else if (type === 'item') {
        dispatch({ type: 'CREATE_ITEM', payload: { id, name: 'New Item', type: 'item', itemType: 'gem', properties: {}, texture: { type: 'procedural', value: 'gem' } } as any });
    } else {
        dispatch({ type: 'CREATE_RECIPE', payload: { id, type: 'crafting_shaped', pattern: ['   ','   ','   '], key: {}, result: { item: 'minecraft:air' } } as any });
    }
    setSelection(type, id);
  };

  return (
    <div className="library-container">
       <section>
         <div className="section-header">
           <span className="section-title"><Box size={16} /> Blocks</span>
           <button className="icon-btn" onClick={() => handleCreate('block')} title="Add Block"><Plus size={16}/></button>
         </div>
         <ul className="item-list">
           {Object.values(state.project.blocks).length === 0 && <li className="empty-list-item">No blocks yet</li>}
           {Object.values(state.project.blocks).map(b => (
             <li key={b.id} 
                 className={ui.activeId === b.id ? 'active' : ''}
                 onClick={() => setSelection('block', b.id)}>
               {b.name} <span className="id-sub">{b.id}</span>
             </li>
           ))}
         </ul>
       </section>

       <section>
         <div className="section-header">
           <span className="section-title"><Package size={16} /> Items</span>
           <button className="icon-btn" onClick={() => handleCreate('item')} title="Add Item"><Plus size={16}/></button>
         </div>
         <ul className="item-list">
           {Object.values(state.project.items).length === 0 && <li className="empty-list-item">No items yet</li>}
           {Object.values(state.project.items).map(i => (
             <li key={i.id} 
                 className={ui.activeId === i.id ? 'active' : ''}
                 onClick={() => setSelection('item', i.id)}>
               {i.name} <span className="id-sub">{i.id}</span>
             </li>
           ))}
         </ul>
       </section>
    </div>
  );
}
