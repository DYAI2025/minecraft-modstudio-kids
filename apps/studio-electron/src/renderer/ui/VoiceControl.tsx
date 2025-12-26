import React, { useEffect } from 'react';
import { useProject } from '../state/ProjectContext';
import { CommandParser } from '@kidmodstudio/core-model';
import { Mic, Loader2 } from 'lucide-react';
import './VoiceControl.css';

import { useToast } from '../state/ToastContext';

export function VoiceControl() {
  const { ui, setVoiceState, dispatch, setSelection } = useProject();
  const { addToast } = useToast();

  const handleMouseDown = () => {
    setVoiceState('listening');
  };

  const handleMouseUp = () => {
    setVoiceState('processing');
    
    // Simulate STT delay
    setTimeout(() => {
        // MOCK: Toggle between creating a block and an item based on randomness or fixed sequence for testing?
        // Let's use a fixed "Block" command for now, or maybe random to show robustness.
        const mockTranscript = Math.random() > 0.5 
            ? 'Erstelle einen Block namens Obsidian' 
            : 'Erstelle ein Item namens Smaragd';

        
        setVoiceState('idle', mockTranscript); 
        
        // Parse the command
        const result = CommandParser.parse(mockTranscript);
        
        if (result.action) {
            dispatch(result.action);
            addToast(`Executed: "${mockTranscript}"`, 'success');

            // Auto-select the new object
            if (result.action.type === 'CREATE_BLOCK' || result.action.type === 'CREATE_ITEM') {
                // We know payload has id, but TS might not be sure of specific union member
                // Casting or checking type strictly
                const payload = result.action.payload as any;
                const type = result.action.type === 'CREATE_BLOCK' ? 'block' : 'item';
                setSelection(type, payload.id);
            }
        } else {
             addToast(`Unknown command: "${mockTranscript}"`, 'info');
        }

    }, 1500);
  };

  // PTT Spacebar (only if not typing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
            e.preventDefault();
            handleMouseDown();
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space' && ui.voiceState === 'listening') {
            handleMouseUp();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [ui.voiceState]);

  return (
    <div className={`voice-control ${ui.voiceState}`}>
      {ui.voiceState === 'listening' && <div className="voice-wave">Listening...</div>}
      
      {ui.transcript && ui.voiceState === 'idle' && (
          <div className="transcript-toast">{ui.transcript}</div>
      )}

      <button 
        className="mic-btn"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => ui.voiceState === 'listening' && handleMouseUp()}
      >
        {ui.voiceState === 'processing' ? <Loader2 className="spin" size={32} /> : <Mic size={32} />}
      </button>
    </div>
  );
}
