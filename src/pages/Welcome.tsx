import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { Brain, Sparkles, Coins, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    icon: Brain,
    title: "Small habits, big results",
    body: "Tiny daily actions beat willpower. Lower the bar, show up consistently, and watch habits build themselves.",
  },
  {
    icon: Sparkles,
    title: "Reward the effort",
    body: "Pairing a habit with an instant reward trains your brain to crave the next win. Close the loop, repeat.",
  },
  {
    icon: Coins,
    title: "How it works",
    body: "Log a habit → grow your pot → cash out anytime. You set the value for every win.",
  },
];

const Welcome = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  const isLast = current === SLIDES.length - 1;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-lg mx-auto w-full px-6 py-10 flex-1 flex flex-col">
        <header className="text-center mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              Habit Rewards
            </span>
          </h1>
        </header>

        <Carousel setApi={setApi} className="flex-1 flex items-center">
          <CarouselContent>
            {SLIDES.map((slide, i) => {
              const Icon = slide.icon;
              return (
                <CarouselItem key={i}>
                  <div className="text-center px-2 py-6 space-y-6">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                      <Icon className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                      {slide.title}
                    </h2>
                    <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md mx-auto">
                      {slide.body}
                    </p>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6 mb-8">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-2 rounded-full transition-all",
                current === i ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        <div className="space-y-3">
          {!isLast ? (
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold"
              onClick={() => api?.scrollNext()}
            >
              Next
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold"
              onClick={() => navigate("/signup")}
            >
              Get started
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          )}
          <Link to="/auth" className="block">
            <Button variant="ghost" className="w-full h-12 text-muted-foreground">
              I already have an account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
