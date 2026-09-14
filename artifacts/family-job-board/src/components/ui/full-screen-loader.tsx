import { Loader2 } from "lucide-react";

export function FullScreenLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-secondary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
      
      <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
        <div className="p-4 bg-white rounded-2xl shadow-xl border border-border/50 mb-6">
          <img src="/logo.svg" alt="Logo" className="w-12 h-12 animate-pulse" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-4" />
        {message && <p className="text-muted-foreground font-medium">{message}</p>}
      </div>
    </div>
  );
}
