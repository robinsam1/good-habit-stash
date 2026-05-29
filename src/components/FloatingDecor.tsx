import { Star, Zap, Trophy, Target, Sparkles } from "lucide-react";

type Floater = {
  Icon: React.ElementType;
  className: string;
  delay: number;
  slow?: boolean;
};

const DEFAULT_FLOATERS: Floater[] = [
  { Icon: Star, className: "top-[10%] left-[7%] w-6 h-6 text-accent/20", delay: 0 },
  { Icon: Zap, className: "top-[18%] right-[9%] w-5 h-5 text-primary/20", delay: 1 },
  { Icon: Trophy, className: "bottom-[16%] left-[10%] w-7 h-7 text-accent/15", delay: 0.5, slow: true },
  { Icon: Target, className: "bottom-[22%] right-[7%] w-6 h-6 text-primary/15", delay: 1.5, slow: true },
  { Icon: Sparkles, className: "top-[42%] left-[4%] w-5 h-5 text-accent/10", delay: 2 },
  { Icon: Star, className: "top-[6%] right-[22%] w-4 h-4 text-primary/10", delay: 2.5, slow: true },
];

export function FloatingDecor({ floaters = DEFAULT_FLOATERS }: { floaters?: Floater[] }) {
  return (
    <>
      {floaters.map(({ Icon, className, delay, slow }, i) => (
        <div
          key={i}
          className={`absolute pointer-events-none ${slow ? "animate-float-slow" : "animate-float"} ${className}`}
          style={{ animationDelay: `${delay}s` }}
        >
          <Icon className="w-full h-full" />
        </div>
      ))}
    </>
  );
}
