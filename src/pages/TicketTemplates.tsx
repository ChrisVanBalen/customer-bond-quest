import { useState } from "react";
import { useStore, TicketTemplate, TicketTemplateTask, TicketPriority } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, X, FilePlus2 } from "lucide-react";
import { CreateFromTemplateDialog } from "@/components/CreateFromTemplateDialog";

const priorities: TicketPriority[] = ["low", "medium", "high", "critical"];

interface FormState {
  name: string;
  title: string;
  description: string;
  priority: TicketPriority;
  tasks: TicketTemplateTask[];
}

const emptyForm: FormState = { name: "", title: "", description: "", priority: "medium", tasks: [] };

export default function TicketTemplates() {
  const { ticketTemplates, scheduledTickets, addTicketTemplate, updateTicketTemplate, deleteTicketTemplate } = useStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TicketTemplate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [createFrom, setCreateFrom] = useState<string | null>(null);


  const filtered = ticketTemplates.filter(t =>
    [t.name, t.title, t.description].some(f => f.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: TicketTemplate) => {
    setEditing(t);
    setForm({ name: t.name, title: t.title, description: t.description, priority: t.priority, tasks: t.tasks.map(x => ({ ...x })) });
    setDialogOpen(true);
  };

  const addTaskRow = () =>
    setForm(f => ({ ...f, tasks: [...f.tasks, { id: crypto.randomUUID(), name: "", time: 0 }] }));

  const updateTaskRow = (id: string, patch: Partial<TicketTemplateTask>) =>
    setForm(f => ({ ...f, tasks: f.tasks.map(t => t.id === id ? { ...t, ...patch } : t) }));

  const removeTaskRow = (id: string) =>
    setForm(f => ({ ...f, tasks: f.tasks.filter(t => t.id !== id) }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    const payload = {
      ...form,
      title: form.title.trim() || form.name.trim(),
      tasks: form.tasks.filter(t => t.name.trim()),
    };
    if (editing) updateTicketTemplate(editing.id, payload);
    else addTicketTemplate(payload);
    setDialogOpen(false);
  };

  const handleDelete = (t: TicketTemplate) => {
    const used = scheduledTickets.filter(s => s.templateId === t.id).length;
    const msg = used > 0
      ? `Delete "${t.name}"? It is used by ${used} schedule(s), which will be unlinked.`
      : `Delete "${t.name}"?`;
    if (confirm(msg)) deleteTicketTemplate(t.id);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Ticket Templates"
        description={`${ticketTemplates.length} template${ticketTemplates.length === 1 ? "" : "s"} available for new and scheduled tickets`}
        action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />New Template</Button>}
      />

      <div className="flex gap-3 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Template</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Ticket Title</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Priority</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Tasks</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Est. Hours</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 group">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{t.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.priority} /></td>
                  <td className="px-4 py-3">{t.tasks.length}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{t.tasks.reduce((s, x) => s + (x.time || 0), 0)}h</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button variant="outline" size="sm" className="h-8" onClick={() => setCreateFrom(t.id)}>
                        <FilePlus2 className="h-3.5 w-3.5 mr-1.5" />Create Ticket
                      </Button>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No templates yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Template Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Quarterly Maintenance" />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v: TicketPriority) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Ticket Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title used on generated tickets" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Default Tasks</Label>
                <Button variant="outline" size="sm" onClick={addTaskRow}><Plus className="h-3.5 w-3.5 mr-1" />Add Task</Button>
              </div>
              {form.tasks.length === 0 && <p className="text-sm text-muted-foreground">No default tasks.</p>}
              <div className="space-y-2">
                {form.tasks.map(t => (
                  <div key={t.id} className="flex gap-2 items-center">
                    <Input value={t.name} onChange={e => updateTaskRow(t.id, { name: e.target.value })} placeholder="Task name" className="flex-1" />
                    <Input
                      type="number" min={0} step={0.25} value={t.time}
                      onChange={e => updateTaskRow(t.id, { time: parseFloat(e.target.value) || 0 })}
                      className="w-24" placeholder="Hours"
                    />
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeTaskRow(t.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Create Template"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateFromTemplateDialog
        open={createFrom !== null}
        onOpenChange={v => !v && setCreateFrom(null)}
        templateId={createFrom ?? undefined}
      />
    </div>
  );
}
