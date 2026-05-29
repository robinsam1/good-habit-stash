import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50),
  password: z.string().min(1, 'Password is required').max(100),
});

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, signIn } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = loginSchema.safeParse({ username, password });
    if (!result.success) {
      const fieldErrors: { username?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'username') fieldErrors.username = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await signIn(username, password);
    
    if (error) {
      toast.error('Login failed', {
        description: 'Invalid username or password',
      });
    } else {
      toast.success('Welcome back! 👋');
      navigate('/', { replace: true });
    }
    
    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              Habit Rewards
            </span>
          </h1>
          <p className="text-muted-foreground text-lg font-medium tracking-wide">
            Track habits, earn rewards ✨
          </p>
        </header>

        {/* Login Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-4">
            <h2 className="font-display text-xl font-semibold text-center text-foreground">
              Sign In
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="username"
                  className={errors.username ? 'border-destructive' : ''}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
