export interface SPOCDetails {
  name: string;
  email: string;
  mobileNumber: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  branch: string;
  ifscCode: string;
}

export interface Customer {
  id: string;
  companyName: string;
  address: string;
  state: string;
  gstin: string;
  bankDetails: BankDetails;
  spocDetails: SPOCDetails;
  pocs?: SPOCDetails[];
  addresses?: CustomerAddress[];
}

export interface CustomerAddress {
  id?: string;
  type: string; // e.g. Billing, Shipping, Warehouse, etc.
  gstin: string;
  line1: string; // Street and Building
  pincode: string;
  city: string;
  state: string;
  stateCode: string;
}

export interface InvoiceItem {
  name: string;
  hsnCode: string;
  quantity: number;
  unit: string; // e.g. KG, Nos
  rate: number;
  amount: number;
  parameters?: Record<string, string>; // parameter label -> parameter value
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerId?: string;
  amount: number;
  date: string;
  state: string;
  status: 'Paid' | 'Pending' | 'Cancelled';
  paymentMode?: 'Cash' | 'UPI' | 'Net Banking' | 'Card' | string;
  ewayBillNo?: string;
  deliveryNote?: string;
  referenceNumber?: string;
  referenceDate?: string;
  dispatchDocNo?: string;
  dispatchThrough?: string;
  destination?: string;
  termsOfDelivery?: string;
  shipToAddress?: CustomerAddress;
  billingAddress?: CustomerAddress;
  items?: InvoiceItem[];
  taxCgst?: number;
  taxSgst?: number;
  taxIgst?: number;
  pdfData?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  hsnCode: string;
  description?: string;
  parameters: {
    OD: boolean;
    ID: boolean;
    TH: boolean;
    Table: boolean;
    Size: boolean;
    Quantity: boolean;
    RF: boolean;
    PCD: boolean;
    HD: boolean;
  };
  price: number;
  gstRate: number; // e.g. 18 for 18%
  unit: string; // e.g. PCS, BOX, KG
}

export type SidebarTab =
  | 'invoicing-dashboard'
  | 'new-invoice'
  | 'current-customers'
  | 'add-customer'
  | 'current-products'
  | 'add-product'
  | 'eway-bill'
  | 'company-details';

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
];

export interface CompanyAddress {
  id: string;
  type: string; // e.g. Head Office, Warehouse, Branch
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isPrimary: boolean;
}

export interface CompanyDetailsData {
  logo?: string; // base64 URL or image path
  tradeName: string;
  businessSubtitle?: string;
  legalName: string;
  phone: string;
  email: string;
  gstin: string;
  pan?: string;
  website?: string;
  addresses: CompanyAddress[];
  bankDetails: BankDetails;
}

