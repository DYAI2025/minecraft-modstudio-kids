export interface ModelTier {
  id: 'low' | 'med' | 'high';
  name: string;
  modelName: string;
  size: string;
  ramUsage: string;
  description: string;
  huggingFaceRepo: string;
  huggingFaceFile: string;
}

export const MODEL_TIERS: ModelTier[] = [
  {
    id: 'low',
    name: 'Starter (Efficiency)',
    modelName: 'Phi-3 Mini 3.8B',
    size: '2.3 GB',
    ramUsage: '< 4GB',
    description: 'Fast and lightweight. Great for basic text and simple code. Runs on almost any laptop.',
    huggingFaceRepo: 'microsoft/Phi-3-mini-4k-instruct-gguf',
    huggingFaceFile: 'Phi-3-mini-4k-instruct-q4.gguf'
  },
  {
    id: 'med',
    name: 'Balanced',
    modelName: 'Llama-3 8B',
    size: '4.7 GB',
    ramUsage: '~8GB',
    description: 'The sweet spot. Excellent reasoning and creativity. Recommended for most users.',
    huggingFaceRepo: 'Meta-Llama/Meta-Llama-3-8B-Instruct-GGUF',
    huggingFaceFile: 'Meta-Llama-3-8B-Instruct-Q4_K_M.gguf'
  },
  {
    id: 'high',
    name: 'Pro (Performance)',
    modelName: 'Mistral-Nemo 12B',
    size: '7.2 GB',
    ramUsage: '> 12GB',
    description: 'Advanced reasoning and longer context. Best for complex story generation and coding.',
    huggingFaceRepo: 'mistralai/Mistral-Nemo-Instruct-2407-GGUF',
    huggingFaceFile: 'Mistral-Nemo-Instruct-2407-Q4_K_M.gguf'
  }
];

export class ModelManager {
  static async simulateDownload(tierId: string, onProgress: (percent: number) => void): Promise<void> {
    console.log(`Starting mock download for tier: ${tierId}`);
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 5; // Random speed
        if (progress >= 100) {
          progress = 100;
          onProgress(progress);
          clearInterval(interval);
          resolve();
        } else {
          onProgress(Math.floor(progress));
        }
      }, 200); // Update every 200ms
    });
  }

  // Future: Implement real HuggingFace download via Electron Bridge
}
