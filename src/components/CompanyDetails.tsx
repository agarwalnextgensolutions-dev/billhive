import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Save, 
  CheckCircle, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Edit2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Check, 
  Upload, 
  X,
  AlertCircle
} from 'lucide-react';
import { CompanyAddress, CompanyDetailsData, INDIAN_STATES } from '../types';
import { supabase } from '../utils/supabaseClient';

interface CompanyDetailsProps {
  company: any;
  onSave: (updatedDetails: CompanyDetailsData) => Promise<void>;
}

export function mapDbToCompanyDetailsData(c: any): CompanyDetailsData {
  return {
    logo: c.logo || '',
    tradeName: c.trade_name || '',
    businessSubtitle: c.business_subtitle || '',
    legalName: c.legal_name || '',
    phone: c.company_phone || c.phone || '',
    email: c.company_email || '',
    gstin: c.gstin || '',
    pan: c.pan || '',
    website: c.website || '',
    addresses: c.addresses || [],
    bankDetails: {
      bankName: c.bank_name || '',
      accountNumber: c.account_number || '',
      branch: c.branch || '',
      ifscCode: c.ifsc_code || '',
    }
  };
}

export function CompanyDetails({ company, onSave }: CompanyDetailsProps) {
  const [details, setDetails] = useState<CompanyDetailsData | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Address sub-form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrType, setAddrType] = useState('Head Office');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('Karnataka');
  const [addrPincode, setAddrPincode] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from props
  useEffect(() => {
    if (company) {
      setDetails(mapDbToCompanyDetailsData(company));
    }
  }, [company]);

  // Auto-populate city & state based on pincode mapping in DB
  useEffect(() => {
    const lookupPincode = async () => {
      if (addrPincode.length === 6) {
        try {
          const { data, error } = await supabase
            .from('pincode_mappings')
            .select('district, state')
            .eq('pincode', addrPincode)
            .maybeSingle();

          if (error) throw error;
          
          if (data) {
            // Find a matching state name in INDIAN_STATES case-insensitively
            const matchedState = INDIAN_STATES.find(
              s => s.toLowerCase() === data.state.toLowerCase()
            );
            if (matchedState) {
              setAddrState(matchedState);
            }
            // Capitalize city/district nicely
            const cityFormatted = data.district
              .split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            setAddrCity(cityFormatted);
          }
        } catch (err) {
          console.error('Error looking up pincode:', err);
        }
      }
    };

    lookupPincode();
  }, [addrPincode]);


  if (!details) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleInputChange = (field: keyof CompanyDetailsData, value: any) => {
    setDetails(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      
      // Auto-derive PAN if GSTIN is edited and is of valid length
      if (field === 'gstin' && typeof value === 'string') {
        const uppercaseVal = value.toUpperCase();
        updated.gstin = uppercaseVal;
        if (uppercaseVal.length >= 12) {
          // In India, PAN is characters index 2 to 12 of the GSTIN (e.g., 29AAFCS2193M1Z1 -> AAFCS2193M)
          updated.pan = uppercaseVal.substring(2, 12);
        }
      }
      return updated;
    });
  };

  const handleBankChange = (field: string, value: string) => {
    setDetails(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [field]: value
        }
      };
    });
  };

  // Logo uploader
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        setError('Logo file size must be less than 1.5MB');
        setTimeout(() => setError(''), 4000);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('logo', reader.result as string);
        setMessage('Logo uploaded! Save changes to persist.');
        setTimeout(() => setMessage(''), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    handleInputChange('logo', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMessage('Logo cleared! Save changes to persist.');
    setTimeout(() => setMessage(''), 3000);
  };

  // Address CRUD Handlers
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddrType('Branch Office');
    setAddrLine1('');
    setAddrCity('');
    setAddrState('Karnataka');
    setAddrPincode('');
    setShowAddressForm(true);
  };

  const handleOpenEditAddress = (addr: CompanyAddress) => {
    setEditingAddressId(addr.id);
    setAddrType(addr.type);
    setAddrLine1(addr.line1);
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrPincode(addr.pincode);
    setShowAddressForm(true);
  };

  const handleSaveAddressSubForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLine1 || !addrCity || !addrPincode) {
      setError('Please fill all address fields');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setDetails(prev => {
      if (!prev) return prev;
      let updatedAddresses = [...prev.addresses];

      if (editingAddressId) {
        // Edit existing address
        updatedAddresses = updatedAddresses.map(addr => 
          addr.id === editingAddressId 
            ? { ...addr, type: addrType, line1: addrLine1, city: addrCity, state: addrState, pincode: addrPincode }
            : addr
        );
      } else {
        // Add new address
        const newAddress: CompanyAddress = {
          id: `addr-${Date.now()}`,
          type: addrType,
          line1: addrLine1,
          city: addrCity,
          state: addrState,
          pincode: addrPincode,
          isPrimary: updatedAddresses.length === 0 // Make primary if it's the only one
        };
        updatedAddresses.push(newAddress);
      }

      return {
        ...prev,
        addresses: updatedAddresses
      };
    });

    setShowAddressForm(false);
    setEditingAddressId(null);
    setMessage(editingAddressId ? 'Address updated in buffer!' : 'Address added to buffer!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteAddress = (id: string) => {
    const addressToDelete = details.addresses.find(a => a.id === id);
    if (addressToDelete?.isPrimary) {
      setError('Cannot delete the primary address. Set another address as primary first!');
      setTimeout(() => setError(''), 4000);
      return;
    }

    if (confirm('Are you sure you want to delete this address?')) {
      setDetails(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          addresses: prev.addresses.filter(a => a.id !== id)
        };
      });
      setMessage('Address removed from list!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSetPrimaryAddress = (id: string) => {
    setDetails(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        addresses: prev.addresses.map(a => ({
          ...a,
          isPrimary: a.id === id
        }))
      };
    });
    setMessage('Primary billing address updated in buffer!');
    setTimeout(() => setMessage(''), 3000);
  };

  // Persist entire company details state
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!details.logo) {
      setError('Logo is mandatory. Please upload an image.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!details.tradeName) {
      setError('Trade name is mandatory.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!details.legalName) {
      setError('Legal name is mandatory.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!details.phone) {
      setError('Company phone is mandatory.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!details.email) {
      setError('Company email is mandatory.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!details.gstin) {
      setError('GSTIN is mandatory.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (details.addresses.length === 0) {
      setError('Please add at least one business address (mandatory).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (details.addresses.length > 3) {
      setError('You can configure up to 3 addresses only.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Ensure at least one primary address is set
    const hasPrimary = details.addresses.some(a => a.isPrimary);
    if (!hasPrimary) {
      details.addresses[0].isPrimary = true;
    }

    // Bank details check
    const { bankName, accountNumber, branch, ifscCode } = details.bankDetails;
    if (!bankName || !accountNumber || !branch || !ifscCode) {
      setError('All Bank Details (Bank Name, Account Number, Branch, IFSC Code) are mandatory.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(details);
      setMessage('Company details, bank profiles, and invoicing addresses saved successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to save company details.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="company-details-container" className="max-w-7xl mx-auto space-y-6">
      
      {/* Title Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#e2e8f0] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
            Company Details & Settings
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Configure trade branding, legal company credentials, bank details, and primary invoicing addresses.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveAll}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-extrabold shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Notifications banner */}
      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center shadow-xs animate-fade-in">
          <CheckCircle className="w-5 h-5 mr-2.5 text-emerald-600 flex-shrink-0" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-semibold flex items-center shadow-xs animate-fade-in">
          <AlertCircle className="w-5 h-5 mr-2.5 text-red-600 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Main split-screen grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (lg:col-span-7) - Basic details & Bank account */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Brand & Commercial Profile */}
          <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-[#0f172a] flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block"></span>
                Company Brand & Commercial Profile
              </h3>
              <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">
                Step 1 of 3
              </span>
            </div>

            {/* Brand Logo Section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/60 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                {details.logo ? (
                  <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center overflow-hidden shadow-xs">
                    <img src={details.logo} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-blue-600 font-extrabold text-2xl shadow-2xs">
                    {details.tradeName ? details.tradeName[0].toUpperCase() : 'B'}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Company Brand Logo</h4>
                <p className="text-xs text-slate-400">Add an image to display in top-right of your invoices.</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Image
                  </button>
                  {details.logo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Input fields form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              
              {/* Trade name */}
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Brand / Trade Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BillHive"
                  value={details.tradeName}
                  onChange={(e) => handleInputChange('tradeName', e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-[#0f172a] focus:border-[#3b82f6] font-medium"
                />
              </div>

              {/* Business Subtitle */}
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Business Subtitle <span className="text-slate-450 font-normal text-3xs lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Solutions"
                  value={details.businessSubtitle || ''}
                  onChange={(e) => handleInputChange('businessSubtitle', e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-[#0f172a] focus:border-[#3b82f6] font-medium"
                />
              </div>

              {/* Legal Name */}
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Registered Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BillHive Corporate Private Ltd"
                  value={details.legalName}
                  onChange={(e) => handleInputChange('legalName', e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-[#0f172a] focus:border-[#3b82f6] font-semibold"
                />
              </div>

              {/* Company Phone */}
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Company phone <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876500000"
                    value={details.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value.replace(/[^\d+-\s]/g, ''))}
                    className="block w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-[#0f172a] focus:border-[#3b82f6] font-mono font-medium"
                  />
                </div>
              </div>

              {/* Company Email */}
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Company Email <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="e.g. accounts@yourcompany.com"
                    value={details.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-[#0f172a] focus:border-[#3b82f6] font-medium"
                  />
                </div>
              </div>

              {/* GSTIN */}
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  GSTIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 29AAFCS2193M1Z1"
                  maxLength={15}
                  value={details.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-[#0f172a] focus:border-[#3b82f6] font-mono font-bold"
                />
              </div>

              {/* PAN (Auto Derived) */}
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
                  Income Tax PAN
                  <span className="text-slate-400 font-normal lowercase">(Derived from GST)</span>
                </label>
                <input
                  type="text"
                  disabled
                  placeholder="Auto-derived"
                  value={details.pan || ''}
                  className="mt-1.5 block w-full px-4 py-2.5 bg-slate-100 border border-[#e2e8f0] rounded-xl text-slate-500 font-mono font-bold"
                />
              </div>

              {/* Website - Optional */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Website <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Globe className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    placeholder="e.g. https://www.yourcompany.com"
                    value={details.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-[#0f172a] focus:border-[#3b82f6] font-medium text-blue-600"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Card 2: Bank Remittance Details */}
          <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-[#0f172a] flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block"></span>
                Bank Remittance Account
              </h3>
              <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">
                Step 2 of 3
              </span>
            </div>
            
            <p className="text-xs text-[#64748b]">
              This account receives bank settlement requests. Its credentials print automatically on the bottom of tax invoices.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* Bank Name */}
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <CreditCard className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. State Bank of India"
                    value={details.bankDetails.bankName}
                    onChange={(e) => handleBankChange('bankName', e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-[#0f172a] focus:border-[#3b82f6] font-semibold"
                  />
                </div>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 502000234091"
                  value={details.bankDetails.accountNumber}
                  onChange={(e) => handleBankChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                  className="mt-1.5 block w-full px-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-[#0f172a] focus:border-[#3b82f6] font-mono font-bold"
                />
              </div>

              {/* Branch */}
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MG Road Branch"
                  value={details.bankDetails.branch}
                  onChange={(e) => handleBankChange('branch', e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-[#0f172a] focus:border-[#3b82f6] font-medium"
                />
              </div>

              {/* IFSC Code */}
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBIN0001048"
                  value={details.bankDetails.ifscCode}
                  onChange={(e) => handleBankChange('ifscCode', e.target.value.toUpperCase())}
                  className="mt-1.5 block w-full px-4 py-2.5 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 text-[#0f172a] focus:border-[#3b82f6] font-mono font-bold"
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (lg:col-span-5) - Multiple address manager */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-[#0f172a] flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block"></span>
                Billing Addresses
              </h3>
              <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">
                Step 3 of 3
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-[#64748b] max-w-[70%]">
                Define multiple dispatching locations. The **1st primary address** prints automatically on customer invoices.
              </p>
              {!showAddressForm && (
                <button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="px-3 py-1.5 bg-[#f0fdf4] hover:bg-[#dcfce7] border border-emerald-200 text-emerald-800 text-xs font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Address
                </button>
              )}
            </div>

            {/* Address sub-form inside card */}
            {showAddressForm && (
              <form onSubmit={handleSaveAddressSubForm} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 animate-fade-in text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-800">
                    {editingAddressId ? 'Edit Office Address' : 'Register New Office Location'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddressId(null);
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Address Type */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">Address Type / Label</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Head Office, Warehouse, Pune Branch"
                      value={addrType}
                      onChange={(e) => setAddrType(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 bg-white"
                    />
                  </div>

                  {/* Address Line 1 */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">Address Line</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Street name, building, phase, unit"
                      value={addrLine1}
                      onChange={(e) => setAddrLine1(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 bg-white text-xs"
                    />
                  </div>

                  {/* City & State & Pincode Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">City</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bengaluru"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">Pincode</label>
                      <input
                        type="text"
                        required
                        placeholder="6 digits"
                        maxLength={6}
                        value={addrPincode}
                        onChange={(e) => setAddrPincode(e.target.value.replace(/\D/g, ''))}
                        className="mt-1 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 bg-white font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">State</label>
                      <select
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 bg-white"
                      >
                        {INDIAN_STATES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddressId(null);
                    }}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAddressSubForm}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {editingAddressId ? 'Apply Update' : 'Add to List'}
                  </button>
                </div>
              </form>
            )}

            {/* Address List */}
            <div className="space-y-4">
              {details.addresses.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 mt-2 font-medium">No registered office locations found.</p>
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="text-blue-600 font-extrabold text-xs hover:underline mt-1.5 inline-block"
                  >
                    Add primary billing address
                  </button>
                </div>
              ) : (
                details.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-xl border relative transition-all duration-200 ${
                      addr.isPrimary
                        ? 'border-blue-500 bg-blue-50/20 shadow-xs'
                        : 'border-[#e2e8f0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    {/* Badge header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{addr.type}</span>
                        {addr.isPrimary && (
                          <span className="bg-blue-100 text-blue-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 font-mono">
                            <Check className="w-2.5 h-2.5" /> PRIMARY
                          </span>
                        )}
                      </div>

                      {/* Address card actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAddress(addr)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          title="Edit Location"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!addr.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50"
                            title="Delete Location"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Address details body */}
                    <div className="text-slate-600 text-xs space-y-1 font-medium pr-6">
                      <p>{addr.line1}</p>
                      <p className="text-slate-500 text-xs">
                        {addr.city}, <span className="font-semibold text-slate-700">{addr.state}</span> - {addr.pincode}
                      </p>
                    </div>

                    {/* Set primary button if not primary */}
                    {!addr.isPrimary && (
                      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryAddress(addr.id)}
                          className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Mark as Primary Billing Location
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Prompt banner to save everything */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-sm">
            <h4 className="font-extrabold text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Save Configuration
            </h4>
            <p className="text-xs text-slate-300">
              Your modifications are cached locally inside the sandbox memory space. Press "Save Changes" to write them permanently and dynamically update all tax documents.
            </p>
            <button
              type="button"
              onClick={handleSaveAll}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Settings Profiles
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
