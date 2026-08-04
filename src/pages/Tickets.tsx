import { useState } from "react";
import { useStore, Ticket, TicketPriority, TicketStatus, TicketCategory, TICKET_CATEGORIES } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CreateFromTemplateDialog } from "@/components/CreateFromTemplateDialog";
import { Plus, Search, Pencil, Package, MapPin, ChevronDown, Star, UserCircle2, FilePlus2 } from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function Tickets() {
  const { tickets, customers, assets, technicians, projects, addTicket, updateTicket } = useStore();
  const [search, setSearch] = useState("");
  const [categoryTab, setCategoryTab] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<TicketStatus[]>([]);
  const [techFilter, setTechFilter] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", category: "service" as TicketCategory, customerId: "", locationId: null as string | null, assetId: null as string | null, projectId: null as string | null, priority: "medium" as TicketPriority, status: "open" as TicketStatus,
    technicianIds: [] as string[], primaryTechnicianId: null as string | null,
  });

  const toggleTechFilter = (value: string) => {
    setTechFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const techFilterLabel = (() => {
    if (techFilter.length === 0) return "All Technicians";
    if (techFilter.length === 1) {
      const v = techFilter[0];
      if (v === "unassigned") return "Unassigned";
      return technicians.find(t => t.id === v)?.name ?? "1 technician";
    }
    return `${techFilter.length} technicians`;
  })();

  const toggleStatusFilter = (status: TicketStatus) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const filtered = tickets.filter(t => {
    const matchSearch = [t.title, t.description].some(f => f.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryTab === "all" || t.category === categoryTab;
    const matchStatus = statusFilter.length === 0 || statusFilter.includes(t.status);
    const matchTech = techFilter.length === 0 || techFilter.some(v =>
      v === "unassigned" ? t.technicianIds.length === 0 : t.technicianIds.includes(v)
    );
    return matchSearch && matchCategory && matchStatus && matchTech;
  });

  const categoryCounts = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1;
    return acc;
  }, {});

  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const customerLocations = selectedCustomer?.locations ?? [];
  const customerAssets = form.customerId
    ? assets.filter(a => a.assignedTo === form.customerId && a.status === "assigned")
    : [];
  const activeTechnicians = technicians.filter(t => t.active);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", description: "", category: (categoryTab === "all" ? "service" : categoryTab) as TicketCategory, customerId: customers[0]?.id ?? "", locationId: null, assetId: null, projectId: null, priority: "medium", status: "open", technicianIds: [], primaryTechnicianId: null });
    setDialogOpen(true);
  };

  const openEdit = (t: Ticket) => {
    setEditing(t);
    setForm({ title: t.title, description: t.description, category: t.category, customerId: t.customerId, locationId: t.locationId, assetId: t.assetId, projectId: t.projectId, priority: t.priority, status: t.status, technicianIds: t.technicianIds, primaryTechnicianId: t.primaryTechnicianId });
    setDialogOpen(true);
  };

  const toggleFormTech = (techId: string) => {
    setForm(f => {
      const has = f.technicianIds.includes(techId);
      const next = has ? f.technicianIds.filter(id => id !== techId) : [...f.technicianIds, techId];
      let primary = f.primaryTechnicianId;
      if (has && primary === techId) primary = next[0] ?? null;
      if (!has && !primary) primary = techId;
      return { ...f, technicianIds: next, primaryTechnicianId: primary };
    });
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.customerId) return;
    if (editing) {
      updateTicket(editing.id, form);
    } else {
      addTicket(form);
    }
    setDialogOpen(false);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Service Tickets"
        description={`${tickets.filter(t => t.status !== "closed").length} active tickets`}
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1.5" />New Ticket<ChevronDown className="h-4 w-4 ml-1.5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
              <DropdownMenuItem onSelect={openNew}>
                <Plus className="h-4 w-4 mr-2" />Blank ticket
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTemplateDialogOpen(true)}>
                <FilePlus2 className="h-4 w-4 mr-2" />New ticket from template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <Tabs value={categoryTab} onValueChange={setCategoryTab} className="mb-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">
            All <span className="ml-1.5 text-xs text-muted-foreground">{tickets.length}</span>
          </TabsTrigger>
          {TICKET_CATEGORIES.map(c => (
            <TabsTrigger key={c.value} value={c.value}>
              {c.label} <span className="ml-1.5 text-xs text-muted-foreground">{categoryCounts[c.value] ?? 0}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              {statusFilter.length === 0
                ? "All Status"
                : statusFilter.length === 1
                  ? STATUS_OPTIONS.find(o => o.value === statusFilter[0])?.label
                  : `${statusFilter.length} statuses`}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2" align="start">
            {STATUS_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm cursor-pointer hover:bg-accent"
              >
                <Checkbox
                  checked={statusFilter.includes(opt.value)}
                  onCheckedChange={() => toggleStatusFilter(opt.value)}
                />
                {opt.label}
              </label>
            ))}
            {statusFilter.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-1 text-xs"
                onClick={() => setStatusFilter([])}
              >
                Clear filters
              </Button>
            )}
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[220px] justify-between">
              {techFilterLabel}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-2" align="start">
            <label className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm cursor-pointer hover:bg-accent">
              <Checkbox
                checked={techFilter.includes("unassigned")}
                onCheckedChange={() => toggleTechFilter("unassigned")}
              />
              Unassigned
            </label>
            {technicians.map(t => (
              <label
                key={t.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm cursor-pointer hover:bg-accent"
              >
                <Checkbox
                  checked={techFilter.includes(t.id)}
                  onCheckedChange={() => toggleTechFilter(t.id)}
                />
                {t.name}
              </label>
            ))}
            {techFilter.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-1 text-xs"
                onClick={() => setTechFilter([])}
              >
                Clear filters
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Title</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Customer</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden xl:table-cell">Location</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Asset</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Technician</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Priority</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Updated</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(t => {
                const customer = customers.find(c => c.id === t.customerId);
                const asset = t.assetId ? assets.find(a => a.id === t.assetId) : null;
                const location = t.locationId && customer
                  ? customer.locations?.find(l => l.id === t.locationId)
                  : customer?.locations?.find(l => l.isPrimary);
                const primaryTech = t.primaryTechnicianId ? technicians.find(tt => tt.id === t.primaryTechnicianId) : null;
                const extraTechs = t.technicianIds.filter(id => id !== t.primaryTechnicianId).length;
                return (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/tickets/${t.id}`} className="font-medium text-primary hover:underline">{t.title}</Link>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 md:hidden">{customer?.name}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{customer?.name ?? "Unknown"}</td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {location ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {location.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {asset ? (
                        <Link to={`/assets/${asset.id}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                          <Package className="h-3.5 w-3.5" />
                          {asset.tag}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {primaryTech ? (
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-foreground">{primaryTech.name}</span>
                          {extraTechs > 0 && <span className="text-muted-foreground">+{extraTechs}</span>}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums hidden lg:table-cell">{t.updatedAt}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No tickets found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Ticket" : "New Ticket"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as TicketCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Customer</Label>
              <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v, locationId: null, assetId: null }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {customerLocations.length > 0 && (
              <div className="grid gap-1.5">
                <Label>Location</Label>
                <Select value={form.locationId ?? "primary"} onValueChange={v => setForm(f => ({ ...f, locationId: v === "primary" ? null : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Primary location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary Location</SelectItem>
                    {customerLocations.filter(l => !l.isPrimary).map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name} — {l.address}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label>Related Asset</Label>
              <Select value={form.assetId ?? "none"} onValueChange={v => setForm(f => ({ ...f, assetId: v === "none" ? null : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No asset</SelectItem>
                  {customerAssets.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.tag} — {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Project</Label>
              <Select value={form.projectId ?? "none"} onValueChange={v => setForm(f => ({ ...f, projectId: v === "none" ? null : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects
                    .filter(p => !form.customerId || p.customerId === form.customerId)
                    .map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Technicians</Label>
              {activeTechnicians.length === 0 ? (
                <p className="text-xs text-muted-foreground">No active technicians. Add one from the Technicians page.</p>
              ) : (
                <div className="border rounded-md divide-y">
                  {activeTechnicians.map(tech => {
                    const assigned = form.technicianIds.includes(tech.id);
                    const isPrimary = form.primaryTechnicianId === tech.id;
                    return (
                      <div key={tech.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                        <Checkbox
                          checked={assigned}
                          onCheckedChange={() => toggleFormTech(tech.id)}
                        />
                        <span className="flex-1">{tech.name} <span className="text-xs text-muted-foreground">— {tech.role}</span></span>
                        {assigned && (
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, primaryTechnicianId: tech.id }))}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${isPrimary ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                            aria-label={isPrimary ? "Primary technician" : "Set as primary"}
                          >
                            <Star className={`h-3 w-3 ${isPrimary ? "fill-primary" : ""}`} />
                            {isPrimary ? "Primary" : "Set primary"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as TicketPriority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as TicketStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Create Ticket"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateFromTemplateDialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen} />
    </div>
  );
}

