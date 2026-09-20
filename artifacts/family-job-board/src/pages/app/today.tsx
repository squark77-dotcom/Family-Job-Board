import { useGetCurrentUser, useGetDashboard, useListJobs, useStartJob, useCompleteJob, useDeleteJob, useRemindJob, Job, JobStatus, getGetDashboardQueryKey, getListJobsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlayCircle, CheckCircle2, Clock, CheckCircle, Trash2, ArrowRight, Bell } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { playCompletionSound } from "@/lib/sound-effects";

function JobCard({ job, role }: { job: Job; role: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const startJob = useStartJob();
  const deleteJob = useDeleteJob();
  const completeJob = useCompleteJob();
  const remindJob = useRemindJob();

  const handleStart = () => {
    startJob.mutate({ jobId: job.id }, {
      onSuccess: () => {
        toast({ title: "Job started!" });
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
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

  const handleComplete = () => {
    completeJob.mutate({ jobId: job.id }, {
      onSuccess: () => {
        playCompletionSound();
        toast({
          title: "Great work — sent for check-off!",
          description: "Your parent or family owner can now review it.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      }
    });
  };

  const handleRemind = () => {
    remindJob.mutate({ jobId: job.id }, {
      onSuccess: () => toast({ title: "Reminder sent", description: "The child will receive a push notification." }),
      onError: (error: any) => toast({ title: "Could not send reminder", description: error?.error ?? "Push notifications are not enabled.", variant: "destructive" }),
    });
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case "to_do": return "bg-muted text-muted-foreground";
      case "claimed": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "in_progress": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "ready_for_review": return "bg-primary/10 text-primary";
      case "changes_requested": return "bg-destructive/10 text-destructive";
      case "completed": return "bg-accent/10 text-accent";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-all group overflow-hidden rounded-[1.25rem]">
      <CardHeader className="pb-3 px-5 pt-5">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{job.title}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-primary bg-primary/5 px-2 py-1 rounded-md text-xs">{job.points} pts</span>
          </div>
        </div>
        {job.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
        )}
      </CardHeader>
      <CardContent className="pb-4 px-5">
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="secondary" className={`border-0 font-bold ${getStatusColor(job.status)}`}>
            {formatStatus(job.status)}
          </Badge>
          {job.occurrenceTotal > 1 && (
            <Badge variant="secondary" className="border-0 bg-primary/10 text-primary font-bold">
              Run {job.occurrenceNumber} of {job.occurrenceTotal}
            </Badge>
          )}
          {job.estimatedMinutes && (
            <div className="flex items-center text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md">
              <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" />
              {job.estimatedMinutes}m
            </div>
          )}
          {job.type === "assigned" && role === "parent" && job.assignedChildName && (
            <div className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md">
              {job.assignedChildName}
            </div>
          )}
          {job.type === "board" && role === "parent" && job.claimedByChildName && (
            <div className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md">
              {job.claimedByChildName}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-5 pb-5 pt-0 flex gap-2">
        {role === "child" && (
          <>
            {(job.status === "claimed" || job.status === "to_do" || job.status === "changes_requested") && (
              <Button 
                className="w-full font-bold h-10 shadow-sm rounded-xl active:scale-95 transition-all" 
                onClick={handleStart} 
                disabled={startJob.isPending}
              >
                {startJob.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                Start Job
              </Button>
            )}
            {job.status === "in_progress" && (
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 shadow-sm rounded-xl active:scale-95 transition-all" 
                onClick={handleComplete} 
                disabled={completeJob.isPending}
              >
                {completeJob.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Complete & Send for Check-off
              </Button>
            )}
          </>
        )}

        {role === "parent" && (
          <>
            {job.status === "ready_for_review" && (
              <Button variant="secondary" className="w-full font-bold h-10 rounded-xl" asChild>
                <a href="/app/review">Review <ArrowRight className="w-4 h-4 ml-2" /></a>
              </Button>
            )}
            {(job.status === "to_do" || job.status === "claimed" || job.status === "in_progress" || job.status === "changes_requested") &&
              (job.assignedChildId || job.claimedByChildId) && (
              <Button variant="outline" className="h-10 rounded-xl font-bold" onClick={handleRemind} disabled={remindJob.isPending}>
                {remindJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Bell className="w-4 h-4 mr-2" /> Remind</>}
              </Button>
            )}
            {(job.status === "to_do" || job.status === "claimed" || job.status === "changes_requested") && (
              <Button variant="ghost" size="icon" className="ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-10 w-10 shrink-0" onClick={handleDelete} disabled={deleteJob.isPending}>
                {deleteJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export default function Today() {
  const { data: profile } = useGetCurrentUser();
  const isParent = profile?.user?.role === "parent";

  const { data: dashboard, isLoading: isDashboardLoading } = useGetDashboard({ 
    query: { enabled: isParent, queryKey: getGetDashboardQueryKey() } 
  });

  const { data: jobs, isLoading: isJobsLoading } = useListJobs(
    isParent ? {} : { childId: profile?.user?.id, status: undefined },
    { query: { enabled: !!profile, queryKey: getListJobsQueryKey(isParent ? {} : { childId: profile?.user?.id, status: undefined }) } }
  );

  const activeJobs = jobs?.filter(j => 
    isParent ? j.status !== "completed" : j.status !== "completed"
  ) || [];

  if (isParent && isDashboardLoading) {
    return <div className="flex p-8 justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!isParent && isJobsLoading) {
    return <div className="flex p-8 justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight">Today</h1>
          <p className="text-muted-foreground font-medium mt-1">
            {format(new Date(), "EEEE, MMMM do")}
          </p>
        </div>
      </div>

      {isParent && dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-card border-border shadow-sm rounded-[1.25rem]">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-display font-extrabold text-primary">{dashboard.today.outstanding}</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">Outstanding</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm rounded-[1.25rem]">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-display font-extrabold text-amber-500">{dashboard.today.changesRequested}</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">Needs Change</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm rounded-[1.25rem]">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-display font-extrabold text-purple-500">{dashboard.today.awaitingReview}</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">To Review</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm rounded-[1.25rem]">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-display font-extrabold text-accent">{dashboard.today.completed}</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">Completed</span>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          {isParent ? "Active Jobs" : "My Jobs"}
        </h2>
        
        {activeJobs.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-[2rem] border-2 border-dashed border-border/60">
            <CheckCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-foreground">All caught up!</h3>
            <p className="text-muted-foreground font-medium mt-1">No active jobs right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeJobs.map(job => (
              <JobCard key={job.id} job={job} role={profile?.user?.role || "child"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}