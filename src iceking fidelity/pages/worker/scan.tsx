import { useState, useEffect, useRef } from "react";
import { usePurchaseScan, useConfirmPurchaseScan, useListProducts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Gift, ArrowLeft, Minus, Plus, ScanLine } from "lucide-react";
import { Link } from "wouter";

type ScanResult = {
  approved: boolean;
  reason: string | null;
  stampsAdded: number;
  currentStamps: number;
  stampThreshold: number;
  rewardTriggered: boolean;
  rewardDescription?: string | null;
  needsProducts: boolean;
  products?: { id: string; name: string; price: number; category: string }[];
  pendingScanId?: string | null;
  clientName?: string | null;
};

type ProductQty = Record<string, number>;

export default function WorkerScan() {
  const { toast } = useToast();
  const purchaseScan = usePurchaseScan();
  const confirmScan = useConfirmPurchaseScan();
  const [step, setStep] = useState<"scan" | "products" | "result">("scan");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [productQtys, setProductQtys] = useState<ProductQty>({});
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrcodeRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let scanner: any;
    if (step === "scan" && scannerRef.current) {
      import("html5-qrcode").then(({ Html5Qrcode }) => {
        scanner = new Html5Qrcode("qr-scanner-region");
        html5QrcodeRef.current = scanner;
        scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            if (scanning) return;
            setScanning(true);
            try {
              await scanner.stop();
              html5QrcodeRef.current = null;
            } catch {}
            try {
              const scanResult = await purchaseScan.mutateAsync({ data: { clientQrToken: decodedText } });
              const r = scanResult as unknown as ScanResult;
              setResult(r);
              if (r.needsProducts) {
                setProductQtys({});
                setStep("products");
              } else {
                setStep("result");
              }
            } catch (err: any) {
              toast({ title: "Scan failed", description: err?.message, variant: "destructive" });
              setScanning(false);
            }
          },
          () => {},
        ).catch(() => {
          toast({ title: "Camera access denied", description: "Allow camera access to scan QR codes.", variant: "destructive" });
        });
      });
    }
    return () => {
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop().catch(() => {});
        html5QrcodeRef.current = null;
      }
    };
  }, [step]);

  const handleConfirmProducts = async () => {
    if (!result?.pendingScanId) return;
    const products = Object.entries(productQtys)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    try {
      const confirmed = await confirmScan.mutateAsync({ data: { pendingScanId: result.pendingScanId, products } });
      setResult(prev => prev ? { ...prev, ...(confirmed as unknown as Partial<ScanResult>) } : prev);
      setStep("result");
    } catch (err: any) {
      toast({ title: "Confirm failed", description: err?.message, variant: "destructive" });
    }
  };

  const handleReset = () => {
    setStep("scan");
    setResult(null);
    setProductQtys({});
    setScanning(false);
  };

  if (step === "scan") {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" asChild><Link href="/worker"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <h2 className="text-xl font-bold">Scan Customer Card</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="relative w-full max-w-sm">
            <div id="qr-scanner-region" ref={scannerRef} className="overflow-hidden rounded-2xl shadow-lg w-full aspect-square" />
            <div className="absolute inset-0 pointer-events-none rounded-2xl border-4 border-primary/60" />
          </div>

          <div className="text-center">
            <p className="text-muted-foreground text-sm">Point the camera at the customer's loyalty card QR code</p>
            <ScanLine className="h-5 w-5 mx-auto mt-2 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (step === "products" && result?.products) {
    return (
      <div className="flex flex-col h-full p-4 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Select Products</h2>
          <p className="text-sm text-muted-foreground mt-1">Customer: <span className="font-medium text-foreground">{result.clientName}</span></p>
        </div>

        <div className="space-y-3 flex-1">
          {result.products.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{Number(p.price).toLocaleString()} DZD</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setProductQtys(q => ({ ...q, [p.id]: Math.max(0, (q[p.id] ?? 0) - 1) }))}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center font-mono font-semibold">{productQtys[p.id] ?? 0}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setProductQtys(q => ({ ...q, [p.id]: (q[p.id] ?? 0) + 1 }))}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <Button size="lg" className="w-full" onClick={handleConfirmProducts} disabled={confirmScan.isPending}>
            {confirmScan.isPending ? "Processing…" : "Confirm & Add Stamp"}
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleReset}>Cancel</Button>
        </div>
      </div>
    );
  }

  if (step === "result" && result) {
    const isReward = result.rewardTriggered;
    const isApproved = result.approved;

    return (
      <div className="flex flex-col h-full p-4 items-center justify-center text-center">
        {isReward ? (
          <div className="space-y-4">
            <div className="h-24 w-24 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
              <Gift className="h-12 w-12 text-amber-500" />
            </div>
            <Badge className="bg-amber-500 text-white text-base px-4 py-1.5">Reward Unlocked!</Badge>
            <p className="text-2xl font-bold">{result.clientName}</p>
            <p className="text-muted-foreground">{result.rewardDescription}</p>
            <div className="mt-2 bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-sm font-medium text-amber-700">Give the customer their reward and mark it as redeemed in the dashboard.</p>
            </div>
          </div>
        ) : isApproved ? (
          <div className="space-y-4">
            <div className="h-24 w-24 mx-auto rounded-full bg-secondary/20 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-secondary" />
            </div>
            <p className="text-2xl font-bold text-secondary">Approved</p>
            <p className="text-muted-foreground">{result.clientName}</p>
            <div className="mt-2 bg-muted rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-2">Stamp progress</p>
              <div className="flex gap-1.5 justify-center flex-wrap">
                {Array.from({ length: result.stampThreshold }).map((_, i) => (
                  <div key={i} className={`h-5 w-5 rounded-full border-2 ${i < result.currentStamps ? "bg-primary border-primary" : "border-muted-foreground/30"}`} />
                ))}
              </div>
              <p className="text-sm font-semibold mt-3">{result.currentStamps} / {result.stampThreshold} stamps</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-24 w-24 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-destructive">Blocked</p>
            <p className="text-muted-foreground">{result.clientName}</p>
            <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">{result.reason}</p>
            </div>
          </div>
        )}

        <Button size="lg" className="mt-8 w-full max-w-xs" onClick={handleReset}>
          Scan Another Card
        </Button>
      </div>
    );
  }

  return null;
}
