import { useState } from "react";
import { useGetCurrentUser, useListReviews, useReviewJob, JobSubmission, getListReviewsQueryKey, getGetDashboardQueryKey, getGetPointsQueryKey } from "@workspace/api-client-react";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Clock, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function ReviewCard({ submission }: { submission: JobSubmission }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reviewJob = useReviewJob();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "request_changes" | "reject">("approve");

  const handleReview = (action: "approve" | "request_changes" | "reject") => {
    setActionType(action);
    reviewJob.mutate({
      jobId: submission.jobId,
      data: { action, reason: reason || undefined }
    }, {
      onSuccess: () => {
        toast({ title: `Submission ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'returned'}` });
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPointsQueryKey() });
      }
    });
  };

  return (
    <Card className="shadow-sm border-border/50 rounded-[1.25rem] overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 px-6 pt-6 bg-muted/10 border-b border-border/30">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1.5 flex items-center">
              <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
              {submission.childName}
            </div>
            <CardTitle className="text-xl font-display font-bold leading-tight">{submission.jobTitle}</CardTitle>
          </div>
          <div className="text-xs font-bold text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md flex items-center shrink-0">
            <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" />
            {format(new Date(submission.submittedAt), "h:mm a")}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4 px-6 pt-4">
        {submission.status === "changes_requested" ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm border border-destructive/20 font-medium">
            <strong className="block mb-1 text-destructive/80 uppercase text-[10px] tracking-wider">Previous feedback</strong> 
            {submission.parentResponse || "Please fix and resubmit."}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground font-medium">Awaiting your approval.</p>
        )}
      </CardContent>
      <CardFooter className="flex gap-3 px-6 pb-6 pt-0">
        <Button 
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 rounded-xl shadow-md shadow-primary/20 active:scale-95 transition-all" 
          onClick={() => handleReview("approve")}
          disabled={reviewJob.isPending}
        >
          {reviewJob.isPending && actionType === "approve" ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
          Approve
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 font-bold h-11 rounded-xl active:scale-95 transition-all" onClick={() => setActionType("request_changes")}>
              Request Changes
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[1.5rem] p-6 border-border shadow-xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="font-display text-2xl font-bold tracking-tight">Request Changes</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Feedback for {submission.childName}</Label>
              <Textarea 
                placeholder="What needs to be fixed?" 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                className="min-h-[120px] rounded-xl bg-muted/50 border-border"
              />
            </div>
            <DialogFooter className="mt-6 flex gap-3">
              <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                className="rounded-xl font-bold px-6 shadow-md"
                onClick={() => handleReview("request_changes")}
                disabled={reviewJob.isPending || !reason.trim()}
              >
                {reviewJob.isPending && actionType === "request_changes" ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Send Back
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

export default function Review() {
  const { data: profile } = useGetCurrentUser();
  const role = profile?.user?.role;
  
  if (role === "child") {
    return <Redirect to="/app/today" />;
  }

  const { data: reviews, isLoading } = useListReviews({ query: { enabled: role === "parent", queryKey: getListReviewsQueryKey() } });

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight">Review Queue</h1>
        <p className="text-muted-foreground font-medium mt-1">
          Check completed work and award points.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8 mt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : reviews && reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {reviews.map(sub => (
            <ReviewCard key={sub.id} submission={sub} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/50 max-w-2xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-card rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
            <CheckCircle className="w-10 h-10 text-primary/50" />
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground mb-2 tracking-tight">All caught up</h3>
          <p className="text-muted-foreground font-medium text-lg">
            No jobs are waiting for review right now.
          </p>
        </div>
      )}
    </div>
  );
}
