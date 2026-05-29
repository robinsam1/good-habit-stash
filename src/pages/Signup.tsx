import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { REGIONS, getRegion } from "@/lib/regions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(100),
  region: z.string().min(1, "Pick a region"),
});

const Signup = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regionCode, setRegionCode] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = schema.safeParse({ email, password, region: regionCode });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const region = getRegion(regionCode);
    if (!region) {
      setErrors({ region: "Pick a valid region" });
      return;
    }

    setSubmitting(true);
    const { error } = await signUp(email, password, region);
    setSubmitting(false);

    if (error) {
      toast.error("Couldn't create account", { description: error.message });
      return;
    }
    toast.success("Welcome! 🎉");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <Link to="/welcome">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <header className="text-center mb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              Create your account
            </span>
          </h1>
          <p className="text-muted-foreground mt-2">Start rewarding your habits today.</p>
        </header>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-4">
            <h2 className="font-display text-xl font-semibold text-center">Sign Up</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select value={regionCode} onValueChange={setRegionCode} disabled={submitting}>
                  <SelectTrigger id="region" className={errors.region ? "border-destructive" : ""}>
                    <SelectValue placeholder="Choose your country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {REGIONS.map((r) => (
                      <SelectItem key={r.code} value={r.code}>
                        {r.name} · {r.currencySymbol} {r.currencyCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.region && <p className="text-sm text-destructive">{errors.region}</p>}
                <p className="text-xs text-muted-foreground">
                  Sets your currency. You can't change this later.
                </p>
              </div>

              <Button type="submit" className="w-full h-12" disabled={submitting}>
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create account"}
              </Button>
            </form>

            <p className="text-sm text-center text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link to="/auth" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
