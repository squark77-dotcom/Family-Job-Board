import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAcceptFamilyInvitation } from "@workspace/api-client-react";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { useToast } from "@/hooks/use-toast";

export default function InviteAccept() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const accept = useAcceptFamilyInvitation();
  const invitationId = new URLSearchParams(window.location.search).get("invitationId");

  useEffect(() => {
    if (!invitationId || accept.isPending || accept.isSuccess) return;
    accept.mutate(
      { invitationId },
      {
        onSuccess: () => {
          toast({ title: "Invitation accepted", description: "Your Choremate family is ready." });
          setLocation("/app/today");
        },
        onError: (error: any) => {
          toast({ title: "Could not accept invitation", description: error?.error ?? "Please sign in with the invited email.", variant: "destructive" });
        },
      },
    );
  }, [invitationId, accept.isPending, accept.isSuccess]);

  return <FullScreenLoader message="Connecting you to the family..." />;
}