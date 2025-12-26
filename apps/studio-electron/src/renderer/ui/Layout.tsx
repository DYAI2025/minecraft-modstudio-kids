import React, { useState } from 'react';
import { useProject } from '../state/ProjectContext';
import { Library } from './Library';
import { EditorPanel } from './EditorPanel';
import { Preview3D } from './Preview3D';
import { VoiceControl } from './VoiceControl';
import { OnboardingWizard } from './OnboardingWizard';
import { StatusFooter } from './StatusFooter';
import './Layout.css';
import { useToast } from '../state/ToastContext';
import { BuildDialog } from './BuildDialog';
import { Play } from 'lucide-react';

export function Layout() {
  const { load, save, workspaceDir } = useProject();
  const { addToast } = useToast();
  const [showWizard, setShowWizard] = useState(true);
  const [showBuild, setShowBuild] = useState(false);

  const handleSave = async () => {
    try {
      await save();
      addToast('Project saved successfully!', 'success');
    } catch (e) {
      addToast('Failed to save project', 'error');
    }
  };

  const handleLoad = async () => {
    try {
      await load();
      addToast('Project loaded', 'success');
    } catch (e) {
      addToast('Failed to load project', 'error');
    }
  };

  return (
    <div className="layout-grid">
      {showWizard && <OnboardingWizard onComplete={() => setShowWizard(false)} />}
      <BuildDialog open={showBuild} onClose={() => setShowBuild(false)} />
      
      {/* Sidebar */}
      <aside className="sidebar">
        <h1 className="header-title">KidMod Studio</h1>
        
        <div className="btn-group flex gap-2 mb-4">
            <button className="btn" onClick={handleLoad}>Open</button>
            <button className="btn" onClick={handleSave} disabled={!workspaceDir}>Save</button>
            <button 
                className="btn btn-primary bg-green-600 hover:bg-green-500 text-white flex items-center justify-center gap-1" 
                onClick={() => setShowBuild(true)} 
                disabled={!workspaceDir}
                title="Mod bauen und testen"
            >
                <Play size={16} /> Testen
            </button>
        </div>

        <Library />
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <EditorPanel />
      </main>

      {/* Right Panel (Preview/Help) */}
      <aside className="sidebar">
        <h3>3D Preview</h3>
        <div className="preview-box">
            <Preview3D />
        </div>
      </aside>
      
      <VoiceControl />
      <StatusFooter />
    </div>
  );
}
