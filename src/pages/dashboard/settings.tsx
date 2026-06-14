import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Save, CheckCircle, AlertCircle, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { appLink } from "@/lib/links";
import SettingsLinks from "./settings-links";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [general, setGeneral] = useState({ businessName: "", logoUrl: "", cardTemplateUrl: "", currency: "DZD", timezone: "Africa/Algiers", primaryColor: "#1A56DB", secondaryColor: "#0E9F6E" });
  const [fidelity, setFidelity] = useState({ stampThreshold: 9, maxScansPerDay: 2, rewardType: "free_product", rewardValue: "", trackProducts: true });
  const [integrations, setIntegrations] = useState({ whatsappToken: "", whatsappPhoneId: "", emailSender: "" });

  useEffect(() => {
    if (settings) {
      setGeneral({ businessName: settings.businessName ?? "", logoUrl: settings.logoUrl ?? "", cardTemplateUrl: settings.cardTemplateUrl ?? "", currency: settings.currency ?? "DZD", timezone: settings.timezone ?? "Africa/Algiers", primaryColor: settings.primaryColor ?? "#1A56DB", secondaryColor: settings.secondaryColor ?? "#0E9F6E" });
      setFidelity({ stampThreshold: settings.stampThreshold ?? 9, maxScansPerDay: settings.maxScansPerDay ?? 2, rewardType: settings.rewardType ?? "free_product", rewardValue: settings.rewardValue ?? "", trackProducts: settings.trackProducts ?? true });
    }
  }, [settings]);

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      await updateSettings.mutateAsync({ id: settings!.id, data });
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      toast({ title: "Settings saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="fidelity">Fidelity</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Business Settings</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div><Label>Business Name</Label><Input className="mt-1" value={general.businessName} onChange={e => setGeneral(g => ({ ...g, businessName: e.target.value }))} /></div>
              <div><Label>Logo URL</Label><Input className="mt-1" value={general.logoUrl} onChange={e => setGeneral(g => ({ ...g, logoUrl: e.target.value }))} placeholder="/logo.jpg or https://…" /></div>
              <div><Label>Card Background URL</Label><Input className="mt-1" value={general.cardTemplateUrl} onChange={e => setGeneral(g => ({ ...g, cardTemplateUrl: e.target.value }))} placeholder="/card-bg.png or https://…" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Currency</Label>
                  <Select value={general.currency} onValueChange={v => setGeneral(g => ({ ...g, currency: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="DZD">DZD (Algerian Dinar)</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Timezone</Label>
                  <Select value={general.timezone} onValueChange={v => setGeneral(g => ({ ...g, timezone: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Africa/Algiers">Africa/Algiers</SelectItem><SelectItem value="Europe/Paris">Europe/Paris</SelectItem><SelectItem value="UTC">UTC</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Primary Color</Label><Input type="color" className="mt-1 h-10 px-2 cursor-pointer" value={general.primaryColor} onChange={e => setGeneral(g => ({ ...g, primaryColor: e.target.value }))} /></div>
                <div><Label>Secondary Color</Label><Input type="color" className="mt-1 h-10 px-2 cursor-pointer" value={general.secondaryColor} onChange={e => setGeneral(g => ({ ...g, secondaryColor: e.target.value }))} /></div>
              </div>
              <Button onClick={() => handleSave(general)} disabled={updateSettings.isPending}>
                <Save className="h-4 w-4 mr-2" /> Save General Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Customer Enrolment QR
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-6">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <QRCodeSVG value={appLink("/client")} size={160} level="H" />
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Print or display this QR so customers can enrol on their phone.</p>
                <p className="font-mono text-xs bg-muted rounded-lg p-2 break-all">
                  {appLink("/client")}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fidelity" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Fidelity Program</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Stamp Threshold (current: {fidelity.stampThreshold})</Label>
                <Slider className="mt-3" min={3} max={20} step={1} value={[fidelity.stampThreshold]} onValueChange={([v]) => setFidelity(f => ({ ...f, stampThreshold: v }))} />
                <p className="text-xs text-muted-foreground mt-1">Customers need {fidelity.stampThreshold} stamps to earn a reward</p>
              </div>
              <div>
                <Label>Max Scans Per Day (current: {fidelity.maxScansPerDay})</Label>
                <Slider className="mt-3" min={1} max={10} step={1} value={[fidelity.maxScansPerDay]} onValueChange={([v]) => setFidelity(f => ({ ...f, maxScansPerDay: v }))} />
              </div>
              <div><Label>Reward Type</Label>
                <Select value={fidelity.rewardType} onValueChange={v => setFidelity(f => ({ ...f, rewardType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free_product">Free Product</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Reward Value</Label><Input className="mt-1" value={fidelity.rewardValue} onChange={e => setFidelity(f => ({ ...f, rewardValue: e.target.value }))} placeholder="e.g. Free Ice Cream, 20%" /></div>
              <div className="flex items-center gap-3">
                <Switch checked={fidelity.trackProducts} onCheckedChange={v => setFidelity(f => ({ ...f, trackProducts: v }))} />
                <div>
                  <Label>Product Tracking</Label>
                  <p className="text-xs text-muted-foreground">Workers select products when scanning</p>
                </div>
              </div>
              <Button onClick={() => handleSave(fidelity)} disabled={updateSettings.isPending}>
                <Save className="h-4 w-4 mr-2" /> Save Fidelity Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>WhatsApp</CardTitle>
                {settings?.whatsappConfigured
                  ? <Badge className="bg-secondary/20 text-secondary-foreground text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Configured</Badge>
                  : <Badge variant="outline" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" /> Not configured</Badge>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Access Token</Label><Input className="mt-1" type="password" placeholder="WhatsApp API token" value={integrations.whatsappToken} onChange={e => setIntegrations(i => ({ ...i, whatsappToken: e.target.value }))} /></div>
                <div><Label>Phone Number ID</Label><Input className="mt-1" placeholder="Phone number ID from Meta dashboard" value={integrations.whatsappPhoneId} onChange={e => setIntegrations(i => ({ ...i, whatsappPhoneId: e.target.value }))} /></div>
                <Button onClick={() => handleSave({ whatsappToken: integrations.whatsappToken, whatsappPhoneId: integrations.whatsappPhoneId })} disabled={updateSettings.isPending}>
                  <Save className="h-4 w-4 mr-2" /> Save WhatsApp
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Email</CardTitle>
                {settings?.emailConfigured
                  ? <Badge className="bg-secondary/20 text-secondary-foreground text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Configured</Badge>
                  : <Badge variant="outline" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" /> Not configured</Badge>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Sender Email Address</Label><Input className="mt-1" type="email" placeholder="no-reply@iceking.dz" value={integrations.emailSender} onChange={e => setIntegrations(i => ({ ...i, emailSender: e.target.value }))} /></div>
                <Button onClick={() => handleSave({ emailSender: integrations.emailSender })} disabled={updateSettings.isPending}>
                  <Save className="h-4 w-4 mr-2" /> Save Email
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="links" className="mt-4">
          <SettingsLinks />
        </TabsContent>
      </Tabs>
    </div>
  );
}
