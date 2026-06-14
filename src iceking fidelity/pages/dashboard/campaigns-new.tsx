import { useState } from "react";
import { useCreateCampaign, useSendCampaign, getListCampaignsQueryKey, useGetSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CampaignsNew() {
  const [, navigate] = useLocation();
  const { data: settings } = useGetSettings();
  const createCampaign = useCreateCampaign();
  const sendCampaign = useSendCampaign();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: "", channel: "email", subject: "", body: "" });
  const [sendMode, setSendMode] = useState<"now" | "draft">("draft");

  const handleSubmit = async () => {
    if (!form.name || !form.channel || !form.body) {
      toast({ title: "Name, channel and message body are required", variant: "destructive" });
      return;
    }
    try {
      const campaign = await createCampaign.mutateAsync({ data: { name: form.name, channel: form.channel as "email" | "whatsapp", subject: form.subject || undefined, body: form.body } });
      if (sendMode === "now") {
        await sendCampaign.mutateAsync({ id: campaign.id, data: {} });
        toast({ title: "Campaign sent!" });
      } else {
        toast({ title: "Campaign saved as draft" });
      }
      queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      navigate("/dashboard/campaigns");
    } catch {
      toast({ title: "Failed to create campaign", variant: "destructive" });
    }
  };

  const channelNotConfigured = (form.channel === "email" && !settings?.emailConfigured) || (form.channel === "whatsapp" && !settings?.whatsappConfigured);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard/campaigns"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="text-2xl font-bold tracking-tight">New Campaign</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Campaign Name *</Label>
            <Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Summer Special Offer" />
          </div>

          <div>
            <Label>Channel *</Label>
            <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {channelNotConfigured && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {form.channel === "email" ? "Email sender" : "WhatsApp"} is not configured.
                <Link href="/dashboard/settings" className="ml-1 underline font-medium">Configure in Settings → Integrations</Link>
              </AlertDescription>
            </Alert>
          )}

          {form.channel === "email" && (
            <div>
              <Label>Subject</Label>
              <Input className="mt-1" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Email subject line" />
            </div>
          )}

          <div>
            <Label>Message Body *</Label>
            <Textarea className="mt-1" rows={6} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Write your message here…" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => { setSendMode("draft"); handleSubmit(); }} disabled={createCampaign.isPending}>
              Save as Draft
            </Button>
            <Button onClick={() => { setSendMode("now"); handleSubmit(); }} disabled={createCampaign.isPending || sendCampaign.isPending || channelNotConfigured}>
              Send Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
