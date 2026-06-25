import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useIsPro } from "@/hooks/usePro";
import { ManageActivities } from "@/components/ManageActivities";
import { ProInterestCard } from "@/components/ProInterestCard";

const Tasks = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: isPro, isLoading: proLoading } = useIsPro();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/welcome", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="font-display text-2xl font-bold ml-2">Edit Tasks</h1>
        </div>

        {proLoading ? (
          <Card className="p-6 border-border/50 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </Card>
        ) : isPro ? (
          <ManageActivities />
        ) : (
          <ProInterestCard />
        )}
      </div>
    </div>
  );
};

export default Tasks;
