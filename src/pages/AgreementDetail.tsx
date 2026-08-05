import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useStore, type AgreementStage, type AgreementServiceLine, type AgreementAssetLine } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { differenceInMonths, format } from "date-fns";

export default function AgreementDetail() {
  const { id } = useParams<{ id: string }>();
  const { agreements, customers, assets, settings, updateAgreement } = useStore();
  const stages = settings.agreementStages;
  const agreement = agreements.find(a => a.id === id);

  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({ description: "", monthlyPrice: "" });
  const [assetForm, setAssetForm] = useState({ assetId: "", monthlyPrice: "", notes: "" });

  if (!agreement) {
    return (
      <div className="animate-fade-in">
        <Link to="/agreements" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Agreements
        </Link>
        <div className="bg-card rounded-xl border p-12 text-center">
          <p className="text-muted-foreground">Agreement not found</p>
        </div>
      </div>
    );
  }

  const customer = customers.find(c => c.id === agreement.customerId);
  const monthsUntilExpiry = differenceInMonths(new Date(agreement.endDate), new Date());
  const isExpiringSoon = monthsUntilExpiry >= 0 && monthsUntilExpiry <= 6 && (agreement.stage === "accepted" || agreement.stage === "executed");
  const customerAssets = assets.filter(a => a.assignedTo === agreement.customerId);

  const recalcTotal = (services: AgreementServiceLine[], assetLines: AgreementAssetLine[]) => {
    return services.reduce((s, l) => s + l.monthlyPrice, 0) + assetLines.reduce((s, l) => s + l.monthlyPrice, 0);
  };

  const handleStageChange = (stage: AgreementStage) => {
    updateAgreement(agreement.id, { stage });
  };

  const addService = () => {
    if (!serviceForm.description || !serviceForm.monthlyPrice) return;
    const newLine: AgreementServiceLine = {
      id: crypto.randomUUID(),
      description: serviceForm.description,
      monthlyPrice: parseFloat(serviceForm.monthlyPrice),
    };
    const newServices = [...agreement.services, newLine];
    updateAgreement(agreement.id, {
      services: newServices,
      monthlyTotal: recalcTotal(newServices, agreement.assets),
    });
    setServiceForm({ description: "", monthlyPrice: "" });
    setServiceDialogOpen(false);
  };

  const removeService = (lineId: string) => {
    const newServices = agreement.services.filter(s => s.id !== lineId);
    updateAgreement(agreement.id, {
      services: newServices,
      monthlyTotal: recalcTotal(newServices, agreement.assets),
    });
  };

  const addAssetLine = () => {
    if (!assetForm.assetId) return;
    const newLine: AgreementAssetLine = {
      id: crypto.randomUUID(),
      assetId: assetForm.assetId,
      monthlyPrice: parseFloat(assetForm.monthlyPrice) || 0,
      notes: assetForm.notes,
    };
    const newAssets = [...agreement.assets, newLine];
    updateAgreement(agreement.id, {
      assets: newAssets,
      monthlyTotal: recalcTotal(agreement.services, newAssets),
    });
    setAssetForm({ assetId: "", monthlyPrice: "", notes: "" });
    setAssetDialogOpen(false);
  };

  const removeAssetLine = (lineId: string) => {
    const newAssets = agreement.assets.filter(a => a.id !== lineId);
    updateAgreement(agreement.id, {
      assets: newAssets,
      monthlyTotal: recalcTotal(agreement.services, newAssets),
    });
  };

  return (
    <div className="animate-fade-in">
      <Link to="/agreements" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Agreements
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-sm text-muted-foreground">{agreement.number}</span>
            <StatusBadge status={agreement.stage} />
            {isExpiringSoon && <StatusBadge status="expiring_soon" />}
          </div>
          <PageHeader title={agreement.title} description={customer?.name ?? "Unknown customer"} />
        </div>
      </div>

      {isExpiringSoon && (
        <div className="mb-6 border border-warning/30 bg-warning/5 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              This agreement expires on {format(new Date(agreement.endDate), "MMMM d, yyyy")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {monthsUntilExpiry} month{monthsUntilExpiry !== 1 ? "s" : ""} remaining — begin renewal process
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agreement details */}
          <div className="bg-card rounded-xl border shadow-sm p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Agreement Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-muted-foreground">Stage</dt>
                <dd className="mt-1">
                  <Select value={agreement.stage} onValueChange={v => handleStageChange(v as AgreementStage)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {stages.map(s => <SelectItem key={s.id} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Start Date</dt>
                <dd className="text-sm text-foreground tabular-nums">{agreement.startDate}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">End Date</dt>
                <dd className="text-sm text-foreground tabular-nums">{agreement.endDate}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Monthly Total</dt>
                <dd className="text-lg font-semibold text-foreground tabular-nums">${agreement.monthlyTotal.toLocaleString()}/mo</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Annual Value</dt>
                <dd className="text-sm text-foreground tabular-nums">${(agreement.monthlyTotal * 12).toLocaleString()}/yr</dd>
              </div>
            </dl>
            {agreement.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground">{agreement.notes}</p>
              </div>
            )}
          </div>

          {/* Customer card */}
          {customer && (
            <div className="bg-card rounded-xl border shadow-sm p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Customer</h2>
              <Link to={`/customers/${customer.id}`} className="text-sm text-primary hover:underline font-medium">{customer.name}</Link>
              <p className="text-xs text-muted-foreground mt-1">{customer.email}</p>
              <p className="text-xs text-muted-foreground">{customer.phone}</p>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Services */}
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Monthly Services</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{agreement.services.length} line items</p>
              </div>
              <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Service</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Monthly Service</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Description</Label>
                      <Input value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. 24/7 Help Desk Support" />
                    </div>
                    <div>
                      <Label>Monthly Price ($)</Label>
                      <Input type="number" value={serviceForm.monthlyPrice} onChange={e => setServiceForm(f => ({ ...f, monthlyPrice: e.target.value }))} placeholder="0.00" />
                    </div>
                    <Button onClick={addService} className="w-full">Add Service</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {agreement.services.length > 0 ? (
              <div className="divide-y">
                {agreement.services.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-foreground">{s.description}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground tabular-nums">${s.monthlyPrice.toLocaleString()}/mo</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeService(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-5 py-3 bg-muted/30">
                  <span className="text-sm font-medium text-foreground">Services Subtotal</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    ${agreement.services.reduce((s, l) => s + l.monthlyPrice, 0).toLocaleString()}/mo
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">No services added</div>
            )}
          </div>

          {/* Covered Assets */}
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Covered Assets</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{agreement.assets.length} assets</p>
              </div>
              <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Asset</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Asset to Agreement</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Asset</Label>
                      <Select value={assetForm.assetId} onValueChange={v => setAssetForm(f => ({ ...f, assetId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                        <SelectContent>
                          {customerAssets.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.tag} — {a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Monthly Price ($)</Label>
                      <Input type="number" value={assetForm.monthlyPrice} onChange={e => setAssetForm(f => ({ ...f, monthlyPrice: e.target.value }))} placeholder="0.00" />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input value={assetForm.notes} onChange={e => setAssetForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Included in support scope" />
                    </div>
                    <Button onClick={addAssetLine} className="w-full">Add Asset</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {agreement.assets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Asset</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Notes</th>
                      <th className="text-right font-medium text-muted-foreground px-4 py-2.5">Monthly</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {agreement.assets.map(line => {
                      const asset = assets.find(a => a.id === line.assetId);
                      return (
                        <tr key={line.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5">
                            {asset ? (
                              <Link to={`/assets/${asset.id}`} className="text-primary hover:underline">
                                <span className="font-mono text-xs">{asset.tag}</span> — {asset.name}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">Unknown asset</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{line.notes}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">${line.monthlyPrice.toLocaleString()}/mo</td>
                          <td className="px-2 py-2.5">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeAssetLine(line.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">No assets covered</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
