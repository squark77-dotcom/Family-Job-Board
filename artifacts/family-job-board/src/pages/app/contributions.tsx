import { useGetCurrentUser, useGetPoints, getGetPointsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Award, Calendar, Zap } from "lucide-react";
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
    return <div className="flex justify-center p-12 mt-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const transactions = pointsData?.transactions || [];
  const childrenData = pointsData?.byChild || [];

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight">Contributions</h1>
        <p className="text-muted-foreground font-medium mt-1">
          {isParent ? "Family progress and points." : "Your hard work and rewards."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="bg-primary text-primary-foreground border-0 shadow-lg shadow-primary/20 md:col-span-1 flex flex-col justify-center overflow-hidden relative rounded-[1.5rem]">
          <div className="absolute -right-6 -top-6 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
          <CardHeader className="relative z-10 pb-0 pt-8 px-8">
            <CardTitle className="text-primary-foreground/80 text-xs font-bold uppercase tracking-widest flex items-center">
              <Zap className="w-4 h-4 mr-2" /> Total Points
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 px-8 pb-8 pt-4">
            <div className="text-6xl font-display font-extrabold tracking-tight">
              {pointsData?.totalPoints || 0}
            </div>
          </CardContent>
        </Card>

        {isParent ? (
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {childrenData.map(child => (
              <Card key={child.id} className="shadow-sm border-border hover:shadow-md transition-shadow rounded-[1.5rem]">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-accent/20"></div>
                  <div className="w-14 h-14 bg-muted rounded-[14px] flex items-center justify-center mb-4 shadow-inner border border-border">
                    <span className="font-display font-bold text-xl text-foreground">{child.name.charAt(0)}</span>
                  </div>
                  <h3 className="font-bold text-foreground text-lg">{child.name}</h3>
                  <div className="mt-2 text-3xl font-display font-bold text-primary">{child.totalPoints} <span className="text-xs font-sans font-bold text-muted-foreground uppercase tracking-widest">pts</span></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="md:col-span-2 grid grid-cols-2 gap-5">
            <Card className="shadow-sm border-border rounded-[1.5rem] relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute inset-x-0 top-0 h-1 bg-blue-500/20 group-hover:bg-blue-500 transition-colors"></div>
              <CardContent className="p-8 flex flex-col justify-center h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl"><Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
                  <span className="font-bold text-muted-foreground text-sm uppercase tracking-wider">Assigned Jobs</span>
                </div>
                <div className="text-5xl font-display font-bold text-foreground">
                  {childrenData.find(c => c.id === profile?.user?.id)?.assignedCompleted || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border rounded-[1.5rem] relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute inset-x-0 top-0 h-1 bg-accent/20 group-hover:bg-accent transition-colors"></div>
              <CardContent className="p-8 flex flex-col justify-center h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-accent/10 rounded-xl"><TrendingUp className="w-6 h-6 text-accent" /></div>
                  <span className="font-bold text-muted-foreground text-sm uppercase tracking-wider">Voluntary Jobs</span>
                </div>
                <div className="text-5xl font-display font-bold text-foreground">
                  {childrenData.find(c => c.id === profile?.user?.id)?.voluntaryCompleted || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Card className="shadow-sm border-border rounded-[1.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 fill-mode-both">
        <CardHeader className="bg-muted/10 border-b border-border/50 py-5 px-6">
          <CardTitle className="text-lg font-bold">Recent History</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border/50">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-medium">No points earned yet.</div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="p-5 px-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-base">
                      {isParent && <span className="text-primary mr-1.5 uppercase text-[10px] tracking-widest">{tx.childName}</span>}
                      {tx.type === 'assigned_job' ? 'Completed assigned job' : 
                       tx.type === 'voluntary_job' ? 'Completed board job' : 
                       'Bonus points'}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">
                      {tx.reason || format(new Date(tx.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="font-display font-bold text-2xl text-primary shrink-0 bg-primary/5 px-3 py-1 rounded-lg">
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
