import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore, Asset, AssetStatus } from "@/lib/store";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Plus, Search, Pencil, UserPlus, XCircle, MapPin, Upload, Download, ChevronDown } from "lucide-react";

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "decommissioned", label: "Decommissioned" },
];
import { useToast } from "@/hooks/use-toast";

export default function Assets() {
  const { assets, customers, addAsset, updateAsset, assignAsset, decommissionAsset } = useStore();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [assigningAsset, setAssigningAsset] = useState<Asset | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [form, setForm] = useState({ tag: "", name: "", type: "", serialNumber: "", status: "available" as AssetStatus, assignedTo: null as string | null, locationId: null as string | null, notes: "" });

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast({ title: "Import failed", description: "CSV must have a header row and at least one data row.", variant: "destructive" });
        return;
      }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
      const nameIdx = headers.findIndex(h => h === "name");
      const tagIdx = headers.findIndex(h => h === "tag" || h === "assettag");
      const typeIdx = headers.findIndex(h => h === "type");
      const serialIdx = headers.findIndex(h => h === "serialnumber" || h === "serial");
      const notesIdx = headers.findIndex(h => h === "notes");

      if (nameIdx === -1) {
        toast({ title: "Import failed", description: "CSV must have a 'Name' column.", variant: "destructive" });
        return;
      }

      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        const name = cols[nameIdx] || "";
        if (!name) continue;
        const nextNum = assets.length + imported + 1;
        addAsset({
          tag: (tagIdx >= 0 && cols[tagIdx]) || `AST-${String(nextNum).padStart(3, "0")}`,
          name,
          type: (typeIdx >= 0 && cols[typeIdx]) || "",
          serialNumber: (serialIdx >= 0 && cols[serialIdx]) || "",
          status: "available",
          assignedTo: null,
          locationId: null,
          notes: (notesIdx >= 0 && cols[notesIdx]) || "",
        });
        imported++;
      }
      toast({ title: "Import complete", description: `${imported} asset${imported !== 1 ? "s" : ""} imported successfully.` });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleCsvExport = () => {
    const headers = ["Tag", "Name", "Type", "Serial Number", "Status", "Assigned To", "Location", "Notes"];
    const rows = filtered.map(a => {
      const customer = customers.find(c => c.id === a.assignedTo);
      const loc = customer?.locations.find(l => l.id === a.locationId);
      return [a.tag, a.name, a.type, a.serialNumber, a.status, customer?.name ?? "", loc?.name ?? "", a.notes].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assets.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleStatusFilter = (status: AssetStatus) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const filtered = assets.filter(a => {
    const matchSearch = [a.tag, a.name, a.type, a.serialNumber].some(f => f.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter.length === 0 || statusFilter.includes(a.status);
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
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCsvExport}><Download className="h-4 w-4 mr-1.5" />Export</Button>
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-1.5" />Import CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
              </label>
            </Button>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Add Asset</Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
