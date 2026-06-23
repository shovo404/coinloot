import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class for futuristic starry field
    class Star {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      decay: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speed = Math.random() * 0.4 + 0.1;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.decay = Math.random() * 0.01 + 0.002;
      }

      update() {
        this.y -= this.speed;
        if (this.y < 0) {
          this.y = height;
          this.x = Math.random() * width;
        }
        // Subtle star flicker
        this.opacity += this.decay;
        if (this.opacity < 0.2 || this.opacity > 0.8) {
          this.decay = -this.decay;
        }
      }

      draw(context: CanvasRenderingContext2D) {
        context.save();
        context.globalAlpha = this.opacity;
        context.fillStyle = "#ffffff";
        context.shadowBlur = 4;
        context.shadowColor = "#38bdf8"; // cyan shadow
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
    }

    const starCount = width < 768 ? 30 : 80;
    const stars: Star[] = Array.from({ length: starCount }, () => new Star());

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const render = () => {
      // Clear with dark space trail
      ctx.fillStyle = "#020617"; // tailwind slate-950
      ctx.fillRect(0, 0, width, height);

      // Render star particles
      stars.forEach((star) => {
        star.update();
        star.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-30 overflow-hidden pointer-events-none">
      {/* Dynamic Star Backdrop canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* Floating neon gradient orbs & Aurora effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 blur-[130px] rounded-full animate-pulse" />
      <div className="absolute top-1/2 left-3/4 w-[500px] h-[500px] bg-cyan-600/10 blur-[160px] rounded-full animate-bounce [animation-duration:15s]" />
      <div className="absolute bottom-10 left-12 w-80 h-80 bg-fuchsia-600/5 blur-[120px] rounded-full" />
    </div>
  );
}
