import { useState, useEffect, type ReactNode } from "react";
import Loader from "./Loader";

interface ContentLoaderProps {
  loading: boolean;
  children: ReactNode;
  minHeight?: string;
  className?: string;
  loaderSize?: "xs" | "sm" | "md" | "lg";
  loaderText?: string;
}

export default function ContentLoader({
  loading,
  children,
  minHeight = "200px",
  className = "",
  loaderSize,
  loaderText,
}: ContentLoaderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [loading]);

  return (
    <div className={`relative ${className}`} style={{ minHeight }}>
      <div
        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        style={{
          opacity: loading ? 1 : 0,
          pointerEvents: loading ? "auto" : "none",
        }}
      >
        <Loader size={loaderSize} text={loaderText} />
      </div>
      <div
        className="transition-all duration-500 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
