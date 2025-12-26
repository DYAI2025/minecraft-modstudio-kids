import React, { useState, useRef, useEffect } from 'react';
import { CreeperAvatar } from './CreeperAvatar';
import { X, Send, Mic, Volume2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { useProject } from '../state/ProjectContext'; // Access Dispatch
import { processUserCommand } from '../ai/commander';

interface CreeperChatProps {
    open: boolean;
    onClose: () => void;
}

interface Message {
    id: string;
    sender: 'user' | 'creeper';
    text: string;
}

export function CreeperChat({ open, onClose }: CreeperChatProps) {
    const { dispatch } = useProject(); // Connect to Redux
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'creeper', text: 'Ssss... Ich bin ganz Ohr! Sag mir, was ich bauen soll.' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // TTS Function
    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        // Strip markdown roughly for speech
        const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'de-DE';
        utterance.pitch = 1.2; // Slightly higher/kid-friendly
        utterance.rate = 1.1; 
        window.speechSynthesis.speak(utterance);
    };

    // STT Function
    const toggleListening = () => {
        if (isListening) {
             // Stop strictly not needed if auto-end, but good for UI
             setIsListening(false);
             return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) {
            alert("Browser unterstützt keine Spracheingabe :(");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'de-DE';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
            handleSubmit(undefined, transcript); // Auto-submit
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.start();
    };


    const handleSubmit = async (e?: React.FormEvent, overrideQuery?: string) => {
        e?.preventDefault();
        const textToProcess = overrideQuery || query;
        if (!textToProcess.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: textToProcess };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setIsTyping(true);

        // 1. Check Commander (Local AI)
        const commandResult = processUserCommand(textToProcess);

        if (commandResult.message) {
            // It was a command!
            setTimeout(() => {
                const botMsg: Message = { id: (Date.now() + 1).toString(), sender: 'creeper', text: commandResult.message };
                setMessages(prev => [...prev, botMsg]);
                setIsTyping(false);
                speak(commandResult.message);
                
                if (commandResult.action) {
                    dispatch(commandResult.action); // <--- Execute Action
                }
            }, 600);
            return;
        }

        // 2. Fallback to Help Search
        try {
            // @ts-ignore
            const results = await window.KidMod.searchHelp(textToProcess);
            
            setTimeout(() => {
                let replyText = "Ssss... das weiß ich leider nicht. Versuch es mal mit 'Erstelle ein Schwert'.";
                if (results && results.length > 0) {
                    const top = results[0];
                    replyText = `**${top.title}**\n\n${top.excerpt}`;
                }

                const botMsg: Message = { id: (Date.now() + 1).toString(), sender: 'creeper', text: replyText };
                setMessages(prev => [...prev, botMsg]);
                setIsTyping(false);
                speak(replyText);
            }, 1000); 
        } catch (err) {
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'creeper', text: 'Fehler im Netzwerk...' }]);
            setIsTyping(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed bottom-20 left-4 w-96 h-[500px] bg-[#2a2a2a] border-4 border-[#111] shadow-2xl flex flex-col font-mono z-50 text-white rounded-t-lg">
            {/* Header */}
            <div className="bg-[#111] p-3 flex justify-between items-center border-b-4 border-[#333]">
                <div className="flex items-center gap-2">
                    <CreeperAvatar size={24} expression={isListening ? 'talking' : 'happy'} />
                    <span className="font-bold text-[#55AA55]">Creeper Companion</span>
                </div>
                <button onClick={onClose} className="hover:text-red-400">
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg text-sm shadow-md ${msg.sender === 'user' ? 'bg-[#398139] text-white' : 'bg-[#444] text-[#eee] border border-[#666]'}`}>
                             <Markdown>{msg.text}</Markdown>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-[#444] p-2 rounded-lg text-xs text-[#aaa] animate-pulse">
                            Creeper denkt nach...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={(e) => handleSubmit(e)} className="p-3 bg-[#222] border-t-4 border-[#333] flex gap-2 items-center">
                <button 
                    type="button" 
                    onClick={toggleListening}
                    className={`p-2 rounded-full border-2 transition-colors ${isListening ? 'bg-red-500 border-red-700 animate-pulse' : 'bg-[#333] border-[#555] hover:bg-[#444]'}`}
                    title="Spracheingabe"
                    aria-label="Spracheingabe starten"
                >
                    <Mic size={18} className="text-white" />
                </button>

                <input 
                    type="text" 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={isListening ? "Ich höre zu..." : "Frag mich was..."}
                    className="flex-1 bg-[#111] border border-[#444] p-2 text-white focus:border-[#55AA55] outline-none text-sm disabled:opacity-50"
                    disabled={isListening}
                />
                
                <button 
                    type="submit" 
                    disabled={!query.trim() || isTyping} 
                    className="bg-[#55AA55] hover:bg-[#398139] p-2 rounded text-[#111] disabled:opacity-50"
                    aria-label="Senden"
                    title="Senden"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
