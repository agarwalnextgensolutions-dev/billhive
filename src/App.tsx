import { useState, useEffect } from 'react';
import { SidebarTab, Customer, Invoice, Product, CompanyDetailsData } from './types';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { InvoiceDashboard } from './components/InvoiceDashboard';
import { AddCustomer } from './components/AddCustomer';
import { CurrentCustomers } from './components/CurrentCustomers';
import { NewInvoice } from './components/NewInvoice';
import { Products } from './components/Products';
import { EWayBill } from './components/EWayBill';
import { CompanyDetails } from './components/CompanyDetails';
import { HiveIcon } from './components/HiveIcon';
import { supabase } from './utils/supabaseClient';
import { Menu } from 'lucide-react';
import { compareInvoiceNumbers } from './utils/invoiceHelper';
// INITIAL MOCK DATA STATE
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    companyName: 'ABC Technologies Private Limited',
    address: 'Symphony Towers, Suite 501, Outer Ring Road, Pune',
    state: 'Maharashtra',
    gstin: '27AADCB2230M1ZT',
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountNumber: '502000293014',
      branch: 'Pune Phase III',
      ifscCode: 'HDFC0001042',
    },
    spocDetails: {
      name: 'Mayank P H',
      email: 'mayank@abctech.com',
      mobileNumber: '9876543210',
    },
    addresses: [
      {
        type: 'Billing Address',
        gstin: '27AADCB2230M1ZT',
        line1: 'Symphony Towers, Suite 501, Outer Ring Road',
        pincode: '411045',
        city: 'Pune',
        state: 'Maharashtra',
        stateCode: '27'
      },
      {
        type: 'Shipping Warehouse',
        gstin: '27AADCB2230M1ZT',
        line1: 'Warehouse 12, Chakan Industrial Area',
        pincode: '410501',
        city: 'Pune',
        state: 'Maharashtra',
        stateCode: '27'
      }
    ]
  },
  {
    id: 'cust-2',
    companyName: 'Zypher Systems Inc',
    address: 'DLF Cyber City, Building 10C, Gurugram',
    state: 'Haryana',
    gstin: '06AAACZ1092P1Z0',
    bankDetails: {
      bankName: 'ICICI Bank Ltd',
      accountNumber: '012405001294',
      branch: 'Gurgaon DLF Cybercity',
      ifscCode: 'ICIC0000124',
    },
    spocDetails: {
      name: 'Aditya h h',
      email: 'aditya@zypher.io',
      mobileNumber: '9999999999',
    },
    addresses: [
      {
        type: 'Billing Address',
        gstin: '06AAACZ1092P1Z0',
        line1: 'DLF Cyber City, Building 10C',
        pincode: '122002',
        city: 'Gurugram',
        state: 'Haryana',
        stateCode: '06'
      }
    ]
  },
  {
    id: 'cust-3',
    companyName: 'Rajeshwar Commercial Corp',
    address: '42, Mount Road, Nandanam, Chennai',
    state: 'Tamil Nadu',
    gstin: '33AAACR2948R2Z1',
    bankDetails: {
      bankName: 'State Bank of India',
      accountNumber: '30291049201',
      branch: 'Chennai Main Branch',
      ifscCode: 'SBIN0000823',
    },
    spocDetails: {
      name: 'Rajeshwar',
      email: 'rajeshwar@commercials.com',
      mobileNumber: '9123456789',
    },
    addresses: [
      {
        type: 'Billing Address',
        gstin: '33AAACR2948R2Z1',
        line1: '42, Mount Road, Nandanam',
        pincode: '600035',
        city: 'Chennai',
        state: 'Tamil Nadu',
        stateCode: '33'
      }
    ]
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV/2026-27/304',
    customerName: 'Zypher Systems Inc',
    amount: 2000.00,
    date: '2026-06-25',
    state: 'Haryana',
    status: 'Pending',
    paymentMode: undefined,
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV/2026-27/305',
    customerName: 'Rajeshwar Commercial Corp',
    amount: 400.00,
    date: '2026-06-24',
    state: 'Tamil Nadu',
    status: 'Paid',
    paymentMode: 'UPI',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV/2026-27/102',
    customerName: 'ABC Technologies Private Limited',
    amount: 148779.00,
    date: '2026-06-23',
    state: 'Maharashtra',
    status: 'Paid',
    paymentMode: 'Cash',
  },
  {
    id: 'inv-4',
    invoiceNumber: 'INV/2026-27/098',
    customerName: 'ABC Technologies Private Limited',
    amount: 116858.00,
    date: '2026-06-18',
    state: 'Maharashtra',
    status: 'Pending',
    paymentMode: undefined,
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Dell XPS 15 Intel i9 Developer Edition Laptop',
    sku: 'DELL-XPS15-I9',
    hsnCode: '84713010',
    description: 'High-end developer configuration with 64GB RAM and 2TB SSD',
    parameters: {
      OD: false,
      ID: false,
      TH: false,
      Table: false,
      Size: true,
      Quantity: true,
      RF: false,
      PCD: false,
      HD: false,
    },
    price: 125000.00,
    gstRate: 18,
    unit: 'PCS',
  },
  {
    id: 'prod-2',
    name: 'Standard Cloud Migration Automation Service',
    sku: 'SRV-CLOUD-MIG',
    hsnCode: '99831300',
    description: 'Cloud assessment and lift-and-shift automation execution',
    parameters: {
      OD: false,
      ID: false,
      TH: false,
      Table: false,
      Size: false,
      Quantity: true,
      RF: false,
      PCD: false,
      HD: false,
    },
    price: 15000.00,
    gstRate: 18,
    unit: 'HRS',
  },
  {
    id: 'prod-3',
    name: 'USB-C Multi-port Thunderbolt 4 Docking Hub',
    sku: 'ACC-USBC-HUB4',
    hsnCode: '84718000',
    description: 'Multi-display laptop dock with Power Delivery and Gigabit Ethernet',
    parameters: {
      OD: true,
      ID: false,
      TH: true,
      Table: false,
      Size: true,
      Quantity: true,
      RF: false,
      PCD: false,
      HD: false,
    },
    price: 2499.00,
    gstRate: 18,
    unit: 'PCS',
  },
];

