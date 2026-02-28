import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, RefreshCw } from "lucide-react";

export default function PendingApproval() {
  const { user, isApproved, loading, signOut, recheckApproval } = useAuth();
  const [checking, setChecking] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isApproved) return <Navigate to="/" replace />;

  const handleCheck = async () => {
    setChecking(true);
    await recheckApproval();
    setChecking(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-30" />
      <div className="orb orb-cyan w-[400px] h-[400px] -top-32 -right-32" />
      <div className="orb orb-violet w-[350px] h-[350px] -bottom-32 -left-32" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="glass-strong rounded-2xl p-8 text-center glow-amber relative overflow-hidden scan-line">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl mx-auto mb-6 glow-ring"
               style={{ background: 'hsla(38, 100%, 55%, 0.12)', '--primary': '38 100% 55%' } as React.CSSProperties}>
            <Clock className="w-7 h-7 text-health-amber" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Pending Approval</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Your account is awaiting admin approval. Hang tight — the mothership is reviewing. 🛸
          </p>

          <div className="flex flex-col gap-3">
            <Button onClick={handleCheck} disabled={checking} variant="outline" className="w-full border-border/50">
              <RefreshCw className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""}`} />
              {checking ? "Checking..." : "Check Again"}
            </Button>
            <Button onClick={signOut} variant="ghost" className="w-full text-muted-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
