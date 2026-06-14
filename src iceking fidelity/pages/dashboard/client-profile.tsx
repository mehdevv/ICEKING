import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetClient, useUpdateClient, useDeleteClient, getListClientsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, CheckCircle, Trash2, Save } from "lucide-react";
import { Link } from "wouter";

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: profile, isLoading } = useGetClient(id);
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<string | undefined>(undefined);
  const [notesSaved, setNotesSaved] = useState(true);

  const client = profile?.client;

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading…</div>;
  if (!client) return <div className="py-12 text-center text-muted-foreground">Client not found.</div>;

  const handleSaveNotes = async () => {
    try {
      await updateClient.mutateAsync({ id, data: { notes: notes ?? client.notes ?? "" } });
      setNotesSaved(true);
      toast({ title: "Notes saved" });
    } catch {
      toast({ title: "Failed to save notes", variant: "destructive" });
    }
  };

  const handleToggleBlock = async () => {
    try {
      await updateClient.mutateAsync({ id, data: { isBlocked: !client.isBlocked } });
      queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
      toast({ title: client.isBlocked ? "Client unblocked" : "Client blocked" });
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirm("This will permanently anonymise the client's data. Continue?")) return;
    try {
      await deleteClient.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
      navigate("/dashboard/clients");
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const stampThreshold = profile?.client?.totalStamps !== undefined ? 9 : 9;
  const currentCycle = client.currentCycleStamps;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard/clients"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{client.fullName}</h1>
          <p className="text-sm text-muted-foreground">{client.email ?? client.phone ?? "No contact info"}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant={client.isBlocked ? "outline" : "destructive"} size="sm" onClick={handleToggleBlock}>
            {client.isBlocked ? <><CheckCircle className="h-4 w-4 mr-1" /> Unblock</> : <><Ban className="h-4 w-4 mr-1" /> Block</>}
          </Button>
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Anonymise
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Stamp Progress</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{currentCycle} / 9</p>
            <div className="flex gap-1 mt-3 flex-wrap">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={`h-4 w-4 rounded-full border-2 ${i < currentCycle ? "bg-primary border-primary" : "border-muted-foreground/30"}`} />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Stamps</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{client.totalStamps}</p>
            <p className="text-xs text-muted-foreground mt-1">Since enrolment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Rewards Earned</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-secondary">{client.totalRewardsEarned}</p>
            <p className="text-xs text-muted-foreground mt-1">{profile?.pendingRewards} pending</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Scans</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Stamps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile?.recentScans?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No scans yet.</TableCell></TableRow>
                ) : profile?.recentScans?.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{new Date(s.scannedAt).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{s.scanType}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={s.status === "approved" ? "secondary" : "destructive"} className={`text-xs ${s.status === "approved" ? "bg-secondary/20 text-secondary-foreground" : ""}`}>
                        {s.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">+{s.stampsAdded}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Owner Notes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={6}
              placeholder="Private notes about this client…"
              value={notes ?? client.notes ?? ""}
              onChange={e => { setNotes(e.target.value); setNotesSaved(false); }}
            />
            <Button size="sm" onClick={handleSaveNotes} disabled={notesSaved || updateClient.isPending}>
              <Save className="h-4 w-4 mr-1" /> {notesSaved ? "Saved" : "Save Notes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
