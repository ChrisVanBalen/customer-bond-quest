import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Building2, CalendarDays, UserCircle2, Plus, X, TicketPlus } from "lucide-react";

export default function ProjectDetail() {
  const { id } = useParams();
  const { projects, customers, technicians, tickets, updateProject, updateTicket, addTicket } = useStore();
  const [linkDialog, setLinkDialog] = useState(false);
  const [ticketToLink, setTicketToLink] = useState<string>("");
  const [newDialog, setNewDialog] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    technicianId: "none",
  });

  const project = projects.find(p => p.id === id);

  if (!project) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Project not found" />
        <Link to="/projects" className="text-primary text-sm">Back to projects</Link>
      </div>
    );
  }

  const customer = customers.find(c => c.id === project.customerId);
  const manager = technicians.find(t => t.id === project.managerId);
  const projectTickets = tickets.filter(t => t.projectId === project.id);
  const completed = projectTickets.filter(t => t.status === "closed").length;
  const pct = projectTickets.length ? Math.round((completed / projectTickets.length) * 100) : 0;
  const linkable = tickets.filter(t => !t.projectId && t.customerId === project.customerId);

  const handleCreateTicket = () => {
    if (!form.title.trim()) return;
    const tech = form.technicianId === "none" ? null : form.technicianId;
    addTicket({
      title: form.title.trim(),
      description: form.description,
      customerId: project.customerId,
      locationId: null,
      assetId: null,
      projectId: project.id,
      priority: form.priority,
      status: "open",
      technicianIds: tech ? [tech] : [],
      primaryTechnicianId: tech,
    });
    setNewDialog(false);
  };


  return (
    <div className="animate-fade-in">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />Back to projects
      </Link>
      <PageHeader
        title={project.name}
        description={project.description}
        action={
          <Select value={project.status} onValueChange={v => updateProject(project.id, { status: v as typeof project.status })}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["planning", "active", "on_hold", "completed", "cancelled"] as const).map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Project Tickets</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{completed} of {projectTickets.length} complete</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => { setTicketToLink(""); setLinkDialog(true); }}>
                  <Plus className="h-4 w-4 mr-1.5" />Link Ticket
                </Button>
                <Button size="sm" onClick={() => { setForm({ title: "", description: "", priority: "medium", technicianId: "none" }); setNewDialog(true); }}>
                  <TicketPlus className="h-4 w-4 mr-1.5" />New Ticket
                </Button>
              </div>
            </div>
            <div className="px-5 pt-4">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="divide-y mt-2">
              {projectTickets.map(t => (
                <div key={t.id} className="group flex items-center justify-between gap-3 p-4 hover:bg-muted/40 transition-colors">
                  <Link to={`/tickets/${t.id}`} className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.technicianIds.length
                        ? t.technicianIds.map(tid => technicians.find(x => x.id === tid)?.name).filter(Boolean).join(", ")
                        : "Unassigned"}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={t.priority} />
                    <StatusBadge status={t.status} />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Unlink ticket"
                      onClick={() => updateTicket(t.id, { projectId: null })}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {projectTickets.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">No tickets linked to this project yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-foreground mb-1">Details</h2>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {customer ? <Link to={`/customers/${customer.id}`} className="text-primary hover:underline">{customer.name}</Link> : <span className="text-muted-foreground">—</span>}
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
              {manager?.name ?? "No project manager"}
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {project.startDate} → {project.targetDate}
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-5">
            <h2 className="font-semibold text-foreground mb-3">Project Manager</h2>
            <Label className="sr-only">Project Manager</Label>
            <Select value={project.managerId ?? "none"} onValueChange={v => updateProject(project.id, { managerId: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {technicians.filter(t => t.active).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Link Ticket to Project</DialogTitle></DialogHeader>
          <div className="grid gap-1.5 py-2">
            <Label>Unassigned tickets for {customer?.name ?? "this customer"}</Label>
            <Select value={ticketToLink} onValueChange={setTicketToLink}>
              <SelectTrigger><SelectValue placeholder="Select ticket..." /></SelectTrigger>
              <SelectContent>
                {linkable.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {linkable.length === 0 && <p className="text-xs text-muted-foreground">No available tickets for this customer.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog(false)}>Cancel</Button>
            <Button
              disabled={!ticketToLink}
              onClick={() => { updateTicket(ticketToLink, { projectId: project.id }); setLinkDialog(false); }}
            >
              Link Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
