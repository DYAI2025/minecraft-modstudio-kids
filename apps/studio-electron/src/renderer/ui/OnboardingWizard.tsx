import React, { useState } from 'react';
import { Cloud, WifiOff, HardDrive, Cpu, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { MODEL_TIERS, ModelManager, ModelTier } from '../utils/ModelManager';
import { useToast } from '../state/ToastContext';
import './OnboardingWizard.css';

type Step = 'mode' | 'hardware' | 'download' | 'finish';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>('mode');
  const [mode, setMode] = useState<'cloud' | 'local' | null>(null);
  const [selectedTier, setSelectedTier] = useState<ModelTier | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { addToast } = useToast();

  const handleModeSelect = (m: 'cloud' | 'local') => {
    setMode(m);
  };

  const handleNext = () => {
    if (step === 'mode') {
      if (mode === 'local') setStep('hardware');
      else onComplete(); // Cloud needs no setup for MVP
    } else if (step === 'hardware') {
      if (selectedTier) startDownload();
    } else if (step === 'finish') {
      onComplete();
    }
  };

  const startDownload = async () => {
    if (!selectedTier) return;
    setStep('download');
    
    try {
      await ModelManager.simulateDownload(selectedTier.id, (p) => {
        setDownloadProgress(p);
      });
      addToast(`${selectedTier.modelName} downloaded successfully!`, 'success');
      setStep('finish');
    } catch (e) {
      addToast('Download failed', 'error');
      setStep('hardware'); // Go back
    }
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-container">
        
        <div className="wizard-header">
          {step === 'mode' && (
            <>
              <h1>Power Source</h1>
              <p>How should KidMod Studio generate code?</p>
            </>
          )}
          {step === 'hardware' && (
            <>
              <h1>Local Setup</h1>
              <p>Select a model compatible with your hardware.</p>
            </>
          )}
          {step === 'download' && (
            <>
              <h1>Downloading Model</h1>
              <p>Fetching {selectedTier?.modelName} from HuggingFace...</p>
            </>
          )}
          {step === 'finish' && (
            <>
              <h1>All Set!</h1>
              <p>KidMod Studio is ready to use.</p>
            </>
          )}
        </div>

        <div className="wizard-step">
          
          {/* STEP 1: MODE */}
          {step === 'mode' && (
            <div className="mode-selection">
              <div 
                className={clsx('selection-card', mode === 'cloud' && 'selected')}
                onClick={() => handleModeSelect('cloud')}
              >
                <Cloud size={48} className="card-icon" />
                <div className="card-title">Cloud (Simple)</div>
                <div className="card-desc">
                  Uses an online API. Requires internet. No downloads needed. Best for older laptops.
                </div>
              </div>

              <div 
                className={clsx('selection-card', mode === 'local' && 'selected')}
                onClick={() => handleModeSelect('local')}
              >
                <div style={{ position: 'relative' }}>
                    <WifiOff size={48} className="card-icon" />
                </div>
                <div className="card-title">Local (Private)</div>
                <div className="card-desc">
                  Runs entirely on your device. Works offline. Requires valid hardware.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: HARDWARE */}
          {step === 'hardware' && (
            <div className="tier-grid">
              {MODEL_TIERS.map(tier => (
                <div 
                  key={tier.id}
                  className={clsx('tier-card', selectedTier?.id === tier.id && 'selected')}
                  onClick={() => setSelectedTier(tier)}
                >
                  {tier.id === 'med' && <div className="tier-badge">Recommended</div>}
                  <div className="tier-name">{tier.name}</div>
                  <div className="tier-model">{tier.modelName}</div>
                  <div className="tier-specs">
                    <span><HardDrive size={14} /> {tier.size}</span>
                    <span><Cpu size={14} /> RAM {tier.ramUsage}</span>
                  </div>
                  <div className="card-desc" style={{ fontSize: '0.85rem' }}>{tier.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3: DOWNLOAD */}
          {step === 'download' && (
            <div className="download-screen">
               <div className="progress-container">
                 <div className="progress-bar" style={{ width: `${downloadProgress}%` }} />
               </div>
               <div className="progress-text">{Math.round(downloadProgress)}% Complete</div>
               <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                 Downloading {selectedTier?.huggingFaceFile}
               </p>
            </div>
          )}

          {/* STEP 4: FINISH */}
          {step === 'finish' && (
            <div className="download-screen">
                <CheckCircle size={64} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
                <h2>Ready to Mod</h2>
                <p>Your local AI brain is active.</p>
            </div>
          )}
        </div>

        <div className="wizard-footer">
           {step !== 'download' && step !== 'finish' && (
             <button className="btn-secondary" onClick={step === 'hardware' ? () => setStep('mode') : undefined} disabled={step === 'mode'}>
               Back
             </button>
           )}
           {step !== 'download' && (
              <button 
                className="btn" 
                onClick={handleNext}
                disabled={step === 'mode' && !mode || step === 'hardware' && !selectedTier}
              >
                {step === 'finish' ? 'Start Studio' : 'Next'}
              </button>
           )}
        </div>

      </div>
    </div>
  );
}
