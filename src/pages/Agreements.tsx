import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileSignature, AlertTriangle } from "lucide-react";
import { useStore, type AgreementStage, type ServiceAgreement } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { differenceInMonths } from "date-fns";

function isExpiringSoon(endDate: string): boolean {
  const months = differenceInMonths(new Date(endDate), new Date());
  return months >= 0 && months <= 6;
}

export default function Agreements() {
  const { agreements, customers, settings, addAgreement } = useStore();
  const stages = settings.agreementStages;
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    customerId: "", title: "", stage: "draft" as AgreementStage,
    startDate: "", endDate: "", notes: "",
  });

  const filtered = agreements.filter(a => {
    const customer = customers.find(c => c.id === a.customerId);
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.number.toLowerCase().includes(search.toLowerCase()) ||
      (customer?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || a.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const expiringSoon = agreements.filter(a =>
    (a.stage === "accepted" || a.stage === "executed") && isExpiringSoon(a.endDate)
  );

  const handleSubmit = () => {
    if (!form.customerId || !form.title || !form.startDate || !form.endDate) return;
    addAgreement({
      ...form, monthlyTotal: 0, services: [], assets: [],
    });
    setForm({ customerId: "", title: "", stage: "draft", startDate: "", endDate: "", notes: "" });
    setOpen(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Service Agreements" description="Manage customer contracts and renewals" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Agreement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Service Agreement</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Customer</Label>
                <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Managed IT Services" />
              </div>
              <div>
                <Label>Stage</Label>
                <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v as AgreementStage }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stages.map(s => <SelectItem key={s.id} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <Button onClick={handleSubmit} className="w-full">Create Agreement</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {expiringSoon.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {expiringSoon.length} agreement{expiringSoon.length > 1 ? "s" : ""} expiring within 6 months
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {expiringSoon.map(a => a.number).join(", ")} — review for renewal
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <Input placeholder="Search agreements…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map(s => <SelectItem key={s.id} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Number</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Title</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Customer</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Stage</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Monthly</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">End Date</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(a => {
                const customer = customers.find(c => c.id === a.customerId);
                const expiring = (a.stage === "accepted" || a.stage === "executed") && isExpiringSoon(a.endDate);
                return (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/agreements/${a.id}`} className="font-mono text-primary hover:underline">{a.number}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/agreements/${a.id}`} className="text-foreground font-medium hover:underline">{a.title}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/customers/${a.customerId}`} className="text-muted-foreground hover:text-foreground">{customer?.name ?? "Unknown"}</Link>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={a.stage} /></td>
                    <td className="px-4 py-3 text-foreground tabular-nums hidden md:table-cell">${a.monthlyTotal.toLocaleString()}/mo</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums hidden lg:table-cell">{a.endDate}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {expiring && <StatusBadge status="expiring_soon" />}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <FileSignature className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No agreements found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
