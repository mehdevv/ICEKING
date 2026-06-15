import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cardPageUrl, formatCardCode } from "@/lib/card-code";
import { tapScale, vibrate } from "@/lib/motion";
import { motion } from "framer-motion";
import { Check, Copy, Link2 } from "lucide-react";
import { useClientI18n } from "@/hooks/use-client-i18n";

type CardLinkBarProps = {
  code: string;
  primaryColor?: string;
  prominent?: boolean;
};

export default function CardLinkBar({ code, primaryColor = "#1A56DB", prominent }: CardLinkBarProps) {
  const { t } = useClientI18n();
  const fullUrl = cardPageUrl(code);
  const shortUrl = fullUrl.replace(/^https?:\/\//, "");
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 text-center ${
        prominent
          ? "bg-amber-50 border-amber-200 shadow-sm"
          : "bg-white/90 border-border/60 shadow-sm"
      }`}
    >
      {prominent && (
        <p className="text-sm font-semibold text-amber-900 mb-3">{t("saveLinkProminent")}</p>
      )}

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
        {t("cardNumber")}
      </p>
      <p
        className="text-2xl font-mono font-bold tracking-[0.25em] tabular-nums mb-3"
        style={{ color: primaryColor }}
      >
        {formatCardCode(code)}
      </p>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4 min-w-0">
        <Link2 className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate font-mono">{shortUrl}</span>
      </div>

      <motion.div {...tapScale()}>
        <Button
          type="button"
          className="w-full h-12 rounded-xl font-semibold"
          variant={copied ? "secondary" : "default"}
          style={copied ? undefined : { backgroundColor: primaryColor }}
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              {t("copied")}
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              {t("copyLink")}
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}
