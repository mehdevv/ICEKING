import { useState } from "react";
import { Link } from "wouter";
import { Button, Card, Chip, Modal, Label, TextArea } from "@heroui/react";
import { useListFraudEvents, useReviewFraudEvent, exportFraudCsv } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { Download, ShieldAlert } from "lucide-react";

export default function FraudEvents() {
  const [filter, setFilter] = useState<"unreviewed" | "all">("unreviewed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const { data: events, isLoading } = useListFraudEvents({
    reviewed: filter === "unreviewed" ? false : undefined,
  });
  const reviewMutation = useReviewFraudEvent();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selected = events?.find((e) => e.id === selectedId);

  const handleReview = async () => {
    if (!selectedId) return;
    try {
      await reviewMutation.mutateAsync({ id: selectedId, notes });
      queryClient.invalidateQueries({ queryKey: ["fraud-events"] });
      setSelectedId(null);
      setNotes("");
      toast({ title: "Fraud event marked as reviewed" });
    } catch {
      toast({ title: "Failed to review", variant: "destructive" });
    }
  };

  const handleExport = async () => {
    const blob = await exportFraudCsv();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fraud-events.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div className="space-y-6" variants={fadeUp} initial="initial" animate="animate">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fraud Events</h1>
          <p className="text-sm text-muted-foreground mt-1">Blocked scans and suspicious activity</p>
        </div>
        <Button variant="secondary" onPress={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === "unreviewed" ? "primary" : "secondary"} onPress={() => setFilter("unreviewed")}>
          Unreviewed
        </Button>
        <Button variant={filter === "all" ? "primary" : "secondary"} onPress={() => setFilter("all")}>
          All
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">Loading…</p>
      ) : !events?.length ? (
        <Card className="p-8 text-center">
          <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No fraud events found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className={`p-4 border-l-4 ${event.reviewedAt ? "border-l-neutral-300" : "border-l-red-600"}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Chip size="sm" color={event.status === "blocked_fraud" ? "danger" : "warning"}>
                      {event.blockReasonLabel}
                    </Chip>
                    {event.reviewedAt && <Chip size="sm" variant="soft">Reviewed</Chip>}
                  </div>
                  <p className="font-medium">{event.clientName ?? "Unknown client"}</p>
                  <p className="text-sm text-muted-foreground">
                    Worker: {event.workerName ?? "—"} · {new Date(event.scannedAt).toLocaleString()}
                  </p>
                </div>
                {!event.reviewedAt && (
                  <Button size="sm" onPress={() => setSelectedId(event.id)}>
                    Review
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-lg">
              <Modal.Header>
                <Modal.Heading>Review Fraud Event</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                {selected && (
                  <>
                    <p><strong>Customer:</strong> {selected.clientName}</p>
                    <p><strong>Employee:</strong> {selected.workerName}</p>
                    <p><strong>Rule:</strong> {selected.blockReasonLabel}</p>
                    <p><strong>Time:</strong> {new Date(selected.scannedAt).toLocaleString()}</p>
                    <div>
                      <Label>Review notes (optional)</Label>
                      <TextArea
                        className="mt-1"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={() => setSelectedId(null)}>Cancel</Button>
                <Button onPress={handleReview} isDisabled={reviewMutation.isPending}>
                  Mark Reviewed
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <p className="text-sm text-muted-foreground">
        <Link href="/scans" className="text-primary hover:underline">View full scan log</Link>
      </p>
    </motion.div>
  );
}
