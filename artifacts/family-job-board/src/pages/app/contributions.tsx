import { useGetCurrentUser, useGetPoints, getGetPointsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Award, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function Contributions() {
  const { data: profile } = useGetCurrentUser();
  const role = profile?.user?.role;
  const isParent = role === "parent";

  const { data: pointsData, isLoading } = useGetPoints(
    isParent ? {} : { childId: profile?.user?.id },
    { query: { enabled: !!profile, queryKey: getGetPointsQueryKey(isParent ? {} : { childId: profile?.user?.id }) } }
  );

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const transactions = pointsData?.transactions || [];
  const childrenData = pointsData?.byChild || [];

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Contributions</h1>
        <p className="text-muted-foreground mt-1">
          {isParent ? "Family progress and points." : "Your hard work and rewards."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground border-0 shadow-lg md:col-span-1 flex flex-col justify-center overflow-hidden relative">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-primary-foreground/80 text-sm uppercase tracking-wider">Total Points</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-display font-bold">
              {pointsData?.totalPoints || 0}
            </div>
          </CardContent>
        </Card>

        {isParent ? (
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {childrenData.map(child => (
              <Card key={child.id} className="shadow-sm border-border/50">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-3">
                    <span className="font-bold text-lg text-secondary">{child.name.charAt(0)}</span>
                  </div>
                  <h3 className="font-bold text-foreground">{child.name}</h3>
                  <div className="mt-2 text-2xl font-display font-bold text-primary">{child.totalPoints} <span className="text-sm font-sans font-medium text-muted-foreground">pts</span></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <Card className="shadow-sm border-border/50">
              <CardContent className="p-6 flex flex-col justify-center h-full">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg"><Calendar className="w-5 h-5 text-blue-600" /></div>
                  <span className="font-semibold text-muted-foreground">Assigned Jobs</span>
                </div>
                <div className="text-3xl font-bold mt-2">
                  {childrenData.find(c => c.id === profile?.user?.id)?.assignedCompleted || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border/50">
              <CardContent className="p-6 flex flex-col justify-center h-full">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-100 rounded-lg"><TrendingUp className="w-5 h-5 text-orange-600" /></div>
                  <span className="font-semibold text-muted-foreground">Voluntary Jobs</span>
                </div>
                <div className="text-3xl font-bold mt-2">
                  {childrenData.find(c => c.id === profile?.user?.id)?.voluntaryCompleted || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Card className="shadow-sm border-border/50 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-lg">Recent History</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border/50">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No points earned yet.</div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {isParent && <span className="text-secondary mr-1">{tx.childName}</span>}
                      {tx.type === 'assigned_job' ? 'Completed assigned job' : 
                       tx.type === 'voluntary_job' ? 'Completed board job' : 
                       'Bonus points'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tx.reason || format(new Date(tx.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="font-bold text-lg text-primary shrink-0">
                  +{tx.points}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
