import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Heart, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col overflow-hidden relative">
      {/* Decorative backgrounds */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-secondary/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 z-0 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 w-[80vw] h-[80vw] bg-accent/30 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 z-0 pointer-events-none"></div>

      <header className="px-6 py-6 lg:px-12 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-border flex items-center justify-center p-2">
            <img src="/logo.svg" alt="Logo" className="w-full h-full" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">Family Job Board</span>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="font-semibold hidden sm:flex">
            <Link href="/sign-in">Log In</Link>
          </Button>
          <Button asChild className="font-semibold shadow-sm">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:py-24 text-center z-10 max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="text-sm font-semibold text-foreground">A new way to manage family work</span>
        </div>

        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both">
          Build initiative, <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">not resentment.</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both leading-relaxed">
          A cheerful, shared space where parents coordinate household jobs and kids discover the satisfaction of contributing to the family.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 fill-mode-both">
          <Button asChild size="lg" className="h-14 px-8 text-lg font-bold shadow-md hover:shadow-lg transition-all rounded-2xl group">
            <Link href="/sign-up">
              Start Your Family Board
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-2xl bg-white/50 backdrop-blur-sm">
            <Link href="/sign-in">
              I have an invite code
            </Link>
          </Button>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full animate-in fade-in duration-1000 delay-500 fill-mode-both">
          {[
            {
              icon: CheckCircle,
              color: "text-primary",
              bg: "bg-primary/10",
              title: "Clear Expectations",
              desc: "Assign jobs to specific kids or put them on the shared board for anyone to claim."
            },
            {
              icon: Heart,
              color: "text-secondary",
              bg: "bg-secondary/10",
              title: "Positive Reinforcement",
              desc: "Review completed work and award points to build a sense of pride and accomplishment."
            },
            {
              icon: Star,
              color: "text-orange-500",
              bg: "bg-orange-500/10",
              title: "Track Growth",
              desc: "Watch as kids take on more voluntary jobs and build initiative over time."
            }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 rounded-3xl bg-white border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
