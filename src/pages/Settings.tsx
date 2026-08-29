import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, KeyRound, PiggyBank, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateBank, useUpdateTimezone } from "@/hooks/useProfile";
import { detectTimezone } from "@/lib/dayBucketing";
import { BANKS } from "@/lib/banks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FALLBACK_TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Athens",
  "Europe/Istanbul",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "Africa/Lagos",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Perth",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const Settings = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: profile } = useProfile();
  const { mutate: updateBank, isPending: savingBank } = useUpdateBank();
  const { mutate: updateTimezone, isPending: savingTimezone } = useUpdateTimezone();

  const TIMEZONES = useMemo(() => {
    const supported =
      typeof Intl.supportedValuesOf === "function"
        ? (Intl.supportedValuesOf("timeZone") as string[])
        : FALLBACK_TIMEZONES;
    const all = new Set([...supported, "UTC", detectTimezone()]);
    return Array.from(all).sort();
  }, []);

  const handleBankChange = (bankId: string) => {
    updateBank(bankId, {
      onSuccess: () => toast.success("Banking app saved"),
      onError: () => toast.error("Couldn't save your banking app"),
    });
  };

  const handleTimezoneChange = (tz: string) => {
    updateTimezone(tz, {
      onSuccess: () => toast.success("Time zone saved"),
      onError: () => toast.error("Couldn't save your time zone"),
    });
  };



  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/welcome", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 || password.length > 100) {
      toast.error("Password must be 8-100 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error("Couldn't update password", { description: error.message });
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Password updated");
  };

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
      <div className="max-w-lg sm:max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="font-display text-2xl font-bold ml-2">Settings</h1>
        </div>

        <Card className="p-6 border-border shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Change password</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="text-base"
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full h-14">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
          </form>
        </Card>

        <Card className="p-6 border-border shadow-xl mt-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Time zone</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Used to decide which day a habit belongs to, so your counts and adherence
            match on every device and browser.
          </p>
          <div className="space-y-2">
            <Label htmlFor="timezone">Time zone</Label>
            <Select
              value={profile?.timezone ?? undefined}
              onValueChange={handleTimezoneChange}
              disabled={savingTimezone}
            >
              <SelectTrigger id="timezone" className="h-12 text-base">
                <SelectValue placeholder="Choose your time zone" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz} className="text-base">
                    {tz.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This browser reports {detectTimezone().replace(/_/g, " ")}.
            </p>
          </div>
        </Card>

        <Card className="p-6 border-border shadow-xl mt-6">
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Savings</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Pick your banking app and we'll add a shortcut to it when you move money to
            savings. We never touch your money — you make the transfer yourself.
          </p>
          <div className="space-y-2">
            <Label htmlFor="bank">Banking app</Label>
            <Select
              value={profile?.bank_id ?? undefined}
              onValueChange={handleBankChange}
              disabled={savingBank}
            >
              <SelectTrigger id="bank" className="h-12 text-base">
                <SelectValue placeholder="Choose your bank" />
              </SelectTrigger>
              <SelectContent>
                {BANKS.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id} className="text-base">
                    {bank.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

      </div>

    </div>
  );
};

export default Settings;
