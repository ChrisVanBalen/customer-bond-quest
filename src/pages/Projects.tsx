import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore, Project, ProjectStatus } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, FolderKanban } from "lucide-react";



export default function Projects() {
  const { projects, customers, technicians, tickets, settings, addProject, updateProject, deleteProject } = useStore();
  const STATUSES = settings.projectStatuses;
  const statusLabel = (v: ProjectStatus) => STATUSES.find(s => s.value === v)?.label ?? String(v).replace("_", " ");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    name: "", description: "", customerId: "", status: "planning" as ProjectStatus,
    startDate: today, targetDate: today, managerId: null as string | null,
  });

  const filtered = projects.filter(p =>
    [p.name, p.description].some(f => f.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", description: "", customerId: customers[0]?.id ?? "", status: "planning", startDate: today, targetDate: today, managerId: null });
    setDialogOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, customerId: p.customerId, status: p.status, startDate: p.startDate, targetDate: p.targetDate, managerId: p.managerId });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.customerId) return;
    if (editing) updateProject(editing.id, form);
    else addProject(form);
    setDialogOpen(false);
  };

  const handleDelete = (p: Project) => {
    const linked = tickets.filter(t => t.projectId === p.id).length;
    const msg = linked > 0
      ? `Delete ${p.name}? ${linked} ticket(s) will be unlinked from this project.`
      : `Delete ${p.name}?`;
    if (confirm(msg)) deleteProject(p.id);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projects"
        description={`${projects.filter(p => p.status === "active").length} active · ${projects.length} total`}
        action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />New Project</Button>}
      />

      <div className="flex gap-3 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Project</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Customer</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Manager</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Tickets</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Target</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(p => {
                const projectTickets = tickets.filter(t => t.projectId === p.id);
                const done = projectTickets.filter(t => t.status === "closed").length;
                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/projects/${p.id}`} className="flex items-center gap-2 font-medium text-foreground hover:text-primary">
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {customers.find(c => c.id === p.customerId)?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {technicians.find(t => t.id === p.managerId)?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{done}/{projectTickets.length}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell tabular-nums">{p.targetDate}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{statusLabel(p.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(p)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No projects found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Project" : "New Project"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Project name" />
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Scope and goals" />
            </div>
            <div className="grid gap-1.5">
              <Label>Customer</Label>
              <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ProjectStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s.id} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Project Manager</Label>
                <Select value={form.managerId ?? "none"} onValueChange={v => setForm(f => ({ ...f, managerId: v === "none" ? null : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {technicians.filter(t => t.active).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Target Date</Label>
                <Input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Create Project"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
