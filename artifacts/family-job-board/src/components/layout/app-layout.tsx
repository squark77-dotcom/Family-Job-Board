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
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium cursor-pointer ${
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span className="hidden md:block sm:hidden lg:block">{item.name}</span>
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-20 lg:w-64 border-r border-border bg-white shadow-sm z-10 transition-all">
        <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start gap-3">
          <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
          <h1 className="font-display font-bold text-xl text-foreground hidden lg:block">Job Board</h1>
        </div>
        
        <nav className="flex-1 px-3 space-y-2 mt-4">
          <NavigationLinks />
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 lg:mb-2">
            <img src={clerkUser?.imageUrl || "/logo.svg"} alt="Avatar" className="w-8 h-8 rounded-full border border-border" />
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-bold truncate text-foreground">{profile?.user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.family?.name || ""}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start lg:px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="w-5 h-5 lg:mr-3" />
            <span className="hidden lg:inline">Log out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-border shadow-sm z-10">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
            <h1 className="font-display font-bold text-lg">Job Board</h1>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-6 h-6 text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-white flex flex-col p-0">
              <div className="p-6 border-b border-border flex items-center gap-3">
                <img src={clerkUser?.imageUrl || "/logo.svg"} alt="Avatar" className="w-12 h-12 rounded-full border border-border" />
                <div>
                  <p className="text-base font-bold text-foreground">{profile?.user?.name || "User"}</p>
                  <p className="text-sm text-muted-foreground">{profile?.family?.name || ""}</p>
                </div>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-2">
                <NavigationLinks />
              </nav>
              <div className="p-4 border-t border-border">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
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
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.04)] z-20 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}>
                  <div className={`p-1 rounded-full ${isActive ? "bg-primary/10" : ""}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-medium mt-1">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
