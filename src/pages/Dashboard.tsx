import { Users, Package, TicketCheck, AlertTriangle, FileSignature } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { customers, assets, tickets, agreements } = useStore();

  const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress");
  const assignedAssets = assets.filter(a => a.status === "assigned");
  const availableAssets = assets.filter(a => a.status === "available");
  const criticalTickets = tickets.filter(t => t.priority === "critical" || t.priority === "high");

  const expiringAgreements = agreements.filter(a => {
    if (a.stage !== "accepted" && a.stage !== "executed") return false;
    const months = Math.round((new Date(a.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
    return months >= 0 && months <= 6;
  });

  const recentTickets = [...tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Dashboard" description="Overview of your operations" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Customers" value={customers.length} icon={Users} trend={`${customers.length} active accounts`} />
        <StatCard label="Assigned Assets" value={assignedAssets.length} icon={Package} trend={`${availableAssets.length} available`} />
        <StatCard label="Open Tickets" value={openTickets.length} icon={TicketCheck} trend={`${tickets.length} total`} />
        <StatCard label="High Priority" value={criticalTickets.length} icon={AlertTriangle} trend="Needs attention" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-5 border-b">
            <h2 className="font-semibold text-foreground">Recent Tickets</h2>
          </div>
          <div className="divide-y">
            {recentTickets.map(ticket => {
              const customer = customers.find(c => c.id === ticket.customerId);
              return (
                <Link to="/tickets" key={ticket.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-medium text-foreground truncate">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{customer?.name ?? "Unknown"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </Link>
              );
            })}
            {recentTickets.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">No tickets yet</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-5 border-b">
            <h2 className="font-semibold text-foreground">Asset Summary</h2>
          </div>
          <div className="p-5 space-y-4">
            {(["assigned", "available", "decommissioned"] as const).map(status => {
              const count = assets.filter(a => a.status === status).length;
              const pct = assets.length ? Math.round((count / assets.length) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="capitalize text-foreground font-medium">{status}</span>
                    <span className="text-muted-foreground tabular-nums">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        status === "assigned" ? "bg-primary" : status === "available" ? "bg-success" : "bg-muted-foreground/30"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
