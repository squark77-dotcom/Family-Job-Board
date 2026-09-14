import { Loader2, Zap } from "lucide-react";

export function FullScreenLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-accent/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
      
      <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-8 shadow-md">
          <Zap className="w-8 h-8 text-white animate-pulse" fill="currentColor" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-4" />
        {message && <p className="text-muted-foreground font-bold tracking-tight">{message}</p>}
      </div>
    </div>
  );
}
