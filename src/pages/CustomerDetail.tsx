import { useParams, Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Mail, Phone, MapPin, Building, FileText, Package, FileSignature } from "lucide-react";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { customers, assets, tickets, agreements } = useStore();
  const customer = customers.find(c => c.id === id);

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
  const customerTickets = tickets.filter(t => t.customerId === customer.id);
  const customerAgreements = agreements.filter(a => a.customerId === customer.id);

  const encodedAddress = encodeURIComponent(customer.address);

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
        {/* Left column: Info + Map */}
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
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Address</dt>
                  <dd className="text-sm text-foreground">{customer.address}</dd>
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

          {/* Map */}
          {customer.address && (
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-sm font-semibold text-foreground">Location</h2>
              </div>
              <div className="aspect-video bg-muted relative">
                <iframe
                  title="Customer location"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=-180,-90,180,90&layer=mapnik`}
                  className="absolute inset-0"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-muted/60 backdrop-blur-sm">
                  <div className="text-center p-4">
                    <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">{customer.address}</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 inline-block"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Assets + Tickets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Assets */}
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Assigned Assets</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{customerAssets.length} assets</p>
              </div>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            {customerAssets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Tag</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Name</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Type</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Status</th>
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
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Priority</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Status</th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {customerTickets.map(t => (
                      <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 text-foreground font-medium">{t.title}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={t.priority} /></td>
                        <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-2.5 text-muted-foreground tabular-nums hidden sm:table-cell">{t.updatedAt}</td>
                      </tr>
                    ))}
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
    </div>
  );
}