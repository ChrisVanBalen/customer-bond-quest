import { useState } from "react";
import { useStore, Technician } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Mail, Phone, UserCircle2, Search } from "lucide-react";

export default function Technicians() {
  const { technicians, tickets, addTechnician, updateTechnician, deleteTechnician } = useStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "", active: true });

  const filtered = technicians.filter(t =>
    [t.name, t.email, t.role].some(f => f.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", role: "", active: true });
    setDialogOpen(true);
  };

  const openEdit = (t: Technician) => {
    setEditing(t);
    setForm({ name: t.name, email: t.email, phone: t.phone, role: t.role, active: t.active });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) updateTechnician(editing.id, form);
    else addTechnician(form);
    setDialogOpen(false);
  };

  const handleDelete = (t: Technician) => {
    const assigned = tickets.filter(tk => tk.technicianIds.includes(t.id)).length;
    const msg = assigned > 0
      ? `Delete ${t.name}? They are assigned to ${assigned} ticket(s) and will be removed from them.`
      : `Delete ${t.name}?`;
    if (confirm(msg)) deleteTechnician(t.id);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Technicians"
        description={`${technicians.filter(t => t.active).length} active · ${technicians.length} total`}
        action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />New Technician</Button>}
      />

      <div className="flex gap-3 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search technicians..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Role</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Phone</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Open Tickets</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(t => {
                const openCount = tickets.filter(tk => tk.technicianIds.includes(t.id) && tk.status !== "closed").length;
                return (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.role || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{t.email || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{t.phone || "—"}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{openCount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {t.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(t)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No technicians found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Technician" : "New Technician"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Senior Technician" />
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="tech@company.com" />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Inactive technicians won't appear in ticket assignment.</p>
              </div>
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
            </div>
            <p className="text-xs text-muted-foreground">Email will be used for sign-in when authentication is enabled.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Create Technician"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
