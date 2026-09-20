import { useState } from "react";
import { useGetCurrentUser, useUpdateFamily, useListChildren, useCreateChild, useAwardBonus, useCreateFamilyInvitation, getListChildrenQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Gift, Copy, Check, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

function BonusDialog({ childId, childName }: { childId: string, childName: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const awardBonus = useAwardBonus();
  
  const [points, setPoints] = useState("10");
  const [reason, setReason] = useState("");

  const handleAward = () => {
    if (!reason) {
      toast({ title: "Reason is required", variant: "destructive" });
      return;
    }
    awardBonus.mutate({
      data: { childId, points: parseInt(points, 10), reason }
    }, {
      onSuccess: () => {
        toast({ title: `Awarded ${points} points to ${childName}!` });
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/points"] });
        queryClient.invalidateQueries({ queryKey: ["/api/family/children"] });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-accent border-accent/20 hover:bg-accent/10 hover:text-accent font-bold rounded-xl shadow-sm h-10 active:scale-95 transition-all">
          <Gift className="w-4 h-4 mr-2" /> Give Bonus
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[1.5rem] p-6 border-border shadow-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">Award Bonus Points</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Points to award</Label>
            <Input className="h-11 rounded-xl bg-muted/50 border-border font-bold text-accent" type="number" min="1" max="100" value={points} onChange={e => setPoints(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Reason</Label>
            <Input className="h-11 rounded-xl bg-muted/50 border-border" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Extra help today" />
          </div>
        </div>
        <DialogFooter className="mt-6 flex gap-3">
          <Button variant="ghost" className="rounded-xl font-bold h-11" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="rounded-xl font-bold h-11 px-6 shadow-md shadow-accent/20 bg-accent hover:bg-accent/90 text-white" onClick={handleAward} disabled={awardBonus.isPending}>
            {awardBonus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Award Points
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateChildDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createChild = useCreateChild();
  const invite = useCreateFamilyInvitation();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleCreate = () => {
    if (!name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    createChild.mutate({
      data: { name }
    }, {
      onSuccess: (child) => {
        if (email.trim()) {
          invite.mutate({
            data: { email: email.trim(), kind: "child", childId: child.id },
          });
        }
        toast({ title: email.trim() ? "Profile added and invite sent" : "Profile added" });
        setOpen(false);
        setName("");
        setEmail("");
        queryClient.invalidateQueries({ queryKey: ["/api/family/children"] });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-dashed border-2 rounded-xl h-12 text-muted-foreground font-bold hover:text-foreground active:scale-[0.98] transition-all">
          <UserPlus className="w-5 h-5 mr-2" /> Add Teen Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[1.5rem] p-6 border-border shadow-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">Add Profile</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground block mb-2">Name</Label>
          <Input className="h-11 rounded-xl bg-muted/50 border-border" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex" autoFocus />
          <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground block mb-2 mt-4">Email invite (optional)</Label>
          <Input className="h-11 rounded-xl bg-muted/50 border-border" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@example.com" type="email" />
        </div>
        <DialogFooter className="mt-6">
          <Button className="w-full rounded-xl font-bold h-12 shadow-md shadow-primary/20 active:scale-[0.98] transition-all" onClick={handleCreate} disabled={createChild.isPending}>
            {createChild.isPending && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            Save Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ParentInviteDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const invite = useCreateFamilyInvitation();
  const handleInvite = () => {
    if (!email.trim()) return;
    invite.mutate({ data: { email: email.trim(), kind: "parent" } }, {
      onSuccess: () => {
        toast({ title: "Co-parent invite sent" });
        setEmail("");
        setOpen(false);
      },
      onError: (error: any) => toast({ title: "Could not send invite", description: error?.error, variant: "destructive" }),
    });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl font-bold"><Users className="w-4 h-4 mr-2" /> Invite co-parent</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[1.5rem] p-6">
        <DialogHeader><DialogTitle>Invite a co-parent</DialogTitle></DialogHeader>
        <Label>Email address</Label>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="parent@example.com" />
        <DialogFooter><Button onClick={handleInvite} disabled={invite.isPending || !email.trim()}>{invite.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Send invite</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Family() {
  const { toast } = useToast();
  const { data: profile, refetch: refetchProfile } = useGetCurrentUser();
  const updateFamily = useUpdateFamily();
  
  const role = profile?.user?.role;
  const isParent = role === "parent";

  const [familyName, setFamilyName] = useState(profile?.family?.name || "");
  const [copied, setCopied] = useState(false);

  const { data: childrenList, isLoading: isChildrenLoading } = useListChildren({ 
    query: { enabled: isParent, queryKey: getListChildrenQueryKey() } 
  });

  const handleUpdateFamily = () => {
    if (!familyName.trim()) return;
    updateFamily.mutate({ data: { name: familyName } }, {
      onSuccess: () => {
        toast({ title: "Workspace updated" });
        refetchProfile();
      }
    });
  };

  const copyJoinCode = () => {
    if (profile?.family?.joinCode) {
      navigator.clipboard.writeText(profile.family.joinCode);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground font-medium mt-1">
            Manage your shared workspace.
          </p>
        </div>
        {isParent && <ParentInviteDialog />}
      </div>

      <Card className="shadow-sm border-border rounded-[1.5rem] overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/50 pb-5 pt-6 px-6">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Users className="w-6 h-6 text-primary" />
            Workspace Info
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2 max-w-md">
            <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Workspace Name</Label>
            {isParent ? (
              <div className="flex gap-2">
                <Input 
                  value={familyName} 
                  onChange={e => setFamilyName(e.target.value)} 
                  className="h-11 rounded-xl bg-muted/50 border-border font-bold text-base"
                />
                <Button className="h-11 rounded-xl font-bold shadow-md shadow-primary/20 active:scale-95 transition-all" onClick={handleUpdateFamily} disabled={updateFamily.isPending || familyName === profile?.family?.name}>
                  {updateFamily.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
                </Button>
              </div>
            ) : (
              <div className="p-3.5 bg-muted/50 border border-border/50 rounded-xl font-bold text-lg">{profile?.family?.name}</div>
            )}
          </div>

          {isParent && profile?.family?.joinCode && (
            <div className="space-y-3 max-w-md pt-6 border-t border-border/50">
              <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Join Code</Label>
              <CardDescription className="text-sm">Share this code with your teens so they can link their accounts.</CardDescription>
              <div className="flex items-center gap-3">
                <code className="flex-1 p-3.5 bg-muted/50 border border-border/50 rounded-xl font-mono text-xl font-bold text-center tracking-[0.2em] uppercase">
                  {profile.family.joinCode}
                </code>
                <Button variant="outline" size="icon" onClick={copyJoinCode} className="h-14 w-14 shrink-0 rounded-xl hover:bg-muted active:scale-95 transition-all">
                  {copied ? <Check className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6 text-foreground" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isParent && (
        <Card className="shadow-sm border-border rounded-[1.5rem] overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/50 pb-5 pt-6 px-6">
            <CardTitle className="text-xl font-bold">Teens</CardTitle>
            <CardDescription className="text-sm">Manage profiles and IDs.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isChildrenLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : childrenList && childrenList.length > 0 ? (
              <div className="space-y-4">
                {childrenList.map(child => (
                  <div key={child.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-[14px] flex items-center justify-center shrink-0 border border-border">
                        <span className="font-display font-bold text-xl text-foreground">{child.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-foreground">{child.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md font-mono">
                            ID: {child.id}
                          </span>
                          {child.linked ? (
                            <span className="text-[10px] uppercase tracking-wider font-bold text-green-700 bg-green-500/10 px-2 py-1 rounded-md flex items-center">
                              <Check className="w-3 h-3 mr-1" /> Linked
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-500/10 px-2 py-1 rounded-md">
                              Not linked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      <BonusDialog childId={child.id} childName={child.name} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10 font-medium">No profiles yet.</p>
            )}
          </CardContent>
          {childrenList && childrenList.length < 10 && (
            <CardFooter className="px-6 pb-6 pt-0">
              <CreateChildDialog />
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
