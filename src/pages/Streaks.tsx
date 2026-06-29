import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Flame } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStreaks } from "@/hooks/useStreaks";
import { StreakRow } from "@/components/StreakRow";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const Streaks = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: stats, isLoading } = useStreaks();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/welcome", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        <header className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Flame className="h-7 w-7 text-accent" />
            Streaks
          </h1>
          <p className="text-muted-foreground mt-1">
            How long you've kept each habit going
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !stats?.length ? (
          <div className="text-center py-12 px-4">
            <div className="text-4xl mb-3">🔥</div>
            <p className="text-muted-foreground font-medium">No habits yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a task to start building streaks
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.map((s) => (
              <StreakRow key={s.activityId} stat={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Streaks;
