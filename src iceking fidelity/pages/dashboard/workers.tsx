import { useState } from "react";
import { useListWorkers, useCreateWorker, useUpdateWorker, useDeleteWorker, useGetWorkerQr } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, QrCode, Power, PowerOff, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListWorkersQueryKey } from "@workspace/api-client-react";

const workerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export default function Workers() {
  const { data: workers, isLoading } = useListWorkers();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [qrWorkerId, setQrWorkerId] = useState<string | null>(null);
  
  const createWorker = useCreateWorker();
  const updateWorker = useUpdateWorker();
  const deleteWorker = useDeleteWorker();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof workerSchema>>({
    resolver: zodResolver(workerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof workerSchema>) => {
    try {
      await createWorker.mutateAsync({ data: values });
      toast({ title: "Worker created successfully" });
      setIsAddOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: getListWorkersQueryKey() });
    } catch (error: any) {
      toast({ title: "Failed to create worker", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateWorker.mutateAsync({ id, data: { isActive: !currentStatus } });
      queryClient.invalidateQueries({ queryKey: getListWorkersQueryKey() });
      toast({ title: `Worker ${!currentStatus ? 'activated' : 'deactivated'}` });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this worker?")) {
      try {
        await deleteWorker.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getListWorkersQueryKey() });
        toast({ title: "Worker deleted" });
      } catch (error: any) {
        toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Workers</h1>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Worker
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : workers?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No workers found.</TableCell></TableRow>
              ) : (
                workers?.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">{worker.fullName}</TableCell>
                    <TableCell>{worker.email}</TableCell>
                    <TableCell>
                      <Badge variant={worker.isActive ? "default" : "secondary"} className={worker.isActive ? "bg-secondary hover:bg-secondary/90 text-white" : ""}>
                        {worker.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{worker.scanCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="View QR" onClick={() => setQrWorkerId(worker.id)}>
                          <QrCode className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Toggle Status" onClick={() => handleToggleStatus(worker.id, worker.isActive)}>
                          {worker.isActive ? <PowerOff className="h-4 w-4 text-muted-foreground" /> : <Power className="h-4 w-4 text-secondary" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(worker.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Worker</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter className="mt-6">
                <Button variant="outline" type="button" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createWorker.isPending}>Save Worker</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!qrWorkerId} onOpenChange={(open) => !open && setQrWorkerId(null)}>
        <DialogContent className="sm:max-w-md flex flex-col items-center p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center">Worker Login QR</DialogTitle>
          </DialogHeader>
          {qrWorkerId && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <img src={`/api/workers/${qrWorkerId}/qr`} alt="Worker QR Code" className="w-64 h-64 object-contain" />
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-6 text-center">
            Workers can scan this code to log into the mobile app without typing credentials.
          </p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => setQrWorkerId(null)}>Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
