import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore, Asset, AssetStatus } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Search, Pencil, UserPlus, XCircle, MapPin, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Assets() {
  const { assets, customers, addAsset, updateAsset, assignAsset, decommissionAsset } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [assigningAsset, setAssigningAsset] = useState<Asset | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [form, setForm] = useState({ tag: "", name: "", type: "", serialNumber: "", status: "available" as AssetStatus, assignedTo: null as string | null, locationId: null as string | null, notes: "" });

  const filtered = assets.filter(a => {
    const matchSearch = [a.tag, a.name, a.type, a.serialNumber].some(f => f.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => {
    setEditing(null);
    const nextNum = assets.length + 1;
    setForm({ tag: `AST-${String(nextNum).padStart(3, "0")}`, name: "", type: "", serialNumber: "", status: "available", assignedTo: null, locationId: null, notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (a: Asset) => {
    setEditing(a);
    setForm({ tag: a.tag, name: a.name, type: a.type, serialNumber: a.serialNumber, status: a.status, assignedTo: a.assignedTo, locationId: a.locationId, notes: a.notes });
    setDialogOpen(true);
  };

  const openAssign = (a: Asset) => {
    setAssigningAsset(a);
    setSelectedCustomer(a.assignedTo ?? "");
    setSelectedLocation(a.locationId ?? "");
    setAssignDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.tag.trim()) return;
    if (editing) {
      updateAsset(editing.id, form);
    } else {
      addAsset(form);
    }
    setDialogOpen(false);
  };

  const assignCustomerLocations = selectedCustomer && selectedCustomer !== "__unassign__"
    ? customers.find(c => c.id === selectedCustomer)?.locations ?? []
    : [];

  const getLocationName = (asset: Asset) => {
    if (!asset.assignedTo || !asset.locationId) return null;
    const customer = customers.find(c => c.id === asset.assignedTo);
    return customer?.locations.find(l => l.id === asset.locationId)?.name ?? null;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Asset Inventory"
        description={`${assets.length} tracked assets`}
        action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Add Asset</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="decommissioned">Decommissioned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Tag</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Name</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Type</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Serial #</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Assigned To</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Location</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(a => {
                const customer = customers.find(c => c.id === a.assignedTo);
                const locationName = getLocationName(a);
                return (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">
                      <Link to={`/assets/${a.id}`} className="text-primary hover:underline">{a.tag}</Link>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link to={`/assets/${a.id}`} className="text-foreground hover:text-primary transition-colors">{a.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{a.type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden lg:table-cell">{a.serialNumber}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{customer?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {locationName ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {locationName}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {a.status !== "decommissioned" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openAssign(a)} title="Assign">
                              <UserPlus className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => decommissionAsset(a.id)} title="Decommission">
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No assets found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Asset" : "New Asset"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Asset Tag</Label>
                <Input value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} className="font-mono" />
              </div>
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="Desktop, Laptop, Network..." />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Device name or model" />
            </div>
            <div className="grid gap-1.5">
              <Label>Serial Number</Label>
              <Input value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} className="font-mono" />
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Add Asset"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Asset — {assigningAsset?.tag}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-1.5">
              <Label>Customer</Label>
              <Select value={selectedCustomer} onValueChange={(v) => { setSelectedCustomer(v); setSelectedLocation(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unassign__">— Unassign —</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {assignCustomerLocations.length > 0 && (
              <div className="grid gap-1.5">
                <Label>Location</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignCustomerLocations.map(l => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}{l.isPrimary ? " (Primary)" : ""} — {l.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (assigningAsset) {
                const custId = selectedCustomer === "__unassign__" ? null : selectedCustomer || null;
                assignAsset(assigningAsset.id, custId, custId ? selectedLocation || null : null);
              }
              setAssignDialogOpen(false);
            }}>
              {selectedCustomer === "__unassign__" ? "Unassign" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
