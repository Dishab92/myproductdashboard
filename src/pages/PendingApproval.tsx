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
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-health-amber mx-auto mb-6">
            <Clock className="w-7 h-7 text-health-amber" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Pending Approval</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Your account is awaiting admin approval. You'll get access once your request is approved.
          </p>

          <div className="flex flex-col gap-3">
            <Button onClick={handleCheck} disabled={checking} variant="outline" className="w-full">
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
