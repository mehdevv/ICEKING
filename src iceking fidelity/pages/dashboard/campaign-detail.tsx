import { useParams } from "wouter";
import { useGetCampaignStats, useSendCampaign, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, MessageCircle, Send } from "lucide-react";
import { Link } from "wouter";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-amber-100 text-amber-700",
  sent: "bg-secondary/20 text-secondary-foreground",
  failed: "bg-destructive/20 text-destructive",
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, isLoading } = useGetCampaignStats(id);
  const sendCampaign = useSendCampaign();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSend = async () => {
    try {
      await sendCampaign.mutateAsync({ id, data: {} });
      queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      toast({ title: "Campaign sent!" });
    } catch {
      toast({ title: "Failed to send", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading…</div>;
  if (!campaign) return <div className="py-12 text-center text-muted-foreground">Campaign not found.</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard/campaigns"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <Badge variant="outline" className={`text-xs ${STATUS_BADGE[campaign.status] ?? ""}`}>{campaign.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            {campaign.channel === "email" ? <Mail className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
            {campaign.channel} · Created {new Date(campaign.createdAt).toLocaleDateString()}
          </p>
        </div>
        {campaign.status === "draft" && (
          <Button onClick={handleSend} disabled={sendCampaign.isPending}>
            <Send className="h-4 w-4 mr-2" /> Send Now
          </Button>
        )}
      </div>

      {campaign.status === "sent" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Recipients</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{campaign.totalRecipients}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Sent</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-secondary">{campaign.totalSent}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Failed</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-destructive">{campaign.totalFailed}</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Message</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {campaign.subject && <div><p className="text-sm font-medium text-muted-foreground mb-1">Subject</p><p className="font-medium">{campaign.subject}</p></div>}
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Body</p><p className="whitespace-pre-wrap text-sm bg-muted/50 rounded-lg p-4">{campaign.body}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
