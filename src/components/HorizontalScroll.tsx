import { useRef, useCallback, ReactNode, MouseEvent } from "react";

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
  snap?: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function HorizontalScroll({ children, className = "", snap = false, containerRef: externalRef }: HorizontalScrollProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = externalRef || internalRef;
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = useCallback((e: MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (containerRef.current?.offsetLeft || 0);
    scrollLeft.current = containerRef.current?.scrollLeft || 0;
    if (containerRef.current) containerRef.current.style.cursor = "grabbing";
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (containerRef.current.offsetLeft || 0);
    const walk = x - startX.current;
    containerRef.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = "";
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex overflow-x-auto gap-3 lg:gap-4 pb-2 scrollbar-hide select-none ${snap ? "snap-x snap-mandatory" : ""} ${className}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ cursor: "grab", scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {children}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
