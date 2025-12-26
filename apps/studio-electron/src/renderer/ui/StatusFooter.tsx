import React, { useState } from 'react';
import './StatusFooter.css';
import { useProject } from '../state/ProjectContext';
import { explainLastAction } from '@kidmodstudio/core-model';
import { CreeperAvatar } from './CreeperAvatar';
import { CreeperChat } from './CreeperChat';

export function StatusFooter() {
  const { state } = useProject();
  const explanation = explainLastAction(state);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
        <CreeperChat open={chatOpen} onClose={() => setChatOpen(false)} />
        <footer className="status-footer minecraft-theme">
        <button 
            className="status-helper hover:scale-110 transition-transform cursor-help"
            onClick={() => setChatOpen(!chatOpen)}
            title="Frag den Creeper!"
        >
            <CreeperAvatar size={32} expression="happy" />
        </button>
        <div className="status-content">
            <p className="status-text font-minecraft">
                {explanation}
            </p>
        </div>
        </footer>
    </>
  );
}
