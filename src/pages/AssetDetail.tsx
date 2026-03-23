import { useParams, Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, User, Calendar, Hash, FileText, CircleDot, Ticket } from "lucide-react";

const eventIcons: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-600",
  assigned: "bg-blue-100 text-blue-600",
  reassigned: "bg-amber-100 text-amber-600",
  unassigned: "bg-zinc-100 text-zinc-500",
  decommissioned: "bg-red-100 text-red-600",
};

const eventLabels: Record<string, string> = {
  created: "Created",
  assigned: "Assigned",
  reassigned: "Reassigned",
  unassigned: "Unassigned",
  decommissioned: "Decommissioned",
};

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const { assets, customers, tickets } = useStore();
  const asset = assets.find(a => a.id === id);

  if (!asset) {
    return (
      <div className="animate-fade-in">
        <Link to="/assets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Assets
        </Link>
        <div className="bg-card rounded-xl border p-12 text-center">
          <p className="text-muted-foreground">Asset not found</p>
        </div>
      </div>
    );
  }

  const currentCustomer = customers.find(c => c.id === asset.assignedTo);
  const assetTickets = tickets.filter(t => t.assetId === asset.id);
  const history = [...asset.history].sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date);
    if (dateCmp !== 0) return dateCmp;
    // Keep original order for same-date events (reverse since we want newest first)
    return asset.history.indexOf(b) - asset.history.indexOf(a);
  });

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return null;
    return customers.find(c => c.id === customerId)?.name ?? "Deleted Customer";
  };

  return (
    <div className="animate-fade-in">
      <Link to="/assets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Assets
      </Link>

      <PageHeader
        title={asset.name}
        description={`${asset.tag} · ${asset.type}`}
        action={<StatusBadge status={asset.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-xl border shadow-sm p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Asset Information</h2>
            <dl className="space-y-3.5">
              <div className="flex items-start gap-3">
                <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Asset Tag</dt>
                  <dd className="text-sm font-mono font-medium text-foreground">{asset.tag}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Type</dt>
                  <dd className="text-sm text-foreground">{asset.type}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Serial Number</dt>
                  <dd className="text-sm font-mono text-foreground">{asset.serialNumber}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Created</dt>
                  <dd className="text-sm text-foreground tabular-nums">{asset.createdAt}</dd>
                </div>
              </div>
              {asset.decommissionedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Decommissioned</dt>
                    <dd className="text-sm text-foreground tabular-nums">{asset.decommissionedAt}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Currently Assigned To</dt>
                  <dd className="text-sm text-foreground">
                    {currentCustomer ? (
                      <Link to="/customers" className="text-primary hover:underline">{currentCustomer.name}</Link>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </dd>
                </div>
              </div>
            </dl>
            {asset.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground">{asset.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Deployment History */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-5 border-b">
              <h2 className="font-semibold text-foreground">Deployment History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{history.length} events tracked</p>
            </div>
            <div className="p-5">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

                <div className="space-y-6">
                  {history.map((event, i) => {
                    const customerName = getCustomerName(event.customerId);
                    const prevCustomerName = getCustomerName(event.previousCustomerId);

                    return (
                      <div key={event.id} className="relative flex gap-4" style={{ animationDelay: `${i * 60}ms` }}>
                        {/* Timeline dot */}
                        <div className={`relative z-10 h-[30px] w-[30px] rounded-full flex items-center justify-center shrink-0 ${eventIcons[event.type] ?? "bg-muted text-muted-foreground"}`}>
                          <CircleDot className="h-3.5 w-3.5" />
                        </div>

                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{eventLabels[event.type] ?? event.type}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">{event.date}</span>
                          </div>

                          {/* Context line */}
                          <div className="mt-1 text-sm text-muted-foreground">
                            {event.type === "assigned" && customerName && (
                              <span>Assigned to <span className="text-foreground font-medium">{customerName}</span></span>
                            )}
                            {event.type === "reassigned" && (
                              <span>
                                Moved from <span className="text-foreground font-medium">{prevCustomerName ?? "Unknown"}</span>
                                {" → "}
                                <span className="text-foreground font-medium">{customerName ?? "Unknown"}</span>
                              </span>
                            )}
                            {event.type === "unassigned" && prevCustomerName && (
                              <span>Returned from <span className="text-foreground font-medium">{prevCustomerName}</span></span>
                            )}
                            {event.type === "decommissioned" && prevCustomerName && (
                              <span>Previously with <span className="text-foreground font-medium">{prevCustomerName}</span></span>
                            )}
                            {event.type === "created" && (
                              <span>Asset added to inventory</span>
                            )}
                          </div>

                          {event.notes && event.type !== "created" && (
                            <p className="mt-1 text-xs text-muted-foreground/80 italic">{event.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Service Ticket History */}
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Service Tickets</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{assetTickets.length} tickets linked to this asset</p>
              </div>
              <Ticket className="h-5 w-5 text-muted-foreground" />
            </div>
            {assetTickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Title</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Customer</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Priority</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Status</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {assetTickets.map(t => {
                      const ticketCustomer = customers.find(c => c.id === t.customerId);
                      return (
                        <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 text-foreground font-medium">{t.title}</td>
                          <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
                            {ticketCustomer ? (
                              <Link to={`/customers/${ticketCustomer.id}`} className="text-primary hover:underline">{ticketCustomer.name}</Link>
                            ) : "Unknown"}
                          </td>
                          <td className="px-4 py-2.5"><StatusBadge status={t.priority} /></td>
                          <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                          <td className="px-4 py-2.5 text-muted-foreground tabular-nums hidden sm:table-cell">{t.createdAt}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">No tickets linked to this asset</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
