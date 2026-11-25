import { useState, useEffect } from 'react';
import { SidebarTab, Customer, Invoice, Product, CompanyDetailsData, AppUser } from './types';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { InvoiceDashboard } from './components/InvoiceDashboard';
import { AddCustomer } from './components/AddCustomer';
import { CurrentCustomers } from './components/CurrentCustomers';
import { NewInvoice } from './components/NewInvoice';
import { Products } from './components/Products';
import { EWayBill } from './components/EWayBill';
import { CompanyDetails } from './components/CompanyDetails';
import { AdminPanel } from './components/AdminPanel';
import { HiveIcon } from './components/HiveIcon';
import { supabase } from './utils/supabaseClient';
import { Menu, ShieldAlert } from 'lucide-react';
import { compareInvoiceNumbers } from './utils/invoiceHelper';
import {
  getCurrentUserSession,
  setCurrentUserSession,
  loadUsersFromDB,
  saveUsersToDB,
  isUserAdmin,
  canUserView,
} from './utils/userHelper';

export function App() {
  // Current user session & entity state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getCurrentUserSession());
  const [company, setCompany] = useState<any>(() => {
    const saved = localStorage.getItem('billhive_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Core domain states
  const [activeCustomers, setActiveCustomers] = useState<Customer[]>([]);
  const [deletedCustomers, setDeletedCustomers] = useState<Customer[]>([]);
  const [activeInvoices, setActiveInvoices] = useState<Invoice[]>([]);
  const [deletedInvoices, setDeletedInvoices] = useState<Invoice[]>([]);
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Tab navigation & right sidebar collapse toggle
  const [currentTab, setCurrentTab] = useState<SidebarTab>('invoicing-dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Edit Buffer States
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const isAdmin = isUserAdmin(currentUser);

  // Load registered users from database
  useEffect(() => {
    if (company?.id) {
      loadUsersFromDB(company.id).then((loaded) => {
        setUsers(loaded);
      });
    }
  }, [company?.id]);

  // Set the tab depending on company setup completion status on login/refresh
  useEffect(() => {
    if (company && currentUser) {
      if (!company.is_setup_completed && canUserView(currentUser, 'companyDetails')) {
        setCurrentTab('company-details');
      }
    }
  }, [company?.id, company?.is_setup_completed]);

  // Tab guard based on user permissions
  useEffect(() => {
    if (!currentUser) return;

    if (currentTab === 'admin-panel' && !isAdmin && !canUserView(currentUser, 'userManagement')) {
      setCurrentTab('invoicing-dashboard');
    } else if (
      (currentTab === 'invoicing-dashboard' || currentTab === 'new-invoice') &&
      !canUserView(currentUser, 'invoicing')
    ) {
      if (canUserView(currentUser, 'customers')) setCurrentTab('current-customers');
      else if (canUserView(currentUser, 'product')) setCurrentTab('current-products');
      else if (canUserView(currentUser, 'ewayBill')) setCurrentTab('eway-bill');
      else if (canUserView(currentUser, 'companyDetails')) setCurrentTab('company-details');
    } else if (
      (currentTab === 'current-customers' || currentTab === 'add-customer') &&
      !canUserView(currentUser, 'customers')
    ) {
      if (canUserView(currentUser, 'invoicing')) setCurrentTab('invoicing-dashboard');
      else if (canUserView(currentUser, 'product')) setCurrentTab('current-products');
    } else if (
      (currentTab === 'current-products' || currentTab === 'add-product') &&
      !canUserView(currentUser, 'product')
    ) {
      if (canUserView(currentUser, 'invoicing')) setCurrentTab('invoicing-dashboard');
    } else if (currentTab === 'eway-bill' && !canUserView(currentUser, 'ewayBill')) {
      if (canUserView(currentUser, 'invoicing')) setCurrentTab('invoicing-dashboard');
    } else if (currentTab === 'company-details' && !canUserView(currentUser, 'companyDetails')) {
      if (canUserView(currentUser, 'invoicing')) setCurrentTab('invoicing-dashboard');
    }
  }, [currentUser, currentTab, isAdmin]);

  // Load data from DB when logged-in company changes
  useEffect(() => {
    if (!company) {
      setActiveCustomers([]);
      setDeletedCustomers([]);
      setActiveInvoices([]);
      setDeletedInvoices([]);
      setActiveProducts([]);
      setDeletedProducts([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Customers (filtering out system users row)
        const { data: custData, error: custError } = await supabase
          .from('customers')
          .select('*')
          .eq('company_id', company.id)
          .neq('company_name', '__SYSTEM_USERS__')
          .order('created_at', { ascending: false });

        if (custError) throw custError;

        const mappedCustomers: Customer[] = (custData || []).map((c: any) => ({
          id: c.id,
          companyName: c.company_name,
          address: c.addresses?.[0]?.line1 || '',
          state: c.addresses?.[0]?.state || '',
          gstin: c.addresses?.[0]?.gstin || '',
          addresses: c.addresses || [],
          bankDetails: c.bank_details || { bankName: '', accountNumber: '', branch: '', ifscCode: '' },
          spocDetails: c.spoc_details?.[0] || { name: '', email: '', mobileNumber: '' },
          pocs: c.spoc_details || [],
        }));

        setActiveCustomers(mappedCustomers.filter((c) => !c.bankDetails?._deleted?.isDeleted));
        setDeletedCustomers(mappedCustomers.filter((c) => !!c.bankDetails?._deleted?.isDeleted));

        // 2. Fetch Products
        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('*')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false });

        if (prodError) throw prodError;

        const mappedProducts: Product[] = (prodData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          hsnCode: p.hsn_code,
          description: p.description || '',
          parameters: p.parameters,
          price: Number(p.price),
          gstRate: Number(p.gst_rate),
          unit: p.unit,
        }));

        setActiveProducts(mappedProducts.filter((p) => !p.parameters?._deleted?.isDeleted));
        setDeletedProducts(mappedProducts.filter((p) => !!p.parameters?._deleted?.isDeleted));

        // 3. Fetch Invoices
        const { data: invData, error: invError } = await supabase
          .from('invoices')
          .select('*')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false });

        if (invError) throw invError;

        const mappedInvoices: Invoice[] = (invData || []).map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          customerName: inv.customer_name,
          amount: Number(inv.amount),
          date: inv.date,
          state: inv.shipping_address?.state || '',
          status: inv.status,
          paymentMode: inv.payment_mode || undefined,
          ewayBillNo: inv.eway_bill_no || undefined,
          deliveryNote: inv.delivery_note || undefined,
          referenceNumber: inv.reference_number || undefined,
          referenceDate: inv.reference_date || undefined,
          dispatchDocNo: inv.dispatch_doc_no || undefined,
          dispatchThrough: inv.dispatch_through || undefined,
          destination: inv.destination || undefined,
          termsOfDelivery: inv.terms_of_delivery || undefined,
          shipToAddress: inv.shipping_address || undefined,
          billingAddress: inv.billing_address || undefined,
          items: inv.items || [],
          taxCgst: Number(inv.tax_cgst || 0),
          taxSgst: Number(inv.tax_sgst || 0),
          taxIgst: Number(inv.tax_igst || 0),
          pdfData: inv.pdf_data || undefined,
        }));

        const sortedInvoices = mappedInvoices.sort((a, b) => compareInvoiceNumbers(a.invoiceNumber, b.invoiceNumber));
        setActiveInvoices(
          sortedInvoices.filter((inv) => !inv.billingAddress?._deleted?.isDeleted && inv.status !== 'Deleted')
        );
        setDeletedInvoices(
          sortedInvoices.filter((inv) => !!inv.billingAddress?._deleted?.isDeleted || inv.status === 'Deleted')
        );
      } catch (err: any) {
        console.error('Error fetching database tables:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [company?.id]);

  // Authentication controllers
  const handleLogin = (user: AppUser, companyRecord: any) => {
    setCurrentUser(user);
    setCompany(companyRecord);
    setCurrentUserSession(user);
    localStorage.setItem('billhive_session', JSON.stringify(companyRecord));
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out of BillHive?')) {
      setCurrentUser(null);
      setCompany(null);
      setCurrentUserSession(null);
      localStorage.removeItem('billhive_session');
      setCurrentTab('invoicing-dashboard');
    }
  };

  const handleSaveCompanyDetails = async (details: CompanyDetailsData) => {
    if (!company) return;

    const updatedFields = {
      trade_name: details.tradeName,
      business_subtitle: details.businessSubtitle || null,
      legal_name: details.legalName,
      company_phone: details.phone,
      company_email: details.email,
      gstin: details.gstin,
      pan: details.pan || (details.gstin.length >= 12 ? details.gstin.substring(2, 12) : ''),
      website: details.website || null,
      logo: details.logo || null,
      addresses: details.addresses,
      bank_name: details.bankDetails.bankName,
      account_number: details.bankDetails.accountNumber,
      branch: details.bankDetails.branch,
      ifsc_code: details.bankDetails.ifscCode,
      is_setup_completed: true,
    };

    const { data, error } = await supabase
      .from('companies')
      .update(updatedFields)
      .eq('id', company.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    setCompany(data);
    localStorage.setItem('billhive_session', JSON.stringify(data));
  };

  // Customer handlers
  const handleSaveCustomer = async (customer: Customer) => {
    if (!company) return;

    const dbFields = {
      company_id: company.id,
      company_name: customer.companyName,
      addresses: customer.addresses,
      bank_details: customer.bankDetails,
      spoc_details: customer.pocs || [],
    };

    try {
      if (customer.id && !customer.id.startsWith('new-')) {
        const { error } = await supabase.from('customers').update(dbFields).eq('id', customer.id);
        if (error) throw error;
        alert(`Customer ${customer.companyName} updated successfully!`);
      } else {
        const { error } = await supabase.from('customers').insert([dbFields]);
        if (error) throw error;
        alert(`Customer ${customer.companyName} registered successfully!`);
      }

      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error saving customer: ${err.message}`);
    }

    setEditingCustomer(null);
    setCurrentTab('current-customers');
  };

  const handleEditCustomerClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setCurrentTab('add-customer');
  };

  // Customer Soft-Delete
  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      const target = activeCustomers.find((c) => c.id === id);
      const delMeta = {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.name || currentUser?.username || 'User',
      };
      const updatedBankDetails = { ...(target?.bankDetails || {}), _deleted: delMeta };

      const { error } = await supabase
        .from('customers')
        .update({ bank_details: updatedBankDetails })
        .eq('id', id);

      if (error) throw error;
      alert(`Customer moved to Deleted Items. Admin can restore or permanently erase it.`);
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error deleting customer: ${err.message}`);
    }
  };

  // Customer Restore (Admin only)
  const handleRestoreCustomer = async (id: string) => {
    try {
      const target = deletedCustomers.find((c) => c.id === id);
      const updatedBankDetails = { ...(target?.bankDetails || {}) };
      delete (updatedBankDetails as any)._deleted;

      const { error } = await supabase
        .from('customers')
        .update({ bank_details: updatedBankDetails })
        .eq('id', id);

      if (error) throw error;
      alert(`Customer restored to active records!`);
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error restoring customer: ${err.message}`);
    }
  };

  // Customer Permanent Delete (Admin only)
  const handlePermanentDeleteCustomer = async (id: string) => {
    if (!confirm('PERMANENT DELETION WARNING: Are you sure you want to permanently erase this customer? This cannot be undone.'))
      return;
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      alert('Customer permanently erased from database.');
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error permanently deleting customer: ${err.message}`);
    }
  };

  // Invoice handlers
  const handleSaveInvoice = async (invoice: Invoice) => {
    if (!company) return;

    const userPrimaryState = company.addresses?.[0]?.state || '';
    const shippingState = invoice.shipToAddress?.state || '';

    let taxCgst = 0;
    let taxSgst = 0;
    let taxIgst = 0;

    const subtotal = invoice.amount;
    if (userPrimaryState.toLowerCase().trim() === shippingState.toLowerCase().trim()) {
      taxCgst = Number((subtotal * 0.09).toFixed(2));
      taxSgst = Number((subtotal * 0.09).toFixed(2));
    } else {
      taxIgst = Number((subtotal * 0.18).toFixed(2));
    }

    const totalInvoiceAmount = subtotal + taxCgst + taxSgst + taxIgst;

    const dbFields = {
      company_id: company.id,
      invoice_number: invoice.invoiceNumber,
      date: invoice.date,
      customer_name: invoice.customerName,
      customer_id:
        invoice.customerId && !invoice.customerId.startsWith('new-') && invoice.customerId !== 'custom'
          ? invoice.customerId
          : null,
      amount: totalInvoiceAmount,
      status: invoice.status,
      payment_mode: invoice.paymentMode,
      eway_bill_no: invoice.ewayBillNo || null,
      delivery_note: invoice.deliveryNote || null,
      reference_number: invoice.referenceNumber || null,
      reference_date: invoice.referenceDate || null,
      dispatch_doc_no: invoice.dispatchDocNo || null,
      dispatch_through: invoice.dispatchThrough || null,
      destination: invoice.destination || null,
      terms_of_delivery: invoice.termsOfDelivery || null,
      billing_address: company.addresses?.[0] || {},
      shipping_address: invoice.shipToAddress || {},
      items: invoice.items,
      tax_cgst: taxCgst,
      tax_sgst: taxSgst,
      tax_igst: taxIgst,
      pdf_data: invoice.pdfData || null,
    };

    try {
      if (invoice.id && !invoice.id.startsWith('new-')) {
        const { error } = await supabase.from('invoices').update(dbFields).eq('id', invoice.id);
        if (error) throw error;
        alert(`Invoice ${invoice.invoiceNumber} updated successfully!`);
      } else {
        const { error } = await supabase.from('invoices').insert([dbFields]);
        if (error) throw error;
        alert(`Invoice ${invoice.invoiceNumber} issued successfully!`);
      }
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error saving invoice: ${err.message}`);
    }

    setEditingInvoice(null);
    setCurrentTab('invoicing-dashboard');
  };

  const handleEditInvoiceClick = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setCurrentTab('new-invoice');
  };

  // Invoice Soft-Delete
  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const target = activeInvoices.find((i) => i.id === id);
      const delMeta = {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.name || currentUser?.username || 'User',
      };
      const updatedBillingAddress = { ...(target?.billingAddress || {}), _deleted: delMeta };

      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'Deleted',
          billing_address: updatedBillingAddress,
        })
        .eq('id', id);

      if (error) throw error;
      alert(`Invoice moved to Deleted Items. Admin can restore or permanently erase it.`);
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error deleting invoice: ${err.message}`);
    }
  };

  // Invoice Restore (Admin only)
  const handleRestoreInvoice = async (id: string) => {
    try {
      const target = deletedInvoices.find((i) => i.id === id);
      const updatedBillingAddress = { ...(target?.billingAddress || {}) };
      delete (updatedBillingAddress as any)._deleted;

      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'Pending',
          billing_address: updatedBillingAddress,
        })
        .eq('id', id);

      if (error) throw error;
      alert(`Invoice restored to active dashboard!`);
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error restoring invoice: ${err.message}`);
    }
  };

  // Invoice Permanent Delete (Admin only)
  const handlePermanentDeleteInvoice = async (id: string) => {
    if (!confirm('PERMANENT DELETION WARNING: Are you sure you want to permanently erase this invoice? This cannot be undone.'))
      return;
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      alert('Invoice permanently deleted from database.');
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error permanently deleting invoice: ${err.message}`);
    }
  };

  // Product handlers
  const handleSaveProduct = async (prod: Product) => {
    if (!company) return;

    const dbFields = {
      company_id: company.id,
      name: prod.name,
      sku: prod.sku || null,
      hsn_code: prod.hsnCode,
      description: prod.description || null,
      parameters: prod.parameters,
      price: prod.price,
      gst_rate: prod.gstRate,
      unit: prod.unit,
    };

    try {
      if (prod.id && !prod.id.startsWith('new-')) {
        const { error } = await supabase.from('products').update(dbFields).eq('id', prod.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([dbFields]);
        if (error) throw error;
      }
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error saving product: ${err.message}`);
    }
  };

  // Product Soft-Delete
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const target = activeProducts.find((p) => p.id === id);
      const delMeta = {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.name || currentUser?.username || 'User',
      };
      const updatedParams = { ...(target?.parameters || {}), _deleted: delMeta };

      const { error } = await supabase
        .from('products')
        .update({ parameters: updatedParams })
        .eq('id', id);

      if (error) throw error;
      alert(`Product moved to Deleted Items. Admin can restore or permanently erase it.`);
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error deleting product: ${err.message}`);
    }
  };

  // Product Restore (Admin only)
  const handleRestoreProduct = async (id: string) => {
    try {
      const target = deletedProducts.find((p) => p.id === id);
      const updatedParams = { ...(target?.parameters || {}) };
      delete (updatedParams as any)._deleted;

      const { error } = await supabase
        .from('products')
        .update({ parameters: updatedParams })
        .eq('id', id);

      if (error) throw error;
      alert(`Product restored to active inventory!`);
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error restoring product: ${err.message}`);
    }
  };

  // Product Permanent Delete (Admin only)
  const handlePermanentDeleteProduct = async (id: string) => {
    if (!confirm('PERMANENT DELETION WARNING: Are you sure you want to permanently erase this product? This cannot be undone.'))
      return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      alert('Product permanently deleted from database.');
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error permanently deleting product: ${err.message}`);
    }
  };

  // User Management handlers
  const handleSaveUser = async (userToSave: AppUser) => {
    if (!company) return;
    const existingIndex = users.findIndex(
      (u) => (u.userId || u.username || '').toLowerCase() === (userToSave.userId || userToSave.username || '').toLowerCase()
    );
    let nextUsers: AppUser[];
    if (existingIndex >= 0) {
      nextUsers = [...users];
      nextUsers[existingIndex] = { ...userToSave, updatedAt: new Date().toISOString() };
    } else {
      nextUsers = [...users, { ...userToSave, createdAt: new Date().toISOString() }];
    }
    await saveUsersToDB(nextUsers, company.id);
    setUsers(nextUsers);

    // If updating current logged in user's profile
    if (
      currentUser &&
      (currentUser.userId || currentUser.username || '').toLowerCase() ===
        (userToSave.userId || userToSave.username || '').toLowerCase()
    ) {
      setCurrentUser(userToSave);
      setCurrentUserSession(userToSave);
    }
    alert(`User profile "${userToSave.name}" (${userToSave.userId}) successfully updated.`);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!company) return;
    const userToDelete = users.find((u) => u.id === userId || u.userId === userId);
    if (!userToDelete) return;
    if ((userToDelete.userId || userToDelete.username || '').toLowerCase() === 'angs') {
      alert('The primary administrator account (Angs) cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete user ${userToDelete.name} (${userToDelete.userId})?`)) {
      return;
    }
    const nextUsers = users.filter((u) => u.id !== userId && u.userId !== userId);
    await saveUsersToDB(nextUsers, company.id);
    setUsers(nextUsers);
    alert(`User ${userToDelete.userId} deleted.`);
  };

  // If not authenticated or company not loaded, display Login
  if (!company || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen h-[100dvh] overflow-hidden bg-[#f1f5f9] flex flex-col font-sans antialiased text-slate-800">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-[#e2e8f0] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="p-2 -ml-1 sm:-ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden block cursor-pointer transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="p-1.5 sm:p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/15 flex-shrink-0">
            <HiveIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="truncate">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
              Bill<span className="text-blue-600">Hive</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* User Account Info */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-1">
              <span className="text-xs font-bold text-slate-800 max-w-[100px] sm:max-w-none truncate">{currentUser.name}</span>
              {isAdmin && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] sm:text-[10px] font-extrabold uppercase">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono hidden xs:block">@{currentUser.userId || currentUser.username}</p>
          </div>

          <div className="w-px h-7 bg-slate-200 hidden sm:block" />

          {/* Single Entity Details */}
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold font-mono text-slate-700">+91 {company.phone}</p>
            <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
              {company.trade_name || 'Agarwal NextGen Solutions'}
            </p>
          </div>

          <div className="w-px h-7 bg-slate-200" />

          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors bg-slate-100 hover:bg-red-50 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl cursor-pointer whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Screen Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Backdrop overlay for mobile sidebar */}
        {showMobileSidebar && (
          <div
            onClick={() => setShowMobileSidebar(false)}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-30 md:hidden transition-opacity"
          />
        )}

        {/* Left Collapsible Navigation Sidebar with Admin Panel at top */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => {
            if (tab !== 'add-customer') setEditingCustomer(null);
            if (tab !== 'new-invoice') setEditingInvoice(null);
            setCurrentTab(tab);
            setShowMobileSidebar(false);
          }}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          userPhone={company.phone}
          currentUser={currentUser}
          onLogout={handleLogout}
          isOpenOnMobile={showMobileSidebar}
          onCloseMobile={() => setShowMobileSidebar(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-sm font-semibold text-slate-500">Loading synchronization stream...</p>
              </div>
            ) : (
              <>
                {/* 0. ADMIN PANEL */}
                {currentTab === 'admin-panel' && (
                  <AdminPanel
                    currentUser={currentUser}
                    users={users}
                    onSaveUser={handleSaveUser}
                    onDeleteUser={handleDeleteUser}
                    deletedInvoices={deletedInvoices}
                    deletedCustomers={deletedCustomers}
                    deletedProducts={deletedProducts}
                    onRestoreInvoice={handleRestoreInvoice}
                    onPermanentDeleteInvoice={handlePermanentDeleteInvoice}
                    onRestoreCustomer={handleRestoreCustomer}
                    onPermanentDeleteCustomer={handlePermanentDeleteCustomer}
                    onRestoreProduct={handleRestoreProduct}
                    onPermanentDeleteProduct={handlePermanentDeleteProduct}
                  />
                )}

                {/* 1. INVOICING DASHBOARD */}
                {currentTab === 'invoicing-dashboard' && (
                  <InvoiceDashboard
                    invoices={activeInvoices}
                    deletedInvoices={deletedInvoices}
                    currentUser={currentUser}
                    onAddInvoiceClick={() => {
                      setEditingInvoice(null);
                      setCurrentTab('new-invoice');
                    }}
                    onEditInvoice={handleEditInvoiceClick}
                    onDeleteInvoice={handleDeleteInvoice}
                    onRestoreInvoice={handleRestoreInvoice}
                    onPermanentDeleteInvoice={handlePermanentDeleteInvoice}
                    company={company}
                    customers={activeCustomers}
                  />
                )}

                {/* 2. NEW / EDIT INVOICE */}
                {currentTab === 'new-invoice' && (
                  <NewInvoice
                    customers={activeCustomers}
                    products={activeProducts}
                    invoices={activeInvoices}
                    currentUser={currentUser}
                    onSaveInvoice={handleSaveInvoice}
                    onAddCustomer={async (newCust) => {
                      if (!company) return newCust;
                      const dbFields = {
                        company_id: company.id,
                        company_name: newCust.companyName,
                        addresses: newCust.addresses,
                        bank_details: newCust.bankDetails,
                        spoc_details: newCust.pocs || [],
                      };
                      try {
                        const { data, error } = await supabase
                          .from('customers')
                          .insert([dbFields])
                          .select()
                          .single();
                        if (error) throw error;
                        const primaryAddr = data.addresses?.[0] || {
                          line1: '',
                          city: '',
                          pincode: '',
                          state: '',
                          gstin: '',
                        };
                        const addressStr = primaryAddr.line1
                          ? `${primaryAddr.line1}, ${primaryAddr.city} - ${primaryAddr.pincode}`
                          : '';
                        const savedCustomer: Customer = {
                          id: data.id,
                          companyName: data.company_name,
                          address: addressStr,
                          state: primaryAddr.state || '',
                          gstin: primaryAddr.gstin || '',
                          addresses: data.addresses || [],
                          bankDetails: data.bank_details || {},
                          pocs: data.spoc_details || [],
                          spocDetails: data.spoc_details?.[0] || { name: '', email: '', mobileNumber: '' },
                        };
                        setActiveCustomers((prev) => [savedCustomer, ...prev]);
                        return savedCustomer;
                      } catch (err: any) {
                        alert('Error registering customer: ' + err.message);
                        return newCust;
                      }
                    }}
                    onCancel={() => {
                      setEditingInvoice(null);
                      setCurrentTab('invoicing-dashboard');
                    }}
                    editingInvoice={editingInvoice}
                    company={company}
                  />
                )}

                {/* 3. CURRENT CUSTOMERS DIRECTORY */}
                {currentTab === 'current-customers' && (
                  <CurrentCustomers
                    customers={activeCustomers}
                    deletedCustomers={deletedCustomers}
                    currentUser={currentUser}
                    onAddCustomerClick={() => {
                      setEditingCustomer(null);
                      setCurrentTab('add-customer');
                    }}
                    onEditCustomer={handleEditCustomerClick}
                    onDeleteCustomer={handleDeleteCustomer}
                    onRestoreCustomer={handleRestoreCustomer}
                    onPermanentDeleteCustomer={handlePermanentDeleteCustomer}
                  />
                )}

                {/* 4. ADD / EDIT CUSTOMER */}
                {currentTab === 'add-customer' && (
                  <AddCustomer
                    onSaveCustomer={handleSaveCustomer}
                    onCancel={() => {
                      setEditingCustomer(null);
                      setCurrentTab('current-customers');
                    }}
                    editingCustomer={editingCustomer}
                    currentUser={currentUser}
                  />
                )}

                {/* 5. CURRENT PRODUCTS */}
                {currentTab === 'current-products' && (
                  <Products
                    products={activeProducts}
                    deletedProducts={deletedProducts}
                    currentUser={currentUser}
                    onSaveProduct={handleSaveProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onRestoreProduct={handleRestoreProduct}
                    onPermanentDeleteProduct={handlePermanentDeleteProduct}
                    initialShowAddForm={false}
                  />
                )}

                {/* 6. ADD PRODUCT FORM */}
                {currentTab === 'add-product' && (
                  <Products
                    products={activeProducts}
                    deletedProducts={deletedProducts}
                    currentUser={currentUser}
                    onSaveProduct={handleSaveProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onRestoreProduct={handleRestoreProduct}
                    onPermanentDeleteProduct={handlePermanentDeleteProduct}
                    initialShowAddForm={true}
                  />
                )}

                {/* 7. E-WAY BILL */}
                {currentTab === 'eway-bill' && (
                  <EWayBill invoices={activeInvoices} currentUser={currentUser} />
                )}

                {/* 8. COMPANY DETAILS */}
                {currentTab === 'company-details' && (
                  <CompanyDetails
                    company={company}
                    onSave={handleSaveCompanyDetails}
                    currentUser={currentUser}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Page Footer */}
      <footer className="bg-white border-t border-slate-100 py-3 px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
        <p>© 2026 BillHive Invoicing Hub. Live Supabase database synchronized.</p>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 font-medium">
          <span className="text-slate-500">Single Entity Mode</span>
          <span>•</span>
          <span className="text-slate-500">Access Control Engine Active</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
