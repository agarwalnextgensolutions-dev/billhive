import React, { useState, useEffect } from 'react';
import { Customer, SPOCDetails, CustomerAddress, AppUser } from '../types';
import { User, Building, Landmark, Save, RotateCcw, AlertCircle, Plus, Trash2, MapPin, Lock } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import {
  canUserUpdateCustomerContact,
  canUserUpdateCustomerBank,
  canUserViewCustomerContact,
  canUserViewCustomerBank,
} from '../utils/userHelper';

interface AddCustomerProps {
  onSaveCustomer: (customer: Customer) => void;
  onCancel: () => void;
  editingCustomer?: Customer | null;
  currentUser?: AppUser | null;
}

interface StateInfo {
  state: string;
  code: string;
}

const PINCODE_MAP: Record<string, StateInfo> = {
  '11': { state: 'Delhi', code: '07' },
  '12': { state: 'Haryana', code: '06' },
  '13': { state: 'Haryana', code: '06' },
  '14': { state: 'Punjab', code: '03' },
  '15': { state: 'Punjab', code: '03' },
  '16': { state: 'Punjab', code: '03' },
  '17': { state: 'Himachal Pradesh', code: '02' },
  '18': { state: 'Jammu and Kashmir', code: '01' },
  '19': { state: 'Jammu and Kashmir', code: '01' },
  '20': { state: 'Uttar Pradesh', code: '09' },
  '21': { state: 'Uttar Pradesh', code: '09' },
  '22': { state: 'Uttar Pradesh', code: '09' },
  '23': { state: 'Uttar Pradesh', code: '09' },
  '24': { state: 'Uttar Pradesh', code: '09' },
  '25': { state: 'Uttar Pradesh', code: '09' },
  '26': { state: 'Uttar Pradesh', code: '09' },
  '27': { state: 'Uttar Pradesh', code: '09' },
  '28': { state: 'Uttar Pradesh', code: '09' },
  '30': { state: 'Rajasthan', code: '08' },
  '31': { state: 'Rajasthan', code: '08' },
  '32': { state: 'Rajasthan', code: '08' },
  '33': { state: 'Rajasthan', code: '08' },
  '34': { state: 'Rajasthan', code: '08' },
  '36': { state: 'Gujarat', code: '24' },
  '37': { state: 'Gujarat', code: '24' },
  '38': { state: 'Gujarat', code: '24' },
  '39': { state: 'Gujarat', code: '24' },
  '40': { state: 'Maharashtra', code: '27' },
  '41': { state: 'Maharashtra', code: '27' },
  '42': { state: 'Maharashtra', code: '27' },
  '43': { state: 'Maharashtra', code: '27' },
  '44': { state: 'Maharashtra', code: '27' },
  '45': { state: 'Madhya Pradesh', code: '23' },
  '46': { state: 'Madhya Pradesh', code: '23' },
  '47': { state: 'Madhya Pradesh', code: '23' },
  '48': { state: 'Madhya Pradesh', code: '23' },
  '49': { state: 'Chhattisgarh', code: '22' },
  '50': { state: 'Telangana', code: '36' },
  '51': { state: 'Andhra Pradesh', code: '37' },
  '52': { state: 'Andhra Pradesh', code: '37' },
  '53': { state: 'Andhra Pradesh', code: '37' },
  '56': { state: 'Karnataka', code: '29' },
  '57': { state: 'Karnataka', code: '29' },
  '58': { state: 'Karnataka', code: '29' },
  '59': { state: 'Karnataka', code: '29' },
  '60': { state: 'Tamil Nadu', code: '33' },
  '61': { state: 'Tamil Nadu', code: '33' },
  '62': { state: 'Tamil Nadu', code: '33' },
  '63': { state: 'Tamil Nadu', code: '33' },
  '64': { state: 'Tamil Nadu', code: '33' },
  '67': { state: 'Kerala', code: '32' },
  '68': { state: 'Kerala', code: '32' },
  '69': { state: 'Kerala', code: '32' },
  '70': { state: 'West Bengal', code: '19' },
  '71': { state: 'West Bengal', code: '19' },
  '72': { state: 'West Bengal', code: '19' },
  '73': { state: 'West Bengal', code: '19' },
  '74': { state: 'West Bengal', code: '19' },
  '75': { state: 'Odisha', code: '21' },
  '76': { state: 'Odisha', code: '21' },
  '77': { state: 'Odisha', code: '21' },
  '78': { state: 'Assam', code: '18' },
  '79': { state: 'Meghalaya', code: '17' },
  '80': { state: 'Bihar', code: '10' },
  '81': { state: 'Bihar', code: '10' },
  '82': { state: 'Bihar', code: '10' },
  '83': { state: 'Bihar', code: '10' },
  '84': { state: 'Bihar', code: '10' },
  '85': { state: 'Bihar', code: '10' },
};

