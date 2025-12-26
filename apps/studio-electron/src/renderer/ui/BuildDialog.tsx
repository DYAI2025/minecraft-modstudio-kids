import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Loader2, Play, AlertTriangle, FileOutput, Hammer, Gamepad2 } from 'lucide-react';
import { useProject } from '../state/ProjectContext';
import { clsx } from 'clsx';
import { PipelineStatus } from '../types/bridge'; 
import { CreeperAvatar } from './CreeperAvatar';

interface BuildDialogProps {
    open: boolean;
    onClose: () => void;
}

export function BuildDialog({ open, onClose }: BuildDialogProps) {
    const { project } = useProject();
    const [status, setStatus] = useState<PipelineStatus | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (!open) {
            setStatus(null);
            setIsRunning(false);
            return;
        }
    }, [open]);

    const startPipeline = async () => {
        setIsRunning(true);
        setStatus({ step: 'export', message: 'Bereite alles vor...', progress: 0 });
        
        const unsubscribe = window.KidMod.onBuildProgress((event: any, newStatus: PipelineStatus) => {
            setStatus(newStatus);
            if (newStatus.step === 'done' || newStatus.step === 'error') {
                setIsRunning(false);
            }
        });

        try {
            await window.KidMod.startBuildPipeline(project);
        } catch (e) {
            setStatus({ step: 'error', message: 'Konnte nicht starten :(' });
            setIsRunning(false);
        }

        return () => unsubscribe();
    };

    const steps = [
        { id: 'export', label: 'Vorbereiten', icon: FileOutput },
        { id: 'build', label: 'Bauen', icon: Hammer },
        { id: 'test', label: 'Testen', icon: Gamepad2 }
    ];

    const getStepState = (stepId: string, idx: number) => {
        const currentIdx = steps.findIndex(s => s.id === status?.step);
        if (status?.step === 'done') return 'completed';
        if (status?.step === 'error' && currentIdx === idx) return 'error';
        if (currentIdx === idx) return 'active';
        if (currentIdx > idx) return 'completed';
        return 'pending';
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[500px] bg-[#2a2a2a] border-4 border-[#111] shadow-2xl overflow-hidden text-slate-100 font-mono">
                {/* Header */}
                <div className="bg-[#111] p-4 flex justify-between items-center border-b-4 border-[#333]">
                    <h2 className="text-xl font-bold text-[#55AA55] drop-shadow-md">
                        Mod Werkstatt
                    </h2>
                    <button 
                        onClick={onClose} 
                        disabled={isRunning} 
                        className="p-1 hover:bg-[#333] rounded disabled:opacity-50 text-white"
                        aria-label="Schließen"
                        title="Schließen"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 bg-[#2a2a2a]">
                    
                    {!status && !isRunning ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="mx-auto w-16 h-16 flex items-center justify-center">
                                <CreeperAvatar size={64} expression="happy" />
                            </div>
                            <p className="text-lg text-[#eee]">Bereit zum Bauen?</p>
                            <p className="text-sm text-[#aaa]">Ich baue deinen Mod und starte Minecraft für dich.</p>
                            <button 
                                onClick={startPipeline}
                                className="px-6 py-3 bg-[#398139] border-b-4 border-[#1e461e] hover:bg-[#55AA55] text-white font-bold flex items-center gap-2 mx-auto active:translate-y-1 active:border-b-0 transition-none"
                            >
                                <Play size={20} /> Los geht's!
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Stepper */}
                            <div className="flex justify-between relative px-4">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-[#444] -z-10 -translate-y-1/2" />
                                
                                {steps.map((step, idx) => {
                                    const state = getStepState(step.id, idx);
                                    let borderColor = 'border-[#444] bg-[#222]'; 
                                    let iconColor = 'text-[#666]';
                                    
                                    if (state === 'completed') {
                                         borderColor = 'border-[#55AA55] bg-[#398139]';
                                         iconColor = 'text-white';
                                    }
                                    if (state === 'active') {
                                         borderColor = 'border-[#FFAA00] bg-[#AA7700]'; // Gold for active
                                         iconColor = 'text-white';
                                    }
                                    if (state === 'error') {
                                         borderColor = 'border-[#AA0000] bg-[#880000]';
                                         iconColor = 'text-white';
                                    }

                                    return (
                                        <div key={step.id} className="flex flex-col items-center gap-2 bg-[#2a2a2a] px-2 z-10">
                                            <div className={clsx("w-10 h-10 border-4 flex items-center justify-center", borderColor)}>
                                                {state === 'active' ? (
                                                     <CreeperAvatar size={24} expression="working" /> 
                                                ) : state === 'completed' ? (
                                                     <CheckCircle size={20} className="text-white" />
                                                ) : (
                                                     <step.icon size={18} className={iconColor} />
                                                )}
                                            </div>
                                            <span className={clsx("text-xs font-bold", state === 'active' ? 'text-[#FFAA00]' : 'text-[#aaa]')}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Status Box */}
                            <div className="bg-[#111] border-2 border-[#444] p-4 min-h-[120px] flex flex-col items-center justify-center text-center rounded-none relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2a2a2a] px-2">
                                     <CreeperAvatar size={32} expression={status?.step === 'error' ? 'confused' : status?.step === 'done' ? 'happy' : 'talking'} />
                                </div>
                                <div className="mt-4">
                                     <h3 className={clsx("font-bold mb-1", status?.step === 'error' ? 'text-[#FF5555]' : 'text-[#55AA55]')}>
                                        {status?.message}
                                     </h3>
                                     {status?.details && (
                                        <p className="text-xs text-[#aaa] font-mono mt-2 bg-black p-2 border border-[#333] max-h-24 overflow-auto text-left">
                                            {status.details}
                                        </p>
                                     )}
                                     
                                     {status?.progress && (
                                         <div className="w-64 h-4 bg-[#333] border border-[#555] mt-2 relative">
                                             <div 
                                                className="h-full bg-[#55AA55]" 
                                                style={{ width: `${status.progress}%` }} 
                                             />
                                             <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20" />
                                         </div>
                                     )}
                                </div>
                            </div>
                        </>
                    )}

                </div>

                {(status?.step === 'done' || status?.step === 'error') && (
                    <div className="p-4 border-t-4 border-[#333] bg-[#111] flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 bg-[#444] hover:bg-[#555] text-white border-b-4 border-[#222] active:border-b-0 active:translate-y-1 font-mono text-sm">
                            Schließen
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
