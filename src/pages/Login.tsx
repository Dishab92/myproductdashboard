import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

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
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mx-auto mb-6">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">PM Master Dashboard</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Sign in to access the command center
          </p>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full h-11 font-semibold"
          >
            {signingIn ? "Signing in..." : "Sign in with Google"}
          </Button>

          <p className="text-xs text-muted-foreground mt-6">
            Access requires admin approval after first sign-in.
          </p>
        </div>
      </div>
    </div>
  );
}
