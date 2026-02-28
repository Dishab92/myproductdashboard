import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Starfield } from "@/components/effects/Starfield";

export default function Login() {
  const { user, isApproved, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (user && isApproved) return <Navigate to="/" replace />;
  if (user && !isApproved) return <Navigate to="/pending" replace />;

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError(result.error.message || "Sign in failed");
      }
    } catch (e) {
      setError("An unexpected error occurred");
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden">
      <Starfield />
      <div className="absolute inset-0 grid-dots opacity-40" />
      <div className="orb orb-cyan w-[500px] h-[500px] -top-40 -left-40" />
      <div className="orb orb-violet w-[400px] h-[400px] top-1/3 -right-32" />
      <div className="orb orb-magenta w-[350px] h-[350px] -bottom-32 left-1/4" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="glass-strong rounded-2xl p-8 text-center glow-cyan">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-6 glow-ring"
               style={{ background: 'hsla(var(--primary), 0.12)' }}>
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold mb-1 text-gradient-cyan">PM Master Dashboard</h1>
          <p className="text-sm text-muted-foreground mb-8">Command your product universe ✦</p>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 mb-4 border border-destructive/20">
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full h-12 font-semibold text-sm rounded-xl transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(220 80% 55%))',
              boxShadow: '0 4px 20px hsla(var(--primary), 0.3)',
            }}
          >
            {signingIn ? "Signing in..." : "Sign in with Google"}
          </Button>

          <p className="text-xs text-muted-foreground mt-6 opacity-60">
            Access requires admin approval after first sign-in.
          </p>
        </div>
      </div>
    </div>
  );
}
