import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetCurrentUser, useCreateFamily, useJoinFamily } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Home, KeyRound, ArrowRight, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

export default function Setup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: profile, isLoading: isProfileLoading, refetch } = useGetCurrentUser();
  const createFamily = useCreateFamily();
  const joinFamily = useJoinFamily();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");

  // Parent State
  const [familyName, setFamilyName] = useState("");
  const [children, setChildren] = useState([{ name: "" }]);

  // Child State
  const [joinCode, setJoinCode] = useState("");
  const [childId, setChildId] = useState("");

  if (isProfileLoading) return <FullScreenLoader />;

  useEffect(() => {
    if (profile?.family) setLocation("/app/today");
  }, [profile?.family, setLocation]);

  if (profile?.family) return null;

  const handleAddChild = () => {
    if (children.length < 3) {
      setChildren([...children, { name: "" }]);
    }
  };

  const handleRemoveChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleChildChange = (index: number, value: string) => {
    const newChildren = [...children];
    newChildren[index].name = value;
    setChildren(newChildren);
  };

  const handleCreateFamily = () => {
    const validChildren = children.filter(c => c.name.trim() !== "");
    if (!familyName.trim()) {
      toast({ title: "Family name required", variant: "destructive" });
      return;
    }
    if (validChildren.length === 0) {
      toast({ title: "Add at least one child", variant: "destructive" });
      return;
    }

    createFamily.mutate({ data: { name: familyName, children: validChildren } }, {
      onSuccess: () => {
        toast({ title: "Family created!" });
        refetch();
      },
      onError: (err: any) => {
        toast({ title: "Failed to create family", description: err.error || "Unknown error", variant: "destructive" });
      }
    });
  };

  const handleJoinFamily = () => {
    if (!joinCode.trim() || !childId.trim()) {
      toast({ title: "Join code and profile ID required", variant: "destructive" });
      return;
    }
    joinFamily.mutate({ data: { joinCode: joinCode.trim(), childId: childId.trim() } }, {
      onSuccess: () => {
        toast({ title: "Joined family successfully!" });
        refetch();
      },
      onError: (err: any) => {
        toast({ title: "Failed to join", description: err.error || "Unknown error", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 relative overflow-hidden selection:bg-primary/20">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-accent/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
      
      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-md">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8 invert brightness-0" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight">Almost there</h1>
          <p className="text-muted-foreground font-medium mt-2">Let's get your workspace set up.</p>
        </div>

        {mode === "choose" ? (
          <Card className="shadow-xl shadow-primary/5 border-border rounded-[1.5rem] overflow-hidden">
            <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
              <CardTitle className="text-xl">How are you joining?</CardTitle>
              <CardDescription className="text-sm">
                Choose the path that matches you. You can change a parent-default account into a child account by joining with your family details.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-6">
              <Button
                variant="outline"
                className="h-auto justify-start gap-3 rounded-xl p-4 text-left"
                onClick={() => setMode("create")}
              >
                <Home className="h-5 w-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-bold">I’m a parent</span>
                  <span className="block text-sm font-normal text-muted-foreground">Create a new family and add child profiles.</span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0" />
              </Button>
              <Button
                variant="outline"
                className="h-auto justify-start gap-3 rounded-xl p-4 text-left"
                onClick={() => setMode("join")}
              >
                <UserRound className="h-5 w-5 shrink-0 text-accent" />
                <span>
                  <span className="block font-bold">I’m joining as a child</span>
                  <span className="block text-sm font-normal text-muted-foreground">Enter your family join code and child profile ID.</span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0" />
              </Button>
            </CardContent>
          </Card>
        ) : mode === "create" ? (
          <Card className="shadow-xl shadow-primary/5 border-border rounded-[1.5rem] overflow-hidden">
            <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Home className="w-5 h-5 text-primary" />
                Create your workspace
              </CardTitle>
              <CardDescription className="text-sm">Give your family a name and set up profiles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="font-semibold text-foreground/80 text-xs uppercase tracking-wider">Family Name</Label>
                <Input 
                  placeholder="e.g. The Smiths" 
                  value={familyName} 
                  onChange={e => setFamilyName(e.target.value)}
                  className="h-12 bg-muted/50 border-border rounded-xl focus-visible:ring-primary/20 text-base"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="font-semibold text-foreground/80 text-xs uppercase tracking-wider">Teens / Children</Label>
                {children.map((child, index) => (
                  <div key={index} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <Input 
                      placeholder={`Name ${index + 1}`} 
                      value={child.name}
                      onChange={e => handleChildChange(index, e.target.value)}
                      className="h-12 bg-muted/50 border-border rounded-xl focus-visible:ring-primary/20 text-base"
                    />
                    {children.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveChild(index)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 h-12 w-12 rounded-xl">
                        &times;
                      </Button>
                    )}
                  </div>
                ))}
                {children.length < 5 && (
                  <Button variant="outline" size="sm" onClick={handleAddChild} className="w-full h-11 mt-2 border-dashed border-2 rounded-xl text-muted-foreground hover:text-foreground">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add another profile
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-6 px-6">
              <Button 
                className="w-full h-14 text-lg font-bold rounded-xl shadow-md shadow-primary/20 active:scale-[0.98] transition-all" 
                onClick={handleCreateFamily}
                disabled={createFamily.isPending}
              >
                {createFamily.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Workspace"}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="shadow-xl shadow-accent/5 border-border rounded-[1.5rem] overflow-hidden">
            <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-xl">
                <KeyRound className="w-5 h-5 text-accent" />
                Join as a child
              </CardTitle>
              <CardDescription className="text-sm">Use the join code and unlinked child profile ID from your parent. This also corrects accounts that were accidentally created with the parent default.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label className="font-semibold text-foreground/80 text-xs uppercase tracking-wider">Join Code</Label>
                <Input 
                  placeholder="e.g. ABCD123" 
                  value={joinCode} 
                  onChange={e => setJoinCode(e.target.value)}
                  className="h-12 bg-muted/50 border-border rounded-xl focus-visible:ring-accent/20 text-base uppercase font-mono tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-foreground/80 text-xs uppercase tracking-wider">Profile ID</Label>
                <Input 
                  placeholder="Ask your parent for this" 
                  value={childId} 
                  onChange={e => setChildId(e.target.value)}
                  className="h-12 bg-muted/50 border-border rounded-xl focus-visible:ring-accent/20 text-base font-mono"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-6 px-6">
              <Button 
                className="w-full h-14 text-lg font-bold rounded-xl shadow-md shadow-accent/20 active:scale-[0.98] transition-all bg-accent hover:bg-accent/90 text-white" 
                onClick={handleJoinFamily}
                disabled={joinFamily.isPending}
              >
                {joinFamily.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Enter Workspace <ArrowRight className="w-5 h-5 ml-2" /></>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
