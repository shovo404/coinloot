import { useRef, useCallback, ReactNode, MouseEvent, TouchEvent } from "react";

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
  snap?: boolean;
}

export default function HorizontalScroll({ children, className = "", snap = false }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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
    const walk = (x - startX.current) * 1.5;
    containerRef.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = "";
  }, []);

  const onTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0);
    scrollLeft.current = containerRef.current?.scrollLeft || 0;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!containerRef.current) return;
    const x = e.touches[0].pageX - (containerRef.current.offsetLeft || 0);
    const walk = (x - startX.current) * 1.5;
    containerRef.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex overflow-x-auto gap-3 lg:gap-4 pb-2 scrollbar-hide select-none ${snap ? "snap-x snap-mandatory" : ""} ${className}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      style={{ cursor: "grab", scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {children}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
