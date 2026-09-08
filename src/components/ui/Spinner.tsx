import { Loader2 } from "lucide-react";

export function Spinner({ size = 20, className = "" }: { size?: number; className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} style={{ width: size, height: size }} />;
}

export function FullSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Spinner size={32} className="text-brand-600" />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
}