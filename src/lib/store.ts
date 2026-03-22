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

export interface Asset {
  id: string;
  tag: string;
  name: string;
  type: string;
  serialNumber: string;
  status: AssetStatus;
  assignedTo: string | null; // customer id
  notes: string;
  createdAt: string;
  decommissionedAt: string | null;
}

export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  customerId: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
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
    { id: "a1", tag: "AST-001", name: "Dell OptiPlex 7090", type: "Desktop", serialNumber: "DL-7090-XK4521", status: "assigned", assignedTo: "c1", notes: "Front desk workstation", createdAt: "2024-11-20", decommissionedAt: null },
    { id: "a2", tag: "AST-002", name: "Cisco Meraki MR46", type: "Network", serialNumber: "MR46-Q9X832", status: "assigned", assignedTo: "c1", notes: "Main lobby AP", createdAt: "2024-11-20", decommissionedAt: null },
    { id: "a3", tag: "AST-003", name: "HP LaserJet Pro M404", type: "Printer", serialNumber: "HP-M404-TN7291", status: "available", assignedTo: null, notes: "Spare inventory", createdAt: "2025-01-05", decommissionedAt: null },
    { id: "a4", tag: "AST-004", name: "Lenovo ThinkPad T14", type: "Laptop", serialNumber: "LN-T14-PK6183", status: "assigned", assignedTo: "c2", notes: "Engineering team lead", createdAt: "2025-01-12", decommissionedAt: null },
    { id: "a5", tag: "AST-005", name: "APC UPS 1500VA", type: "Power", serialNumber: "APC-1500-ZM4920", status: "decommissioned", assignedTo: null, notes: "Battery failure, replaced", createdAt: "2024-06-15", decommissionedAt: "2025-02-01" },
  ],
  tickets: [
    { id: "t1", title: "Email server not syncing", description: "Outlook clients unable to sync with Exchange server since this morning.", customerId: "c1", priority: "high", status: "in_progress", createdAt: "2025-03-20", updatedAt: "2025-03-21" },
    { id: "t2", title: "New workstation setup", description: "Set up 3 new workstations for engineering hires starting next week.", customerId: "c2", priority: "medium", status: "open", createdAt: "2025-03-19", updatedAt: "2025-03-19" },
    { id: "t3", title: "WiFi coverage gap in Building B", description: "Students reporting weak signal in second floor classrooms.", customerId: "c3", priority: "medium", status: "open", createdAt: "2025-03-18", updatedAt: "2025-03-18" },
  ],
};

function loadData(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
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
      assets: prev.assets.map(a => a.assignedTo === id ? { ...a, assignedTo: null, status: "available" as AssetStatus } : a),
    }));
  }, []);

  const addAsset = useCallback((a: Omit<Asset, "id" | "createdAt" | "decommissionedAt">) => {
    setData(prev => ({
      ...prev,
      assets: [...prev.assets, { ...a, id: crypto.randomUUID(), createdAt: new Date().toISOString().split("T")[0], decommissionedAt: null }],
    }));
  }, []);

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setData(prev => ({
      ...prev,
      assets: prev.assets.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  }, []);

  const assignAsset = useCallback((assetId: string, customerId: string | null) => {
    setData(prev => ({
      ...prev,
      assets: prev.assets.map(a =>
        a.id === assetId
          ? { ...a, assignedTo: customerId, status: customerId ? "assigned" as AssetStatus : "available" as AssetStatus }
          : a
      ),
    }));
  }, []);

  const decommissionAsset = useCallback((assetId: string) => {
    setData(prev => ({
      ...prev,
      assets: prev.assets.map(a =>
        a.id === assetId
          ? { ...a, status: "decommissioned" as AssetStatus, assignedTo: null, decommissionedAt: new Date().toISOString().split("T")[0] }
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
