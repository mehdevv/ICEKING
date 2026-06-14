import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useEnrolClient, useGetSettings } from "@/api";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Bookmark } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(8, "Phone number is required."),
  email: z.string().email("A valid email address is required."),
});

type EnrolResult = {
  fullName: string;
  phone: string;
  email: string;
  fidelityQrToken: string;
};

export default function ClientEnrol() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: settings } = useGetSettings();
  const enrolClient = useEnrolClient();
  const [enrolled, setEnrolled] = useState<EnrolResult | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", phone: "", email: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await enrolClient.mutateAsync({
        data: {
          fullName: values.fullName,
          phone: values.phone,
          email: values.email,
        },
      });
      setEnrolled({
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        fidelityQrToken: response.fidelityQrToken,
      });
      toast({ title: "Welcome to the loyalty program!" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Registration failed", description: message, variant: "destructive" });
    }
  };

  if (enrolled) {
    const cardUrl = `${window.location.origin}/card/${enrolled.fidelityQrToken}`;
    return (
      <div
        className="min-h-[100dvh] flex flex-col"
        style={settings?.primaryColor ? { backgroundColor: settings.primaryColor } : {}}
      >
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-none">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-secondary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Bookmark className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl font-bold">You&apos;re enrolled!</CardTitle>
              <CardDescription className="text-base mt-2">
                Save your details — you&apos;ll need them when you visit us again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {enrolled.fullName}</p>
                <p><span className="font-medium">Email:</span> {enrolled.email}</p>
                <p><span className="font-medium">Phone:</span> {enrolled.phone}</p>
              </div>
              <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>
                  <strong>Remember your credentials.</strong> Bookmark your loyalty card link or take a screenshot.
                  Use the same email and phone when you return so we can find your account.
                </p>
              </div>
              <Button className="w-full h-12 text-lg" onClick={() => setLocation(`~/card/${enrolled.fidelityQrToken}`)}>
                View My Loyalty Card
              </Button>
              <p className="text-xs text-center text-muted-foreground break-all">{cardUrl}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={settings?.primaryColor ? { backgroundColor: settings.primaryColor } : {}}
    >
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <CardHeader className="text-center pb-6">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-24 h-24 mx-auto object-contain mb-4 rounded-xl" />
            ) : (
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">LQ</span>
              </div>
            )}
            <CardTitle className="text-2xl font-bold">{settings?.businessName || "LoyalQR"} Rewards</CardTitle>
            <CardDescription className="text-base mt-2">
              Join our loyalty program. Enter your details to get your digital card.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+213 123 456 789" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Please use accurate details — you will need the same email and phone on future visits.
                </p>
                <Button type="submit" className="w-full h-12 text-lg mt-2 shadow-md" disabled={enrolClient.isPending}>
                  {enrolClient.isPending ? "Joining..." : "Join Now"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
