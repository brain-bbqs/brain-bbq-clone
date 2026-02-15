import { useEffect, useRef } from "react";

interface SyncVisualizationProps {
  speciesA: string;
  speciesB: string;
  sharedBehaviors: string[];
  sharedTools: string[];
}

export function SyncVisualization({ speciesA, speciesB, sharedBehaviors, sharedTools }: SyncVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Particles flowing between the two sides
    interface Particle {
      x: number;
      y: number;
      speed: number;
      size: number;
      opacity: number;
      direction: 1 | -1;
      yOffset: number;
      phase: number;
    }

    const particles: Particle[] = [];
    const rect = canvas.getBoundingClientRect();

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random(),
        y: 0.3 + Math.random() * 0.4,
        speed: 0.001 + Math.random() * 0.002,
        size: 1.5 + Math.random() * 2.5,
        opacity: 0.3 + Math.random() * 0.5,
        direction: Math.random() > 0.5 ? 1 : -1,
        yOffset: (Math.random() - 0.5) * 0.15,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w, h);
      time += 0.016;

      // Draw flowing connection lines (bezier curves)
      const centerY = h * 0.5;
      const leftX = w * 0.18;
      const rightX = w * 0.82;

      for (let i = 0; i < 5; i++) {
        const offset = (i - 2) * 18;
        const wave = Math.sin(time * 0.8 + i * 0.7) * 8;
        
        ctx.beginPath();
        ctx.moveTo(leftX, centerY + offset);
        ctx.bezierCurveTo(
          w * 0.35, centerY + offset + wave - 15,
          w * 0.65, centerY + offset - wave + 15,
          rightX, centerY + offset
        );
        
        const gradient = ctx.createLinearGradient(leftX, 0, rightX, 0);
        gradient.addColorStop(0, `hsla(222, 47%, 20%, ${0.06 + i * 0.02})`);
        gradient.addColorStop(0.3, `hsla(38, 90%, 50%, ${0.12 + i * 0.02})`);
        gradient.addColorStop(0.5, `hsla(38, 90%, 50%, ${0.18 + i * 0.02})`);
        gradient.addColorStop(0.7, `hsla(38, 90%, 50%, ${0.12 + i * 0.02})`);
        gradient.addColorStop(1, `hsla(222, 47%, 20%, ${0.06 + i * 0.02})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw particles flowing along the curves
      particles.forEach((p) => {
        p.x += p.speed * p.direction;
        if (p.x > 1.05) { p.x = -0.05; }
        if (p.x < -0.05) { p.x = 1.05; }

        const px = leftX + (rightX - leftX) * p.x;
        const waveY = Math.sin(time * 1.2 + p.phase) * 12;
        const py = centerY + p.yOffset * h + waveY;

        // Fade at edges
        const edgeFade = Math.min(p.x * 5, (1 - p.x) * 5, 1);
        const alpha = p.opacity * edgeFade;

        // Glow
        const glow = ctx.createRadialGradient(px, py, 0, px, py, p.size * 3);
        glow.addColorStop(0, `hsla(38, 90%, 55%, ${alpha})`);
        glow.addColorStop(0.5, `hsla(38, 90%, 50%, ${alpha * 0.3})`);
        glow.addColorStop(1, `hsla(38, 90%, 50%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `hsla(38, 90%, 60%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Node circles at each end
      [leftX, rightX].forEach((nx, idx) => {
        const pulseR = 24 + Math.sin(time * 1.5 + idx * Math.PI) * 4;
        
        // Outer pulse
        const outerGlow = ctx.createRadialGradient(nx, centerY, pulseR * 0.5, nx, centerY, pulseR * 1.5);
        outerGlow.addColorStop(0, `hsla(222, 47%, 20%, 0.08)`);
        outerGlow.addColorStop(1, `hsla(222, 47%, 20%, 0)`);
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(nx, centerY, pulseR * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        ctx.fillStyle = "hsla(222, 47%, 20%, 0.9)";
        ctx.beginPath();
        ctx.arc(nx, centerY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Ring
        ctx.strokeStyle = "hsla(38, 90%, 50%, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(nx, centerY, 22, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Species labels
      ctx.fillStyle = "hsl(0, 0%, 100%)";
      ctx.font = "bold 9px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Draw species initials in circles
      const initA = speciesA.split(" ")[0].charAt(0).toUpperCase();
      const initB = speciesB.split(" ")[0].charAt(0).toUpperCase();
      ctx.fillText(initA, leftX, centerY);
      ctx.fillText(initB, rightX, centerY);

      // "SYNC" label in center
      const syncPulse = 0.6 + Math.sin(time * 2) * 0.15;
      ctx.fillStyle = `hsla(38, 90%, 50%, ${syncPulse})`;
      ctx.font = "bold 10px system-ui, sans-serif";
      ctx.letterSpacing = "2px";
      ctx.fillText("⟷ SYNC", w / 2, centerY - 35);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [speciesA, speciesB]);

  return (
    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* Species labels */}
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
        <div className="text-left ml-12">
          <p className="text-xs font-bold text-foreground">{speciesA.split(" (")[0]}</p>
          <p className="text-[10px] text-muted-foreground italic">{speciesA.match(/\((.+)\)/)?.[1]}</p>
        </div>
        <div className="text-right mr-12">
          <p className="text-xs font-bold text-foreground">{speciesB.split(" (")[0]}</p>
          <p className="text-[10px] text-muted-foreground italic">{speciesB.match(/\((.+)\)/)?.[1]}</p>
        </div>
      </div>
      
      {/* Center badge */}
      <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
        <div className="flex gap-2 flex-wrap justify-center max-w-xs">
          {["Shared Pipeline", "Transfer Learning"].map(tag => (
            <span key={tag} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground border border-accent/20">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
