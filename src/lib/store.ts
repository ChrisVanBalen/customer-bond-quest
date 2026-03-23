import { useState, useEffect, useCallback } from "react";

// Types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
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
  notes: string;
  createdAt: string;
  decommissionedAt: string | null;
  history: DeploymentEvent[];
}

export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

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
}

export interface TimeEntry {
  id: string;
  date: string;
  technician: string;
  hours: number;
  description: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  customerId: string;
  assetId: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  logs: TicketLogEntry[];
  billableItems: BillableItem[];
  timeEntries: TimeEntry[];
}

interface StoreData {
  customers: Customer[];
  assets: Asset[];
  tickets: Ticket[];
}

const STORAGE_KEY = "crm-psa-data";

const defaultData: StoreData = {
  customers: [
    { id: "c1", name: "Meridian Health Systems", email: "contact@meridianhs.com", phone: "(555) 234-5678", company: "Meridian Health Systems", address: "1200 Oak Valley Dr, Suite 300", notes: "Enterprise client, 3-year contract", createdAt: "2024-11-15" },
    { id: "c2", name: "Cascade Engineering", email: "ops@cascadeeng.com", phone: "(555) 876-5432", company: "Cascade Engineering", address: "890 Industrial Pkwy", notes: "Manufacturing sector", createdAt: "2024-12-01" },
    { id: "c3", name: "Pinebrook Academy", email: "it@pinebrookacad.edu", phone: "(555) 345-6789", company: "Pinebrook Academy", address: "456 Campus Blvd", notes: "Education sector, 150 endpoints", createdAt: "2025-01-10" },
  ],
  assets: [
    {
      id: "a1", tag: "AST-001", name: "Dell OptiPlex 7090", type: "Desktop", serialNumber: "DL-7090-XK4521", status: "assigned", assignedTo: "c1", notes: "Front desk workstation", createdAt: "2024-11-20", decommissionedAt: null,
      history: [
        { id: "h1", date: "2024-11-20", type: "created", customerId: null, previousCustomerId: null, notes: "Added to inventory" },
        { id: "h2", date: "2024-11-22", type: "assigned", customerId: "c1", previousCustomerId: null, notes: "Deployed to front desk" },
      ],
    },
    {
      id: "a2", tag: "AST-002", name: "Cisco Meraki MR46", type: "Network", serialNumber: "MR46-Q9X832", status: "assigned", assignedTo: "c1", notes: "Main lobby AP", createdAt: "2024-11-20", decommissionedAt: null,
      history: [
        { id: "h3", date: "2024-11-20", type: "created", customerId: null, previousCustomerId: null, notes: "Added to inventory" },
        { id: "h4", date: "2024-12-01", type: "assigned", customerId: "c3", previousCustomerId: null, notes: "Initial deployment to Pinebrook" },
        { id: "h5", date: "2025-01-15", type: "reassigned", customerId: "c1", previousCustomerId: "c3", notes: "Moved to Meridian lobby after Pinebrook upgrade" },
      ],
    },
    {
      id: "a3", tag: "AST-003", name: "HP LaserJet Pro M404", type: "Printer", serialNumber: "HP-M404-TN7291", status: "available", assignedTo: null, notes: "Spare inventory", createdAt: "2025-01-05", decommissionedAt: null,
      history: [
        { id: "h6", date: "2025-01-05", type: "created", customerId: null, previousCustomerId: null, notes: "Added to inventory" },
      ],
    },
    {
      id: "a4", tag: "AST-004", name: "Lenovo ThinkPad T14", type: "Laptop", serialNumber: "LN-T14-PK6183", status: "assigned", assignedTo: "c2", notes: "Engineering team lead", createdAt: "2025-01-12", decommissionedAt: null,
      history: [
        { id: "h7", date: "2025-01-12", type: "created", customerId: null, previousCustomerId: null, notes: "Added to inventory" },
        { id: "h8", date: "2025-01-14", type: "assigned", customerId: "c2", previousCustomerId: null, notes: "Issued to engineering team lead" },
      ],
    },
    {
      id: "a5", tag: "AST-005", name: "APC UPS 1500VA", type: "Power", serialNumber: "APC-1500-ZM4920", status: "decommissioned", assignedTo: null, notes: "Battery failure, replaced", createdAt: "2024-06-15", decommissionedAt: "2025-02-01",
      history: [
        { id: "h9", date: "2024-06-15", type: "created", customerId: null, previousCustomerId: null, notes: "Added to inventory" },
        { id: "h10", date: "2024-06-20", type: "assigned", customerId: "c1", previousCustomerId: null, notes: "Installed in server room" },
        { id: "h11", date: "2025-02-01", type: "decommissioned", customerId: null, previousCustomerId: "c1", notes: "Battery failure, replaced with newer model" },
      ],
    },
  ],
  tickets: [
    { id: "t1", title: "Email server not syncing", description: "Outlook clients unable to sync with Exchange server since this morning.", customerId: "c1", assetId: "a1", priority: "high", status: "in_progress", createdAt: "2025-03-20", updatedAt: "2025-03-21" },
    { id: "t2", title: "New workstation setup", description: "Set up 3 new workstations for engineering hires starting next week.", customerId: "c2", assetId: null, priority: "medium", status: "open", createdAt: "2025-03-19", updatedAt: "2025-03-19" },
    { id: "t3", title: "WiFi coverage gap in Building B", description: "Students reporting weak signal in second floor classrooms.", customerId: "c3", assetId: "a2", priority: "medium", status: "open", createdAt: "2025-03-18", updatedAt: "2025-03-18" },
  ],
};

function loadData(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate assets without history
      parsed.assets = parsed.assets.map((a: any) => ({
        ...a,
        history: a.history ?? [{ id: crypto.randomUUID(), date: a.createdAt, type: "created", customerId: null, previousCustomerId: null, notes: "Added to inventory" }],
      }));
      // Migrate tickets
      parsed.tickets = parsed.tickets.map((t: any) => ({
        ...t,
        assetId: t.assetId ?? null,
        logs: t.logs ?? [],
        billableItems: t.billableItems ?? [],
        timeEntries: t.timeEntries ?? [],
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

  const addCustomer = useCallback((c: Omit<Customer, "id" | "createdAt">) => {
    setData(prev => ({
      ...prev,
      customers: [...prev.customers, { ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString().split("T")[0] }],
    }));
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === id ? { ...c, ...updates } : c),
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

  const assignAsset = useCallback((assetId: string, customerId: string | null) => {
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

  const addTicket = useCallback((t: Omit<Ticket, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString().split("T")[0];
    setData(prev => ({
      ...prev,
      tickets: [...prev.tickets, { ...t, id: crypto.randomUUID(), createdAt: now, updatedAt: now }],
    }));
  }, []);

  const updateTicket = useCallback((id: string, updates: Partial<Ticket>) => {
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString().split("T")[0] } : t),
    }));
  }, []);

  return {
    ...data,
    addCustomer, updateCustomer, deleteCustomer,
    addAsset, updateAsset, assignAsset, decommissionAsset,
    addTicket, updateTicket,
  };
}
