interface LoaderProps {
  size?: "xs" | "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeMap = { xs: 20, sm: 30, md: 45, lg: 60 };

export default function Loader({ size = "md", text, className = "" }: LoaderProps) {
  const h = sizeMap[size];
  const bw = Math.max(1, Math.round(h / 20));

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className="coinloot-loader"
        style={{ height: h, width: h * 2, borderBottomWidth: bw } as React.CSSProperties}
      />
      {text && (
        <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
          {text}
        </span>
      )}
    </div>
  );
}
