import { useState, useEffect, useCallback } from "react";

// Types
export interface CustomerLocation {
  id: string;
  name: string;
  address: string;
  isPrimary: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string; // kept for backward compat, mirrors primary location
  locations: CustomerLocation[];
  notes: string;
  createdAt: string;
}

export type AssetStatus = "available" | "assigned" | "decommissioned";

export type DeploymentEventType = "created" | "assigned" | "unassigned" | "reassigned" | "decommissioned";

export interface DeploymentEvent {
  id: string;
  date: string;
  type: DeploymentEventType;
  customerId: string | null;
  previousCustomerId: string | null;
  notes: string;
}

export interface Asset {
  id: string;
  tag: string;
  name: string;
  type: string;
  serialNumber: string;
  status: AssetStatus;
  assignedTo: string | null;
  locationId: string | null;
  notes: string;
  /** Expected useful lifespan in years (end of life). Null when not set. */
  eolYears: number | null;
  createdAt: string;
  decommissionedAt: string | null;
  history: DeploymentEvent[];
}

export type TicketPriority = "low" | "medium" | "high" | "critical" | (string & {});
export type TicketStatus = "open" | "in_progress" | "resolved" | "billing" | "closed" | (string & {});

export interface TicketLogEntry {
  id: string;
  date: string;
  author: string;
  message: string;
}

export interface BillableItem {
  id: string;
  date: string;
  description: string;
  quantity: number;
  unitPrice: number;
  technicianId: string | null;
}

export interface TimeEntry {
  id: string;
  date: string;
  technician: string;
  hours: number;
  description: string;
}

export interface TicketTask {
  id: string;
  name: string;
  time: number; // estimated hours
  actualTime: number; // actual hours
  completed: boolean;
  technicianId: string | null;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string; // e.g. "Senior Tech", "Field Engineer"
  active: boolean;
  createdAt: string;
}

export type TicketCategory = "service" | "sales" | "purchasing" | "porting" | "quoting" | (string & {});

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "service", label: "Service" },
  { value: "sales", label: "Sales" },
  { value: "purchasing", label: "Purchasing" },
  { value: "porting", label: "Porting" },
  { value: "quoting", label: "Quoting" },
];

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  customerId: string;
  locationId: string | null;
  assetId: string | null;
  projectId: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  technicianIds: string[];
  primaryTechnicianId: string | null;
  createdAt: string;
  updatedAt: string;
  tasks: TicketTask[];
  logs: TicketLogEntry[];
  billableItems: BillableItem[];
  timeEntries: TimeEntry[];
}

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled" | (string & {});

export interface Project {
  id: string;
  name: string;
  description: string;
  customerId: string;
  status: ProjectStatus;
  startDate: string;
  targetDate: string;
  managerId: string | null; // technician leading the project
  createdAt: string;
  updatedAt: string;
}


export type AgreementStage = "draft" | "quoting" | "sent" | "accepted" | "executed" | "expired" | "cancelled" | (string & {});

export interface AgreementServiceLine {
  id: string;
  description: string;
  monthlyPrice: number;
}

export interface AgreementAssetLine {
  id: string;
  assetId: string;
  monthlyPrice: number;
  notes: string;
}

export interface ServiceAgreement {
  id: string;
  number: string;
  customerId: string;
  title: string;
  stage: AgreementStage;
  startDate: string;
  endDate: string;
  monthlyTotal: number;
  services: AgreementServiceLine[];
  assets: AgreementAssetLine[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketTemplateTask {
  id: string;
  name: string;
  time: number; // estimated hours
}

export interface TicketTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  priority: TicketPriority;
  tasks: TicketTemplateTask[];
  createdAt: string;
  updatedAt: string;
}

export type ScheduleFrequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual" | "annual";

export interface ScheduledTicket {
  id: string;
  name: string;
  templateId: string | null;
  customerId: string;
  locationId: string | null;
  frequency: ScheduleFrequency;
  nextRunDate: string;
  lastRunDate: string | null;
  technicianIds: string[];
  primaryTechnicianId: string | null;
  active: boolean;
  createdAt: string;
}

interface StoreData {
  customers: Customer[];
  assets: Asset[];
  tickets: Ticket[];
  agreements: ServiceAgreement[];
  technicians: Technician[];
  projects: Project[];
  ticketTemplates: TicketTemplate[];
  scheduledTickets: ScheduledTicket[];
}

export const FREQUENCY_LABELS: Record<ScheduleFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semiannual: "Every 6 months",
  annual: "Annually",
};

