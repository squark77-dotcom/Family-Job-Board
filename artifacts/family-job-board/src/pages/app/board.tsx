import { useState } from "react";
import { useGetCurrentUser, useListJobs, useClaimJob, useCreateJob, useDeleteJob, Job, useListChildren, getListJobsQueryKey, getListChildrenQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Hand, Plus, Clock, Trash2, ClipboardList, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { playClaimSound } from "@/lib/sound-effects";

function CreateJobDialog({ childrenList }: { childrenList: any[] }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createJob = useCreateJob();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("10");
  const [type, setType] = useState<"assigned" | "board">("board");
  const [assignedChildId, setAssignedChildId] = useState<string>("none");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [dailyRuns, setDailyRuns] = useState<"1" | "2">("1");

  const handleSubmit = () => {
    if (!title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    createJob.mutate({
      data: {
        title,
        description: description || undefined,
        points: parseInt(points, 10),
        type,
        assignedChildId: type === "assigned" && assignedChildId !== "none" ? assignedChildId : undefined,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
        dailyRuns: parseInt(dailyRuns, 10),
      }
    }, {
      onSuccess: () => {
        toast({
          title: dailyRuns === "2" ? "Two daily runs created!" : "Job created!",
          description:
            dailyRuns === "2"
              ? "Each run can be claimed and checked off separately."
              : undefined,
        });
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
        // reset
        setTitle("");
        setDescription("");
        setPoints("10");
        setType("board");
        setAssignedChildId("none");
        setEstimatedMinutes("");
        setDailyRuns("1");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold shadow-md shadow-primary/20 rounded-xl h-11 px-5 active:scale-95 transition-all">
          <Plus className="w-5 h-5 mr-2" /> New Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[1.5rem] p-6 border-border shadow-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">Create a Job</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Title</Label>
            <Input className="h-11 rounded-xl bg-muted/50 border-border" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Wash the car" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Description (optional)</Label>
            <Textarea className="rounded-xl bg-muted/50 border-border min-h-[80px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Any special instructions?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Points</Label>
              <Input className="h-11 rounded-xl bg-muted/50 border-border font-bold text-primary" type="number" min="1" max="100" value={points} onChange={e => setPoints(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Est. Minutes</Label>
              <Input className="h-11 rounded-xl bg-muted/50 border-border font-bold" type="number" min="1" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} placeholder="15" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Times Today</Label>
            <Select value={dailyRuns} onValueChange={(value: "1" | "2") => setDailyRuns(value)}>
              <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="1" className="font-medium rounded-lg">Once today</SelectItem>
                <SelectItem value="2" className="font-medium rounded-lg">Twice today — separate people can claim</SelectItem>
              </SelectContent>
            </Select>
            {dailyRuns === "2" && type === "assigned" && (
              <p className="text-xs text-muted-foreground">
                Assigned jobs create two runs for the same teen. Use the Shared Board if different people should claim them.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Job Type</Label>
            <Select value={type} onValueChange={(v: "board"|"assigned") => setType(v)}>
              <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border font-semibold">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="board" className="font-medium rounded-lg">Shared Board (Anyone can claim)</SelectItem>
                <SelectItem value="assigned" className="font-medium rounded-lg">Assigned to specific teen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === "assigned" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Assign To</Label>
              <Select value={assignedChildId} onValueChange={setAssignedChildId}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border font-semibold">
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none" className="font-medium rounded-lg">-- Select Profile --</SelectItem>
                  {childrenList.map(c => (
                    <SelectItem key={c.id} value={c.id} className="font-medium rounded-lg">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter className="mt-6">
          <Button className="w-full h-12 font-bold rounded-xl active:scale-[0.98] transition-all" onClick={handleSubmit} disabled={createJob.isPending}>
            {createJob.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Save Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function BoardJobCard({ job, role }: { job: Job; role: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const claimJob = useClaimJob();
  const deleteJob = useDeleteJob();

  const handleClaim = () => {
    claimJob.mutate({ jobId: job.id }, {
      onSuccess: () => {
        playClaimSound();
        toast({ title: "Job claimed!", description: "It's now on your Today list." });
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      },
      onError: (err: any) => {
        toast({ title: "Failed to claim", description: err.error, variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this job?")) {
      deleteJob.mutate({ jobId: job.id }, {
        onSuccess: () => {
          toast({ title: "Job deleted" });
          queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        }
      });
    }
  };

  return (
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-all group overflow-hidden relative rounded-[1.25rem]">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-primary/20 group-hover:bg-primary transition-colors"></div>
      <CardHeader className="pb-3 pl-6 pr-5 pt-5">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{job.title}</CardTitle>
          <div className="shrink-0 bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-md text-xs flex items-center shadow-sm">
            <Zap className="w-3 h-3 mr-1 fill-primary" /> {job.points} pts
          </div>
        </div>
        {job.description && (
          <CardDescription className="mt-2 text-sm text-muted-foreground/80 line-clamp-2">{job.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-4 pl-6 pr-5">
        <div className="flex items-center text-xs font-bold text-muted-foreground gap-3">
          {job.occurrenceTotal > 1 && (
            <Badge variant="secondary" className="border-0 bg-primary/10 text-primary font-bold">
              Run {job.occurrenceNumber} of {job.occurrenceTotal}
            </Badge>
          )}
          {job.estimatedMinutes && (
            <div className="flex items-center bg-muted/50 px-2.5 py-1.5 rounded-md">
              <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {job.estimatedMinutes}m
            </div>
          )}
          <span className="text-muted-foreground/50 uppercase tracking-wider text-[10px]">Added {new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
      {role === "child" && (
        <CardFooter className="pl-6 pr-5 pb-5 pt-0">
          <Button 
            className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-11 rounded-xl shadow-sm shadow-accent/20 active:scale-95 transition-all" 
            onClick={handleClaim} 
            disabled={claimJob.isPending}
          >
            {claimJob.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Hand className="w-5 h-5 mr-2" /> Claim Job</>}
          </Button>
        </CardFooter>
      )}
      {role === "parent" && (
        <CardFooter className="pl-6 pr-5 pb-5 pt-0">
          <Button 
            variant="ghost" 
            className="w-full text-destructive hover:bg-destructive/10 font-bold h-11 rounded-xl" 
            onClick={handleDelete} 
            disabled={deleteJob.isPending}
          >
            {deleteJob.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Trash2 className="w-5 h-5 mr-2" /> Delete</>}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default function Board() {
  const { data: profile } = useGetCurrentUser();
  const role = profile?.user?.role;
  const isParent = role === "parent";

  const { data: jobs, isLoading: isJobsLoading } = useListJobs(
    { type: "board", status: "to_do" },
    { query: { enabled: !!profile, queryKey: getListJobsQueryKey({ type: "board", status: "to_do" }) } }
  );

  const { data: childrenList } = useListChildren({ query: { enabled: isParent, queryKey: getListChildrenQueryKey() } });

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight">Job Board</h1>
          <p className="text-muted-foreground font-medium mt-1">
            Extra tasks anyone can claim for bonus points.
          </p>
        </div>
        {isParent && childrenList && (
          <CreateJobDialog childrenList={childrenList} />
        )}
      </div>

      {isJobsLoading ? (
        <div className="flex justify-center p-8 mt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : jobs && jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {jobs.map(job => (
            <BoardJobCard key={job.id} job={job} role={role || "child"} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/50 max-w-2xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-card rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
            <ClipboardList className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground mb-2 tracking-tight">The board is empty</h3>
          <p className="text-muted-foreground font-medium text-lg">
            {isParent ? "Create some new jobs to get things moving." : "Check back later for more opportunities."}
          </p>
        </div>
      )}
    </div>
  );
}