import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { 
  Sun, 
  ClipboardList, 
  ClipboardCheck, 
  Sprout, 
  Users, 
  LogOut,
  Menu,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useGetCurrentUser } from "@workspace/api-client-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { data: profile } = useGetCurrentUser();
  
  const role = profile?.user?.role;
  const isParent = role === "parent";

  const navItems = [
    { name: "Today", path: "/app/today", icon: Sun },
    { name: "Board", path: "/app/board", icon: ClipboardList },
    ...(isParent ? [{ name: "Review", path: "/app/review", icon: ClipboardCheck }] : []),
    { name: "Contributions", path: "/app/contributions", icon: Sprout },
    { name: "Family", path: "/app/family", icon: Users },
  ];

  const NavigationLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.path;
        const Icon = item.icon;
        
        return (
          <Link key={item.path} href={item.path}>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold cursor-pointer group active:scale-[0.98] ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-primary-foreground" : ""}`} />
              <span className="hidden md:block sm:hidden lg:block">{item.name}</span>
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-background flex selection:bg-primary/20">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-20 lg:w-[260px] border-r border-border bg-card shadow-sm z-10 transition-all">
        <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
          <div className="w-10 h-10 bg-black rounded-[14px] flex items-center justify-center p-2 text-white shrink-0">
            <Zap className="w-6 h-6" fill="currentColor" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground hidden lg:block tracking-tight">Board</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-2">
          <NavigationLinks />
        </nav>

        <div className="p-4">
          <div className="flex items-center gap-3 px-2 py-3 lg:mb-2 bg-muted/30 rounded-xl border border-border/50">
            <img src={clerkUser?.imageUrl || "/logo.svg"} alt="Avatar" className="w-10 h-10 rounded-[10px] object-cover shrink-0 ml-1" />
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-bold truncate text-foreground">{profile?.user?.name || "User"}</p>
              <p className="text-xs font-medium text-muted-foreground truncate">{profile?.family?.name || ""}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start lg:px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-bold rounded-xl mt-2" 
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="w-5 h-5 lg:mr-3" />
            <span className="hidden lg:inline">Log out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-[80px] md:pb-0 overflow-hidden bg-background">
        {/* Mobile Top Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-4 bg-card border-b border-border shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center p-1.5 text-white">
              <Zap className="w-full h-full" fill="currentColor" />
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight">Board</h1>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-xl bg-muted/50">
                <Menu className="w-6 h-6 text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-card flex flex-col p-0 border-l-border">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="p-6 border-b border-border bg-muted/10 flex items-center gap-4">
                <img src={clerkUser?.imageUrl || "/logo.svg"} alt="Avatar" className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                <div>
                  <p className="text-lg font-bold text-foreground">{profile?.user?.name || "User"}</p>
                  <p className="text-sm font-medium text-muted-foreground">{profile?.family?.name || ""}</p>
                </div>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-2">
                <NavigationLinks />
              </nav>
              <div className="p-6 border-t border-border bg-muted/10">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-bold h-12 rounded-xl" 
                  onClick={() => signOut({ redirectUrl: "/" })}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto bg-background/50">
          <div className="max-w-4xl mx-auto w-full h-full animate-in fade-in duration-500">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] z-20 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}>
                  <div className={`p-1.5 rounded-[12px] transition-all ${isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : ""}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold mt-1 ${isActive ? "text-primary" : ""}`}>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
