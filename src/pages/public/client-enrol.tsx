import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useEnrolClient, useLoginClient, useGetSettings } from "@/api";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Bookmark } from "lucide-react";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters."),
    phone: z.string().min(8, "Phone number is required."),
    email: z.string().email("Enter a valid email.").optional().or(z.literal("")),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  phone: z.string().min(8, "Phone number is required."),
  password: z.string().min(1, "Password is required."),
});

type EnrolResult = {
  fullName: string;
  phone: string;
  fidelityQrToken: string;
};

export default function ClientEnrol() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: settings } = useGetSettings();
  const enrolClient = useEnrolClient();
  const loginClient = useLoginClient();
  const [enrolled, setEnrolled] = useState<EnrolResult | null>(null);
  const [tab, setTab] = useState<"signup" | "login">("signup");

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", phone: "", email: "", password: "", confirmPassword: "" },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  const goToCard = (result: EnrolResult) => {
    setEnrolled(result);
    toast({ title: tab === "signup" ? "Welcome to the loyalty program!" : "Welcome back!" });
  };

  const onSignup = async (values: z.infer<typeof signupSchema>) => {
    try {
      const response = await enrolClient.mutateAsync({
        data: {
          fullName: values.fullName,
          phone: values.phone,
          password: values.password,
          email: values.email || undefined,
        },
      });
      goToCard({
        fullName: response.fullName,
        phone: response.phone,
        fidelityQrToken: response.fidelityQrToken,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      if (message.toLowerCase().includes("already exists")) {
        setTab("login");
        loginForm.setValue("phone", values.phone);
      }
      toast({ title: "Registration failed", description: message, variant: "destructive" });
    }
  };

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    try {
      const response = await loginClient.mutateAsync({ data: values });
      goToCard({
        fullName: response.fullName,
        phone: values.phone,
        fidelityQrToken: response.fidelityQrToken,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Sign in failed", description: message, variant: "destructive" });
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
              <CardTitle className="text-2xl font-bold">Your card is ready!</CardTitle>
              <CardDescription className="text-base mt-2">
                Use your phone number and password to sign in next time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {enrolled.fullName}</p>
                <p><span className="font-medium">Phone:</span> {enrolled.phone}</p>
              </div>
              <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p>
                  <strong>Remember your phone and password.</strong> Bookmark your card link or take a screenshot of your QR code.
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

  const shellStyle = settings?.primaryColor ? { backgroundColor: settings.primaryColor } : {};

  return (
    <div className="min-h-[100dvh] flex flex-col" style={shellStyle}>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <CardHeader className="text-center pb-4">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-24 h-24 mx-auto object-contain mb-4 rounded-xl" />
            ) : (
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">LQ</span>
              </div>
            )}
            <CardTitle className="text-2xl font-bold">{settings?.businessName || "LoyalQR"} Rewards</CardTitle>
            <CardDescription className="text-base mt-2">
              Create your digital loyalty card or sign in with your phone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signup" | "login")}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signup">Create card</TabsTrigger>
                <TabsTrigger value="login">Sign in</TabsTrigger>
              </TabsList>

              <TabsContent value="signup">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
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
                      control={signupForm.control}
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
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (optional)</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="At least 6 characters" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Repeat password" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-12 text-lg mt-2 shadow-md" disabled={enrolClient.isPending}>
                      {enrolClient.isPending ? "Creating card..." : "Create My Card"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
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
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Your password" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Don&apos;t have a card yet? Switch to <button type="button" className="text-primary underline" onClick={() => setTab("signup")}>Create card</button>.
                    </p>
                    <Button type="submit" className="w-full h-12 text-lg mt-2 shadow-md" disabled={loginClient.isPending}>
                      {loginClient.isPending ? "Signing in..." : "Sign In & View Card"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
