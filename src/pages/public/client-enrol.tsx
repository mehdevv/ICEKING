import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useEnrolClient, useLoginClient, useGetSettings } from "@/api";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { celebrate, tabPanel, tapScale } from "@/lib/motion";
import ClientShell, { ClientCard, ClientLoading } from "@/components/client/client-shell";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  LogIn,
  PartyPopper,
  Smartphone,
  Sparkles,
  UserPlus,
} from "lucide-react";

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

export default function ClientEnrol() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: settings, isLoading } = useGetSettings();
  const enrolClient = useEnrolClient();
  const loginClient = useLoginClient();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [signupSuccess, setSignupSuccess] = useState<{ name: string; token: string } | null>(null);

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", phone: "", email: "", password: "", confirmPassword: "" },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  const primary = settings?.primaryColor ?? "#1A56DB";
  const secondary = settings?.secondaryColor ?? "#0E9F6E";

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
      setSignupSuccess({ name: response.fullName, token: response.fidelityQrToken });
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
      setLocation(`~/card/${response.fidelityQrToken}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Sign in failed", description: message, variant: "destructive" });
    }
  };

  if (isLoading) return <ClientLoading label="Loading…" />;

  if (signupSuccess) {
    return (
      <ClientShell primaryColor={primary} secondaryColor={secondary}>
        <div className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
          <ClientCard className="p-8 text-center">
            <motion.div variants={celebrate} initial="initial" animate="animate">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                <PartyPopper className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Welcome, {signupSuccess.name.split(" ")[0]}!</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Your loyalty card is ready. Use your phone & password to sign in next time.
              </p>
              <motion.div {...tapScale()} className="mt-8">
                <Button
                  className="w-full h-14 text-lg rounded-2xl shadow-lg"
                  style={{ backgroundColor: primary }}
                  onClick={() => setLocation(`~/card/${signupSuccess.token}`)}
                >
                  Open My Card
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          </ClientCard>
        </div>
      </ClientShell>
    );
  }

  return (
    <ClientShell primaryColor={primary} secondaryColor={secondary}>
      <div className="flex min-h-[100dvh] flex-col items-center justify-center p-4 py-8">
        <ClientCard className="overflow-hidden">
          <div className="p-6 pb-4 text-center border-b border-border/50">
            {settings?.logoUrl ? (
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={settings.logoUrl}
                alt="Logo"
                className="w-20 h-20 mx-auto object-contain mb-3 rounded-2xl"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl shadow-md"
                style={{ backgroundColor: primary }}
              >
                {(settings?.businessName ?? "LQ").slice(0, 2).toUpperCase()}
              </div>
            )}
            <h1 className="text-xl font-bold tracking-tight">{settings?.businessName || "LoyalQR"}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              Digital loyalty card
            </p>
          </div>

          <div className="p-2">
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-2xl m-3">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all min-h-12 ${
                  tab === "login" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setTab("signup")}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all min-h-12 ${
                  tab === "signup" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                <UserPlus className="h-4 w-4" />
                New card
              </button>
            </div>

            <div className="px-4 pb-6">
              <AnimatePresence mode="wait">
                {tab === "login" ? (
                  <motion.div key="login" variants={tabPanel} initial="initial" animate="animate" exit="exit">
                    <p className="text-xs text-muted-foreground mb-4 text-center">
                      Already have a card? Enter your phone & password.
                    </p>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    placeholder="0555 123 456"
                                    className="h-12 pl-10 rounded-xl text-base"
                                    {...field}
                                  />
                                </div>
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
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  autoComplete="current-password"
                                  placeholder="Your password"
                                  className="h-12 rounded-xl text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <motion.div {...tapScale()}>
                          <Button
                            type="submit"
                            className="w-full h-14 text-base rounded-2xl font-semibold shadow-md"
                            style={{ backgroundColor: primary }}
                            disabled={loginClient.isPending}
                          >
                            {loginClient.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Opening card…
                              </>
                            ) : (
                              <>
                                View My Card
                                <ArrowRight className="ml-2 h-5 w-5" />
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </form>
                    </Form>
                  </motion.div>
                ) : (
                  <motion.div key="signup" variants={tabPanel} initial="initial" animate="animate" exit="exit">
                    <p className="text-xs text-muted-foreground mb-4 text-center">
                      First visit? Create your free loyalty card in seconds.
                    </p>
                    <Form {...signupForm}>
                      <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-3">
                        <FormField
                          control={signupForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your name"
                                  autoComplete="name"
                                  className="h-12 rounded-xl text-base"
                                  {...field}
                                />
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
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  inputMode="tel"
                                  autoComplete="tel"
                                  placeholder="0555 123 456"
                                  className="h-12 rounded-xl text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={signupForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Min. 6 chars"
                                    className="h-12 rounded-xl"
                                    {...field}
                                  />
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
                                <FormLabel>Confirm</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Repeat"
                                    className="h-12 rounded-xl"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <motion.div {...tapScale()}>
                          <Button
                            type="submit"
                            className="w-full h-14 text-base rounded-2xl font-semibold shadow-md mt-2"
                            style={{ backgroundColor: primary }}
                            disabled={enrolClient.isPending}
                          >
                            {enrolClient.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Creating…
                              </>
                            ) : (
                              "Create My Card"
                            )}
                          </Button>
                        </motion.div>
                      </form>
                    </Form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-amber-950">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Remember your phone & password — you&apos;ll need them every visit.</p>
              </div>
            </div>
          </div>
        </ClientCard>
      </div>
    </ClientShell>
  );
}
