import { useState } from "react";
import { useStore, Ticket, TicketPriority, TicketStatus } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Plus, Search, Pencil, Package, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export default function Tickets() {
  const { tickets, customers, assets, addTicket, updateTicket } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", customerId: "", locationId: null as string | null, assetId: null as string | null, priority: "medium" as TicketPriority, status: "open" as TicketStatus,
  });

  const filtered = tickets.filter(t => {
    const matchSearch = [t.title, t.description].some(f => f.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const customerLocations = selectedCustomer?.locations ?? [];
  const customerAssets = form.customerId
    ? assets.filter(a => a.assignedTo === form.customerId && a.status === "assigned")
    : [];

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", description: "", customerId: customers[0]?.id ?? "", locationId: null, assetId: null, priority: "medium", status: "open" });
    setDialogOpen(true);
  };

  const openEdit = (t: Ticket) => {
    setEditing(t);
    setForm({ title: t.title, description: t.description, customerId: t.customerId, locationId: t.locationId, assetId: t.assetId, priority: t.priority, status: t.status });
    setDialogOpen(true);
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
        action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />New Ticket</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
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
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No tickets found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Ticket" : "New Ticket"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
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
    </div>
  );
}