export function advanceDate(date: string, frequency: ScheduleFrequency): string {
  const d = new Date(date + "T00:00:00");
  switch (frequency) {
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "biweekly": d.setDate(d.getDate() + 14); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "semiannual": d.setMonth(d.getMonth() + 6); break;
    case "annual": d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split("T")[0];
}


const STORAGE_KEY = "crm-psa-data";

const defaultData: StoreData = {
  ticketTemplates: [
    {
      id: "tpl1", name: "Quarterly Maintenance", title: "Quarterly preventive maintenance",
      description: "Standard quarterly onsite maintenance visit.", priority: "medium",
      tasks: [
        { id: "tt1", name: "Inspect network hardware", time: 1 },
        { id: "tt2", name: "Apply firmware/OS updates", time: 2 },
        { id: "tt3", name: "Verify backups", time: 1 },
      ],
      createdAt: "2025-01-05", updatedAt: "2025-01-05",
    },
    {
      id: "tpl2", name: "New Workstation Setup", title: "Workstation deployment",
      description: "Provision and deploy a new workstation for a user.", priority: "medium",
      tasks: [
        { id: "tt4", name: "Image machine", time: 1.5 },
        { id: "tt5", name: "Install standard software", time: 1 },
        { id: "tt6", name: "User handoff & orientation", time: 0.5 },
      ],
      createdAt: "2025-01-10", updatedAt: "2025-01-10",
    },
  ],
  scheduledTickets: [
    {
      id: "sch1", name: "Meridian quarterly maintenance", templateId: "tpl1", customerId: "c1", locationId: null,
      frequency: "quarterly", nextRunDate: "2025-07-01", lastRunDate: "2025-04-01",
      technicianIds: ["tech1"], primaryTechnicianId: "tech1", active: true, createdAt: "2025-01-05",
    },
  ],

  technicians: [
    { id: "tech1", name: "Alex Rivera", email: "alex@commandhub.com", phone: "(555) 111-2233", role: "Senior Technician", active: true, createdAt: "2024-10-01" },
    { id: "tech2", name: "Jordan Chen", email: "jordan@commandhub.com", phone: "(555) 222-3344", role: "Field Engineer", active: true, createdAt: "2024-10-15" },
    { id: "tech3", name: "Sam Patel", email: "sam@commandhub.com", phone: "(555) 333-4455", role: "Help Desk Lead", active: true, createdAt: "2024-11-01" },
  ],
  customers: [
    {
      id: "c1", name: "Meridian Health Systems", email: "contact@meridianhs.com", phone: "(555) 234-5678", company: "Meridian Health Systems",
      address: "1200 Oak Valley Dr, Suite 300",
      locations: [
        { id: "loc1", name: "Headquarters", address: "1200 Oak Valley Dr, Suite 300", isPrimary: true },
        { id: "loc2", name: "East Campus Clinic", address: "4500 Riverside Blvd, Building C", isPrimary: false },
      ],
      notes: "Enterprise client, 3-year contract", createdAt: "2024-11-15",
    },
    {
      id: "c2", name: "Cascade Engineering", email: "ops@cascadeeng.com", phone: "(555) 876-5432", company: "Cascade Engineering",
      address: "890 Industrial Pkwy",
      locations: [
        { id: "loc3", name: "Main Office", address: "890 Industrial Pkwy", isPrimary: true },
      ],
      notes: "Manufacturing sector", createdAt: "2024-12-01",
    },
    {
      id: "c3", name: "Pinebrook Academy", email: "it@pinebrookacad.edu", phone: "(555) 345-6789", company: "Pinebrook Academy",
      address: "456 Campus Blvd",
      locations: [
        { id: "loc4", name: "Main Campus", address: "456 Campus Blvd", isPrimary: true },
        { id: "loc5", name: "Athletic Complex", address: "460 Campus Blvd, West Wing", isPrimary: false },
        { id: "loc6", name: "Admin Building", address: "450 Campus Blvd, Suite 100", isPrimary: false },
      ],
      notes: "Education sector, 150 endpoints", createdAt: "2025-01-10",
    },
  ],
  assets: [
    {
      id: "a1", eolYears: 5, tag: "AST-001", name: "Dell OptiPlex 7090", type: "Desktop", serialNumber: "DL-7090-XK4521", status: "assigned", assignedTo: "c1", locationId: null, notes: "Front desk workstation", createdAt: "2024-11-20", decommissionedAt: null,
      history: [
        { id: "h1", date: "2024-11-20", type: "created", customerId: null, previousCustomerId: null, notes: "Added to inventory" },
        { id: "h2", date: "2024-11-22", type: "assigned", customerId: "c1", previousCustomerId: null, notes: "Deployed to front desk" },
      ],
    },
    {
      id: "a2", eolYears: 7, tag: "AST-002", name: "Cisco Meraki MR46", type: "Network", serialNumber: "MR46-Q9X832", status: "assigned", assignedTo: "c1", locationId: null, notes: "Main lobby AP", createdAt: "2024-11-20", decommissionedAt: null,
      history: [
        { id: "h3", date: "2024-11-20", type: "created", customerId: null, previousCustomerId: null, notes: "Added to inventory" },
        { id: "h4", date: "2024-12-01", type: "assigned", customerId: "c3", previousCustomerId: null, notes: "Initial deployment to Pinebrook" },
        { id: "h5", date: "2025-01-15", type: "reassigned", customerId: "c1", previousCustomerId: "c3", notes: "Moved to Meridian lobby after Pinebrook upgrade" },
      ],
    },
    {
      id: "a3", eolYears: 5, tag: "AST-003", name: "HP LaserJet Pro M404", type: "Printer", serialNumber: "HP-M404-TN7291", status: "available", assignedTo: null, locationId: null, notes: "Spare inventory", createdAt: "2025-01-05", decommissionedAt: null,
      history: [
        { id: "h6", date: "2025-01-05", type: "created", customerId: null, previousCustomerId: null, notes: "Added to inventory" },
      ],
    },
    {
      id: "a4", eolYears: 4, tag: "AST-004", name: "Lenovo ThinkPad T14", type: "Laptop", serialNumber: "LN-T14-PK6183", status: "assigned", assignedTo: "c2", locationId: null, notes: "Engineering team lead", createdAt: "2025-01-12", decommissionedAt: null,
      history: [
        { id: "h7", date: "2025-01-12", type: "created", customerId: null, previousCustomerId: null, notes: "Added to inventory" },
        { id: "h8", date: "2025-01-14", type: "assigned", customerId: "c2", previousCustomerId: null, notes: "Issued to engineering team lead" },
      ],
    },
    {
      id: "a5", eolYears: 5, tag: "AST-005", name: "APC UPS 1500VA", type: "Power", serialNumber: "APC-1500-ZM4920", status: "decommissioned", assignedTo: null, locationId: null, notes: "Battery failure, replaced", createdAt: "2024-06-15", decommissionedAt: "2025-02-01",
      history: [
        { id: "h9", date: "2024-06-15", type: "created", customerId: null, previousCustomerId: null, notes: "Added to inventory" },
        { id: "h10", date: "2024-06-20", type: "assigned", customerId: "c1", previousCustomerId: null, notes: "Installed in server room" },
        { id: "h11", date: "2025-02-01", type: "decommissioned", customerId: null, previousCustomerId: "c1", notes: "Battery failure, replaced with newer model" },
      ],
    },
  ],
  projects: [
    {
      id: "p1", name: "HQ Network Refresh", description: "Replace aging switches and access points across the main office.",
      customerId: "c1", status: "active", startDate: "2025-03-01", targetDate: "2025-06-30",
      managerId: "tech1", createdAt: "2025-03-01", updatedAt: "2025-03-20",
    },
  ],
  tickets: [
    { id: "t1", title: "Email server not syncing", description: "Outlook clients unable to sync with Exchange server since this morning.", category: "service", customerId: "c1", locationId: null, assetId: "a1", projectId: null, priority: "high", status: "in_progress", technicianIds: ["tech1"], primaryTechnicianId: "tech1", createdAt: "2025-03-20", updatedAt: "2025-03-21", tasks: [], logs: [], billableItems: [], timeEntries: [] },
    { id: "t2", title: "New workstation setup", description: "Set up 3 new workstations for engineering hires starting next week.", category: "purchasing", customerId: "c2", locationId: null, assetId: null, projectId: null, priority: "medium", status: "open", technicianIds: ["tech2", "tech3"], primaryTechnicianId: "tech2", createdAt: "2025-03-19", updatedAt: "2025-03-19", tasks: [], logs: [], billableItems: [], timeEntries: [] },
    { id: "t3", title: "WiFi coverage gap in Building B", description: "Students reporting weak signal in second floor classrooms.", category: "service", customerId: "c3", locationId: null, assetId: "a2", projectId: "p1", priority: "medium", status: "open", technicianIds: [], primaryTechnicianId: null, createdAt: "2025-03-18", updatedAt: "2025-03-18", tasks: [], logs: [], billableItems: [], timeEntries: [] },
  ],
  agreements: [
    {
      id: "sa1", number: "SA-001", customerId: "c1", title: "Managed IT Services", stage: "executed",
      startDate: "2024-12-01", endDate: "2025-11-30", monthlyTotal: 4500,
      services: [
        { id: "sl1", description: "24/7 Help Desk Support", monthlyPrice: 2000 },
        { id: "sl2", description: "Network Monitoring & Management", monthlyPrice: 1500 },
        { id: "sl3", description: "Endpoint Protection", monthlyPrice: 1000 },
      ],
      assets: [
        { id: "al1", assetId: "a1", monthlyPrice: 0, notes: "Included in support scope" },
        { id: "al2", assetId: "a2", monthlyPrice: 0, notes: "Included in support scope" },
      ],
      notes: "Annual renewal, auto-escalation clause 3%", createdAt: "2024-11-15", updatedAt: "2024-12-01",
    },
    {
      id: "sa2", number: "SA-002", customerId: "c3", title: "Campus IT Support", stage: "quoting",
      startDate: "2025-04-01", endDate: "2026-03-31", monthlyTotal: 3200,
      services: [
        { id: "sl4", description: "On-site Technician (2 days/week)", monthlyPrice: 2400 },
        { id: "sl5", description: "Student Lab Management", monthlyPrice: 800 },
      ],
      assets: [],
      notes: "Awaiting board approval", createdAt: "2025-03-10", updatedAt: "2025-03-15",
    },
  ],
};

function loadData(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate assets without history or locationId
      parsed.assets = parsed.assets.map((a: any) => ({
        ...a,
        locationId: a.locationId ?? null,
        eolYears: a.eolYears ?? null,
        history: a.history ?? [{ id: crypto.randomUUID(), date: a.createdAt, type: "created", customerId: null, previousCustomerId: null, notes: "Added to inventory" }],
      }));
      // Migrate tickets
      parsed.tickets = parsed.tickets.map((t: any) => ({
        ...t,
        category: t.category ?? "service",
        assetId: t.assetId ?? null,
        locationId: t.locationId ?? null,
        projectId: t.projectId ?? null,
        technicianIds: t.technicianIds ?? [],
        primaryTechnicianId: t.primaryTechnicianId ?? null,
        tasks: (t.tasks ?? []).map((tk: any) => ({ ...tk, actualTime: tk.actualTime ?? 0, technicianId: tk.technicianId ?? null })),
        logs: t.logs ?? [],
        billableItems: (t.billableItems ?? []).map((b: any) => ({ ...b, technicianId: b.technicianId ?? null })),
        timeEntries: t.timeEntries ?? [],
      }));
      // Migrate projects
      parsed.projects = parsed.projects ?? defaultData.projects;
      // Migrate agreements
      parsed.agreements = parsed.agreements ?? [];
      // Migrate technicians
      parsed.technicians = parsed.technicians ?? defaultData.technicians;
      // Migrate ticket templates & scheduled tickets
      parsed.ticketTemplates = parsed.ticketTemplates ?? defaultData.ticketTemplates;
      parsed.scheduledTickets = (parsed.scheduledTickets ?? defaultData.scheduledTickets).map((s: any) => ({
        ...s,
        technicianIds: s.technicianIds ?? [],
        primaryTechnicianId: s.primaryTechnicianId ?? null,
        lastRunDate: s.lastRunDate ?? null,
        locationId: s.locationId ?? null,
      }));

      // Migrate customers to have locations
      parsed.customers = parsed.customers.map((c: any) => ({
        ...c,
        locations: c.locations ?? (c.address ? [{ id: crypto.randomUUID(), name: "Primary", address: c.address, isPrimary: true }] : []),
      }));
      return parsed;
    }
  } catch {}
  return defaultData;
}

