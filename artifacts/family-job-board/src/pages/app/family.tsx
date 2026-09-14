import { useState } from "react";
import { useGetCurrentUser, useUpdateFamily, useListChildren, useCreateChild, useUpdateChild, useAwardBonus, getListChildrenQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, UserPlus, Gift, Copy, Check } from "lucide-react";
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
        <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50">
          <Gift className="w-4 h-4 mr-2" /> Give Bonus
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Award Bonus Points</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Points to award</Label>
            <Input type="number" min="1" max="100" value={points} onChange={e => setPoints(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Helped sibling with homework" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAward} disabled={awardBonus.isPending}>
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
  
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    createChild.mutate({
      data: { name }
    }, {
      onSuccess: () => {
        toast({ title: "Child profile added" });
        setOpen(false);
        setName("");
        queryClient.invalidateQueries({ queryKey: ["/api/family/children"] });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-dashed">
          <UserPlus className="w-4 h-4 mr-2" /> Add Child Profile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Child Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Child's name" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={createChild.isPending}>
            {createChild.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Family() {
  const { data: profile, refetch: refetchProfile } = useGetCurrentUser();
  const role = profile?.user?.role;
  const isParent = role === "parent";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: childrenList, isLoading: isChildrenLoading } = useListChildren({ query: { enabled: isParent, queryKey: getListChildrenQueryKey() } });
  const updateFamily = useUpdateFamily();

  const [familyName, setFamilyName] = useState(profile?.family?.name || "");
  const [copied, setCopied] = useState(false);

  const handleUpdateFamily = () => {
    updateFamily.mutate({ data: { name: familyName } }, {
      onSuccess: () => {
        toast({ title: "Family updated" });
        refetchProfile();
      }
    });
  };

  const copyJoinCode = () => {
    if (profile?.family?.joinCode) {
      navigator.clipboard.writeText(profile.family.joinCode);
      setCopied(true);
      toast({ title: "Join code copied!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Family Settings</h1>
        <p className="text-muted-foreground mt-1">
          {isParent ? "Manage your family and profiles." : "Your family info."}
        </p>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Family Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label>Family Name</Label>
            {isParent ? (
              <div className="flex gap-2">
                <Input value={familyName} onChange={e => setFamilyName(e.target.value)} />
                <Button onClick={handleUpdateFamily} disabled={updateFamily.isPending || familyName === profile?.family?.name}>
                  {updateFamily.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-muted rounded-lg font-medium">{profile?.family?.name}</div>
            )}
          </div>

          {isParent && profile?.family?.joinCode && (
            <div className="space-y-2 max-w-md pt-4 border-t border-border">
              <Label>Family Join Code</Label>
              <CardDescription>Share this code with your children so they can link their accounts.</CardDescription>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-lg font-bold text-center tracking-widest">
                  {profile.family.joinCode}
                </code>
                <Button variant="outline" size="icon" onClick={copyJoinCode} className="h-12 w-12 shrink-0">
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isParent && (
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Children Profiles</CardTitle>
            <CardDescription>Manage profiles for your children.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isChildrenLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : childrenList && childrenList.length > 0 ? (
              <div className="space-y-3">
                {childrenList.map(child => (
                  <div key={child.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-white shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                        <span className="font-bold text-secondary">{child.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{child.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                            ID: {child.id.substring(0, 8)}...
                          </span>
                          {child.linked ? (
                            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-md flex items-center">
                              <Check className="w-3 h-3 mr-1" /> Linked
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                              Not linked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BonusDialog childId={child.id} childName={child.name} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No children profiles yet.</p>
            )}
          </CardContent>
          {childrenList && childrenList.length < 5 && (
            <CardFooter>
              <CreateChildDialog />
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
