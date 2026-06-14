import { useGetAnalyticsOverview, useGetAnalyticsSales, useGetWorkersLeaderboard, useGetClientsLeaderboard } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import { Users, QrCode, Gift, ShieldAlert } from "lucide-react";

export default function Analytics() {
  const { data: overview } = useGetAnalyticsOverview();
  const { data: sales } = useGetAnalyticsSales({ days: 30 });
  const { data: workers } = useGetWorkersLeaderboard();
  const { data: clients } = useGetClientsLeaderboard();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Total Clients", value: overview?.totalClients, icon: Users, color: "text-primary" },
              { label: "Scans Today", value: overview?.scansToday, icon: QrCode, color: "text-secondary" },
              { label: "Pending Rewards", value: overview?.rewardsPending, icon: Gift, color: "text-amber-500" },
              { label: "Fraud Alerts Today", value: overview?.fraudAlertsToday, icon: ShieldAlert, color: "text-destructive" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
                  <Icon className={`h-4 w-4 ${color}`} />
                </CardHeader>
                <CardContent><p className="text-3xl font-bold">{value ?? "—"}</p></CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Daily Scans (30 Days)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overview?.dailyScans ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0/0.1)" }} />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Daily Enrolments (30 Days)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overview?.dailyEnrolments ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0/0.1)" }} />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6 mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Revenue (30d)</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{sales?.totalRevenue?.toLocaleString() ?? "—"} DZD</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Units Sold (30d)</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{sales?.totalUnitsSold ?? "—"}</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sales?.topProducts ?? []} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="productName" tick={{ fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0/0.1)" }} />
                    <Bar dataKey="unitsSold" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Worker Leaderboard</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead className="text-right">Total Scans</TableHead>
                    <TableHead className="text-right">Approved</TableHead>
                    <TableHead className="text-right">Fraud Flags</TableHead>
                    <TableHead className="text-right">Rewards</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No data yet.</TableCell></TableRow>}
                  {workers?.map((w, i) => (
                    <TableRow key={w.workerId}>
                      <TableCell>
                        <span className="font-mono text-muted-foreground text-xs mr-2">#{i + 1}</span>
                        <span className="font-medium">{w.workerName}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{w.totalScans}</TableCell>
                      <TableCell className="text-right font-mono text-secondary">{w.approvedScans}</TableCell>
                      <TableCell className="text-right font-mono">
                        {w.fraudFlags > 0 ? <span className="text-destructive">{w.fraudFlags}</span> : "0"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-amber-600">{w.rewardsTriggered}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6 mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Top Buyers</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Client</TableHead><TableHead className="text-right">Stamps</TableHead><TableHead className="text-right">Rewards</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {clients?.topBuyers?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No data.</TableCell></TableRow>}
                    {clients?.topBuyers?.map((c, i) => (
                      <TableRow key={c.clientId}>
                        <TableCell><span className="text-muted-foreground text-xs mr-2">#{i + 1}</span>{c.clientName}</TableCell>
                        <TableCell className="text-right font-mono text-primary">{c.totalStamps}</TableCell>
                        <TableCell className="text-right font-mono text-amber-600">{c.totalRewards}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Churn Risk</CardTitle>
                <p className="text-sm text-muted-foreground">Not seen in 30+ days</p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Client</TableHead><TableHead className="text-right">Last Seen</TableHead><TableHead className="text-right">Days Ago</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {clients?.churnRisk?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No churn risk clients.</TableCell></TableRow>}
                    {clients?.churnRisk?.map(c => (
                      <TableRow key={c.clientId}>
                        <TableCell className="font-medium">{c.clientName}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{c.lastScanAt ? new Date(c.lastScanAt).toLocaleDateString() : "Never"}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive" className="text-xs">{c.daysSinceLastScan}d</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