export default function App() {
  // Authentication & Company session state
  const [company, setCompany] = useState<any | null>(() => {
    const saved = localStorage.getItem('billhive_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Core domain states (loaded dynamically from database)
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Tab navigation & right sidebar collapse toggle
  const [currentTab, setCurrentTab] = useState<SidebarTab>('invoicing-dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Edit Buffer States
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Set the tab depending on company setup completion status on login/refresh
  useEffect(() => {
    if (company) {
      if (!company.is_setup_completed) {
        setCurrentTab('company-details');
      } else if (currentTab === 'company-details') {
        setCurrentTab('invoicing-dashboard');
      }
    }
  }, [company?.id, company?.is_setup_completed]);

  // Load data from DB when logged-in company changes
  useEffect(() => {
    if (!company) {
      setCustomers([]);
      setInvoices([]);
      setProducts([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Customers
        const { data: custData, error: custError } = await supabase
          .from('customers')
          .select('*')
          .eq('company_id', company.id)
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

        setCustomers(mappedCustomers);

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

        setProducts(mappedProducts);

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
        setInvoices(sortedInvoices);
      } catch (err: any) {
        console.error('Error fetching database tables:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [company?.id]);

  // Authentication controllers
  const handleLogin = (companyRecord: any) => {
    setCompany(companyRecord);
    localStorage.setItem('billhive_session', JSON.stringify(companyRecord));
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out of BillHive?')) {
      setCompany(null);
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
        const { error } = await supabase
          .from('customers')
          .update(dbFields)
          .eq('id', customer.id);
        if (error) throw error;
        alert(`Customer ${customer.companyName} updated successfully!`);
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([dbFields]);
        if (error) throw error;
        alert(`Customer ${customer.companyName} registered successfully!`);
      }

      // Re-trigger fetch by updating company state reference
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

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error deleting customer: ${err.message}`);
    }
  };

  // Invoice handlers
  const handleSaveInvoice = async (invoice: Invoice) => {
    if (!company) return;

    // Calculate taxes based on shipping state vs company primary state
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
      customer_id: (invoice.customerId && !invoice.customerId.startsWith('new-') && invoice.customerId !== 'custom') ? invoice.customerId : null,
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
        const { error } = await supabase
          .from('invoices')
          .update(dbFields)
          .eq('id', invoice.id);
        if (error) throw error;
        alert(`Invoice ${invoice.invoiceNumber} updated successfully!`);
      } else {
        const { error } = await supabase
          .from('invoices')
          .insert([dbFields]);
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

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error deleting invoice: ${err.message}`);
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
        const { error } = await supabase
          .from('products')
          .update(dbFields)
          .eq('id', prod.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([dbFields]);
        if (error) throw error;
      }
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error saving product: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setCompany({ ...company });
    } catch (err: any) {
      alert(`Error deleting product: ${err.message}`);
    }
  };

  // If not logged in, show Login
  if (!company) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f1f5f9] flex flex-col font-sans antialiased text-slate-800">
      
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-[#e2e8f0] px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden block cursor-pointer transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/15">
            <HiveIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Bill<span className="text-blue-600">Hive</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold font-mono text-slate-700">+91 {company.phone}</p>
          </div>
          <div className="w-px h-8 bg-slate-100 hidden sm:block" />
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors bg-slate-100 hover:bg-red-50 px-3.5 py-1.8 rounded-xl cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Screen Layout (Sidebar on the left) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Backdrop overlay for mobile sidebar */}
        {showMobileSidebar && (
          <div 
            onClick={() => setShowMobileSidebar(false)}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-30 md:hidden transition-opacity"
          />
        )}
        
        {/* Left Collapsible Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => {
            // Clean buffers when jumping between views
            if (tab !== 'add-customer') setEditingCustomer(null);
            if (tab !== 'new-invoice') setEditingInvoice(null);
            setCurrentTab(tab);
            setShowMobileSidebar(false);
          }}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          userPhone={company.phone}
          onLogout={handleLogout}
          isOpenOnMobile={showMobileSidebar}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm font-semibold text-slate-500">Loading synchronization stream...</p>
              </div>
            ) : (
              <>
                {currentTab === 'invoicing-dashboard' && (
                  <InvoiceDashboard
                    invoices={invoices}
                    onAddInvoiceClick={() => {
                      setEditingInvoice(null);
                      setCurrentTab('new-invoice');
                    }}
                    onEditInvoice={handleEditInvoiceClick}
                    onDeleteInvoice={handleDeleteInvoice}
                    company={company}
                    customers={customers}
                  />
                )}

                {currentTab === 'new-invoice' && (
                  <NewInvoice
                    customers={customers}
                    products={products}
                    invoices={invoices}
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
                        const primaryAddr = data.addresses?.[0] || { line1: '', city: '', pincode: '', state: '', gstin: '' };
                        const addressStr = primaryAddr.line1 ? `${primaryAddr.line1}, ${primaryAddr.city} - ${primaryAddr.pincode}` : '';
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
                        setCustomers(prev => [savedCustomer, ...prev]);
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

                {currentTab === 'current-customers' && (
                  <CurrentCustomers
                    customers={customers}
                    onAddCustomerClick={() => {
                      setEditingCustomer(null);
                      setCurrentTab('add-customer');
                    }}
                    onEditCustomer={handleEditCustomerClick}
                    onDeleteCustomer={handleDeleteCustomer}
                  />
                )}

                {currentTab === 'add-customer' && (
                  <AddCustomer
                    onSaveCustomer={handleSaveCustomer}
                    onCancel={() => {
                      setEditingCustomer(null);
                      setCurrentTab('current-customers');
                    }}
                    editingCustomer={editingCustomer}
                  />
                )}

                {currentTab === 'current-products' && (
                  <Products
                    products={products}
                    onSaveProduct={handleSaveProduct}
                    onDeleteProduct={handleDeleteProduct}
                    initialShowAddForm={false}
                  />
                )}

                {currentTab === 'add-product' && (
                  <Products
                    products={products}
                    onSaveProduct={handleSaveProduct}
                    onDeleteProduct={handleDeleteProduct}
                    initialShowAddForm={true}
                  />
                )}

                {currentTab === 'eway-bill' && (
                  <EWayBill invoices={invoices} />
                )}

                {currentTab === 'company-details' && (
                  <CompanyDetails company={company} onSave={handleSaveCompanyDetails} />
                )}
              </>
            )}
          </div>
        </main>

      </div>

      {/* Page Footer */}
      <footer className="bg-white border-t border-slate-100 py-3.5 px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
        <p>© 2026 BillHive Invoicing Hub. Live Supabase database synchronized.</p>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 font-medium">
          <button onClick={() => alert('GST portal simulation active.')} className="hover:text-blue-600 transition-colors cursor-pointer">GST Integration</button>
          <span>•</span>
          <button onClick={() => alert('All transactions and customer profiles are secured by PostgreSQL RLS in cloud.')} className="hover:text-blue-600 transition-colors cursor-pointer">Security Sync</button>
        </div>
      </footer>

    </div>
  );
}