const GST_STATE_CODE_MAP: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

const resolveStateAndCityFromPincode = (pin: string) => {
  if (pin.length < 2) return null;
  const prefix2 = pin.substring(0, 2);
  const stateInfo = PINCODE_MAP[prefix2];
  if (!stateInfo) return null;

  let suggestedCity = '';
  if (prefix2 === '11') suggestedCity = 'New Delhi';
  else if (prefix2 === '40') suggestedCity = 'Mumbai';
  else if (prefix2 === '41') suggestedCity = 'Pune';
  else if (prefix2 === '56') suggestedCity = 'Bengaluru';
  else if (prefix2 === '60') suggestedCity = 'Chennai';
  else if (prefix2 === '70') suggestedCity = 'Kolkata';
  else if (prefix2 === '50') suggestedCity = 'Hyderabad';
  else if (prefix2 === '38') suggestedCity = 'Ahmedabad';
  else if (prefix2 === '12') suggestedCity = 'Gurugram';
  else if (prefix2 === '20') suggestedCity = 'Noida';
  else if (prefix2 === '30') suggestedCity = 'Jaipur';
  else if (prefix2 === '80') suggestedCity = 'Patna';
  else if (prefix2 === '57') suggestedCity = 'Mangalore';
  else if (prefix2 === '68') suggestedCity = 'Kochi';
  else if (prefix2 === '36') suggestedCity = 'Surat';

  return {
    state: stateInfo.state,
    stateCode: stateInfo.code,
    city: suggestedCity,
  };
};

const resolveStateFromGstin = (gst: string) => {
  if (gst.length < 2) return null;
  const code = gst.substring(0, 2);
  const stateName = GST_STATE_CODE_MAP[code];
  if (stateName) {
    return {
      state: stateName,
      stateCode: code,
    };
  }
  return null;
};

