import { useState } from "react";
import { useListRewards, useRedeemReward, getListRewardsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Gift, CheckCircle } from "lucide-react";

export default function Rewards() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListRewards({ page, limit: 20, status });
  const redeemReward = useRedeemReward();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRedeem = async (id: string) => {
    try {
      await redeemReward.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListRewardsQueryKey() });
      toast({ title: "Reward marked as redeemed" });
    } catch {
      toast({ title: "Failed to redeem", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gift className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Rewards</h1>
        </div>
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="redeemed">Redeemed</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Earned</TableHead>
                <TableHead>Redeemed</TableHead>
                <TableHead>Redeemed By</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading…</TableCell></TableRow>
              ) : data?.rewards?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No rewards found.</TableCell></TableRow>
              ) : data?.rewards?.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.clientName ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-amber-500" />
                      <span>{r.rewardDescription}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {r.redeemedAt ? (
                      <Badge className="bg-secondary/20 text-secondary-foreground text-xs border-secondary/30"><CheckCircle className="h-3 w-3 mr-1" /> {new Date(r.redeemedAt).toLocaleDateString()}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.redeemedByWorkerName ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {!r.redeemedAt && (
                      <Button size="sm" variant="outline" onClick={() => handleRedeem(r.id)} disabled={redeemReward.isPending}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Redeem
                      </Button>
                    )}
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
