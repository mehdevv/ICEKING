import { useRoute } from "wouter";
import { useGetClientCard } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";

export default function CardView() {
  const [, params] = useRoute("/card/:token");
  const token = params?.token;
  
  const { data: card, isLoading, error } = useGetClientCard(token || "", {
    query: {
      enabled: !!token,
    }
  });

  if (!token) return <div>Invalid link</div>;

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-muted p-4 flex flex-col items-center py-12">
        <Skeleton className="h-12 w-48 mb-8 rounded-lg" />
        <Skeleton className="w-full max-w-sm aspect-[4/5] rounded-3xl" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-[100dvh] bg-muted p-4 flex flex-col items-center justify-center">
        <div className="text-center p-8 bg-card rounded-2xl shadow-sm">
          <div className="text-destructive mb-4 flex justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Card Not Found</h2>
          <p className="text-muted-foreground">This loyalty card doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    // In a real app, this would use html2canvas or a backend generated image
    // For now, we'll just open the card URL if it exists
    if (card.cardUrl) {
      window.open(card.cardUrl, "_blank");
    }
  };

  const stamps = Array.from({ length: card.stampThreshold });

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col items-center py-8 px-4" style={{ backgroundColor: `${card.primaryColor}15` }}>
      <h1 className="text-2xl font-bold text-center mb-8" style={{ color: card.primaryColor }}>
        {card.businessName}
      </h1>
      
      <div className="w-full max-w-[340px] perspective-1000">
        <div className="relative w-full rounded-3xl shadow-2xl overflow-hidden bg-white transform transition-transform" style={{ borderTop: `8px solid ${card.primaryColor}` }}>
          {/* Card Header */}
          <div className="p-6 text-center border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">{card.clientName}</h2>
            <p className="text-sm text-gray-500 mt-1">Member Card</p>
          </div>
          
          {/* QR Code Area */}
          <div className="p-8 flex justify-center bg-gray-50/50">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <QRCodeSVG value={token} size={200} level="H" fgColor="#000" />
            </div>
          </div>
          
          {/* Stamps Area */}
          <div className="p-6 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-gray-700">Your Progress</span>
              <span className="text-sm font-bold" style={{ color: card.primaryColor }}>
                {card.currentCycleStamps} / {card.stampThreshold}
              </span>
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {stamps.map((_, i) => (
                <div 
                  key={i} 
                  className="aspect-square rounded-full flex items-center justify-center border-2 transition-all"
                  style={{ 
                    borderColor: i < card.currentCycleStamps ? card.primaryColor : '#E5E7EB',
                    backgroundColor: i < card.currentCycleStamps ? `${card.primaryColor}20` : 'transparent'
                  }}
                >
                  {i < card.currentCycleStamps && (
                    <CheckCircle2 className="w-6 h-6" style={{ color: card.primaryColor }} />
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-6">
              Show this QR code to the cashier to earn stamps!
            </p>
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-[340px] mt-8 flex gap-4">
        <Button 
          className="flex-1 h-14 rounded-xl shadow-sm" 
          variant="outline"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `${card.businessName} Loyalty Card`,
                url: window.location.href
              });
            }
          }}
        >
          <Share2 className="mr-2 h-5 w-5" />
          Share
        </Button>
        <Button 
          className="flex-1 h-14 rounded-xl shadow-md"
          onClick={handleDownload}
          style={{ backgroundColor: card.primaryColor }}
        >
          <Download className="mr-2 h-5 w-5" />
          Save
        </Button>
      </div>
    </div>
  );
}
