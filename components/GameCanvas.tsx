
import React, { useEffect, useRef } from 'react';
import { GameStatus } from '../types';

interface GameCanvasProps {
  status: GameStatus;
  multiplier: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ status, multiplier }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (status === 'IDLE' || status === 'STARTING') {
        // Draw static base line
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, h - 40);
        ctx.lineTo(w - 40, h - 40);
        ctx.stroke();
        return;
      }

      // Calculate progress (clamped for visual)
      // Multiplier starts at 1.0. We map it to a curve.
      const t = Math.min(1, (multiplier - 1) / 10); // visual mapping for 10x range
      
      // Draw Curve
      ctx.beginPath();
      ctx.strokeStyle = status === 'CRASHED' ? '#7f1d1d' : '#ef4444';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.moveTo(40, h - 40);

      // Quadratic curve based on multiplier
      const endX = 40 + (w - 100) * t;
      const endY = (h - 40) - (h - 100) * Math.pow(t, 1.5);

      // Control point for smooth curve
      const cpX = 40 + (endX - 40) * 0.8;
      const cpY = h - 40;

      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      ctx.stroke();

      // Shadow/Glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = status === 'CRASHED' ? 'transparent' : 'rgba(239, 68, 68, 0.5)';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Plane Icon (Simple triangle for now)
      if (status !== 'CRASHED') {
        ctx.save();
        ctx.translate(endX, endY);
        // Rotate based on curve slope roughly
        ctx.rotate(-Math.PI / 4 * t);
        
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-20, 5);
        ctx.lineTo(-20, -5);
        ctx.closePath();
        ctx.fill();

        // Little flame
        if (multiplier > 1.1) {
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(-20, 0);
            ctx.lineTo(-30, Math.sin(Date.now() / 50) * 3);
            ctx.lineTo(-20, 3);
            ctx.fill();
        }

        ctx.restore();
      } else {
        // Explosion mark
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(endX, endY, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = 'bold 16px Inter';
        ctx.fillStyle = '#f87171';
        ctx.fillText('CRASHED', endX - 35, endY - 25);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [status, multiplier]);

  return (
    <div className="relative w-full h-full bg-zinc-950/50 rounded-xl border border-zinc-800 overflow-hidden shadow-inner">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={400} 
        className="w-full h-full object-cover"
      />
      {status === 'FLYING' && (
        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/40 px-3 py-1 rounded-full border border-zinc-700">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Live Flight</span>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
