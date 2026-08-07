import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useStore, CustomerLocation } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { AssetLifeBar } from "@/components/AssetLifeBar";
import { getAssetLife, stageMeta } from "@/lib/assetLife";
import { StatusBadge } from "@/components/StatusBadge";
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
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  Package,
  FileSignature,
  Plus,
  Pencil,
  Trash2,
  Star,
  Download,
} from "lucide-react";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { customers, assets, tickets, agreements, addCustomerLocation, updateCustomerLocation, deleteCustomerLocation } = useStore();
  const customer = customers.find(c => c.id === id);

  const [locationDialog, setLocationDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<CustomerLocation | null>(null);
  const [locForm, setLocForm] = useState({ name: "", address: "", isPrimary: false });

  if (!customer) {
    return (
      <div className="animate-fade-in">
        <Link to="/customers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <div className="bg-card rounded-xl border p-12 text-center">
          <p className="text-muted-foreground">Customer not found</p>
        </div>
      </div>
    );
  }

  const customerAssets = assets.filter(a => a.assignedTo === customer.id);
  const lifeStats = (["expired", "nearing", "aging", "healthy", "unknown"] as const).map(stage => ({
    stage,
    count: customerAssets.filter(a => getAssetLife(a).stage === stage).length,
  })).filter(s => s.count > 0);
  const customerTickets = tickets.filter(t => t.customerId === customer.id);
  const customerAgreements = agreements.filter(a => a.customerId === customer.id);

  const locations = customer.locations ?? [];
  const primaryLocation = locations.find(l => l.isPrimary);

  const openNewLocation = () => {
    setEditingLocation(null);
    setLocForm({ name: "", address: "", isPrimary: locations.length === 0 });
    setLocationDialog(true);
  };

  const openEditLocation = (loc: CustomerLocation) => {
    setEditingLocation(loc);
    setLocForm({ name: loc.name, address: loc.address, isPrimary: loc.isPrimary });
    setLocationDialog(true);
  };

  const handleSaveLocation = () => {
    if (!locForm.name.trim() || !locForm.address.trim()) return;
    if (editingLocation) {
      updateCustomerLocation(customer.id, editingLocation.id, locForm);
    } else {
      addCustomerLocation(customer.id, locForm);
    }
    setLocationDialog(false);
  };

  // Build Google Maps URL with all locations for the static map display
  const allAddresses = locations.map(l => encodeURIComponent(l.address));

  return (
    <div className="animate-fade-in">
      <Link to="/customers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </Link>

      <PageHeader
        title={customer.name}
        description={customer.company}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Info + Locations + Map */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Info */}
          <div className="bg-card rounded-xl border shadow-sm p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Contact Information</h2>
            <dl className="space-y-3.5">
              <div className="flex items-start gap-3">
                <Building className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Company</dt>
                  <dd className="text-sm text-foreground">{customer.company}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="text-sm text-foreground">{customer.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd className="text-sm text-foreground">{customer.phone}</dd>
                </div>
              </div>
            </dl>
            {customer.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground">{customer.notes}</p>
              </div>
            )}
          </div>

          {/* Locations */}
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Locations</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{locations.length} location{locations.length !== 1 ? "s" : ""}</p>
              </div>
              <Button size="sm" variant="outline" onClick={openNewLocation}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
            <div className="divide-y">
              {locations.map(loc => (
                <div key={loc.id} className="px-5 py-3 flex items-start gap-3">
                  <MapPin className={`h-4 w-4 mt-0.5 shrink-0 ${loc.isPrimary ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{loc.name}</span>
                      {loc.isPrimary && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                          <Star className="h-2.5 w-2.5" /> Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{loc.address}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditLocation(loc)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {!loc.isPrimary && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteCustomerLocation(customer.id, loc.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {locations.length === 0 && (
                <div className="px-5 py-6 text-center text-sm text-muted-foreground">No locations added</div>
              )}
            </div>
          </div>

          {/* Map */}
          {locations.length > 0 && (
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-sm font-semibold text-foreground">Locations Map</h2>
              </div>
              <div className="aspect-video bg-muted relative">
                <iframe
                  title="Customer locations"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=-180,-90,180,90&layer=mapnik`}
                  className="absolute inset-0"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-muted/60 backdrop-blur-sm">
                  <div className="text-center p-4 space-y-2">
                    <MapPin className="h-8 w-8 text-primary mx-auto" />
                    <div className="space-y-1">
                      {locations.map(loc => (
                        <div key={loc.id} className="text-xs text-foreground">
                          <span className="font-medium">{loc.name}:</span>{" "}
                          <span className="text-muted-foreground">{loc.address}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center pt-1">
                      {locations.map(loc => (
                        <a
                          key={loc.id}
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline"
                        >
                          {loc.name} →
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Assets + Tickets + Agreements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Assets */}
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Assigned Assets</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{customerAssets.length} assets</p>
              </div>
              <div className="flex items-center gap-2">
                {customerAssets.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => {
                    const headers = ["Tag", "Name", "Type", "Serial Number", "Status", "Location", "End Of Life (years)", "Age (years)", "Notes"];
                    const rows = customerAssets.map(a => {
                      const loc = customer.locations.find(l => l.id === a.locationId);
                      return [a.tag, a.name, a.type, a.serialNumber, a.status, loc?.name ?? "", a.eolYears ?? "", getAssetLife(a).ageYears.toFixed(1), a.notes].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
                    });
                    const csv = [headers.join(","), ...rows].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `${customer.name.replace(/[^a-zA-Z0-9]/g, "_")}_assets.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}>
                    <Download className="h-3.5 w-3.5 mr-1" />Export
                  </Button>
                )}
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            {lifeStats.length > 0 && (
              <div className="px-5 py-3 border-b flex flex-wrap items-center gap-4">
                {lifeStats.map(({ stage, count }) => (
                  <div key={stage} className="flex items-center gap-1.5 text-xs">
                    <span className={`h-2 w-2 rounded-full ${stageMeta[stage].dot}`} />
                    <span className="text-muted-foreground">{stageMeta[stage].label}</span>
                    <span className="font-semibold text-foreground tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            )}
            {customerAssets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Tag</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Name</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Type</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Status</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[170px]">Lifecycle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {customerAssets.map(a => (
                      <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <Link to={`/assets/${a.id}`} className="font-mono text-primary hover:underline">{a.tag}</Link>
                        </td>
                        <td className="px-4 py-2.5 text-foreground">{a.name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{a.type}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={a.status} /></td>
                        <td className="px-4 py-2.5"><AssetLifeBar asset={a} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">No assets assigned</div>
            )}
          </div>

          {/* Service Tickets */}
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Service Tickets</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{customerTickets.length} tickets</p>
              </div>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            {customerTickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Title</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Location</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Priority</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Status</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[170px]">Lifecycle</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {customerTickets.map(t => {
                      const loc = t.locationId ? locations.find(l => l.id === t.locationId) : primaryLocation;
                      return (
                        <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <Link to={`/tickets/${t.id}`} className="text-foreground font-medium hover:text-primary hover:underline">{t.title}</Link>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs hidden sm:table-cell">{loc?.name ?? "—"}</td>
                          <td className="px-4 py-2.5"><StatusBadge status={t.priority} /></td>
                          <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                          <td className="px-4 py-2.5 text-muted-foreground tabular-nums hidden sm:table-cell">{t.updatedAt}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">No tickets</div>
            )}
          </div>

          {/* Service Agreements */}
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Service Agreements</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{customerAgreements.length} agreements</p>
              </div>
              <FileSignature className="h-5 w-5 text-muted-foreground" />
            </div>
            {customerAgreements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Number</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Title</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Stage</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Monthly</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">End Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {customerAgreements.map(a => (
                      <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <Link to={`/agreements/${a.id}`} className="font-mono text-primary hover:underline">{a.number}</Link>
                        </td>
                        <td className="px-4 py-2.5 text-foreground font-medium">{a.title}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={a.stage} /></td>
                        <td className="px-4 py-2.5 text-foreground tabular-nums hidden sm:table-cell">${a.monthlyTotal.toLocaleString()}/mo</td>
                        <td className="px-4 py-2.5 text-muted-foreground tabular-nums hidden sm:table-cell">{a.endDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">No agreements</div>
            )}
          </div>
        </div>
      </div>

      {/* Location Dialog */}
      <Dialog open={locationDialog} onOpenChange={setLocationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Edit Location" : "Add Location"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Location Name</Label>
              <Input value={locForm.name} onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Headquarters, Branch Office" />
            </div>
            <div className="grid gap-1.5">
              <Label>Address</Label>
              <AddressAutocomplete
                value={locForm.address}
                onChange={(address, coords) =>
                  setLocForm(f => ({ ...f, address, lat: coords?.lat, lng: coords?.lng }))
                }
                placeholder="Full address"
              />
              <p className="text-xs text-muted-foreground">Powered by Google Address lookup</p>
            </div>
            <div className="flex items-center justify-between">
              <Label>Primary Location</Label>
              <Switch checked={locForm.isPrimary} onCheckedChange={v => setLocForm(f => ({ ...f, isPrimary: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocationDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveLocation}>{editingLocation ? "Save" : "Add Location"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
