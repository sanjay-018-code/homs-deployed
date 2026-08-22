import React, { useState, useEffect } from "react";
import axios from "axios";
import { LogOut, RefreshCw, Users, Clipboard, History, Undo, Check, ShieldAlert, Edit, Trash2, UserPlus, Search, ChevronRight, CornerDownRight, Database, Download, Activity } from "lucide-react";
import { getErrorMessage } from "../utils/errorUtils";

const DEPARTMENTS = ["AI&ML", "AI&DS", "CSE", "ECE", "IT", "CS", "EEE", "CIVIL", "MECH"];
const DEPARTMENT_SCOPED_ROLES = ["student", "advisor", "hod", "department_admin"];
const DEPARTMENT_ADMIN_MANAGED_ROLES = ["student", "advisor", "hod"];

export default function AdminDashboard({ token, role, department, userName, onLogout, apiUrl }) {
  const isSuperAdmin = role === "super_admin" || role === "admin";
  const canManageUser = (user) => isSuperAdmin || (
    user.department === department && DEPARTMENT_ADMIN_MANAGED_ROLES.includes(user.role)
  );
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [outpasses, setOutpasses] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Editor states
  const [editingUser, setEditingUser] = useState(null);
  const [editingOutpass, setEditingOutpass] = useState(null);
  
  // History states
  const [viewingHistoryUser, setViewingHistoryUser] = useState(null);
  const [userOutpassHistory, setUserOutpassHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Creation states
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    roll_number: "",
    parent_email: "",
    department: department || "AI&ML",
    hostel_name: "",
    room_number: ""
  });

  const headers = { Authorization: `Bearer ${token}` };

  const handleDownloadReport = async () => {
    setError("");
    setMessage("");
    try {
      const response = await axios.get(`${apiUrl}/api/reports/excel/daily`, {
        headers,
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const today = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `outpass_activity_${today}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage("Gate Activity report downloaded successfully!");
    } catch (err) {
      console.error("Excel download failed:", err);
      setError("Failed to download daily Excel report. Make sure there are gate activities recorded.");
    }
  };

  const loadUsers = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/admin/users`, { headers });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOutpasses = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/admin/outpasses`, { headers });
      setOutpasses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/admin/audit-logs`, { headers });
      setAuditLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshData = () => {
    setError("");
    setMessage("");
    if (activeTab === "users") loadUsers();
    if (activeTab === "outpasses" || activeTab === "gate_logs") loadOutpasses();
    if (activeTab === "audit") loadAuditLogs();
  };

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = {
        name: editingUser.name,
        email: editingUser.email,
        roll_number: editingUser.roll_number || null,
        parent_email: editingUser.parent_email || null,
        enrollment_status: editingUser.enrollment_status,
        role: editingUser.role,
        department: editingUser.department || null,
        hostel_details: ["student", "warden"].includes(editingUser.role) && editingUser.hostel_details?.hostel_name
          ? {
              hostel_name: editingUser.hostel_details.hostel_name,
              room: editingUser.role === "student" ? (editingUser.hostel_details.room || "N/A") : "N/A",
              occupancy_status: editingUser.role === "warden" ? "Staff" : "Resident"
            }
          : null
      };
      if (editingUser.password) {
        payload.password = editingUser.password;
      }
      await axios.put(`${apiUrl}/api/admin/users/${editingUser.id}`, payload, { headers });
      setMessage("User updated successfully (Audit Log registered).");
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update user."));
    }
  };

  const handleUpdateOutpass = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = {
        destination: editingOutpass.destination,
        reason: editingOutpass.reason,
        status: editingOutpass.status,
      };
      await axios.put(`${apiUrl}/api/admin/outpasses/${editingOutpass.id}`, payload, { headers });
      setMessage("Outpass updated successfully (Audit Log registered).");
      setEditingOutpass(null);
      loadOutpasses();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update outpass."));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        roll_number: newUser.role === "student" ? newUser.roll_number : null,
        parent_email: newUser.role === "student" ? newUser.parent_email : null,
        department: DEPARTMENT_SCOPED_ROLES.includes(newUser.role) ? newUser.department : null,
        hostel_details: ["student", "warden"].includes(newUser.role) && newUser.hostel_name
          ? { hostel_name: newUser.hostel_name, room: newUser.role === "student" ? (newUser.room_number || "N/A") : "N/A", occupancy_status: newUser.role === "warden" ? "Staff" : "Resident" }
          : null
      };
      await axios.post(`${apiUrl}/api/admin/users`, payload, { headers });
      setMessage("User created successfully (Audit Log registered).");
      setCreatingUser(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "student",
        roll_number: "",
        parent_email: "",
        department: department || "AI&ML",
        hostel_name: "",
        room_number: ""
      });
      loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create user."));
    }
  };

  const handleDeleteUser = async (userId) => {
    setError("");
    setMessage("");
    if (!window.confirm("Are you sure you want to delete this user account? This action is tracked in the audit trail.")) {
      return;
    }
    try {
      await axios.delete(`${apiUrl}/api/admin/users/${userId}`, { headers });
      setMessage("User deleted successfully (Audit Log registered).");
      loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete user."));
    }
  };

  const handleDeleteOutpass = async (outpassId) => {
    setError("");
    setMessage("");
    if (!window.confirm("Are you sure you want to delete this outpass activity record? This action is tracked in the audit trail.")) {
      return;
    }
    try {
      await axios.delete(`${apiUrl}/api/admin/outpasses/${outpassId}`, { headers });
      setMessage("Outpass record deleted successfully (Audit Log registered).");
      loadOutpasses();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete outpass."));
    }
  };

  const handleViewHistory = async (user) => {
    setViewingHistoryUser(user);
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${apiUrl}/api/admin/users/${user.id}/outpasses`, { headers });
      setUserOutpassHistory(res.data);
    } catch (err) {
      console.error("Failed to load user outpass history", err);
      setUserOutpassHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRollback = async (logId) => {
    setError("");
    setMessage("");
    if (!window.confirm("Are you sure you want to perform a transaction rollback for this action?")) {
      return;
    }
    try {
      await axios.post(`${apiUrl}/api/admin/rollback/${logId}`, {}, { headers });
      setMessage("Rollback executed successfully. Database values restored.");
      loadAuditLogs();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to execute rollback."));
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const query = searchQuery.toLowerCase();
    return (
      log.actor_name.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.affected_model.toLowerCase().includes(query) ||
      log.affected_id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen premium-bg p-6 font-sans relative">
      <div className="absolute inset-0 noise-overlay pointer-events-none z-0" />

      <div className="max-w-6xl mx-auto space-y-8 z-10 relative">
        {/* Top Navbar */}
        <header className="flex items-center justify-between py-4 border-b border-border-premium">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pure-white flex items-center justify-center border border-border-premium shadow-sm">
              <Database size={18} className="text-primary-text" />
            </div>
            <div>
              <span className="text-[10px] text-muted-text uppercase font-bold tracking-widest">Control Center</span>
              <h2 className="text-base font-bold text-primary-text leading-none">Admin Workspace</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userName && (
              <span className="hidden sm:inline text-xs font-semibold text-muted-text">
                Welcome, <span className="text-primary-text">{userName}</span>
              </span>
            )}
            <button
              onClick={onLogout}
              className="btn-premium btn-premium-secondary !h-10 text-xs gap-1.5"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Dashboard Title & Tabs Pill Container */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary-text">Admin Override Panel</h1>
            <p className="text-sm text-secondary-text">Global directory override layer, outpass control, and transactions auditing.</p>
          </div>

          {/* Vercel Pill Tab Controller */}
          <div className="bg-secondary-surface p-1 rounded-xl flex gap-1 border border-border-premium">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === "users"
                  ? "bg-pure-white text-primary-text shadow-sm"
                  : "text-muted-text hover:text-primary-text"
              }`}
            >
              <Users size={13} />
              <span>Users Database</span>
            </button>
            <button
              onClick={() => setActiveTab("outpasses")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === "outpasses"
                  ? "bg-pure-white text-primary-text shadow-sm"
                  : "text-muted-text hover:text-primary-text"
              }`}
            >
              <Clipboard size={13} />
              <span>Outpass Override</span>
            </button>
             <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === "audit"
                  ? "bg-pure-white text-primary-text shadow-sm"
                  : "text-muted-text hover:text-primary-text"
              }`}
            >
              <History size={13} />
              <span>Audit Trail</span>
            </button>
            <button
              onClick={() => setActiveTab("gate_logs")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === "gate_logs"
                  ? "bg-pure-white text-primary-text shadow-sm"
                  : "text-muted-text hover:text-primary-text"
              }`}
            >
              <Activity size={13} />
              <span>Gate Logs</span>
            </button>

          </div>
        </div>

        {/* Messaging Feedback Area */}
        {error && (
          <div className="p-4 bg-warm-accent border border-red-200/50 text-red-700 text-sm rounded-2xl animate-shake flex items-center gap-2">
            <ShieldAlert size={18} className="shrink-0 text-red-500" />
            <span className="font-semibold">{error}</span>
          </div>
        )}
        {message && (
          <div className="p-4 bg-success-surface border border-emerald-200/50 text-emerald-800 text-sm rounded-2xl flex items-center gap-2">
            <Check size={18} className="shrink-0 text-emerald-600" />
            <span className="font-semibold">{message}</span>
          </div>
        )}

        {/* Main Content card */}
        <main className="card-premium p-6 bg-pure-white min-h-[500px]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-border-premium">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-primary-text uppercase tracking-wider">
                {activeTab === "users" && "User Accounts Registry"}
                {activeTab === "outpasses" && "Global Outpass Database Override"}
                {activeTab === "audit" && "Transaction Logs (Immutable System Log)"}
                {activeTab === "gate_logs" && "Real-Time Gate Exit & Entry Logs"}
              </h3>
              {activeTab === "users" && (
                <button
                  onClick={() => setCreatingUser(true)}
                  className="btn-premium btn-premium-primary !h-8 !py-0 !px-3 text-xs gap-1"
                >
                  <UserPlus size={13} />
                  <span>New Account</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadReport}
                className="btn-premium btn-premium-secondary !h-9 px-3 text-xs gap-1.5 flex items-center"
                title="Download daily gate activity Excel report"
              >
                <Download size={14} />
                <span>Gate Report</span>
              </button>
              <button
                onClick={refreshData}
                className="btn-premium btn-premium-secondary !h-9 !w-9 !p-0"
                title="Refresh Registry"
              >
                <RefreshCw size={14} className="icon-hover-rotate" />
              </button>
            </div>
          </div>

          {/* User Manager Tab */}
          {activeTab === "users" && (
            <div className="overflow-x-auto rounded-2xl border border-border-premium bg-elevated-surface">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-premium bg-secondary-surface text-secondary-text uppercase font-bold">
                    <th className="p-4 text-[10px] tracking-wider">Name</th>
                    <th className="p-4 text-[10px] tracking-wider">Email Address</th>
                    <th className="p-4 text-[10px] tracking-wider">Role</th>
                    <th className="p-4 text-[10px] tracking-wider">Department</th>
                    <th className="p-4 text-[10px] tracking-wider">Verification Attributes</th>
                    <th className="p-4 text-[10px] tracking-wider">Enrollment</th>
                    <th className="p-4 text-[10px] tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-premium font-medium text-secondary-text bg-pure-white">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-cool-accent/30 transition-colors">
                      <td className="p-4 font-bold text-primary-text">{u.name}</td>
                      <td className="p-4 font-mono text-[11px] text-secondary-text">{u.email}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-cool-accent border-border-premium text-primary-text w-fit">
                            {u.role}
                          </span>
                          {u.role === "student" && (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border w-fit ${
                              u.live_status === "Outside Campus"
                                ? "bg-red-50 text-red-700 border-red-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                              {u.live_status} ({u.active_outpass_status})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-primary-text">
                        {u.department || <span className="text-muted-text italic">Global</span>}
                      </td>
                      <td className="p-4">
                        {u.role === "student" ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-primary-text">Roll: {u.roll_number}</div>
                            <div className="text-muted-text font-mono text-[10px]">Parent: {u.parent_email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-text italic">Not applicable</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          u.enrollment_status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                          {u.enrollment_status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {u.role === "student" && (
                            <button
                              onClick={() => handleViewHistory(u)}
                              className="btn-premium btn-premium-secondary !h-8 !w-8 !p-0"
                              title="Audit student activity history"
                            >
                              <History size={13} />
                            </button>
                          )}
                          {canManageUser(u) && <>
                            <button
                              onClick={() => setEditingUser(u)}
                              className="btn-premium btn-premium-secondary !h-8 !w-8 !p-0"
                              title="Edit user settings"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="btn-premium btn-premium-danger !h-8 !w-8 !p-0"
                              title="Delete user account"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Outpass Override Override Tab */}
          {activeTab === "outpasses" && (
            <div className="overflow-x-auto rounded-2xl border border-border-premium bg-elevated-surface">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-premium bg-secondary-surface text-secondary-text uppercase font-bold">
                    <th className="p-4 text-[10px] tracking-wider">Student Name</th>
                    <th className="p-4 text-[10px] tracking-wider">Destination</th>
                    <th className="p-4 text-[10px] tracking-wider">Validity Period</th>
                    <th className="p-4 text-[10px] tracking-wider">Status</th>
                    <th className="p-4 text-[10px] tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-premium font-medium text-secondary-text bg-pure-white">
                  {outpasses.map((op) => (
                    <tr key={op.id} className="hover:bg-cool-accent/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-primary-text">{op.student_name}</div>
                        <div className="text-muted-text font-semibold text-[10px]">Roll: {op.roll_number}</div>
                      </td>
                      <td className="p-4 font-semibold text-primary-text">{op.destination}</td>
                      <td className="p-4 font-mono text-[11px]">
                        {new Date(op.out_date).toLocaleDateString()} - {new Date(op.in_date).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-secondary-surface border-border-premium text-secondary-text">
                          {op.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {isSuperAdmin ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingOutpass(op)}
                              className="btn-premium btn-premium-secondary !h-8 !w-8 !p-0"
                              title="Override Outpass Status"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteOutpass(op.id)}
                              className="btn-premium btn-premium-danger !h-8 !w-8 !p-0"
                              title="Delete Outpass Record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : <span className="text-muted-text italic">View only</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit Logs tab */}
          {activeTab === "audit" && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" />
                <input
                  type="text"
                  placeholder="Search audit trail by actor, action, target..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-premium input-premium-icon"
                />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-border-premium bg-elevated-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-premium bg-secondary-surface text-secondary-text uppercase font-bold">
                      <th className="p-4 text-[10px] tracking-wider">Timestamp</th>
                      <th className="p-4 text-[10px] tracking-wider">Admin Name</th>
                      <th className="p-4 text-[10px] tracking-wider">Admin Action</th>
                      <th className="p-4 text-[10px] tracking-wider">Target Type & ID</th>
                      <th className="p-4 text-[10px] tracking-wider">State Changes</th>
                      <th className="p-4 text-[10px] tracking-wider text-right">Rollback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-premium font-medium text-secondary-text bg-pure-white font-mono text-[11px]">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-cool-accent/30 transition-colors">
                        <td className="p-4 text-[10px] text-muted-text">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-4 font-bold text-primary-text">{log.actor_name}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] uppercase border font-bold ${
                            log.action.includes("ROLLBACK")
                              ? "bg-amber-50 text-amber-700 border-amber-200/50"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-secondary-text">
                          {log.affected_model} <span className="text-[10px] text-muted-text">({log.affected_id.slice(-6)})</span>
                        </td>
                        <td className="p-4 text-[10px]">
                          <div className="max-h-24 overflow-y-auto space-y-1.5 leading-normal">
                            {Object.entries(log.changes).map(([field, vals]) => (
                              <div key={field} className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-primary-text">{field}:</span>
                                <span className="text-red-600 line-through bg-red-50 px-1 rounded">{String(vals[0])}</span>
                                <ChevronRight size={10} className="text-muted-text" />
                                <span className="text-emerald-700 bg-emerald-50 px-1 rounded font-semibold">{String(vals[1])}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          {isSuperAdmin && !log.action.includes("ROLLBACK") && (
                            <button
                              onClick={() => handleRollback(log.id)}
                              className="btn-premium btn-premium-secondary !h-8 !w-8 !p-0"
                              title="Rollback this database write transaction"
                            >
                              <Undo size={13} className="text-amber-600" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {activeTab === "gate_logs" && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-border-premium bg-elevated-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-premium bg-secondary-surface text-secondary-text uppercase font-bold">
                      <th className="p-4 text-[10px] tracking-wider">Student Name</th>
                      <th className="p-4 text-[10px] tracking-wider">Roll Number</th>
                      <th className="p-4 text-[10px] tracking-wider">Destination</th>
                      <th className="p-4 text-[10px] tracking-wider">Stated Reason</th>
                      <th className="p-4 text-[10px] tracking-wider">Gate OUT (Exit)</th>
                      <th className="p-4 text-[10px] tracking-wider">Gate IN (Entry)</th>
                      <th className="p-4 text-[10px] tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-premium font-medium text-secondary-text bg-pure-white">
                    {outpasses
                      .filter(op => op.exit_time || op.entry_time || op.status === "Student Left" || op.status === "Student Returned")
                      .map((op) => (
                        <tr key={op.id} className="hover:bg-cool-accent/30 transition-colors">
                          <td className="p-4 font-bold text-primary-text">{op.student_name}</td>
                          <td className="p-4 font-mono text-[11px] text-secondary-text">{op.roll_number}</td>
                          <td className="p-4 text-secondary-text">{op.destination}</td>
                          <td className="p-4 text-muted-text italic">"{op.reason}"</td>
                          <td className="p-4 font-mono text-secondary-text">
                            {op.exit_time ? new Date(op.exit_time).toLocaleString() : (
                              <span className="text-muted-text italic">Not Exited Yet</span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-secondary-text">
                            {op.entry_time ? new Date(op.entry_time).toLocaleString() : (
                              <span className="text-muted-text italic">Not Returned Yet</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                              op.status === "Student Left"
                                ? "bg-red-50 text-red-700 border-red-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                              {op.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    {outpasses.filter(op => op.exit_time || op.entry_time || op.status === "Student Left" || op.status === "Student Returned").length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-muted-text italic">
                          No active gate exit/entry movements recorded today.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* User Editor Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-primary-bg/70 backdrop-blur-md flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={handleUpdateUser}
            className="bg-pure-white border border-border-premium rounded-[24px] p-6 max-w-sm w-full shadow-2xl text-left my-auto max-h-[90vh] overflow-y-auto"
          >
            <h4 className="text-lg font-bold text-primary-text mb-4 flex items-center gap-2 pb-3 border-b border-border-premium">
              <Edit size={18} className="text-primary-text" />
              <span>Modify Account Data</span>
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="input-premium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Email</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="input-premium"
                />
              </div>

              {editingUser.role === "student" && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Roll Number</label>
                    <input
                      type="text"
                      value={editingUser.roll_number || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, roll_number: e.target.value })}
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Parent Email</label>
                    <input
                      type="email"
                      value={editingUser.parent_email || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, parent_email: e.target.value })}
                      className="input-premium"
                    />
                  </div>
                </>
              )}

              {["student", "warden"].includes(editingUser.role) && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">
                      {editingUser.role === "warden" ? "Hostel Assigned" : "Hostel Name"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. A-Block"
                      value={editingUser.hostel_details?.hostel_name || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          hostel_details: { ...editingUser.hostel_details, hostel_name: e.target.value }
                        })
                      }
                      className="input-premium"
                    />
                  </div>
                  {editingUser.role === "student" && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Room Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 101"
                        value={editingUser.hostel_details?.room || ""}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            hostel_details: { ...editingUser.hostel_details, room: e.target.value }
                          })
                        }
                        className="input-premium"
                      />
                    </div>
                  )}
                </>
              )}

              {DEPARTMENT_SCOPED_ROLES.includes(editingUser.role) && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Department</label>
                  <select
                    required
                    value={isSuperAdmin ? (editingUser.department || "") : department}
                    disabled={!isSuperAdmin}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="input-premium font-semibold text-xs disabled:opacity-70"
                  >
                    <option value="" disabled>Select department</option>
                    {DEPARTMENTS.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Enrollment Status</label>
                <select
                  value={editingUser.enrollment_status}
                  onChange={(e) => setEditingUser({ ...editingUser, enrollment_status: e.target.value })}
                  className="input-premium font-semibold text-xs"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">System Role</label>
                {isSuperAdmin ? (
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="input-premium font-semibold text-xs"
                  >
                    <option value="student">Student</option>
                    <option value="advisor">Adviser</option>
                    <option value="hod">HOD</option>
                    <option value="warden">Warden</option>
                    <option value="security">Security</option>
                    <option value="department_admin">Department Admin</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Legacy Super Admin</option>
                  </select>
                ) : (
                  <div className="input-premium text-xs font-semibold flex items-center">{editingUser.role}</div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Reset Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editingUser.password || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="input-premium text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border-premium">
              <button
                type="submit"
                className="flex-1 btn-premium btn-premium-primary text-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 btn-premium btn-premium-secondary text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Outpass Override Editor Modal */}
      {editingOutpass && (
        <div className="fixed inset-0 bg-primary-bg/70 backdrop-blur-md flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={handleUpdateOutpass}
            className="bg-pure-white border border-border-premium rounded-[24px] p-6 max-w-sm w-full shadow-2xl text-left my-auto max-h-[90vh] overflow-y-auto"
          >
            <h4 className="text-lg font-bold text-primary-text mb-4 flex items-center gap-2 pb-3 border-b border-border-premium">
              <Edit size={18} className="text-primary-text" />
              <span>Override Pass Parameters</span>
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Destination</label>
                <input
                  type="text"
                  required
                  value={editingOutpass.destination}
                  onChange={(e) => setEditingOutpass({ ...editingOutpass, destination: e.target.value })}
                  className="input-premium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Reason</label>
                <textarea
                  required
                  value={editingOutpass.reason}
                  onChange={(e) => setEditingOutpass({ ...editingOutpass, reason: e.target.value })}
                  className="textarea-premium text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Override Status</label>
                <select
                  value={editingOutpass.status}
                  onChange={(e) => setEditingOutpass({ ...editingOutpass, status: e.target.value })}
                  className="input-premium font-semibold text-xs"
                >
                  <option value="Pending">Pending</option>
                  <option value="Advisor Approved">Advisor Approved</option>
                  <option value="HOD Approved">HOD Approved</option>
                  <option value="Approved">Approved</option>
                  <option value="Student Left">Student Left</option>
                  <option value="Student Returned">Student Returned</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border-premium">
              <button
                type="submit"
                className="flex-1 btn-premium btn-premium-primary text-xs"
              >
                Apply Override
              </button>
              <button
                type="button"
                onClick={() => setEditingOutpass(null)}
                className="flex-1 btn-premium btn-premium-secondary text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Creation Modal */}
      {creatingUser && (
        <div className="fixed inset-0 bg-primary-bg/70 backdrop-blur-md flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
          <form
            onSubmit={handleCreateUser}
            className="bg-pure-white border border-border-premium rounded-[24px] p-6 max-w-sm w-full shadow-2xl text-left my-auto max-h-[90vh] overflow-y-auto"
          >
            <h4 className="text-lg font-bold text-primary-text mb-4 flex items-center gap-2 pb-3 border-b border-border-premium">
              <UserPlus size={18} className="text-primary-text" />
              <span>Create Account Profile</span>
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="input-premium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@college.edu"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input-premium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input-premium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">System Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="input-premium font-semibold text-xs"
                >
                  {isSuperAdmin ? <>
                    <option value="student">Student</option>
                    <option value="advisor">Adviser</option>
                    <option value="hod">HOD</option>
                    <option value="warden">Warden</option>
                    <option value="security">Security</option>
                    <option value="department_admin">Department Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </> : DEPARTMENT_ADMIN_MANAGED_ROLES.map((userRole) => (
                    <option key={userRole} value={userRole}>
                      {userRole === "advisor" ? "Adviser" : userRole.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {DEPARTMENT_SCOPED_ROLES.includes(newUser.role) && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Department</label>
                  <select
                    required
                    value={isSuperAdmin ? newUser.department : department}
                    disabled={!isSuperAdmin}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="input-premium font-semibold text-xs disabled:opacity-70"
                  >
                    <option value="" disabled>Select department</option>
                    {DEPARTMENTS.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>
              )}

              {newUser.role === "student" && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Roll Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. STU123"
                      value={newUser.roll_number}
                      onChange={(e) => setNewUser({ ...newUser, roll_number: e.target.value })}
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Parent Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. parent@home.com"
                      value={newUser.parent_email}
                      onChange={(e) => setNewUser({ ...newUser, parent_email: e.target.value })}
                      className="input-premium"
                    />
                  </div>
                </>
              )}

              {["student", "warden"].includes(newUser.role) && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">
                      {newUser.role === "warden" ? "Hostel Assigned" : "Hostel Name"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. A-Block"
                      value={newUser.hostel_name}
                      onChange={(e) => setNewUser({ ...newUser, hostel_name: e.target.value })}
                      className="input-premium"
                    />
                  </div>
                  {newUser.role === "student" && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-secondary-text mb-1 ml-1 tracking-wide">Room Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 101"
                        value={newUser.room_number}
                        onChange={(e) => setNewUser({ ...newUser, room_number: e.target.value })}
                        className="input-premium"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border-premium">
              <button
                type="submit"
                className="flex-1 btn-premium btn-premium-primary text-xs"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setCreatingUser(false)}
                className="flex-1 btn-premium btn-premium-secondary text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Student History & Live Condition Modal */}
      {viewingHistoryUser && (
        <div className="fixed inset-0 bg-primary-bg/70 backdrop-blur-md flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-pure-white border border-border-premium rounded-[28px] p-6 max-w-2xl w-full shadow-2xl text-left flex flex-col max-h-[90vh]">
            <h4 className="text-lg font-bold text-primary-text mb-4 flex items-center gap-2 pb-3 border-b border-border-premium">
              <History size={20} className="text-primary-text" />
              <span>Outpass Audit & Live Campus Status</span>
            </h4>

            {/* Live Campus Card */}
            <div className="bg-secondary-surface p-5 rounded-2xl border border-border-premium mb-4">
              <div className="text-[10px] uppercase text-muted-text font-bold mb-2">Live Status Tracking</div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="text-base font-bold text-primary-text">{viewingHistoryUser.name}</div>
                  <div className="text-xs text-muted-text font-semibold">Roll Number: {viewingHistoryUser.roll_number}</div>
                  <div className="text-[11px] text-muted-text font-semibold">Parent Mail: {viewingHistoryUser.parent_email}</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[9px] text-muted-text uppercase font-bold">Campus Position</div>
                  <span className={`inline-flex px-3 py-1 mt-1 rounded-full text-xs font-bold border ${
                    viewingHistoryUser.live_status === "Outside Campus"
                      ? "bg-red-50 text-red-700 border-red-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-100"
                  }`}>
                    {viewingHistoryUser.live_status || "Inside Campus"}
                  </span>
                  <div className="text-[10px] text-muted-text font-semibold mt-1">
                    Active Pass: {viewingHistoryUser.active_outpass_status || "None"}
                  </div>
                </div>
              </div>
            </div>

            {/* Outpass List */}
            <div className="flex-1 overflow-y-auto mb-4 min-h-[200px] pr-1 space-y-3">
              <div className="text-[10px] uppercase text-muted-text font-bold mb-2">Clearance History & Workflow Logs ({userOutpassHistory.length})</div>
              {loadingHistory ? (
                <div className="text-center py-8 text-muted-text text-xs">Loading logs...</div>
              ) : userOutpassHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-text text-xs border border-dashed border-border-premium rounded-2xl">
                  No activity found for this student.
                </div>
              ) : (
                <div className="space-y-3">
                  {userOutpassHistory.map((op) => (
                    <div key={op.id} className="p-4 bg-secondary-surface/50 border border-border-premium rounded-2xl">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <div className="font-bold text-primary-text text-xs flex items-center gap-1">
                            <CornerDownRight size={12} className="text-muted-text" />
                            <span>To: {op.destination}</span>
                          </div>
                          <div className="text-xs text-secondary-text mt-1 pl-4">Reason: "{op.reason}"</div>
                          <div className="text-[10px] text-muted-text mt-1 pl-4 font-mono font-semibold">
                            Timeframe: {new Date(op.out_date).toLocaleString()} - {new Date(op.in_date).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            op.status === "Approved" || op.status === "Student Returned"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : op.status === "Rejected"
                              ? "bg-red-50 text-red-700 border-red-100"
                              : "bg-secondary-surface text-secondary-text border-border-premium"
                          }`}>
                            {op.status}
                          </span>
                        </div>
                      </div>

                      {/* Timeline logs */}
                      {op.history && op.history.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border-premium pl-4 space-y-1.5 text-[10px] text-secondary-text">
                          <div className="text-[9px] uppercase font-bold text-muted-text">Workflow logs:</div>
                          {op.history.map((log, idx) => (
                            <div key={idx} className="flex gap-1.5 items-center flex-wrap">
                              <span className="font-bold text-primary-text">[{log.status}]</span>
                              <span>by {log.updated_by}</span>
                              <span className="text-muted-text font-mono">({new Date(log.timestamp).toLocaleDateString()})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border-premium pt-4">
              <button
                type="button"
                onClick={() => setViewingHistoryUser(null)}
                className="w-full btn-premium btn-premium-secondary text-xs"
              >
                Close Audit Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
