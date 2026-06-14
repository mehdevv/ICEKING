import { useListCampaigns } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Plus, Mail, MessageCircle, Eye } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  sending: "bg-amber-100 text-amber-700 border-amber-200",
  sent: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function Campaigns() {
  const { data: campaigns, isLoading } = useListCampaigns();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        <Button asChild><Link href="/dashboard/campaigns/new"><Plus className="h-4 w-4 mr-2" /> New Campaign</Link></Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading…</div>
      ) : campaigns?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">No campaigns yet. Create one to reach your clients.</p>
            <Button asChild><Link href="/dashboard/campaigns/new">Create Campaign</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns?.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {c.channel === "email" ? <Mail className="h-5 w-5 text-primary" /> : <MessageCircle className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.channel} · Created {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {c.status === "sent" && (
                    <div className="text-right text-sm">
                      <p className="font-medium">{c.totalSent}/{c.totalRecipients}</p>
                      <p className="text-muted-foreground text-xs">sent</p>
                    </div>
                  )}
                  <Badge variant="outline" className={`text-xs ${STATUS_BADGE[c.status] ?? ""}`}>{c.status}</Badge>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/campaigns/${c.id}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
