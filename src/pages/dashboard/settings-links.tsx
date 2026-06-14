import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  APP_LINK_GROUPS,
  EDGE_FUNCTION_META,
  EDGE_FUNCTION_NAMES,
  appLink,
  edgeFunctionLink,
  getAppOrigin,
  LOCAL_APP_LINKS,
} from "@/lib/links";
import { ExternalLink, Link2 } from "lucide-react";

function LinkRow({ label, href }: { label: string; href: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b border-border last:border-0">
      <span className="text-sm font-medium">{label}</span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary hover:underline font-mono break-all inline-flex items-center gap-1"
      >
        {href}
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    </div>
  );
}

export default function SettingsLinks() {
  const origin = getAppOrigin();
  const isLocal = origin.includes("localhost");

  return (
    <div className="space-y-4">
      {isLocal && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Local development</CardTitle>
            <CardDescription>
              You are running on <span className="font-mono">{origin}</span>. Bookmark these URLs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {Object.entries(LOCAL_APP_LINKS).map(([key, href]) => (
              <LinkRow key={key} label={key} href={href} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            App links
          </CardTitle>
          <CardDescription>Share or open these pages (uses current site URL).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {APP_LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">{group.title}</p>
              {group.links.map((item) => (
                <LinkRow key={item.path} label={item.label} href={appLink(item.path)} />
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edge function endpoints</CardTitle>
          <CardDescription>
            Paste code from <span className="font-mono">supabase/functions/</span> into Supabase Dashboard → Edge Functions.
            See <span className="font-mono">supabase/functions/LINKS.md</span> in the repo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {EDGE_FUNCTION_NAMES.map((name) => {
            const meta = EDGE_FUNCTION_META[name];
            return (
              <div key={name} className="rounded-lg border p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{name}</span>
                  <Badge variant="outline">JWT {meta.jwt.toUpperCase()}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{meta.usedBy}</p>
                <p className="text-xs font-mono text-muted-foreground">{meta.source}</p>
                <a
                  href={edgeFunctionLink(name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline font-mono break-all inline-flex items-center gap-1"
                >
                  {edgeFunctionLink(name)}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
