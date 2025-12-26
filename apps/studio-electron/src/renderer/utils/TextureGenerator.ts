export class TextureGenerator {
  static generate(type: string, seed: number = 0, width = 64, height = 64): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Fill background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    switch (type) {
      case 'rock':
        this.drawNoise(ctx, width, height, 50, 50, 50, 20);
        break;
      case 'wood':
        this.drawWood(ctx, width, height);
        break;
      case 'gem':
        this.drawNoise(ctx, width, height, 200, 50, 200, 40);
        this.drawGem(ctx, width, height);
        break;
      default:
        // solid color fallback
        ctx.fillStyle = '#f0f';
        ctx.fillRect(0, 0, width, height);
    }

    return canvas.toDataURL();
  }

  private static drawNoise(ctx: CanvasRenderingContext2D, w: number, h: number, r: number, g: number, b: number, varRange: number) {
    const idata = ctx.getImageData(0, 0, w, h);
    const buffer = idata.data;
    for (let i = 0; i < buffer.length; i += 4) {
      const noise = (Math.random() - 0.5) * varRange;
      buffer[i] = Math.max(0, Math.min(255, r + noise));
      buffer[i + 1] = Math.max(0, Math.min(255, g + noise));
      buffer[i + 2] = Math.max(0, Math.min(255, b + noise));
      buffer[i + 3] = 255;
    }
    ctx.putImageData(idata, 0, 0);
  }

  private static drawWood(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, w, h);
    
    ctx.imageSmoothingEnabled = false;
    // Simple streaks
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#5C3317';
    for(let i=0; i<20; i++) {
        const x = Math.random() * w;
        const width = Math.random() * 5 + 1;
        ctx.fillRect(x, 0, width, h);
    }
    ctx.globalAlpha = 1.0;
  }

  private static drawGem(ctx: CanvasRenderingContext2D, w: number, h: number) {
      // Shine
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(w, 0);
      ctx.fill();
      ctx.globalAlpha = 1.0;
  }
}