export function AddCustomer({ onSaveCustomer, onCancel, editingCustomer, currentUser }: AddCustomerProps) {
  // Access control
  const canViewBank = canUserViewCustomerBank(currentUser);
  const canEditBank = canUserUpdateCustomerBank(currentUser);
  const canViewContact = canUserViewCustomerContact(currentUser);
  const canEditContact = canUserUpdateCustomerContact(currentUser);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [addresses, setAddresses] = useState<CustomerAddress[]>([
    { type: 'Billing Address', gstin: '', line1: '', pincode: '', city: '', state: '', stateCode: '' }
  ]);

  // Bank details state
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // POC details state (supports multiple POCs max 5)
  const [pocs, setPocs] = useState<SPOCDetails[]>([
    { name: '', email: '', mobileNumber: '' }
  ]);

  // Helper States
  const [formError, setFormError] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (editingCustomer) {
      setCompanyName(editingCustomer.companyName);
      
      setBankName(editingCustomer.bankDetails?.bankName || '');
      setAccountNumber(editingCustomer.bankDetails?.accountNumber || '');
      setBranch(editingCustomer.bankDetails?.branch || '');
      setIfscCode(editingCustomer.bankDetails?.ifscCode || '');

      if (editingCustomer.pocs && editingCustomer.pocs.length > 0) {
        setPocs(editingCustomer.pocs);
      } else if (editingCustomer.spocDetails) {
        setPocs([
          {
            name: editingCustomer.spocDetails.name || '',
            email: editingCustomer.spocDetails.email || '',
            mobileNumber: editingCustomer.spocDetails.mobileNumber || ''
          }
        ]);
      } else {
        setPocs([{ name: '', email: '', mobileNumber: '' }]);
      }

      if (editingCustomer.addresses && editingCustomer.addresses.length > 0) {
        setAddresses(editingCustomer.addresses);
      } else {
        // Build fallback address from legacy fields
        setAddresses([
          {
            type: 'Billing Address',
            gstin: editingCustomer.gstin || '',
            line1: editingCustomer.address || '',
            pincode: '',
            city: '',
            state: editingCustomer.state || '',
            stateCode: editingCustomer.gstin ? editingCustomer.gstin.substring(0, 2) : ''
          }
        ]);
      }
    }
  }, [editingCustomer]);

  const handleAddAddress = () => {
    if (addresses.length >= 5) return;
    setAddresses([
      ...addresses,
      { type: 'Billing Address', gstin: '', line1: '', pincode: '', city: '', state: '', stateCode: '' }
    ]);
  };

  const handleRemoveAddress = (index: number) => {
    if (addresses.length <= 1) return;
    setAddresses(addresses.filter((_, idx) => idx !== index));
  };

  const lookupPincodeFromDb = async (index: number, pin: string) => {
    try {
      const { data, error } = await supabase
        .from('pincode_mappings')
        .select('district, state')
        .eq('pincode', pin)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        // Format city nicely
        const cityFormatted = data.district
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        // Find matching state name in GST_STATE_CODE_MAP
        const stateLower = data.state.toLowerCase();
        let matchedStateName = data.state;
        let matchedStateCode = '';
        
        const found = Object.entries(GST_STATE_CODE_MAP).find(
          ([_, name]) => name.toLowerCase() === stateLower
        );
        if (found) {
          matchedStateCode = found[0];
          matchedStateName = found[1];
        }

        setAddresses(prev => prev.map((addr, idx) => {
          if (idx !== index) return addr;
          return {
            ...addr,
            city: cityFormatted,
            state: matchedStateName,
            stateCode: matchedStateCode || addr.stateCode
          };
        }));
      }
    } catch (err) {
      console.error('Error fetching pincode from DB:', err);
    }
  };

  const handleAddressChange = (index: number, field: keyof CustomerAddress, value: string) => {
    setAddresses(prev => prev.map((addr, idx) => {
      if (idx !== index) return addr;
      
      const updated = { ...addr, [field]: value };

      if (field === 'gstin') {
        const uppercaseGst = value.toUpperCase();
        updated.gstin = uppercaseGst;
        if (uppercaseGst.length >= 2) {
          const resolved = resolveStateFromGstin(uppercaseGst);
          if (resolved) {
            updated.state = resolved.state;
            updated.stateCode = resolved.stateCode;
          }
        }
      }

      if (field === 'pincode') {
        const cleanPin = value.replace(/\D/g, '').substring(0, 6);
        updated.pincode = cleanPin;
        if (cleanPin.length === 6) {
          lookupPincodeFromDb(index, cleanPin);
        } else if (cleanPin.length >= 2) {
          const resolved = resolveStateAndCityFromPincode(cleanPin);
          if (resolved) {
            updated.state = resolved.state;
            updated.stateCode = resolved.stateCode;
            if (resolved.city && (!addr.city || addr.city.trim() === '')) {
              updated.city = resolved.city;
            }
          }
        }
      }

      if (field === 'state') {
        const stateNameLower = value.trim().toLowerCase();
        const foundEntry = Object.entries(GST_STATE_CODE_MAP).find(
          ([_, name]) => name.toLowerCase() === stateNameLower
        );
        if (foundEntry) {
          updated.stateCode = foundEntry[0];
        }
      }

      return updated;
    }));
  };

  const handleAddPoc = () => {
    if (pocs.length >= 5) return;
    setPocs([...pocs, { name: '', email: '', mobileNumber: '' }]);
  };

  const handleRemovePoc = (index: number) => {
    if (pocs.length <= 1) return;
    setPocs(pocs.filter((_, idx) => idx !== index));
  };

  const handlePocChange = (index: number, field: keyof SPOCDetails, value: string) => {
    setPocs(pocs.map((poc, idx) => {
      if (idx === index) {
        return { ...poc, [field]: value };
      }
      return poc;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mandatory validations
    if (!companyName.trim()) {
      setFormError('Please fill out the Company Name.');
      return;
    }

    if (addresses.length === 0) {
      setFormError('Please add at least one address.');
      return;
    }

    // Validate each address
    for (let i = 0; i < addresses.length; i++) {
      const addr = addresses[i];
      if (!addr.type) {
        setFormError(`Please select Type for Address #${i + 1}.`);
        return;
      }
      if (!addr.gstin.trim()) {
        setFormError(`Please enter GSTIN for Address #${i + 1}.`);
        return;
      }
      if (addr.gstin.trim().length !== 15) {
        setFormError(`GSTIN for Address #${i + 1} must be exactly 15 characters.`);
        return;
      }
      if (!addr.line1.trim()) {
        setFormError(`Please enter Address (Line 1) for Address #${i + 1}.`);
        return;
      }
      if (!addr.pincode.trim()) {
        setFormError(`Please enter Pincode for Address #${i + 1}.`);
        return;
      }
      if (addr.pincode.trim().length !== 6) {
        setFormError(`Pincode for Address #${i + 1} must be exactly 6 digits.`);
        return;
      }
      if (!addr.city.trim()) {
        setFormError(`Please enter City for Address #${i + 1}.`);
        return;
      }
    }

    setFormError('');

    // Fallbacks for legacy/backwards compatibility
    const firstAddr = addresses[0];
    const legacyAddress = `${firstAddr.line1}, ${firstAddr.city} - ${firstAddr.pincode}`;
    const legacyState = firstAddr.state;
    const legacyGstin = firstAddr.gstin.toUpperCase();

    const finalBankDetails = canEditBank
      ? {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          branch: branch.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
        }
      : (editingCustomer?.bankDetails || {
          bankName: '',
          accountNumber: '',
          branch: '',
          ifscCode: '',
        });

    const finalSpocDetails = canEditContact
      ? {
          name: pocs[0]?.name.trim() || 'N/A',
          email: pocs[0]?.email.trim() || 'N/A',
          mobileNumber: pocs[0]?.mobileNumber.trim() || 'N/A',
        }
      : (editingCustomer?.spocDetails || {
          name: 'N/A',
          email: 'N/A',
          mobileNumber: 'N/A',
        });

    const finalPocs = canEditContact
      ? pocs.map(p => ({
          name: p.name.trim(),
          email: p.email.trim(),
          mobileNumber: p.mobileNumber.trim()
        }))
      : (editingCustomer?.pocs || []);

    const customerData: Customer = {
      id: editingCustomer ? editingCustomer.id : 'new-' + Math.random().toString(36).substring(2, 9),
      companyName: companyName.trim(),
      address: legacyAddress,
      state: legacyState,
      gstin: legacyGstin,
      bankDetails: finalBankDetails,
      spocDetails: finalSpocDetails,
      pocs: finalPocs,
      addresses: addresses.map((addr, idx) => ({
        type: addr.type,
        gstin: addr.gstin.trim().toUpperCase(),
        line1: addr.line1.trim(),
        pincode: addr.pincode.trim(),
        city: addr.city.trim(),
        state: addr.state,
        stateCode: addr.stateCode,
        isPrimary: idx === 0 // 1st address is primary
      }))
    };

    onSaveCustomer(customerData);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to clear the form?')) {
      setCompanyName('');
      setAddresses([
        { type: 'Billing Address', gstin: '', line1: '', pincode: '', city: '', state: '', stateCode: '' }
      ]);
      setBankName('');
      setAccountNumber('');
      setBranch('');
      setIfscCode('');
      setPocs([{ name: '', email: '', mobileNumber: '' }]);
      setFormError('');
    }
  };

  return (
    <div id="add-customer-container" className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e2e8f0] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b]">Provide company, multiple addresses with GSTIN/Pincode lookup, banking, and point-of-contact details.</p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs sm:text-sm font-semibold text-[#3b82f6] hover:text-[#2563eb] transition-colors cursor-pointer self-start sm:self-auto"
        >
          Cancel & Return
        </button>
      </div>

      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium flex items-center shadow-2xs">
          <AlertCircle className="w-5 h-5 mr-2 text-rose-600 flex-shrink-0" />
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: MANDATORY COMPANY DETAILS */}
        <div className="bg-white p-6 rounded-lg border border-[#e2e8f0] shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-slate-900 border-b border-[#e2e8f0] pb-3">
            <Building className="w-5 h-5 text-[#3b82f6]" />
            <h3 className="font-bold text-base">Company & Registration Profile</h3>
          </div>

          <div className="space-y-6">
            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-semibold text-slate-700">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                required
                placeholder="ABC Technologies Private Limited"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-2 block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm text-[#0f172a] bg-white transition-all"
              />
            </div>

            {/* Address Management Section */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#3b82f6]" />
                    Addresses ({addresses.length}/5)
                  </h4>
                  <p className="text-xs text-slate-500">Configure up to 5 regional addresses, warehouses, or billing points.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddAddress}
                  disabled={addresses.length >= 5}
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-lg text-white bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Address
                </button>
              </div>

              {/* Address List */}
              <div className="space-y-5">
                {addresses.map((addr, idx) => (
                  <div key={idx} className="p-5 bg-slate-50/50 rounded-xl border border-[#e2e8f0] relative space-y-4">
                    {/* Address Header */}
                    <div className="flex items-center justify-between border-b border-[#e2e8f0]/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          {idx === 0 ? 'Primary Address (Default billing)' : `Additional Location #${idx + 1}`}
                        </span>
                      </div>
                      {addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAddress(idx)}
                          className="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Address Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Address Type Select */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600">
                          Address Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={addr.type}
                          onChange={(e) => handleAddressChange(idx, 'type', e.target.value)}
                          className="mt-1.5 block w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-xs bg-white text-[#0f172a] font-medium"
                        >
                          <option value="Billing Address">Billing Address</option>
                          <option value="Shipping Address">Shipping Address</option>
                          <option value="Warehouse Location">Warehouse Location</option>
                          <option value="Corporate HQ">Corporate HQ</option>
                          <option value="Branch Office">Branch Office</option>
                          <option value="Registered Office">Registered Office</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* GSTIN for this location */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600">
                          GSTIN <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={15}
                          placeholder="15-digit GSTIN (e.g. 27AADCB2230M1ZT)"
                          value={addr.gstin}
                          onChange={(e) => handleAddressChange(idx, 'gstin', e.target.value)}
                          className="mt-1.5 block w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-xs font-mono tracking-wider text-[#0f172a] bg-white uppercase"
                        />
                      </div>

                      {/* Line 1 (Street and Building) */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600">
                          Address Line 1 (Street, Building, Area) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Plot / Office No., Building, Area Name, Landmark"
                          value={addr.line1}
                          onChange={(e) => handleAddressChange(idx, 'line1', e.target.value)}
                          className="mt-1.5 block w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-xs text-[#0f172a] bg-white"
                        />
                      </div>

                      {/* Pincode, City, State Grid Block */}
                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Pincode */}
                        <div>
                          <label className="block text-xs font-bold text-slate-600">
                            Pincode <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="6-digit Pincode (e.g. 411045)"
                            value={addr.pincode}
                            onChange={(e) => handleAddressChange(idx, 'pincode', e.target.value)}
                            className="mt-1.5 block w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-xs font-mono text-[#0f172a] bg-white"
                          />
                        </div>

                        {/* City */}
                        <div>
                          <label className="block text-xs font-bold text-slate-600">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="City / District"
                            value={addr.city}
                            onChange={(e) => handleAddressChange(idx, 'city', e.target.value)}
                            className="mt-1.5 block w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-xs text-[#0f172a] bg-white"
                          />
                        </div>

                        {/* State */}
                        <div>
                          <label className="block text-xs font-bold text-slate-600">
                            State <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="State Name"
                            value={addr.state}
                            onChange={(e) => handleAddressChange(idx, 'state', e.target.value)}
                            className="mt-1.5 block w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-xs text-[#0f172a] bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: BANK DETAILS */}
        <div className="bg-white p-6 rounded-lg border border-[#e2e8f0] shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-slate-900 border-b border-[#e2e8f0] pb-3">
            <Landmark className="w-5 h-5 text-[#3b82f6]" />
            <h3 className="font-bold text-base">Bank Details (Optional)</h3>
          </div>

          {!canViewBank ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>You do not have permission to view or manage banking details. Existing bank details will be preserved.</span>
            </div>
          ) : (
            <>
              {!canEditBank && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>You have view-only access to banking details. Inputs are read-only.</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Bank Name */}
                <div>
                  <label htmlFor="bankName" className="block text-sm font-semibold text-slate-700">
                    Bank Name
                  </label>
                  <input
                    id="bankName"
                    type="text"
                    disabled={!canEditBank}
                    placeholder="HDFC Bank, ICICI Bank, SBI etc."
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="mt-2 block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-semibold text-slate-700">
                    Account Number
                  </label>
                  <input
                    id="accountNumber"
                    type="text"
                    disabled={!canEditBank}
                    placeholder="Enter bank account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    className="mt-2 block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm font-mono disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label htmlFor="branch" className="block text-sm font-semibold text-slate-700">
                    Branch
                  </label>
                  <input
                    id="branch"
                    type="text"
                    disabled={!canEditBank}
                    placeholder="Enter branch name"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="mt-2 block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* IFSC Code */}
                <div>
                  <label htmlFor="ifscCode" className="block text-sm font-semibold text-slate-700">
                    IFSC Code
                  </label>
                  <input
                    id="ifscCode"
                    type="text"
                    disabled={!canEditBank}
                    placeholder="e.g. HDFC0001201"
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="mt-2 block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm font-mono disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* SECTION 3: SPOC DETAILS */}
        <div className="bg-white p-6 rounded-lg border border-[#e2e8f0] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
            <div className="flex items-center space-x-2 text-slate-900">
              <User className="w-5 h-5 text-[#3b82f6]" />
              <h3 className="font-bold text-base">Points of Contact (POC)</h3>
            </div>
            {canEditContact && (
              <button
                type="button"
                onClick={handleAddPoc}
                disabled={pocs.length >= 5}
                className="px-3 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                Add POC ({pocs.length}/5)
              </button>
            )}
          </div>

          {!canViewContact ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>You do not have permission to view or manage contact details. Existing contacts will be preserved.</span>
            </div>
          ) : (
            <>
              {!canEditContact && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>You have view-only access to contact details. Inputs are read-only.</span>
                </div>
              )}
              <div className="space-y-6">
                {pocs.map((poc, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/50 rounded-lg border border-[#e2e8f0] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
                      <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                        POC #{idx + 1} {idx === 0 ? '(Primary SPOC)' : ''}
                      </span>
                      {canEditContact && pocs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePoc(idx)}
                          className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove Point of Contact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* POC Name */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          Contact Person Name
                        </label>
                        <input
                          type="text"
                          disabled={!canEditContact}
                          placeholder="e.g. Mayank P H"
                          value={poc.name}
                          onChange={(e) => handlePocChange(idx, 'name', e.target.value)}
                          className="mt-2 block w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* POC Email */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          disabled={!canEditContact}
                          placeholder="e.g. mayank@abc.com"
                          value={poc.email}
                          onChange={(e) => handlePocChange(idx, 'email', e.target.value)}
                          className="mt-2 block w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* POC Mobile */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          Contact Mobile Number
                        </label>
                        <input
                          type="tel"
                          disabled={!canEditContact}
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={poc.mobileNumber}
                          onChange={(e) => handlePocChange(idx, 'mobileNumber', e.target.value.replace(/\D/g, ''))}
                          className="mt-2 block w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-sm font-mono disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ACTIONS PANEL */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            id="btn-customer-reset"
            onClick={handleReset}
            className="w-full sm:w-auto px-5 py-3 border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#64748b] font-semibold text-sm rounded-lg flex items-center justify-center shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset Fields
          </button>
          <button
            type="submit"
            id="btn-customer-save"
            className="w-full sm:w-auto px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-sm rounded-lg flex items-center justify-center shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {editingCustomer ? 'Update Customer Record' : 'Save Customer Record'}
          </button>
        </div>
      </form>
    </div>
  );
}
