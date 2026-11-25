import React, { useState } from 'react';
import {
  AppUser,
  UserAccesses,
  Customer,
  Invoice,
  Product,
} from '../types';
import {
  createDefaultAccesses,
  DEFAULT_ADMIN_USER,
} from '../utils/userHelper';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Trash2,
  RotateCcw,
  Key,
  Mail,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  FileText,
  Boxes,
  Truck,
  Building2,
  Lock,
  Eye,
  EyeOff,
  Edit,
  AlertTriangle,
  AlertCircle,
  Check,
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: AppUser;
  users: AppUser[];
  onSaveUser: (user: AppUser) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  // Soft-deleted items
  deletedInvoices: Invoice[];
  deletedCustomers: Customer[];
  deletedProducts: Product[];
  onRestoreInvoice: (id: string) => Promise<void>;
  onPermanentDeleteInvoice: (id: string) => Promise<void>;
  onRestoreCustomer: (id: string) => Promise<void>;
  onPermanentDeleteCustomer: (id: string) => Promise<void>;
  onRestoreProduct: (id: string) => Promise<void>;
  onPermanentDeleteProduct: (id: string) => Promise<void>;
}

export function AdminPanel({
  currentUser,
  users,
  onSaveUser,
  onDeleteUser,
  deletedInvoices,
  deletedCustomers,
  deletedProducts,
  onRestoreInvoice,
  onPermanentDeleteInvoice,
  onRestoreCustomer,
  onPermanentDeleteCustomer,
  onRestoreProduct,
  onPermanentDeleteProduct,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'recycle-bin'>('users');
  const [recycleCategory, setRecycleCategory] = useState<'invoices' | 'customers' | 'products'>('invoices');

  // User form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [accesses, setAccesses] = useState<UserAccesses>(createDefaultAccesses(false));

  const totalDeletedCount = deletedInvoices.length + deletedCustomers.length + deletedProducts.length;

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setUserId('');
    setPassword('');
    setRole('user');
    setAccesses(createDefaultAccesses(false));
    setFormError('');
    setFormSuccess('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: AppUser) => {
    setEditingUser(u);
    setName(u.name || '');
    setEmail(u.email || '');
    setPhone(u.phone || '');
    setUserId(u.userId);
    setPassword(u.password || '');
    setRole(u.role || 'user');
    setAccesses(u.accesses || createDefaultAccesses(u.role === 'admin'));
    setFormError('');
    setFormSuccess('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSaveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const cleanUserId = userId.trim();
    const cleanPassword = password.trim();

    if (!cleanUserId) {
      setFormError('User ID is required.');
      return;
    }
    if (!cleanPassword) {
      setFormError('Password is required.');
      return;
    }

    // Check duplicate User ID (case-insensitive) if creating new user
    if (!editingUser) {
      const exists = users.some(u => u.userId.toLowerCase() === cleanUserId.toLowerCase());
      if (exists) {
        setFormError(`User ID "${cleanUserId}" already exists. Please choose another.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const updatedUser: AppUser = {
        id: editingUser ? editingUser.id : `user-${Date.now()}`,
        userId: cleanUserId,
        name: name.trim() || cleanUserId,
        email: email.trim(),
        phone: phone.trim(),
        password: cleanPassword,
        role: role,
        accesses: role === 'admin' ? createDefaultAccesses(true) : accesses,
        createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveUser(updatedUser);
      setFormSuccess(editingUser ? 'User updated successfully!' : 'User created successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        setIsSubmitting(false);
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message || 'Failed to save user.');
    }
  };

  const handleDeleteUserClick = async (u: AppUser) => {
    if (u.userId.toLowerCase() === DEFAULT_ADMIN_USER.userId.toLowerCase()) {
      alert('The primary system administrator (Angs) cannot be deleted.');
      return;
    }
    if (u.userId === currentUser.userId) {
      alert('You cannot delete your own logged-in user account.');
      return;
    }
    if (confirm(`Are you sure you want to delete user "${u.name} (${u.userId})"?`)) {
      try {
        await onDeleteUser(u.userId);
      } catch (err: any) {
        alert('Error deleting user: ' + err.message);
      }
    }
  };

  // Helper to toggle a single capability
  const togglePermission = (
    module: keyof UserAccesses,
    capability: string,
    value: boolean
  ) => {
    setAccesses(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [capability]: value,
      },
    }));
  };

  return (
    <div id="admin-panel-container" className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-6 rounded-2xl text-white shadow-lg border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 flex-shrink-0">
            <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Admin Command Center</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Single Entity Mode
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
              User Management, Access Controls & Soft-Deleted Recovery
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-col sm:flex-row w-full md:w-auto bg-slate-800/80 p-1 rounded-xl border border-slate-700 gap-1 sm:gap-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            User Management ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('recycle-bin')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'recycle-bin'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Recycle Bin ({totalDeletedCount})
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: USER MANAGEMENT
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Registered Platform Users</h2>
              <p className="text-xs text-slate-500">
                Create new user IDs, passwords, and manage granular module capabilities
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Create New User
            </button>
          </div>

          {/* Mobile Users Card List */}
          <div className="block md:hidden space-y-3">
            {users.map((u) => {
              const isMasterAdmin = u.userId.toLowerCase() === DEFAULT_ADMIN_USER.userId.toLowerCase();
              return (
                <div key={u.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase">
                        {u.name ? u.name[0] : 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                        <div className="font-mono text-xs text-slate-500 font-semibold">@{u.userId}</div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.role === 'admin'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {u.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {u.email && (
                      <div className="flex items-center gap-1.5 text-[11px] truncate">
                        <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                    )}
                    {u.phone && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="font-mono">{u.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Permissions pill list */}
                  <div>
                    {u.role === 'admin' ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                        Full Access to All Modules
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.accesses?.invoicing?.view && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-medium">Invoicing</span>
                        )}
                        {u.accesses?.customers?.view && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-medium">Customers</span>
                        )}
                        {u.accesses?.product?.view && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-medium">Product</span>
                        )}
                        {u.accesses?.ewayBill?.view && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-medium">E-Way</span>
                        )}
                        {u.accesses?.companyDetails?.view && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-medium">Company</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit User
                    </button>
                    {!isMasterAdmin && (
                      <button
                        onClick={() => handleDeleteUserClick(u)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Users Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">User ID</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Module Accesses</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => {
                    const isMasterAdmin = u.userId.toLowerCase() === DEFAULT_ADMIN_USER.userId.toLowerCase();
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase">
                              {u.name ? u.name[0] : 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{u.name}</div>
                              <div className="text-[10px] text-slate-400">Created {new Date(u.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-800 border border-slate-200">
                            {u.userId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              u.role === 'admin'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {u.role === 'admin' ? 'Administrator' : 'Standard User'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.role === 'admin' ? (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Full Access to All Data & Modules
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {u.accesses?.invoicing?.view && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">Invoicing</span>
                              )}
                              {u.accesses?.customers?.view && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                                  Customers
                                  {(u.accesses.customers.viewContact || u.accesses.customers.viewBank) && (
                                    <span className="text-[9px] text-blue-600 ml-1">
                                      ({[u.accesses.customers.viewContact && 'Contact', u.accesses.customers.viewBank && 'Bank'].filter(Boolean).join('+')})
                                    </span>
                                  )}
                                </span>
                              )}
                              {u.accesses?.product?.view && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">Product</span>
                              )}
                              {u.accesses?.ewayBill?.view && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">E-Way Bill</span>
                              )}
                              {u.accesses?.companyDetails?.view && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">Company Details</span>
                              )}
                              {u.accesses?.userManagement?.view && (
                                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium border border-purple-200">User Mgmt</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit user details & permissions"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {!isMasterAdmin && (
                              <button
                                onClick={() => handleDeleteUserClick(u)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: RECYCLE BIN (SOFT-DELETED ITEMS)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'recycle-bin' && (
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-bold">Protected Soft-Deletion Active</p>
                <p className="text-amber-700 mt-0.5">
                  Items deleted by users are retained here safely. Only administrators can restore them or permanently purge them.
                </p>
              </div>
            </div>
          </div>

          {/* Sub-category selector */}
          <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto flex-nowrap sm:flex-wrap">
            <button
              onClick={() => setRecycleCategory('invoices')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                recycleCategory === 'invoices'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Deleted Invoices ({deletedInvoices.length})
            </button>
            <button
              onClick={() => setRecycleCategory('customers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                recycleCategory === 'customers'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Deleted Customers ({deletedCustomers.length})
            </button>
            <button
              onClick={() => setRecycleCategory('products')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                recycleCategory === 'products'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Deleted Products ({deletedProducts.length})
            </button>
          </div>

          {/* Category Tables & Mobile Cards */}
          {recycleCategory === 'invoices' && (
            <div>
              {deletedInvoices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
                  No deleted invoices in recycle bin.
                </div>
              ) : (
                <>
                  {/* Mobile Cards View */}
                  <div className="block md:hidden space-y-3">
                    {deletedInvoices.map((inv) => (
                      <div key={inv.id} className="bg-white p-4 rounded-xl border border-rose-100 shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                              {inv.invoiceNumber}
                            </span>
                            <div className="font-bold text-slate-800 text-sm mt-1">{inv.customerName}</div>
                          </div>
                          <div className="font-mono font-extrabold text-sm text-slate-900">
                            ₹{inv.amount.toFixed(2)}
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {inv.billingAddress?._deleted?.deletedAt
                            ? `Deleted: ${new Date(inv.billingAddress._deleted.deletedAt).toLocaleString()} (by ${inv.billingAddress._deleted.deletedBy})`
                            : 'Status: Soft-deleted'}
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => onRestoreInvoice(inv.id)}
                            className="flex-1 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Permanently delete invoice ${inv.invoiceNumber}? This CANNOT be undone.`)) {
                                onPermanentDeleteInvoice(inv.id);
                              }
                            }}
                            className="flex-1 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Purge
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                          <th className="py-3 px-4">Invoice #</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Deleted Info</th>
                          <th className="py-3 px-4 text-right">Admin Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deletedInvoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                            <td className="py-3 px-4 text-slate-700 font-medium">{inv.customerName}</td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">₹{inv.amount.toFixed(2)}</td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {inv.billingAddress?._deleted?.deletedAt
                                ? `${new Date(inv.billingAddress._deleted.deletedAt).toLocaleString()} (by ${inv.billingAddress._deleted.deletedBy})`
                                : 'Soft-deleted'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => onRestoreInvoice(inv.id)}
                                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Permanently delete invoice ${inv.invoiceNumber}? This CANNOT be undone.`)) {
                                      onPermanentDeleteInvoice(inv.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {recycleCategory === 'customers' && (
            <div>
              {deletedCustomers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
                  No deleted customers in recycle bin.
                </div>
              ) : (
                <>
                  {/* Mobile Cards View */}
                  <div className="block md:hidden space-y-3">
                    {deletedCustomers.map((cust) => (
                      <div key={cust.id} className="bg-white p-4 rounded-xl border border-rose-100 shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{cust.companyName}</div>
                            <div className="font-mono text-xs text-slate-500 mt-0.5">GSTIN: {cust.gstin || 'N/A'}</div>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                            {cust.state || 'India'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {cust.bankDetails?._deleted?.deletedAt
                            ? `Deleted: ${new Date(cust.bankDetails._deleted.deletedAt).toLocaleString()} (by ${cust.bankDetails._deleted.deletedBy})`
                            : 'Status: Soft-deleted'}
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => onRestoreCustomer(cust.id)}
                            className="flex-1 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Permanently delete customer ${cust.companyName}? This CANNOT be undone.`)) {
                                onPermanentDeleteCustomer(cust.id);
                              }
                            }}
                            className="flex-1 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Purge
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                          <th className="py-3 px-4">Company Name</th>
                          <th className="py-3 px-4">GSTIN</th>
                          <th className="py-3 px-4">State</th>
                          <th className="py-3 px-4">Deleted Info</th>
                          <th className="py-3 px-4 text-right">Admin Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deletedCustomers.map(cust => (
                          <tr key={cust.id} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-bold text-slate-900">{cust.companyName}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{cust.gstin || 'N/A'}</td>
                            <td className="py-3 px-4 text-slate-600">{cust.state || 'N/A'}</td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {cust.bankDetails?._deleted?.deletedAt
                                ? `${new Date(cust.bankDetails._deleted.deletedAt).toLocaleString()} (by ${cust.bankDetails._deleted.deletedBy})`
                                : 'Soft-deleted'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => onRestoreCustomer(cust.id)}
                                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Permanently delete customer ${cust.companyName}? This CANNOT be undone.`)) {
                                      onPermanentDeleteCustomer(cust.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {recycleCategory === 'products' && (
            <div>
              {deletedProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
                  No deleted products in recycle bin.
                </div>
              ) : (
                <>
                  {/* Mobile Cards View */}
                  <div className="block md:hidden space-y-3">
                    {deletedProducts.map((prod) => (
                      <div key={prod.id} className="bg-white p-4 rounded-xl border border-rose-100 shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{prod.name}</div>
                            <div className="font-mono text-xs text-slate-500 mt-0.5">HSN: {prod.hsnCode}</div>
                          </div>
                          <div className="font-mono font-extrabold text-sm text-slate-900">
                            ₹{prod.price.toFixed(2)}
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {prod.parameters?._deleted?.deletedAt
                            ? `Deleted: ${new Date(prod.parameters._deleted.deletedAt).toLocaleString()} (by ${prod.parameters._deleted.deletedBy})`
                            : 'Status: Soft-deleted'}
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => onRestoreProduct(prod.id)}
                            className="flex-1 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Permanently delete product ${prod.name}? This CANNOT be undone.`)) {
                                onPermanentDeleteProduct(prod.id);
                              }
                            }}
                            className="flex-1 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Purge
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                          <th className="py-3 px-4">Product Name</th>
                          <th className="py-3 px-4">HSN Code</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4">Deleted Info</th>
                          <th className="py-3 px-4 text-right">Admin Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deletedProducts.map(prod => (
                          <tr key={prod.id} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-bold text-slate-900">{prod.name}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{prod.hsnCode}</td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">₹{prod.price.toFixed(2)}</td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {prod.parameters?._deleted?.deletedAt
                                ? `${new Date(prod.parameters._deleted.deletedAt).toLocaleString()} (by ${prod.parameters._deleted.deletedBy})`
                                : 'Soft-deleted'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => onRestoreProduct(prod.id)}
                                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Permanently delete product ${prod.name}? This CANNOT be undone.`)) {
                                      onPermanentDeleteProduct(prod.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT USER WITH PERMISSIONS MATRIX
         ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {editingUser ? `Edit User: ${editingUser.name}` : 'Create New Platform User'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Define user identity, password, and granular section permissions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveUserForm} className="overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* User Identity Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> User Credentials & Profile
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                    />
                  </div>

                  {/* Unique User ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      User ID <span className="text-slate-400 font-normal">(Unique Login Identifier)</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingUser && editingUser.userId.toLowerCase() === DEFAULT_ADMIN_USER.userId.toLowerCase()}
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="e.g. ramesh_ops"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Login Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Set strong password"
                        className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">System Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 bg-white"
                    >
                      <option value="user">Standard User (Permission Controlled)</option>
                      <option value="admin">Administrator (Full System Access)</option>
                    </select>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ramesh@agarwalnextgen.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Granular Access Control Matrix */}
              {role === 'admin' ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span>
                    <strong>Administrator role selected:</strong> This user automatically receives full View, Update, Delete, and Export capabilities across all modules.
                  </span>
                </div>
              ) : (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4 text-blue-600" /> Module Access & Capabilities
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Check capabilities granted to this user (View, Update, Delete, Export)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAccesses(createDefaultAccesses(true))}
                        className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
                      >
                        Grant All
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccesses(createDefaultAccesses(false))}
                        className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* INVOICING */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Invoicing</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.invoicing.view}
                            onChange={(e) => togglePermission('invoicing', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>View</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.invoicing.update}
                            onChange={(e) => togglePermission('invoicing', 'update', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Create / Edit</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.invoicing.delete}
                            onChange={(e) => togglePermission('invoicing', 'delete', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Delete</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.invoicing.export}
                            onChange={(e) => togglePermission('invoicing', 'export', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Export / PDF</span>
                        </label>
                      </div>
                    </div>

                    {/* PRODUCT */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                        <Boxes className="w-4 h-4 text-blue-600" />
                        <span>Product</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.product.view}
                            onChange={(e) => togglePermission('product', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>View</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.product.update}
                            onChange={(e) => togglePermission('product', 'update', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Create / Edit</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.product.delete}
                            onChange={(e) => togglePermission('product', 'delete', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Delete</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.product.export}
                            onChange={(e) => togglePermission('product', 'export', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Export</span>
                        </label>
                      </div>
                    </div>

                    {/* CUSTOMERS WITH GRANULARITY */}
                    <div className="md:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>Customers (with Contact & Bank Granularity)</span>
                        </div>
                      </div>

                      {/* Main Customer CRUD */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pb-2 border-b border-slate-200">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.customers.view}
                            onChange={(e) => togglePermission('customers', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>View Customers</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.customers.update}
                            onChange={(e) => togglePermission('customers', 'update', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Create / Edit</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.customers.delete}
                            onChange={(e) => togglePermission('customers', 'delete', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Delete</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.customers.export}
                            onChange={(e) => togglePermission('customers', 'export', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Export</span>
                        </label>
                      </div>

                      {/* Granular Sub-permissions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Contact details granularity */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                          <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                            <span>Contact / SPOC Details</span>
                          </div>
                          <div className="flex gap-4 text-xs">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={accesses.customers.viewContact}
                                onChange={(e) => togglePermission('customers', 'viewContact', e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>View Contact</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={accesses.customers.updateContact}
                                onChange={(e) => togglePermission('customers', 'updateContact', e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>Update Contact</span>
                            </label>
                          </div>
                        </div>

                        {/* Bank details granularity */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                          <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Bank Account Details</span>
                          </div>
                          <div className="flex gap-4 text-xs">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={accesses.customers.viewBank}
                                onChange={(e) => togglePermission('customers', 'viewBank', e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>View Bank Details</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={accesses.customers.updateBank}
                                onChange={(e) => togglePermission('customers', 'updateBank', e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>Update Bank Details</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* E-WAY BILL */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span>E-Way Bill</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.ewayBill.view}
                            onChange={(e) => togglePermission('ewayBill', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>View</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.ewayBill.update}
                            onChange={(e) => togglePermission('ewayBill', 'update', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Create / Issue</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.ewayBill.delete}
                            onChange={(e) => togglePermission('ewayBill', 'delete', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Delete</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.ewayBill.export}
                            onChange={(e) => togglePermission('ewayBill', 'export', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Export / Print</span>
                        </label>
                      </div>
                    </div>

                    {/* COMPANY DETAILS */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span>Company Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.companyDetails.view}
                            onChange={(e) => togglePermission('companyDetails', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>View Profile</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.companyDetails.update}
                            onChange={(e) => togglePermission('companyDetails', 'update', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Update Profile</span>
                        </label>
                      </div>
                    </div>

                    {/* USER MANAGEMENT */}
                    <div className="md:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>User Management & Admin Panel Access</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.userManagement.view}
                            onChange={(e) => togglePermission('userManagement', 'view', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>View Admin Panel</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.userManagement.update}
                            onChange={(e) => togglePermission('userManagement', 'update', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Create / Edit Users</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.userManagement.delete}
                            onChange={(e) => togglePermission('userManagement', 'delete', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Delete Users</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accesses.userManagement.export}
                            onChange={(e) => togglePermission('userManagement', 'export', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Export Users</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
