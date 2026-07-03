import { CompanyDetailsData } from '../types';

export const DEFAULT_COMPANY_DETAILS: CompanyDetailsData = {
  logo: '',
  tradeName: 'BillHive',
  legalName: 'BillHive Corporate Private Ltd',
  phone: '9876500000',
  email: 'billing@billhive.io',
  gstin: '29AAFCS2193M1Z1',
  pan: 'AAFCS2193M',
  website: 'https://billhive.io',
  addresses: [
    {
      id: 'addr-1',
      type: 'Head Office',
      line1: 'Tech Park, Phase II',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      isPrimary: true
    },
    {
      id: 'addr-2',
      type: 'Warehouse Block-D',
      line1: 'Plot 45, Chakan Industrial Phase 2',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '410501',
      isPrimary: false
    }
  ],
  bankDetails: {
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200049102481',
    branch: 'Bengaluru MG Road',
    ifscCode: 'HDFC0001201'
  }
};

export function getCompanyDetails(): CompanyDetailsData {
  const saved = localStorage.getItem('billhive_company_details');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure basic structure is intact
      if (parsed && parsed.legalName && Array.isArray(parsed.addresses)) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse company details', e);
    }
  }
  return DEFAULT_COMPANY_DETAILS;
}

export function saveCompanyDetails(details: CompanyDetailsData) {
  localStorage.setItem('billhive_company_details', JSON.stringify(details));
  // Dispatch custom event to notify other components of changes
  window.dispatchEvent(new Event('company_details_updated'));
}