function saveData(data: StoreData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useStore() {
  const [data, setData] = useState<StoreData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addCustomer = useCallback((c: Omit<Customer, "id" | "createdAt" | "locations"> & { locations?: CustomerLocation[] }) => {
    const id = crypto.randomUUID();
    const locations = c.locations && c.locations.length > 0
      ? c.locations
      : c.address ? [{ id: crypto.randomUUID(), name: "Primary", address: c.address, isPrimary: true }] : [];
    setData(prev => ({
      ...prev,
      customers: [...prev.customers, { ...c, id, locations, createdAt: new Date().toISOString().split("T")[0] }],
    }));
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => {
        if (c.id !== id) return c;
        const updated = { ...c, ...updates };
        // Keep address synced with primary location
        if (updates.locations) {
          const primary = updates.locations.find(l => l.isPrimary);
          if (primary) updated.address = primary.address;
        }
        return updated;
      }),
    }));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== id),
      assets: prev.assets.map(a => a.assignedTo === id ? {
        ...a, assignedTo: null, status: "available" as AssetStatus,
        history: [...a.history, { id: crypto.randomUUID(), date: new Date().toISOString().split("T")[0], type: "unassigned" as DeploymentEventType, customerId: null, previousCustomerId: id, notes: "Customer deleted" }],
      } : a),
    }));
  }, []);

  const addCustomerLocation = useCallback((customerId: string, location: Omit<CustomerLocation, "id">) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => {
        if (c.id !== customerId) return c;
        const newLoc: CustomerLocation = { ...location, id: crypto.randomUUID() };
        let locations = [...c.locations, newLoc];
        if (newLoc.isPrimary) {
          locations = locations.map(l => l.id === newLoc.id ? l : { ...l, isPrimary: false });
        }
        const primary = locations.find(l => l.isPrimary);
        return { ...c, locations, address: primary?.address ?? c.address };
      }),
    }));
  }, []);

  const updateCustomerLocation = useCallback((customerId: string, locationId: string, updates: Partial<CustomerLocation>) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => {
        if (c.id !== customerId) return c;
        let locations = c.locations.map(l => l.id === locationId ? { ...l, ...updates } : l);
        if (updates.isPrimary) {
          locations = locations.map(l => l.id === locationId ? l : { ...l, isPrimary: false });
        }
        const primary = locations.find(l => l.isPrimary);
        return { ...c, locations, address: primary?.address ?? c.address };
      }),
    }));
  }, []);

  const deleteCustomerLocation = useCallback((customerId: string, locationId: string) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => {
        if (c.id !== customerId) return c;
        const locations = c.locations.filter(l => l.id !== locationId);
        // If we deleted the primary, make the first one primary
        if (locations.length > 0 && !locations.some(l => l.isPrimary)) {
          locations[0].isPrimary = true;
        }
        const primary = locations.find(l => l.isPrimary);
        return { ...c, locations, address: primary?.address ?? "" };
      }),
    }));
  }, []);

  const addAsset = useCallback((a: Omit<Asset, "id" | "createdAt" | "decommissionedAt" | "history">) => {
    const now = new Date().toISOString().split("T")[0];
    const id = crypto.randomUUID();
    const history: DeploymentEvent[] = [
      { id: crypto.randomUUID(), date: now, type: "created", customerId: null, previousCustomerId: null, notes: "Added to inventory" },
    ];
    if (a.assignedTo) {
      history.push({ id: crypto.randomUUID(), date: now, type: "assigned", customerId: a.assignedTo, previousCustomerId: null, notes: "Initial assignment" });
    }
    setData(prev => ({
      ...prev,
      assets: [...prev.assets, { ...a, id, createdAt: now, decommissionedAt: null, history }],
    }));
  }, []);

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setData(prev => ({
      ...prev,
      assets: prev.assets.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  }, []);

  const assignAsset = useCallback((assetId: string, customerId: string | null, locationId: string | null = null) => {
    const now = new Date().toISOString().split("T")[0];
    setData(prev => ({
      ...prev,
      assets: prev.assets.map(a => {
        if (a.id !== assetId) return a;
        const previousCustomerId = a.assignedTo;
        let eventType: DeploymentEventType;
        let notes: string;
        if (!customerId) {
          eventType = "unassigned";
          notes = "Returned to inventory";
        } else if (previousCustomerId) {
          eventType = "reassigned";
          notes = "Reassigned to new customer";
        } else {
          eventType = "assigned";
          notes = "Assigned to customer";
        }
        return {
          ...a,
          assignedTo: customerId,
          locationId: customerId ? locationId : null,
          status: customerId ? "assigned" as AssetStatus : "available" as AssetStatus,
          history: [...a.history, { id: crypto.randomUUID(), date: now, type: eventType, customerId, previousCustomerId, notes }],
        };
      }),
    }));
  }, []);

  const decommissionAsset = useCallback((assetId: string) => {
    const now = new Date().toISOString().split("T")[0];
    setData(prev => ({
      ...prev,
      assets: prev.assets.map(a =>
        a.id === assetId
          ? {
            ...a,
            status: "decommissioned" as AssetStatus,
            assignedTo: null,
            decommissionedAt: now,
            history: [...a.history, { id: crypto.randomUUID(), date: now, type: "decommissioned" as DeploymentEventType, customerId: null, previousCustomerId: a.assignedTo, notes: "Asset decommissioned" }],
          }
          : a
      ),
    }));
  }, []);

  const addTicket = useCallback((t: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "tasks" | "logs" | "billableItems" | "timeEntries">) => {
    const now = new Date().toISOString().split("T")[0];
    setData(prev => ({
      ...prev,
      tickets: [...prev.tickets, { ...t, id: crypto.randomUUID(), createdAt: now, updatedAt: now, tasks: [], logs: [], billableItems: [], timeEntries: [] }],
    }));
  }, []);

  const updateTicket = useCallback((id: string, updates: Partial<Ticket>) => {
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString().split("T")[0] } : t),
    }));
  }, []);

  const addTicketLog = useCallback((ticketId: string, entry: Omit<TicketLogEntry, "id" | "date">) => {
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? {
        ...t, updatedAt: new Date().toISOString().split("T")[0],
        logs: [...t.logs, { ...entry, id: crypto.randomUUID(), date: new Date().toISOString() }],
      } : t),
    }));
  }, []);

  const addBillableItem = useCallback((ticketId: string, item: Omit<BillableItem, "id">) => {
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? {
        ...t, updatedAt: new Date().toISOString().split("T")[0],
        billableItems: [...t.billableItems, { ...item, id: crypto.randomUUID() }],
      } : t),
    }));
  }, []);

  const updateBillableItem = useCallback((ticketId: string, itemId: string, patch: Partial<Omit<BillableItem, "id">>) => {
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? {
        ...t, updatedAt: new Date().toISOString().split("T")[0],
        billableItems: t.billableItems.map(b => b.id === itemId ? { ...b, ...patch } : b),
      } : t),
    }));
  }, []);

  const deleteBillableItem = useCallback((ticketId: string, itemId: string) => {
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? {
        ...t, updatedAt: new Date().toISOString().split("T")[0],
        billableItems: t.billableItems.filter(b => b.id !== itemId),
      } : t),
    }));
  }, []);

  const addTicketTask = useCallback((ticketId: string, task: Omit<TicketTask, "id">) => {
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? {
        ...t, updatedAt: new Date().toISOString().split("T")[0],
        tasks: [...t.tasks, { ...task, id: crypto.randomUUID() }],
      } : t),
    }));
  }, []);

  const toggleTicketTask = useCallback((ticketId: string, taskId: string) => {
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? {
        ...t, updatedAt: new Date().toISOString().split("T")[0],
        tasks: t.tasks.map(tk => tk.id === taskId ? { ...tk, completed: !tk.completed } : tk),
      } : t),
    }));
  }, []);

  const updateTicketTask = useCallback((ticketId: string, taskId: string, patch: Partial<Omit<TicketTask, "id">>) => {
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? {
        ...t, updatedAt: new Date().toISOString().split("T")[0],
        tasks: t.tasks.map(tk => tk.id === taskId ? { ...tk, ...patch } : tk),
      } : t),
    }));
  }, []);

  const deleteTicketTask = useCallback((ticketId: string, taskId: string) => {
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? {
        ...t, updatedAt: new Date().toISOString().split("T")[0],
        tasks: t.tasks.filter(tk => tk.id !== taskId),
      } : t),
    }));
  }, []);

  const addTimeEntry = useCallback((ticketId: string, entry: Omit<TimeEntry, "id">) => {
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? {
        ...t, updatedAt: new Date().toISOString().split("T")[0],
        timeEntries: [...t.timeEntries, { ...entry, id: crypto.randomUUID() }],
      } : t),
    }));
  }, []);

  const addAgreement = useCallback((a: Omit<ServiceAgreement, "id" | "number" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString().split("T")[0];
    setData(prev => {
      const num = prev.agreements.length + 1;
      return {
        ...prev,
        agreements: [...prev.agreements, { ...a, id: crypto.randomUUID(), number: `SA-${String(num).padStart(3, "0")}`, createdAt: now, updatedAt: now }],
      };
    });
  }, []);

  const updateAgreement = useCallback((id: string, updates: Partial<ServiceAgreement>) => {
    setData(prev => ({
      ...prev,
      agreements: prev.agreements.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString().split("T")[0] } : a),
    }));
  }, []);

  const deleteAgreement = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      agreements: prev.agreements.filter(a => a.id !== id),
    }));
  }, []);

  const addTechnician = useCallback((t: Omit<Technician, "id" | "createdAt">) => {
    setData(prev => ({
      ...prev,
      technicians: [...prev.technicians, { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString().split("T")[0] }],
    }));
  }, []);

  const updateTechnician = useCallback((id: string, updates: Partial<Technician>) => {
    setData(prev => ({
      ...prev,
      technicians: prev.technicians.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  }, []);

  const deleteTechnician = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      technicians: prev.technicians.filter(t => t.id !== id),
      projects: prev.projects.map(p => p.managerId === id ? { ...p, managerId: null } : p),
      tickets: prev.tickets.map(t => ({
        ...t,
        technicianIds: t.technicianIds.filter(tid => tid !== id),
        primaryTechnicianId: t.primaryTechnicianId === id ? null : t.primaryTechnicianId,
        tasks: t.tasks.map(tk => tk.technicianId === id ? { ...tk, technicianId: null } : tk),
      })),
    }));
  }, []);

  const addProject = useCallback((p: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString().split("T")[0];
    setData(prev => ({
      ...prev,
      projects: [...prev.projects, { ...p, id: crypto.randomUUID(), createdAt: now, updatedAt: now }],
    }));
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString().split("T")[0] } : p),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
      tickets: prev.tickets.map(t => t.projectId === id ? { ...t, projectId: null } : t),
    }));
  }, []);

  const addTicketTemplate = useCallback((t: Omit<TicketTemplate, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString().split("T")[0];
    setData(prev => ({
      ...prev,
      ticketTemplates: [...prev.ticketTemplates, { ...t, id: crypto.randomUUID(), createdAt: now, updatedAt: now }],
    }));
  }, []);

  const updateTicketTemplate = useCallback((id: string, updates: Partial<TicketTemplate>) => {
    setData(prev => ({
      ...prev,
      ticketTemplates: prev.ticketTemplates.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString().split("T")[0] } : t),
    }));
  }, []);

  const deleteTicketTemplate = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      ticketTemplates: prev.ticketTemplates.filter(t => t.id !== id),
      scheduledTickets: prev.scheduledTickets.map(s => s.templateId === id ? { ...s, templateId: null } : s),
    }));
  }, []);

  const addScheduledTicket = useCallback((s: Omit<ScheduledTicket, "id" | "createdAt" | "lastRunDate">) => {
    setData(prev => ({
      ...prev,
      scheduledTickets: [...prev.scheduledTickets, { ...s, id: crypto.randomUUID(), lastRunDate: null, createdAt: new Date().toISOString().split("T")[0] }],
    }));
  }, []);

  const updateScheduledTicket = useCallback((id: string, updates: Partial<ScheduledTicket>) => {
    setData(prev => ({
      ...prev,
      scheduledTickets: prev.scheduledTickets.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const deleteScheduledTicket = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      scheduledTickets: prev.scheduledTickets.filter(s => s.id !== id),
    }));
  }, []);

  /** Creates a ticket from a template. Returns nothing; ticket appears in the list. */
  const createTicketFromTemplate = useCallback((templateId: string, overrides: {
    customerId: string; locationId?: string | null; projectId?: string | null;
    technicianIds?: string[]; primaryTechnicianId?: string | null; titleSuffix?: string;
  }) => {
    const now = new Date().toISOString().split("T")[0];
    setData(prev => {
      const tpl = prev.ticketTemplates.find(t => t.id === templateId);
      if (!tpl) return prev;
      const ticket: Ticket = {
        id: crypto.randomUUID(),
        title: overrides.titleSuffix ? `${tpl.title} — ${overrides.titleSuffix}` : tpl.title,
        description: tpl.description,
        category: "service",
        customerId: overrides.customerId,
        locationId: overrides.locationId ?? null,
        assetId: null,
        projectId: overrides.projectId ?? null,
        priority: tpl.priority,
        status: "open",
        technicianIds: overrides.technicianIds ?? [],
        primaryTechnicianId: overrides.primaryTechnicianId ?? null,
        createdAt: now,
        updatedAt: now,
        tasks: tpl.tasks.map(t => ({ id: crypto.randomUUID(), name: t.name, time: t.time, actualTime: 0, completed: false, technicianId: null })),
        logs: [],
        billableItems: [],
        timeEntries: [],
      };
      return { ...prev, tickets: [...prev.tickets, ticket] };
    });
  }, []);

  /** Generates the ticket for a schedule now and advances its next run date. */
  const runScheduledTicket = useCallback((scheduleId: string) => {
    const now = new Date().toISOString().split("T")[0];
    setData(prev => {
      const sch = prev.scheduledTickets.find(s => s.id === scheduleId);
      if (!sch) return prev;
      const tpl = sch.templateId ? prev.ticketTemplates.find(t => t.id === sch.templateId) : null;
      const ticket: Ticket = {
        id: crypto.randomUUID(),
        title: tpl ? `${tpl.title} — ${sch.nextRunDate}` : `${sch.name} — ${sch.nextRunDate}`,
        description: tpl?.description ?? "",
        category: "service",
        customerId: sch.customerId,
        locationId: sch.locationId,
        assetId: null,
        projectId: null,
        priority: tpl?.priority ?? "medium",
        status: "open",
        technicianIds: sch.technicianIds,
        primaryTechnicianId: sch.primaryTechnicianId,
        createdAt: now,
        updatedAt: now,
        tasks: (tpl?.tasks ?? []).map(t => ({ id: crypto.randomUUID(), name: t.name, time: t.time, actualTime: 0, completed: false, technicianId: null })),
        logs: [],
        billableItems: [],
        timeEntries: [],
      };
      return {
        ...prev,
        tickets: [...prev.tickets, ticket],
        scheduledTickets: prev.scheduledTickets.map(s => s.id === scheduleId
          ? { ...s, lastRunDate: now, nextRunDate: advanceDate(s.nextRunDate, s.frequency) }
          : s),
      };
    });
  }, []);

  return {
    ...data,
    addCustomer, updateCustomer, deleteCustomer,
    addCustomerLocation, updateCustomerLocation, deleteCustomerLocation,
    addAsset, updateAsset, assignAsset, decommissionAsset,
    addTicket, updateTicket,
    addTicketLog, addBillableItem, updateBillableItem, deleteBillableItem, addTimeEntry,
    addTicketTask, toggleTicketTask, updateTicketTask, deleteTicketTask,
    addAgreement, updateAgreement, deleteAgreement,
    addTechnician, updateTechnician, deleteTechnician,
    addProject, updateProject, deleteProject,
    addTicketTemplate, updateTicketTemplate, deleteTicketTemplate,
    addScheduledTicket, updateScheduledTicket, deleteScheduledTicket,
    createTicketFromTemplate, runScheduledTicket,
  };

}
