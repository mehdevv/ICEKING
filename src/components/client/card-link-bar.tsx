import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cardPageUrl, formatCardCode } from "@/lib/card-code";
import { tapScale, vibrate } from "@/lib/motion";
import { motion } from "framer-motion";
import { Check, Copy, Link2 } from "lucide-react";
import { useClientI18n } from "@/hooks/use-client-i18n";
import { cn } from "@/lib/utils";

type CardLinkBarProps = {
  code: string;
  primaryColor?: string;
  className?: string;
};

export default function CardLinkBar({ code, primaryColor = "#1A56DB", className }: CardLinkBarProps) {
  const { t } = useClientI18n();
  const fullUrl = cardPageUrl(code);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      vibrate(30);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const input = document.createElement("input");
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border border-border/60 bg-white/95 backdrop-blur-md px-3 py-2 shadow-sm shrink-0",
        className,
      )}
    >
      <p
        className="font-mono text-base font-bold tracking-wide tabular-nums"
        style={{ color: primaryColor }}
      >
        {formatCardCode(code)}
      </p>

      <motion.div {...tapScale()}>
        <Button
          type="button"
          variant="outline"
          className="h-10 min-w-10 shrink-0 rounded-xl px-2.5 gap-1"
          onClick={handleCopy}
          aria-label={copied ? t("copied") : t("copyLink")}
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <>
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <Copy className="h-3.5 w-3.5" aria-hidden />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
