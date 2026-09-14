import { useState } from "react";
import { useGetCurrentUser, useListJobs, useClaimJob, useCreateJob, useDeleteJob, Job, useListChildren, getListJobsQueryKey, getListChildrenQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Hand, Plus, Clock, Trash2, ClipboardList } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
      }
    }, {
      onSuccess: () => {
        toast({ title: "Job created!" });
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
        // reset
        setTitle("");
        setDescription("");
        setPoints("10");
        setType("board");
        setAssignedChildId("none");
        setEstimatedMinutes("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold shadow-sm">
          <Plus className="w-5 h-5 mr-2" /> New Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a Job</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Wash the car" />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Any special instructions?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Points</Label>
              <Input type="number" min="1" max="100" value={points} onChange={e => setPoints(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Est. Minutes (optional)</Label>
              <Input type="number" min="1" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} placeholder="15" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Job Type</Label>
            <Select value={type} onValueChange={(val: any) => setType(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="board">Shared Board (Anyone can claim)</SelectItem>
                <SelectItem value="assigned">Assigned to specific child</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === "assigned" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label>Assign To</Label>
              <Select value={assignedChildId} onValueChange={setAssignedChildId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Select Child --</SelectItem>
                  {childrenList.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createJob.isPending}>
            {createJob.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Job
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
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-all group overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors"></div>
      <CardHeader className="pb-3 pl-6">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{job.title}</CardTitle>
          <Badge variant="secondary" className="font-bold bg-primary/10 text-primary border-0">
            {job.points} pts
          </Badge>
        </div>
        {job.description && (
          <CardDescription className="mt-2 text-sm">{job.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-3 pl-6">
        <div className="flex items-center text-xs text-muted-foreground gap-3">
          {job.estimatedMinutes && (
            <div className="flex items-center bg-muted px-2 py-1 rounded-md">
              <Clock className="w-3 h-3 mr-1" /> {job.estimatedMinutes} min
            </div>
          )}
          <span className="text-slate-400">Added {new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
      {role === "child" && (
        <CardFooter className="pl-6 pt-0">
          <Button 
            className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 shadow-none" 
            onClick={handleClaim} 
            disabled={claimJob.isPending}
          >
            {claimJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Hand className="w-4 h-4 mr-2" /> Claim Job</>}
          </Button>
        </CardFooter>
      )}
      {role === "parent" && (
        <CardFooter className="pl-6 pt-0">
          <Button 
            variant="ghost" 
            className="w-full text-destructive hover:bg-destructive/10" 
            onClick={handleDelete} 
            disabled={deleteJob.isPending}
          >
            {deleteJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-2" /> Delete</>}
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
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Job Board</h1>
          <p className="text-muted-foreground mt-1">
            Extra jobs anyone can claim for bonus points.
          </p>
        </div>
        {isParent && childrenList && (
          <CreateJobDialog childrenList={childrenList} />
        )}
      </div>

      {isJobsLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : jobs && jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(job => (
            <BoardJobCard key={job.id} job={job} role={role || "child"} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-border/60 max-w-2xl mx-auto mt-8">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">The board is empty</h3>
          <p className="text-muted-foreground">
            {isParent ? "Create some new jobs to get things moving!" : "Check back later for more opportunities to earn points."}
          </p>
        </div>
      )}
    </div>
  );
}
