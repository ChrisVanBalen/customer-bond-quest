import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Package,
  MapPin,
  Plus,
  MessageSquare,
  DollarSign,
  Clock,
  ListChecks,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
} from "lucide-react";

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { tickets, customers, assets, addTicketLog, addBillableItem, updateBillableItem, deleteBillableItem, addTimeEntry, addTicketTask, toggleTicketTask, updateTicketTask, deleteTicketTask } = useStore();

  const ticket = tickets.find(t => t.id === id);
  const customer = ticket ? customers.find(c => c.id === ticket.customerId) : null;
  const asset = ticket?.assetId ? assets.find(a => a.id === ticket.assetId) : null;
  const ticketLocation = ticket?.locationId && customer
    ? customer.locations?.find(l => l.id === ticket.locationId)
    : customer?.locations?.find(l => l.isPrimary);

  const [logDialog, setLogDialog] = useState(false);
  const [billableDialog, setBillableDialog] = useState(false);
  const [timeDialog, setTimeDialog] = useState(false);
  const [taskDialog, setTaskDialog] = useState(false);

  const [logForm, setLogForm] = useState({ author: "", message: "" });
  const [billableForm, setBillableForm] = useState({ date: new Date().toISOString().split("T")[0], description: "", quantity: 1, unitPrice: 0 });
  const [timeForm, setTimeForm] = useState({ date: new Date().toISOString().split("T")[0], technician: "", hours: 0, description: "" });
  const [taskForm, setTaskForm] = useState({ name: "", time: 0, actualTime: 0 });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingBillableId, setEditingBillableId] = useState<string | null>(null);

  if (!ticket) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-muted-foreground">Ticket not found.</p>
        <Link to="/tickets" className="text-primary hover:underline mt-2 inline-block">Back to Tickets</Link>
      </div>
    );
  }

  const handleAddLog = () => {
    if (!logForm.author.trim() || !logForm.message.trim()) return;
    addTicketLog(ticket.id, logForm);
    setLogForm({ author: "", message: "" });
    setLogDialog(false);
  };

  const handleSaveBillable = () => {
    if (!billableForm.description.trim()) return;
    if (editingBillableId) {
      updateBillableItem(ticket.id, editingBillableId, billableForm);
    } else {
      addBillableItem(ticket.id, billableForm);
    }
    setBillableForm({ date: new Date().toISOString().split("T")[0], description: "", quantity: 1, unitPrice: 0 });
    setEditingBillableId(null);
    setBillableDialog(false);
  };

  const openAddBillable = () => {
    setEditingBillableId(null);
    setBillableForm({ date: new Date().toISOString().split("T")[0], description: "", quantity: 1, unitPrice: 0 });
    setBillableDialog(true);
  };

  const openEditBillable = (item: { id: string; date: string; description: string; quantity: number; unitPrice: number }) => {
    setEditingBillableId(item.id);
    setBillableForm({ date: item.date, description: item.description, quantity: item.quantity, unitPrice: item.unitPrice });
    setBillableDialog(true);
  };

  const handleAddTime = () => {
    if (!timeForm.technician.trim() || timeForm.hours <= 0) return;
    addTimeEntry(ticket.id, timeForm);
    setTimeForm({ date: new Date().toISOString().split("T")[0], technician: "", hours: 0, description: "" });
    setTimeDialog(false);
  };

  const handleSaveTask = () => {
    if (!taskForm.name.trim() || taskForm.time <= 0) return;
    if (editingTaskId) {
      updateTicketTask(ticket.id, editingTaskId, { name: taskForm.name, time: taskForm.time, actualTime: taskForm.actualTime });
    } else {
      addTicketTask(ticket.id, { name: taskForm.name, time: taskForm.time, actualTime: taskForm.actualTime, completed: false });
    }
    setTaskForm({ name: "", time: 0, actualTime: 0 });
    setEditingTaskId(null);
    setTaskDialog(false);
  };

  const openAddTask = () => {
    setEditingTaskId(null);
    setTaskForm({ name: "", time: 0, actualTime: 0 });
    setTaskDialog(true);
  };

  const openEditTask = (task: { id: string; name: string; time: number; actualTime: number }) => {
    setEditingTaskId(task.id);
    setTaskForm({ name: task.name, time: task.time, actualTime: task.actualTime ?? 0 });
    setTaskDialog(true);
  };

  const totalBillable = ticket.billableItems.reduce((sum, b) => sum + b.quantity * b.unitPrice, 0);
  const totalHours = ticket.timeEntries.reduce((sum, t) => sum + t.hours, 0);
  const completedTaskTime = ticket.tasks.filter(t => t.completed).reduce((sum, t) => sum + (t.actualTime ?? 0), 0);
  const totalTaskTime = ticket.tasks.reduce((sum, t) => sum + t.time, 0);
  const totalActualTaskTime = ticket.tasks.reduce((sum, t) => sum + (t.actualTime ?? 0), 0);

  return (
    <div className="animate-fade-in">
      <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Tickets
      </Link>

      <PageHeader title={ticket.title} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Ticket Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-1"><StatusBadge status={ticket.status} /></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Priority</p>
                <div className="mt-1"><StatusBadge status={ticket.priority} /></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium text-foreground mt-1">{ticket.createdAt}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium text-foreground mt-1">{ticket.updatedAt}</p>
              </div>
            </div>
            {ticketLocation && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm text-foreground mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {ticketLocation.name} — {ticketLocation.address}
                  {ticketLocation.isPrimary && <span className="text-[10px] text-primary font-semibold">(Primary)</span>}
                </p>
              </div>
            )}
            {asset && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground">Related Asset</p>
                <Link to={`/assets/${asset.id}`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-1">
                  <Package className="h-3.5 w-3.5" /> {asset.tag} — {asset.name}
                </Link>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground leading-relaxed">{ticket.description || "No description provided."}</p>
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ListChecks className="h-4 w-4" /> Tasks
              </h2>
              <Button size="sm" variant="outline" onClick={openAddTask}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
              </Button>
            </div>
            {ticket.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {ticket.tasks.map(task => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleTicketTask(ticket.id, task.id)}
                        className="shrink-0"
                        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <span className={`text-sm flex-1 ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.name}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        <span className={task.actualTime > task.time ? "text-destructive font-medium" : "text-foreground"}>
                          {(task.actualTime ?? 0).toFixed(1)}
                        </span>
                        {" / "}{task.time.toFixed(1)} hrs
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditTask(task)} aria-label="Edit task">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteTicketTask(ticket.id, task.id)} aria-label="Delete task">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-4 mt-3 pt-3 border-t text-sm">
                  <p className="text-muted-foreground">
                    Completed: <span className="font-semibold text-foreground">{completedTaskTime.toFixed(1)} / {totalTaskTime.toFixed(1)} hrs</span>
                  </p>
                  <p className="text-muted-foreground">
                    Actual: <span className={`font-semibold ${totalActualTaskTime > totalTaskTime ? "text-destructive" : "text-foreground"}`}>{totalActualTaskTime.toFixed(1)}</span>
                    <span className="text-foreground"> / {totalTaskTime.toFixed(1)} hrs</span>
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Ticket Log
              </h2>
              <Button size="sm" variant="outline" onClick={() => setLogDialog(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Entry
              </Button>
            </div>
            {ticket.logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No log entries yet.</p>
            ) : (
              <div className="space-y-3">
                {ticket.logs.slice().reverse().map(log => (
                  <div key={log.id} className="border-l-2 border-primary/30 pl-4 py-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{log.author}</span>
                      <span>·</span>
                      <span>{new Date(log.date).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-foreground mt-0.5">{log.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time Entries */}
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4" /> Time Tracking
              </h2>
              <Button size="sm" variant="outline" onClick={() => setTimeDialog(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Log Time
              </Button>
            </div>
            {ticket.timeEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No time entries.</p>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium text-muted-foreground pb-2">Date</th>
                      <th className="text-left font-medium text-muted-foreground pb-2">Technician</th>
                      <th className="text-right font-medium text-muted-foreground pb-2">Hours</th>
                      <th className="text-left font-medium text-muted-foreground pb-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ticket.timeEntries.map(entry => (
                      <tr key={entry.id}>
                        <td className="py-2 text-muted-foreground">{entry.date}</td>
                        <td className="py-2 text-foreground">{entry.technician}</td>
                        <td className="py-2 text-right tabular-nums">{entry.hours.toFixed(1)}</td>
                        <td className="py-2 text-foreground">{entry.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end mt-3 pt-3 border-t">
                  <p className="text-sm font-semibold text-foreground">Total: {totalHours.toFixed(1)} hrs</p>
                </div>
              </>
            )}
          </div>

          {/* Billable Items */}
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Billable Items
              </h2>
              <Button size="sm" variant="outline" onClick={openAddBillable}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
              </Button>
            </div>
            {ticket.billableItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No billable items.</p>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium text-muted-foreground pb-2">Date</th>
                      <th className="text-left font-medium text-muted-foreground pb-2">Description</th>
                      <th className="text-right font-medium text-muted-foreground pb-2">Qty</th>
                      <th className="text-right font-medium text-muted-foreground pb-2">Price</th>
                      <th className="text-right font-medium text-muted-foreground pb-2">Total</th>
                      <th className="w-16 pb-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ticket.billableItems.map(item => (
                      <tr key={item.id} className="group">
                        <td className="py-2 text-muted-foreground">{item.date}</td>
                        <td className="py-2 text-foreground">{item.description}</td>
                        <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                        <td className="py-2 text-right tabular-nums">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-2 text-right tabular-nums font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditBillable(item)} aria-label="Edit item">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteBillableItem(ticket.id, item.id)} aria-label="Delete item">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end mt-3 pt-3 border-t">
                  <p className="text-sm font-semibold text-foreground">Total: ${totalBillable.toFixed(2)}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar - Customer Info */}
        <div className="space-y-6">
          {customer && (
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Customer</h2>
              <Link to={`/customers/${customer.id}`} className="text-lg font-semibold text-primary hover:underline flex items-center gap-2">
                <Building2 className="h-4 w-4" /> {customer.name}
              </Link>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {customer.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {customer.phone}
                </div>
                {customer.address && (
                  <p className="text-muted-foreground">{customer.address}</p>
                )}
              </div>
            </div>
          )}

          {/* Summary Card */}
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasks</span>
                <span className="font-medium text-foreground">{ticket.tasks.filter(t => t.completed).length}/{ticket.tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed Task Time</span>
                <span className="font-medium text-foreground">{completedTaskTime.toFixed(1)} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Log Entries</span>
                <span className="font-medium text-foreground">{ticket.logs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billable Items</span>
                <span className="font-medium text-foreground">{ticket.billableItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billable Total</span>
                <span className="font-medium text-foreground">${totalBillable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-muted-foreground">Hours Logged</span>
                <span className="font-medium text-foreground">{totalHours.toFixed(1)} hrs</span>
              </div>
            </div>
          </div>

          {/* Other Open Tickets */}
          {customer && (
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Other Open Tickets</h2>
              {(() => {
                const otherOpenTickets = tickets.filter(t => t.customerId === customer.id && t.id !== ticket.id && t.status !== "closed");
                if (otherOpenTickets.length === 0) return (
                  <p className="text-sm text-muted-foreground">No other open tickets.</p>
                );
                return (
                  <div className="space-y-3">
                    {otherOpenTickets.map(t => (
                      <Link key={t.id} to={`/tickets/${t.id}`} className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{t.title}</span>
                          <StatusBadge status={t.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t.priority} priority · Updated {t.updatedAt}</p>
                      </Link>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Log Dialog */}
      <Dialog open={logDialog} onOpenChange={setLogDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Log Entry</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Author</Label>
              <Input value={logForm.author} onChange={e => setLogForm(f => ({ ...f, author: e.target.value }))} placeholder="Your name" />
            </div>
            <div className="grid gap-1.5">
              <Label>Message</Label>
              <Textarea value={logForm.message} onChange={e => setLogForm(f => ({ ...f, message: e.target.value }))} rows={3} placeholder="What happened..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogDialog(false)}>Cancel</Button>
            <Button onClick={handleAddLog}>Add Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Billable Dialog */}
      <Dialog open={billableDialog} onOpenChange={setBillableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingBillableId ? "Edit Billable Item" : "Add Billable Item"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={billableForm.date} onChange={e => setBillableForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Input value={billableForm.description} onChange={e => setBillableForm(f => ({ ...f, description: e.target.value }))} placeholder="Item description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Quantity</Label>
                <Input type="number" min={1} value={billableForm.quantity} onChange={e => setBillableForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Unit Price ($)</Label>
                <Input type="number" min={0} step={0.01} value={billableForm.unitPrice} onChange={e => setBillableForm(f => ({ ...f, unitPrice: Number(e.target.value) }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillableDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveBillable}>{editingBillableId ? "Save Changes" : "Add Item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Entry Dialog */}
      <Dialog open={timeDialog} onOpenChange={setTimeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Log Time</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={timeForm.date} onChange={e => setTimeForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Technician</Label>
              <Input value={timeForm.technician} onChange={e => setTimeForm(f => ({ ...f, technician: e.target.value }))} placeholder="Technician name" />
            </div>
            <div className="grid gap-1.5">
              <Label>Hours</Label>
              <Input type="number" min={0.1} step={0.1} value={timeForm.hours} onChange={e => setTimeForm(f => ({ ...f, hours: Number(e.target.value) }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Textarea value={timeForm.description} onChange={e => setTimeForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Work performed" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTimeDialog(false)}>Cancel</Button>
            <Button onClick={handleAddTime}>Log Time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskDialog} onOpenChange={setTaskDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingTaskId ? "Edit Task" : "Add Task"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Task Name</Label>
              <Input value={taskForm.name} onChange={e => setTaskForm(f => ({ ...f, name: e.target.value }))} placeholder="Task description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Estimated (hours)</Label>
                <Input type="number" min={0} step={0.1} value={taskForm.time} onChange={e => setTaskForm(f => ({ ...f, time: Number(e.target.value) }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Actual (hours)</Label>
                <Input type="number" min={0} step={0.1} value={taskForm.actualTime} onChange={e => setTaskForm(f => ({ ...f, actualTime: Number(e.target.value) }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveTask}>{editingTaskId ? "Save Changes" : "Add Task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
