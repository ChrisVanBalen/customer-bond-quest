import { useState } from "react";
import { useStore, ScheduledTicket, ScheduleFrequency, FREQUENCY_LABELS } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, PlayCircle, CalendarClock } from "lucide-react";

const frequencies = Object.keys(FREQUENCY_LABELS) as ScheduleFrequency[];

interface FormState {
  name: string;
  templateId: string | null;
  customerId: string;
  locationId: string | null;
  frequency: ScheduleFrequency;
  nextRunDate: string;
  technicianIds: string[];
  primaryTechnicianId: string | null;
  active: boolean;
}

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = (): FormState => ({
  name: "", templateId: null, customerId: "", locationId: null,
  frequency: "monthly", nextRunDate: today(), technicianIds: [], primaryTechnicianId: null, active: true,
});

export default function ScheduledTickets() {
  const {
    scheduledTickets, ticketTemplates, customers, technicians,
    addScheduledTicket, updateScheduledTicket, deleteScheduledTicket, runScheduledTicket,
  } = useStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduledTicket | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const customerName = (id: string) => customers.find(c => c.id === id)?.name ?? "—";
  const templateName = (id: string | null) => ticketTemplates.find(t => t.id === id)?.name ?? "No template";

  const filtered = scheduledTickets.filter(s =>
    [s.name, customerName(s.customerId), templateName(s.templateId)]
      .some(f => f.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (s: ScheduledTicket) => {
    setEditing(s);
    setForm({
      name: s.name, templateId: s.templateId, customerId: s.customerId, locationId: s.locationId,
      frequency: s.frequency, nextRunDate: s.nextRunDate, technicianIds: [...s.technicianIds],
      primaryTechnicianId: s.primaryTechnicianId, active: s.active,
    });
    setDialogOpen(true);
  };

  const toggleTech = (id: string) => {
    setForm(f => {
      const has = f.technicianIds.includes(id);
      const technicianIds = has ? f.technicianIds.filter(t => t !== id) : [...f.technicianIds, id];
      return {
        ...f,
        technicianIds,
        primaryTechnicianId: has && f.primaryTechnicianId === id
          ? (technicianIds[0] ?? null)
          : (f.primaryTechnicianId ?? technicianIds[0] ?? null),
      };
    });
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.customerId) return;
    if (editing) updateScheduledTicket(editing.id, form);
    else addScheduledTicket(form);
    setDialogOpen(false);
  };

  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const isOverdue = (d: string) => d <= today();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Scheduled Tickets"
        description={`${scheduledTickets.filter(s => s.active).length} active · ${scheduledTickets.length} total recurring schedules`}
        action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />New Schedule</Button>}
      />

      <div className="flex gap-3 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search schedules..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Schedule</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Customer</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Template</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Frequency</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Next Run</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Last Run</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 group">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{customerName(s.customerId)}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{templateName(s.templateId)}</td>
                  <td className="px-4 py-3">{FREQUENCY_LABELS[s.frequency]}</td>
                  <td className={`px-4 py-3 ${s.active && isOverdue(s.nextRunDate) ? "text-destructive font-medium" : ""}`}>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5" />{s.nextRunDate}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{s.lastRunDate ?? "Never"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-md ${s.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {s.active ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Generate ticket now" onClick={() => runScheduledTicket(s.id)}>
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteScheduledTicket(s.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No scheduled tickets yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Schedule" : "New Schedule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Schedule Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Quarterly maintenance visit" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Customer</Label>
                <Select value={form.customerId} onValueChange={v => setForm({ ...form, customerId: v, locationId: null })}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Site</Label>
                <Select
                  value={form.locationId ?? "none"}
                  onValueChange={v => setForm({ ...form, locationId: v === "none" ? null : v })}
                  disabled={!selectedCustomer}
                >
                  <SelectTrigger><SelectValue placeholder="Any site" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any site</SelectItem>
                    {selectedCustomer?.locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Template</Label>
                <Select value={form.templateId ?? "none"} onValueChange={v => setForm({ ...form, templateId: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="No template" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {ticketTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v: ScheduleFrequency) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {frequencies.map(f => <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Next Run Date</Label>
                <Input type="date" value={form.nextRunDate} onChange={e => setForm({ ...form, nextRunDate: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assigned Technicians</Label>
              <div className="space-y-2 border rounded-lg p-3">
                {technicians.filter(t => t.active).map(t => (
                  <div key={t.id} className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={form.technicianIds.includes(t.id)} onCheckedChange={() => toggleTech(t.id)} />
                      <span className="text-sm">{t.name}</span>
                    </label>
                    {form.technicianIds.includes(t.id) && (
                      <Button
                        type="button"
                        variant={form.primaryTechnicianId === t.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setForm({ ...form, primaryTechnicianId: t.id })}
                      >
                        {form.primaryTechnicianId === t.id ? "Primary" : "Set primary"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Create Schedule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
