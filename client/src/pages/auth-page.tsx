import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PawPrint, Lock, User, Mail, ArrowLeft, Loader2, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const recoverySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z.string().optional(),
});

type AuthMode = "login" | "forgot-username" | "forgot-password";

export default function AuthPage() {
  const [mode, setAuthMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<{ type: "username" | "password", value: string } | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const recoveryForm = useForm<z.infer<typeof recoverySchema>>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { email: "", username: "" },
  });

  async function onLogin(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/login", values);
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
        toast({ title: "Welcome back!", description: "Access granted to AR Farm Monitoring." });
        setLocation("/");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onRecover(values: z.infer<typeof recoverySchema>) {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/users/recover", values);
      const data = await res.json();

      if (mode === "forgot-username") {
        setRecoveryResult({ type: "username", value: data.username });
      } else {
        setRecoveryResult({ type: "password", value: "A reset request has been sent to the administrator." });
      }
    } catch (error: any) {
      toast({
        title: "Recovery Failed",
        description: error.message || "We couldn't find an account with those details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none grayscale invert dark:invert-0">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`,
            backgroundSize: '200px'
          }}
        />
      </div>

      {/* Centered Auth Card */}
      <div className="relative z-10 w-full max-w-md px-4 animate-in fade-in zoom-in-95 duration-500">
        <Card className="border-border/50 shadow-2xl rounded-3xl overflow-hidden glass-card bg-card/80 backdrop-blur-xl">
          <CardHeader className="bg-muted/10 border-b border-border/50 p-8 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/20 mb-4 ring-4 ring-background">
              <PawPrint className="h-10 w-10" />
            </div>
            <CardTitle className="text-3xl font-display font-black tracking-tighter text-foreground uppercase">
              <span className="text-primary">AR</span> FARM
            </CardTitle>
            <CardDescription className="font-bold uppercase tracking-[0.3em] text-[10px] mt-1 text-muted-foreground">
              Management Portal
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {recoveryResult ? (
              <div className="text-center space-y-6 py-4 animate-in slide-in-from-bottom-4 duration-500">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
                <div>
                  <h3 className="text-xl font-bold font-display text-foreground">
                    {recoveryResult.type === "username" ? "Username Located" : "Request Sent"}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {recoveryResult.type === "username"
                      ? `We found an account associated with your email. Your username is below:`
                      : recoveryResult.value}
                  </p>
                  {recoveryResult.type === "username" && (
                    <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10 font-black text-primary text-xl tracking-tight shadow-inner">
                      {recoveryResult.value}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl font-bold border-border/50 hover:bg-muted/50 transition-all"
                  onClick={() => {
                    setRecoveryResult(null);
                    setAuthMode("login");
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : mode === "login" ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                          <User className="h-3 w-3 text-primary" /> Username
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter username" {...field} className="h-12 bg-muted/20 border-border/50 rounded-xl focus:ring-primary/20 transition-all" />
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
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Lock className="h-3 w-3 text-primary" /> Password
                          </FormLabel>
                          <button
                            type="button"
                            onClick={() => setAuthMode("forgot-username")}
                            className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                          >
                            Forgot?
                          </button>
                        </div>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter password"
                              {...field}
                              className="h-12 bg-muted/20 border-border/50 rounded-xl focus:ring-primary/20 transition-all pr-12"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover-elevate transition-all mt-2"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <button
                  onClick={() => setAuthMode("login")}
                  className="flex items-center text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                >
                  <ArrowLeft className="mr-2 h-3 w-3" /> Back to Sign In
                </button>

                <div>
                  <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2 uppercase tracking-tight">
                    <KeyRound className="h-5 w-5 text-primary" />
                    {mode === "forgot-username" ? "Recover ID" : "Reset Pin"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {mode === "forgot-username"
                      ? "Enter your email to locate your account ID."
                      : "Provide your account details to request a password reset."}
                  </p>
                </div>

                <Form {...recoveryForm}>
                  <form onSubmit={recoveryForm.handleSubmit(onRecover)} className="space-y-4">
                    <FormField
                      control={recoveryForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Mail className="h-3 w-3 text-primary" /> Email
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter email" {...field} className="h-12 bg-muted/20 border-border/50 rounded-xl transition-all" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {mode === "forgot-password" && (
                      <FormField
                        control={recoveryForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                              <User className="h-3 w-3 text-primary" /> Username
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} className="h-12 bg-muted/20 border-border/50 rounded-xl transition-all" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-md hover-elevate transition-all mt-2"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Request"}
                    </Button>

                    {mode === "forgot-username" && (
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setAuthMode("forgot-password")}
                          className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                        >
                          I need to reset my password
                        </button>
                      </div>
                    )}
                  </form>
                </Form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simple Footer */}
        <p className="mt-8 text-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.4em] select-none">
          &copy; 2024 AR FARM MONITORING
        </p>
      </div>
    </div>
  );
}
