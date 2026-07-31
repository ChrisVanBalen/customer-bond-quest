import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Pre-selected template; when set the template picker is hidden. */
  templateId?: string;
}

const NONE = "__none__";

export function CreateFromTemplateDialog({ open, onOpenChange, templateId }: Props) {
  const { ticketTemplates, customers, technicians, projects, createTicketFromTemplate } = useStore();
  const [tplId, setTplId] = useState(templateId ?? "");
  const [customerId, setCustomerId] = useState("");
  const [locationId, setLocationId] = useState<string>(NONE);
  const [projectId, setProjectId] = useState<string>(NONE);
  const [primaryTechnicianId, setPrimaryTechnicianId] = useState<string>(NONE);
  const [titleSuffix, setTitleSuffix] = useState("");

  useEffect(() => {
    if (open) {
      setTplId(templateId ?? "");
      setCustomerId("");
      setLocationId(NONE);
      setProjectId(NONE);
      setPrimaryTechnicianId(NONE);
      setTitleSuffix("");
    }
  }, [open, templateId]);

  const template = ticketTemplates.find(t => t.id === tplId);
  const customer = customers.find(c => c.id === customerId);
  const customerLocations = customer?.locations ?? [];
  const customerProjects = projects.filter(p => p.customerId === customerId);

  const handleCreate = () => {
    if (!tplId || !customerId) return;
    createTicketFromTemplate(tplId, {
      customerId,
      locationId: locationId === NONE ? null : locationId,
      projectId: projectId === NONE ? null : projectId,
      technicianIds: primaryTechnicianId === NONE ? [] : [primaryTechnicianId],
      primaryTechnicianId: primaryTechnicianId === NONE ? null : primaryTechnicianId,
      titleSuffix: titleSuffix.trim() || undefined,
    });
    toast({ title: "Ticket created", description: `From template "${template?.name ?? ""}"` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Ticket from Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!templateId && (
            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select value={tplId} onValueChange={setTplId}>
                <SelectTrigger><SelectValue placeholder="Select a template" /></SelectTrigger>
                <SelectContent>
                  {ticketTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {template && (
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <p className="font-medium">{template.title}</p>
              <p className="text-muted-foreground">
                {template.tasks.length} task{template.tasks.length === 1 ? "" : "s"} · {template.tasks.reduce((s, x) => s + (x.time || 0), 0)}h estimated · {template.priority} priority
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Customer</Label>
            <Select value={customerId} onValueChange={v => { setCustomerId(v); setLocationId(NONE); setProjectId(NONE); }}>
              <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
              <SelectContent>
                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {customerLocations.length > 0 && (
            <div className="space-y-1.5">
              <Label>Site</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No specific site</SelectItem>
                  {customerLocations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Primary Technician</Label>
              <Select value={primaryTechnicianId} onValueChange={setPrimaryTechnicianId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {technicians.filter(t => t.active).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId} disabled={!customerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No project</SelectItem>
                  {customerProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Title Suffix (optional)</Label>
            <Input value={titleSuffix} onChange={e => setTitleSuffix(e.target.value)} placeholder="e.g. Q3 2026" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!tplId || !customerId}>Create Ticket</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
