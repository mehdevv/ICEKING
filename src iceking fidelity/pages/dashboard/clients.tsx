import { useState } from "react";
import { useListClients, useDeleteClient, useUpdateClient, getListClientsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Eye, Ban, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListClients({ page, limit: 20, search: search || undefined, status: status === "all" ? undefined : status });
  const updateClient = useUpdateClient();

  const handleToggleBlock = async (id: string, isBlocked: boolean) => {
    try {
      await updateClient.mutateAsync({ id, data: { isBlocked: !isBlocked } });
      queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
      toast({ title: isBlocked ? "Client unblocked" : "Client blocked" });
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <span className="text-sm text-muted-foreground">{data?.total ?? 0} total</span>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, phone, email…" className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clients</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Stamps</TableHead>
                <TableHead>Last Scan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading…</TableCell></TableRow>
              ) : data?.clients?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No clients found.</TableCell></TableRow>
              ) : data?.clients?.map(c => (
                <TableRow key={c.id} className={c.isBlocked ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium">{c.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-primary">{c.currentCycleStamps}/{c.totalStamps}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.lastScanAt ? new Date(c.lastScanAt).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={c.isBlocked ? "destructive" : "secondary"} className={c.isBlocked ? "" : "bg-secondary/20 text-secondary-foreground border-secondary/30"}>
                      {c.isBlocked ? "Blocked" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/clients/${c.id}`}><Eye className="h-4 w-4 text-primary" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleToggleBlock(c.id, c.isBlocked)}>
                        {c.isBlocked ? <CheckCircle className="h-4 w-4 text-secondary" /> : <Ban className="h-4 w-4 text-destructive" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground flex items-center px-2">Page {page} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
