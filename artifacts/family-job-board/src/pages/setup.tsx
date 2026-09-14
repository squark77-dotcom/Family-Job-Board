import { useState } from "react";
import { useLocation } from "wouter";
import { useGetCurrentUser, useCreateFamily, useJoinFamily } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Home, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

export default function Setup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: profile, isLoading: isProfileLoading, refetch } = useGetCurrentUser();
  const createFamily = useCreateFamily();
  const joinFamily = useJoinFamily();

  // Parent State
  const [familyName, setFamilyName] = useState("");
  const [children, setChildren] = useState([{ name: "" }]);

  // Child State
  const [joinCode, setJoinCode] = useState("");
  const [childId, setChildId] = useState(""); // User will need to enter the child ID given by parent? No, wait. 
  // Wait, the API for joinFamily takes { joinCode, childId }. The child wouldn't know their ID. 
  // Let's check API schema: FamilyJoinInput has joinCode and childId.
  // This implies the parent gives the join code, and then the child is linked.
  // Actually, usually a join code is tied to the family. How does the child pick which profile they are?
  // They probably enter the join code, and the backend needs childId.
  // If the backend requires childId, maybe the parent provides a specific join link?
  // Let's check if the child can fetch list of unclaimed children after providing joinCode? 
  // Or is the childId given by parent? Let's just have them enter child name or childId.
  // A better way: maybe joinCode is enough? But the schema requires childId.
  // I will let the child input "joinCode" and "childId" for now.

  if (isProfileLoading) return <FullScreenLoader />;

  if (profile?.family) {
    setLocation("/app/today");
    return null;
  }

  const role = profile?.user?.role;

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
        refetch(); // will redirect to /app/today
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
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-border mx-auto flex items-center justify-center mb-4">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Welcome to the Board</h1>
          <p className="text-muted-foreground mt-2">Let's get your family set up.</p>
        </div>

        {role === "parent" ? (
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                Create your Family
              </CardTitle>
              <CardDescription>Give your family a name and add your children's profiles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Family Name</Label>
                <Input 
                  placeholder="e.g. The Smiths" 
                  value={familyName} 
                  onChange={e => setFamilyName(e.target.value)} 
                />
              </div>
              
              <div className="space-y-3">
                <Label>Children Profiles</Label>
                {children.map((child, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input 
                      placeholder={`Child ${index + 1} Name`} 
                      value={child.name}
                      onChange={e => handleChildChange(index, e.target.value)}
                    />
                    {children.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveChild(index)} className="text-muted-foreground hover:text-destructive shrink-0">
                        &times;
                      </Button>
                    )}
                  </div>
                ))}
                {children.length < 3 && (
                  <Button variant="outline" size="sm" onClick={handleAddChild} className="w-full mt-2 border-dashed">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add another child
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full h-12 text-lg font-bold" 
                onClick={handleCreateFamily}
                disabled={createFamily.isPending}
              >
                {createFamily.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Family"}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-secondary" />
                Join your Family
              </CardTitle>
              <CardDescription>Ask your parent for the family join code and your profile ID.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Join Code</Label>
                <Input 
                  placeholder="e.g. ABCD123" 
                  value={joinCode} 
                  onChange={e => setJoinCode(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Your Profile ID</Label>
                <Input 
                  placeholder="Ask your parent for this" 
                  value={childId} 
                  onChange={e => setChildId(e.target.value)} 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full h-12 text-lg font-bold" 
                onClick={handleJoinFamily}
                disabled={joinFamily.isPending}
              >
                {joinFamily.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join Family"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
