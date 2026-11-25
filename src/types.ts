export interface SoftDeleteMeta {
  isDeleted: boolean;
  deletedAt: string;
  deletedBy: string;
  deletedByName?: string;
  previousStatus?: string;
}

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
  _deleted?: SoftDeleteMeta;
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
  _deleted?: SoftDeleteMeta;
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
  _deleted?: SoftDeleteMeta;
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
  status: 'Paid' | 'Pending' | 'Cancelled' | 'Deleted';
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
  _deleted?: SoftDeleteMeta;
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
    _deleted?: SoftDeleteMeta;
  };
  price: number;
  gstRate: number; // e.g. 18 for 18%
  unit: string; // e.g. PCS, BOX, KG
  _deleted?: SoftDeleteMeta;
}

export type SidebarTab =
  | 'admin-panel'
  | 'invoicing-dashboard'
  | 'new-invoice'
  | 'current-customers'
  | 'add-customer'
  | 'current-products'
  | 'add-product'
  | 'eway-bill'
  | 'company-details';

export interface ModulePermissions {
  view: boolean;
  update: boolean; // create and edit
  delete: boolean; // soft delete
  export: boolean; // download / export
}

export interface CustomerModulePermissions extends ModulePermissions {
  viewContact: boolean;
  updateContact: boolean;
  viewBank: boolean;
  updateBank: boolean;
}

export interface UserAccesses {
  invoicing: ModulePermissions;
  customers: CustomerModulePermissions;
  product: ModulePermissions;
  ewayBill: ModulePermissions;
  companyDetails: ModulePermissions;
  userManagement: ModulePermissions;
}

export interface AppUser {
  id: string;
  userId: string; // unique identifier (e.g. "Angs")
  username?: string; // alias for userId
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'user';
  accesses: UserAccesses;
  createdAt: string;
  updatedAt?: string;
}

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

