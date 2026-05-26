import { FormEvent, useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("doctor@ward.io");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || "/dashboard";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back", description: "Logged in successfully." });
      navigate(from, { replace: true });
    } catch (err) {
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      {/* Background Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-brand/5 blur-[100px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-brand-glow/5 blur-[100px]" />
      </div>

      <Card className="relative z-10 w-full max-w-md overflow-hidden border-none bg-white/40 p-10 shadow-2xl backdrop-blur-2xl dark:bg-black/20">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-transform hover:scale-105" style={{ background: "var(--gradient-brand)" }}>
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Access Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Welcome to the OptiCare management system</p>
        </div>

        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
            <Input
              id="email"
              type="email"
              required
              className="h-12 border-border/50 bg-white/50 dark:bg-black/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
              <button type="button" className="text-xs font-semibold text-brand hover:underline">Forgot password?</button>
            </div>
            <Input
              id="password"
              type="password"
              required
              minLength={4}
              className="h-12 border-border/50 bg-white/50 dark:bg-black/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="h-12 w-full text-base font-bold shadow-elegant transition-all hover:scale-[1.02]" disabled={loading}>
            {loading ? "Authenticating..." : "Sign In to Portal"}
          </Button>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-muted-foreground">Demo Credentials</span></div>
          </div>
          
          <p className="text-center text-sm font-medium text-muted-foreground">
            Use <span className="text-foreground">doctor@ward.io</span> and any <span className="text-foreground">4+ char password</span>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default Login;