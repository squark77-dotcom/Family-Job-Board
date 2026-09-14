import { useState } from "react";
import { useGetCurrentUser, useListReviews, useReviewJob, JobSubmission, getListReviewsQueryKey, getGetDashboardQueryKey, getGetPointsQueryKey } from "@workspace/api-client-react";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

function ReviewCard({ submission }: { submission: JobSubmission }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reviewJob = useReviewJob();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "request_changes" | "reject">("approve");

  const handleReview = (action: "approve" | "request_changes" | "reject") => {
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
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Submitted by <span className="text-foreground font-bold">{submission.childName}</span>
            </div>
            <CardTitle className="text-lg">{submission.jobTitle}</CardTitle>
          </div>
          <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {format(new Date(submission.submittedAt), "h:mm a")}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {submission.status === "changes_requested" && (
          <div className="bg-red-50 text-red-800 p-3 rounded-xl text-sm mb-4 border border-red-100">
            <strong>Previous feedback:</strong> {submission.parentResponse || "Please fix and resubmit."}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
          onClick={() => handleReview("approve")}
          disabled={reviewJob.isPending}
        >
          {reviewJob.isPending && actionType === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Approve
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1" onClick={() => setActionType("request_changes")}>
              Needs Changes
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Changes</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea 
                placeholder="What needs to be fixed?" 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => handleReview("request_changes")}
                disabled={reviewJob.isPending || !reason.trim()}
              >
                {reviewJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Back"}
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
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Review Queue</h1>
        <p className="text-muted-foreground mt-1">
          Check completed work and award points.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : reviews && reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map(sub => (
            <ReviewCard key={sub.id} submission={sub} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-border/60 max-w-2xl mx-auto mt-8">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-300" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">All caught up</h3>
          <p className="text-muted-foreground">
            No jobs are waiting for review right now.
          </p>
        </div>
      )}
    </div>
  );
}
