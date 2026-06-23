import { useEffect, useRef } from "react";

export default function Globe3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = 450);
    let height = (canvas.height = 450);
    let angle = 0;
    let animationFrameId: number;

    // Define 3D coordinate points on a sphere
    interface Point3D {
      x: number;
      y: number;
      z: number;
      color: string;
      label?: string;
    }

    const points: Point3D[] = [];
    const sphereRadius = 155;

    // Generate longitude and latitude points on the sphere
    for (let lat = -Math.PI / 2 + 0.15; lat < Math.PI / 2; lat += Math.PI / 10) {
      const cosLat = Math.cos(lat);
      const sinLat = Math.sin(lat);
      const dotsInRing = Math.abs(Math.round(cosLat * 26)) || 4;

      for (let lon = 0; lon < Math.PI * 2; lon += (Math.PI * 2) / dotsInRing) {
        const x = sphereRadius * cosLat * Math.cos(lon);
        const y = sphereRadius * cosLat * Math.sin(lon);
        const z = sphereRadius * sinLat;
        const color = Math.random() > 0.85 ? "#38bdf8" : "#8b5cf6"; // Cyan / Purple nodes
        points.push({ x, y, z, color });
      }
    }

    // Add some larger glowing live network/earner markers on top of globe
    const activeNodes = [
      { lat: 0.2, lon: 1.1, label: "🇺🇸 USA" },
      { lat: -0.4, lon: -2.3, label: "🇩🇪 DE" },
      { lat: 0.6, lon: -0.5, label: "🇬🇧 GBR" },
      { lat: -0.1, lon: 3.1, label: "🇮🇳 IND" },
      { lat: 0.8, lon: 2.1, label: "🇧🇷 BRA" }
    ];

    activeNodes.forEach((node) => {
      const x = sphereRadius * Math.cos(node.lat) * Math.cos(node.lon);
      const y = sphereRadius * Math.cos(node.lat) * Math.sin(node.lon);
      const z = sphereRadius * Math.sin(node.lat);
      points.push({ x, y, z, color: "#10b981", label: node.label }); // emerald green for live loot hits
    });

    const isHovering = { value: false };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = x - width / 2;
      const dy = y - height / 2;
      isHovering.value = dx * dx + dy * dy < sphereRadius * sphereRadius;
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint background glowing aura circles behind globe
      ctx.save();
      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, sphereRadius + 60);
      grad.addColorStop(0, "rgba(8, 47, 73, 0.1)");
      grad.addColorStop(0.7, "rgba(139, 92, 246, 0.04)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, sphereRadius + 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Spin speed increases when hovered
      const speed = isHovering.value ? 0.012 : 0.005;
      angle += speed;

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Render projected 3D coordinates to 2D screen
      const projected = points.map((p) => {
        // Rotate points on the Y axis
        const x1 = p.x * cosA - p.z * sinA;
        const z1 = p.x * sinA + p.z * cosA;

        // Perspective projection formula
        const distance = 400;
        const scale = distance / (distance + z1);
        const x2 = width / 2 + x1 * scale;
        const y2 = height / 2 + p.y * scale;

        return { x: x2, y: y2, z: z1, size: Math.max(1, 4 * scale), color: p.color, label: p.label };
      });

      // Sort points by depth (Z-index coordinate) so background dots are covered by foreground dots
      projected.sort((a, b) => b.z - a.z);

      // Draw standard latitude rings as grid lines
      ctx.strokeStyle = "rgba(139, 92, 246, 0.08)";
      ctx.lineWidth = 1;
      for (let lat = -Math.PI / 2 + 0.3; lat < Math.PI / 2; lat += Math.PI / 5) {
        const rad = sphereRadius * Math.cos(lat);
        const zCenter = sphereRadius * Math.sin(lat) * sinA;
        const scale = 400 / (400 + zCenter);

        ctx.beginPath();
        // Draw ellipse to simulate rings rotating
        ctx.ellipse(
          width / 2,
          height / 2 + sphereRadius * Math.sin(lat) * cosA,
          rad,
          rad * Math.abs(sinA) * scale,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      // Draw nodes
      projected.forEach((p) => {
        // Fade out dots in the back
        const alpha = Math.min(1, Math.max(0.15, (sphereRadius - p.z) / (sphereRadius * 2)));
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // If it is an active node in the foreground, draw a ping ring + country label
        if (p.label && p.z < 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px Inter, sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillText(` ${p.label}`, p.x + 8, p.y);
        }
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div id="globe_container" className="relative flex justify-center items-center w-[450px] height-[450px] mx-auto select-none pointer-events-auto">
      <canvas ref={canvasRef} className="max-w-full aspect-square" />
      <div className="absolute inset-0 border border-cyan-500/10 pointer-events-none rounded-full blur-[1px] scale-95" />
    </div>
  );
}
