import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, RotateCcw, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAllActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  type ManagedActivity,
} from "@/hooks/usePro";
import { useMoney } from "@/hooks/useProfile";
import { toast } from "sonner";

interface EditorState {
  open: boolean;
  mode: "create" | "edit";
  activity?: ManagedActivity;
}

export function ManageActivities() {
  const { data: activities, isLoading } = useAllActivities();
  const createMut = useCreateActivity();
  const updateMut = useUpdateActivity();
  const deleteMut = useDeleteActivity();
  const { formatMoney, minorUnitDigits } = useMoney();

  const [editor, setEditor] = useState<EditorState>({ open: false, mode: "create" });
  const [confirmDelete, setConfirmDelete] = useState<ManagedActivity | null>(null);
  const [name, setName] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [saving, setSaving] = useState(false);

  const factor = Math.pow(10, minorUnitDigits);

  const openCreate = () => {
    setEditor({ open: true, mode: "create" });
    setName("");
    setValueInput("1");
  };

  const openEdit = (a: ManagedActivity) => {
    setEditor({ open: true, mode: "edit", activity: a });
    setName(a.name);
    setValueInput((a.currentValue / factor).toFixed(minorUnitDigits));
  };

  const closeEditor = () => setEditor({ open: false, mode: "create" });

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    const parsed = Number(valueInput);
    if (!Number.isFinite(parsed)) {
      toast.error("Enter a valid amount");
      return;
    }
    const minorUnits = Math.round(parsed * factor);
    setSaving(true);
    try {
      if (editor.mode === "create") {
        await createMut.mutateAsync({ name: trimmed, value: minorUnits });
        toast.success("Activity added");
      } else if (editor.activity) {
        await updateMut.mutateAsync({
          id: editor.activity.id,
          name: trimmed,
          value: minorUnits,
          active: editor.activity.active,
        });
        toast.success("Activity updated");
      }
      closeEditor();
    } catch (e: any) {
      toast.error("Couldn't save", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (a: ManagedActivity, active: boolean) => {
    try {
      await updateMut.mutateAsync({
        id: a.id,
        name: a.name,
        value: a.currentValue,
        active,
      });
    } catch (e: any) {
      toast.error("Couldn't update", { description: e?.message });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMut.mutateAsync(confirmDelete.id);
      toast.success("Activity removed");
      setConfirmDelete(null);
    } catch (e: any) {
      toast.error("Couldn't delete", { description: e?.message });
    }
  };

  const active = (activities ?? []).filter((a) => a.active);
  const inactive = (activities ?? []).filter((a) => !a.active);

  return (
    <Card className="p-6 border-border/50 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Manage activities</h2>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border/60">
            {active.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatMoney(a.currentValue)}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(a)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmDelete(a)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
            {active.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                No active activities. Tap Add to create one.
              </li>
            )}
          </ul>

          {inactive.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Inactive
              </h3>
              <ul className="divide-y divide-border/60">
                {inactive.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-3 opacity-70">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{a.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatMoney(a.currentValue)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(a, true)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" /> Restore
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <Dialog open={editor.open} onOpenChange={(o) => !o && closeEditor()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editor.mode === "create" ? "Add activity" : "Edit activity"}
            </DialogTitle>
            <DialogDescription>
              Give it a clear name and set the reward you earn each time you log it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activity-name">Name</Label>
              <Input
                id="activity-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Exercise – 5km run"
                className="text-base"
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-value">Reward amount</Label>
              <Input
                id="activity-value"
                type="number"
                inputMode="decimal"
                step={1 / factor}
                min={0}
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                className="text-base"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeEditor} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this activity?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.name}" will no longer appear in the picker. Past log entries are
              kept. You can restore it from the Inactive list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
