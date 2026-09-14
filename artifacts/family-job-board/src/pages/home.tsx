import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Zap, Rocket, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col overflow-hidden relative selection:bg-primary/20">
      {/* Sleek Decorative Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-primary/10 rounded-full blur-[120px] z-0 pointer-events-none mix-blend-multiply opacity-50"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-accent/10 rounded-full blur-[120px] z-0 pointer-events-none mix-blend-multiply opacity-50"></div>

      <header className="px-6 py-6 lg:px-12 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-[14px] shadow-sm flex items-center justify-center p-2 text-white">
            <Zap className="w-6 h-6" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-xl text-foreground tracking-tight">Board</span>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="font-bold hidden sm:flex text-foreground hover:bg-black/5 hover:text-black rounded-xl">
            <Link href="/sign-in">Log In</Link>
          </Button>
          <Button asChild className="font-bold shadow-md shadow-primary/20 rounded-xl h-11 px-6">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:py-24 text-center z-10 max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Sparkles className="w-4 h-4 text-accent fill-accent" />
          <span className="text-sm font-bold text-foreground">The new way to manage family work</span>
        </div>

        <h1 className="font-display text-5xl sm:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight text-foreground leading-[1.05] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both">
          Own your tasks.<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Rule your day.</span>
        </h1>

        <p className="text-lg sm:text-2xl text-muted-foreground font-medium max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both leading-snug">
          A shared workspace where parents coordinate and teens take charge. Claim jobs, earn points, and build initiative.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 fill-mode-both">
          <Button asChild size="lg" className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all rounded-[1rem] group active:scale-[0.98]">
            <Link href="/sign-up">
              Start Your Board
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-[1rem] bg-white hover:bg-black/5 hover:text-black border-border transition-all active:scale-[0.98]">
            <Link href="/sign-in">
              I have an invite code
            </Link>
          </Button>
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-in fade-in duration-1000 delay-500 fill-mode-both text-left">
          {[
            {
              icon: Rocket,
              color: "text-primary",
              bg: "bg-primary/10",
              title: "Claim & Conquer",
              desc: "Grab tasks from the shared board on your own time. No nagging required."
            },
            {
              icon: CheckCircle2,
              color: "text-accent",
              bg: "bg-accent/10",
              title: "Get Recognized",
              desc: "Submit your work for review. Earn points and see your contributions stack up."
            },
            {
              icon: Zap,
              color: "text-black",
              bg: "bg-black/5",
              title: "Level Up",
              desc: "Watch your stats grow as you take on more responsibility and build real initiative."
            }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col p-8 rounded-[2rem] bg-white border border-border shadow-sm hover:shadow-md transition-shadow group">
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="font-display text-2xl font-bold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
