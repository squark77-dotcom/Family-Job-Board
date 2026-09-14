import { useGetCurrentUser, useGetDashboard, useListJobs, useStartJob, useCompleteJob, useSubmitJob, useDeleteJob, Job, JobStatus, getGetDashboardQueryKey, getListJobsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlayCircle, CheckCircle2, Send, Clock, CheckCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

function JobCard({ job, role }: { job: Job; role: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const startJob = useStartJob();
  const submitJob = useSubmitJob();
  const deleteJob = useDeleteJob();
  const completeJob = useCompleteJob();

  const handleStart = () => {
    startJob.mutate({ jobId: job.id }, {
      onSuccess: () => {
        toast({ title: "Job started!" });
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      }
    });
  };

  const handleSubmit = () => {
    submitJob.mutate({ jobId: job.id }, {
      onSuccess: () => {
        toast({ title: "Submitted for review!" });
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
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
        toast({ title: "Job completed" });
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      }
    });
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case "to_do": return "bg-slate-100 text-slate-700";
      case "claimed": return "bg-blue-100 text-blue-700";
      case "in_progress": return "bg-amber-100 text-amber-700";
      case "ready_for_review": return "bg-purple-100 text-purple-700";
      case "changes_requested": return "bg-red-100 text-red-700";
      case "completed": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg leading-tight">{job.title}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">{job.points} pts</span>
          </div>
        </div>
        {job.description && (
          <p className="text-sm text-muted-foreground mt-1">{job.description}</p>
        )}
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={`border-0 ${getStatusColor(job.status)}`}>
            {formatStatus(job.status)}
          </Badge>
          {job.estimatedMinutes && (
            <div className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
              <Clock className="w-3 h-3 mr-1" />
              {job.estimatedMinutes} min
            </div>
          )}
          {job.type === "board" && (
            <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
              Bonus Job
            </Badge>
          )}
          {role === "parent" && job.claimedByChildName && (
            <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
              {job.claimedByChildName}
            </div>
          )}
          {role === "parent" && !job.claimedByChildName && job.assignedChildName && (
            <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
              {job.assignedChildName}
            </div>
          )}
        </div>
      </CardContent>
      {role === "child" && (
        <CardFooter className="pt-0">
          {(job.status === "to_do" || job.status === "claimed") && (
            <Button className="w-full" onClick={handleStart} disabled={startJob.isPending}>
              {startJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><PlayCircle className="w-4 h-4 mr-2" /> Start Job</>}
            </Button>
          )}
          {(job.status === "in_progress" || job.status === "changes_requested") && (
            <Button className="w-full" onClick={handleSubmit} disabled={submitJob.isPending}>
              {submitJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Submit for Review</>}
            </Button>
          )}
        </CardFooter>
      )}
      {role === "parent" && (
        <CardFooter className="pt-0 flex gap-2">
          {(job.status === "to_do" || job.status === "claimed" || job.status === "in_progress") && (
            <Button variant="outline" className="flex-1 text-green-600 border-green-200 hover:bg-green-50" onClick={handleComplete} disabled={completeJob.isPending}>
              {completeJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Mark Done</>}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 shrink-0" onClick={handleDelete} disabled={deleteJob.isPending}>
            {deleteJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default function Today() {
  const { data: profile } = useGetCurrentUser();
  const role = profile?.user?.role;
  const isParent = role === "parent";

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
    return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!isParent && isJobsLoading) {
    return <div className="flex p-8 justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Today</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), "EEEE, MMMM do")}
          </p>
        </div>
      </div>

      {isParent && dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-border/50 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-display font-bold text-primary">{dashboard.today.outstanding}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Outstanding</span>
            </CardContent>
          </Card>
          <Card className="bg-white border-border/50 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-display font-bold text-amber-500">{dashboard.today.changesRequested}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Needs Change</span>
            </CardContent>
          </Card>
          <Card className="bg-white border-border/50 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-display font-bold text-purple-500">{dashboard.today.awaitingReview}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">To Review</span>
            </CardContent>
          </Card>
          <Card className="bg-white border-border/50 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-display font-bold text-secondary">{dashboard.today.completed}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Completed</span>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          {isParent ? "Active Jobs" : "My Jobs"}
        </h2>
        
        {activeJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-border">
            <CheckCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground">All caught up!</h3>
            <p className="text-muted-foreground">No active jobs right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeJobs.map(job => (
              <JobCard key={job.id} job={job} role={role || "child"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
