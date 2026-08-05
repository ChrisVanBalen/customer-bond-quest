import { useState } from "react";
import { useStore, SETTING_GROUPS, OPTION_COLORS, type OptionColor, type SettingGroupKey, type SettingOption } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Lock } from "lucide-react";

export default function AppSettings() {
  const { settings, addSettingOption, updateSettingOption, deleteSettingOption, moveSettingOption } = useStore();
  const [group, setGroup] = useState<SettingGroupKey>(SETTING_GROUPS[0].key);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SettingOption | null>(null);
  const [form, setForm] = useState({ label: "", color: "gray" as OptionColor });

  const activeGroup = SETTING_GROUPS.find(g => g.key === group)!;
  const options = settings[group];

  const openNew = () => {
    setEditing(null);
    setForm({ label: "", color: "gray" });
    setDialogOpen(true);
  };

  const openEdit = (option: SettingOption) => {
    setEditing(option);
    setForm({ label: option.label, color: option.color });
    setDialogOpen(true);
  };

  const submit = () => {
    if (!form.label.trim()) return;
    if (editing) updateSettingOption(group, editing.id, { label: form.label.trim(), color: form.color });
    else addSettingOption(group, { label: form.label, color: form.color });
    setDialogOpen(false);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="App Settings"
        description="Configure the dropdown options used across CommandHub"
      />

      <Tabs value={group} onValueChange={v => setGroup(v as SettingGroupKey)}>
        <TabsList className="flex flex-wrap h-auto">
          {SETTING_GROUPS.map(g => (
            <TabsTrigger key={g.key} value={g.key}>
              {g.title}
              <span className="ml-2 text-xs text-muted-foreground">{settings[g.key].length}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={group} className="mt-6">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div>
              <h2 className="text-lg font-medium text-foreground">{activeGroup.title}</h2>
              <p className="text-sm text-muted-foreground">{activeGroup.description}</p>
            </div>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Option</Button>
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Preview</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Label</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Stored value</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {options.map((o, i) => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3"><StatusBadge status={o.value} /></td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      <span className="inline-flex items-center gap-2">
                        {o.label}
                        {o.locked && <Lock className="h-3 w-3 text-muted-foreground" aria-label="System option" />}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden md:table-cell">{o.value}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => moveSettingOption(group, o.id, -1)} aria-label="Move up">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" disabled={i === options.length - 1} onClick={() => moveSettingOption(group, o.id, 1)} aria-label="Move down">
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(o)} aria-label="Edit option">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={o.locked}
                          onClick={() => deleteSettingOption(group, o.id)}
                          aria-label="Delete option"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            System options are locked because app logic depends on them — their label and color can still be changed.
          </p>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Option" : `New ${activeGroup.title.replace(/e?s$/, "")}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Label</Label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Awaiting Parts" />
              {!editing && form.label.trim() && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  stored as {form.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}
                </p>
              )}
            </div>
            <div>
              <Label>Color</Label>
              <Select value={form.color} onValueChange={v => setForm(f => ({ ...f, color: v as OptionColor }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPTION_COLORS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Save Changes" : "Add Option"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
