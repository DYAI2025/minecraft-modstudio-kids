import React from 'react';
import { useProject } from '../state/ProjectContext';
import './Editor.css';

export function EditorPanel() {
  const { state, ui, dispatch } = useProject();

  if (!ui.activeId || !ui.activeType) {
    return (
      <div className="empty-state">
        <h3>Time to Create!</h3>
        <p>Select an object from the library or click <b>+</b> to start building.</p>
      </div>
    );
  }

  const activeObj = state.project[`${ui.activeType}s`][ui.activeId];

  if (!activeObj) return <div>Object not found</div>;

  const handleChange = (field: string, value: any) => {
    // Dispatch UPDATE action
    const actionType = `UPDATE_${ui.activeType!.toUpperCase()}` as any;
    dispatch({ 
        type: actionType, 
        payload: { id: ui.activeId!, update: { [field]: value } } 
    });
  };

  const handlePropChange = (key: string, val: any) => {
      const currentProps = (activeObj as any).properties || {};
      handleChange('properties', { ...currentProps, [key]: val });
  };

  const handleTextureChange = (val: string) => {
      const currentTexture = (activeObj as any).texture || { type: 'procedural' };
      handleChange('texture', { ...currentTexture, value: val });
  };

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h2>{(activeObj as any).name || activeObj.id}</h2>
        <span className="badge">{ui.activeType}</span>
      </div>

      <div className="editor-form">
        <label>
          Name
          <input 
            type="text" 
            value={(activeObj as any).name || ''} 
            onChange={e => handleChange('name', e.target.value)}
            title="Object Name"
          />
        </label>
        
        <label>
          ID (Unique)
          <input 
            type="text" 
            value={activeObj.id} 
            disabled 
            className="input-disabled"
            title="Object ID"
          />
        </label>

        {ui.activeType === 'block' && (
          <>
            <div className="prop-group">
              <label>
                Hardness
                <input 
                  type="number" 
                  value={(activeObj as any).properties.hardness} 
                  step="0.1"
                  onChange={e => handlePropChange('hardness', parseFloat(e.target.value))}
                  title="Block Hardness"
                />
              </label>
              <label>
                Luminance
                <input 
                  type="range" 
                  min="0" max="15"
                  value={(activeObj as any).properties.luminance} 
                  onChange={e => handlePropChange('luminance', parseInt(e.target.value))}
                  title="Block Luminance"
                />
              </label>
            </div>
          </>
        )}

        {ui.activeType === 'item' && (
           <label>
             Max Stack
             <input 
               type="number" 
               value={(activeObj as any).properties.maxStackSize} 
               onChange={e => handlePropChange('maxStackSize', parseInt(e.target.value))}
               title="Max Stack Size"
             />
           </label>
        )}

        <label>
          Texture Preset
          <select 
            value={(activeObj as any).texture?.value || 'rock'} 
            onChange={e => handleTextureChange(e.target.value)}
            title="Texture Preset"
          >
            <option value="rock">Rock</option>
            <option value="wood">Wood</option>
            <option value="gem">Gem</option>
          </select>
        </label>
      </div>

    </div>
  );
}
