import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { Brain, Sparkles, Coins, ArrowRight, Star, Zap, Trophy, Target } from "lucide-react";
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
    body: "Log a habit → grow your pot → move it to savings anytime. Real money, in your own savings pot — you transfer it yourself.",
  },
];

const FLOATERS = [
  { Icon: Star, className: "top-16 left-8 text-primary/20 animate-float", size: 28, delay: "0s" },
  { Icon: Zap, className: "top-24 right-10 text-accent/20 animate-float-slow", size: 24, delay: "0.5s" },
  { Icon: Trophy, className: "bottom-40 left-6 text-primary/15 animate-float-slow", size: 32, delay: "1s" },
  { Icon: Target, className: "bottom-32 right-8 text-accent/15 animate-float", size: 26, delay: "1.5s" },
  { Icon: Star, className: "top-1/3 right-4 text-primary/10 animate-float", size: 20, delay: "2s" },
  { Icon: Sparkles, className: "top-1/3 left-4 text-accent/10 animate-float-slow", size: 22, delay: "0.3s" },
];

const Welcome = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const prevCurrent = useRef(0);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      const next = api.selectedScrollSnap();
      if (next !== prevCurrent.current) {
        setIsAnimating(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsAnimating(true));
        });
      }
      prevCurrent.current = next;
      setCurrent(next);
    });
  }, [api]);

  const isLast = current === SLIDES.length - 1;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Floating background icons */}
      {FLOATERS.map((f, i) => (
        <f.Icon
          key={i}
          className={cn("absolute pointer-events-none", f.className)}
          size={f.size}
          style={{ animationDelay: f.delay }}
        />
      ))}

      {/* Animated background blobs */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full animate-blob blur-3xl pointer-events-none" />
      <div className="absolute bottom-32 left-1/4 w-48 h-48 bg-accent/5 rounded-full animate-blob blur-3xl pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="max-w-lg mx-auto w-full px-6 py-10 flex-1 flex flex-col relative z-10">
        <header className="text-center mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-shimmer">
              Habit Visor
            </span>
          </h1>
        </header>

        <Carousel setApi={setApi} className="flex-1 flex items-center">
          <CarouselContent>
            {SLIDES.map((slide, i) => {
              const Icon = slide.icon;
              const active = current === i && isAnimating;
              return (
                <CarouselItem key={i}>
                  <div className="text-center px-2 py-6 space-y-6">
                    <div
                      className={cn(
                        "mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/25 animate-glow-pulse",
                        active && "animate-scale-bounce"
                      )}
                      style={{ animationDelay: active ? undefined : "0s" }}
                    >
                      <Icon className="h-12 w-12 text-primary-foreground" />
                    </div>
                    <h2
                      className={cn(
                        "font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight",
                        active && "animate-slide-up"
                      )}
                      style={{ animationDelay: active ? "0.1s" : "0s", opacity: active ? undefined : 1 }}
                    >
                      {slide.title}
                    </h2>
                    <p
                      className={cn(
                        "text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md mx-auto",
                        active && "animate-slide-up"
                      )}
                      style={{ animationDelay: active ? "0.2s" : "0s", opacity: active ? undefined : 1 }}
                    >
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
                "h-2.5 rounded-full transition-all duration-300",
                current === i
                  ? "w-10 bg-gradient-to-r from-primary to-accent"
                  : "w-2.5 bg-muted-foreground/25 hover:bg-muted-foreground/40"
              )}
            />
          ))}
        </div>

        <div className="space-y-3">
          {!isLast ? (
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all shadow-lg shadow-primary/20"
              onClick={() => api?.scrollNext()}
            >
              Next
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary via-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/25 animate-pulse-success"
              onClick={() => navigate("/signup")}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get started
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          )}
          <Link to="/auth" className="block">
            <Button variant="ghost" className="w-full h-12 text-muted-foreground hover:text-foreground transition-colors">
              I already have an account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
