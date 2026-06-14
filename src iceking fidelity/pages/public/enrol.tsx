import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useEnrolClient, useGetSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
});

export default function Enrol() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: settings } = useGetSettings();
  const enrolClient = useEnrolClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await enrolClient.mutateAsync({ 
        data: {
          fullName: values.fullName,
          phone: values.phone || undefined,
          email: values.email || undefined,
        } 
      });
      toast({ title: "Successfully enrolled!" });
      setLocation(`/card/${response.fidelityQrToken}`);
    } catch (error: any) {
      toast({
        title: "Enrolment failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col" style={settings?.primaryColor ? { backgroundColor: settings.primaryColor } : {}}>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <CardHeader className="text-center pb-6">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-24 h-24 mx-auto object-contain mb-4 rounded-xl" />
            ) : (
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">IK</span>
              </div>
            )}
            <CardTitle className="text-2xl font-bold">{settings?.businessName || "Ice King"} Rewards</CardTitle>
            <CardDescription className="text-base mt-2">
              Join our loyalty program to earn free treats and discounts!
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+213 123 456 789" className="h-12" {...field} />
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
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-lg mt-6 shadow-md" disabled={enrolClient.isPending}>
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
