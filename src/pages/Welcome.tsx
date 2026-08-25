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
import { Sparkles, ArrowRight, Star, Zap, Trophy, Target, Brain, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import slide1Asset from "@/assets/welcome-1.jpg.asset.json";
import slide2Asset from "@/assets/welcome-2.jpg.asset.json";
import slide3Asset from "@/assets/welcome-3.jpg.asset.json";

const SLIDES = [
  {
    image: slide1Asset.url,
    alt: "Person lying on couch scrolling phone",
    title: "I was struggling with my habits — until I built this app",
    body: "I'd wake up 5 minutes before my first meeting. Years of gym memberships without a single visit. My life wasn't going anywhere.",
  },
  {
    image: slide2Asset.url,
    alt: "Stressed worker in a tense meeting",
    title: "Money dictates our life",
    body: "We give 50 years of our best effort to whoever's paying. 7am Zoom calls, managers yelling at us, the stress — but we do it because it earns us money.",
  },
  {
    image: slide3Asset.url,
    alt: "Three friends laughing together on steps",
    title: "What if you worked for yourself instead?",
    body: "Set a selfish goal — a holiday, a gaming PC. Then every day you do something positive for yourself, use this app to put money toward it. When you give your goals that kind of care, they're so much easier to reach.",
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
    <div className="h-[100dvh] overflow-hidden flex flex-col relative">
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

      <div className="max-w-lg sm:max-w-3xl mx-auto w-full px-6 py-6 short:py-3 flex-1 min-h-0 flex flex-col relative z-10">
        <header className="text-center mb-6 short:mb-2 shrink-0">
          <h1 className="font-display text-3xl sm:text-4xl short:text-2xl font-bold tracking-tight">
            <span className="text-brand-gradient animate-shimmer">
              Habit Visor
            </span>
          </h1>
        </header>

        <Carousel setApi={setApi} className="flex-1 min-h-0 flex items-center">
          <CarouselContent>
            {SLIDES.map((slide, i) => {
              const active = current === i && isAnimating;
              return (
                <CarouselItem key={i}>
                  <div className="text-center px-2 py-2 space-y-4 short:space-y-2">
                    <div
                      className={cn(
                        "w-full h-[30vh] short:h-[22vh] shorter:h-[18vh] max-h-[340px] rounded-3xl overflow-hidden shadow-xl shadow-primary/20 ring-1 ring-border/50 relative",
                        active && "animate-scale-bounce"
                      )}
                    >
                      <img
                        src={slide.image}
                        alt={slide.alt}
                        loading={i === 0 ? "eager" : "lazy"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
                    </div>

                    <h2
                      className={cn(
                        "font-display text-xl sm:text-2xl short:text-lg font-bold text-foreground leading-snug tracking-tight text-balance",
                        active && "animate-slide-up"
                      )}
                      style={{ animationDelay: active ? "0.1s" : "0s", opacity: active ? undefined : 1 }}
                    >
                      {slide.title}
                    </h2>
                    <p
                      className={cn(
                        "text-muted-foreground text-[15px] sm:text-base short:text-[13px] leading-relaxed short:leading-snug text-pretty",
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
                  ? "w-10 bg-brand-gradient"
                  : "w-2.5 bg-muted-foreground/25 hover:bg-muted-foreground/40"
              )}
            />
          ))}
        </div>

        <div className="space-y-3">
          {!isLast ? (
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => api?.scrollNext()}
            >
              Next
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse-success"
              onClick={() => navigate("/get-started")}
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
