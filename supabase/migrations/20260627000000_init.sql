-- Create companies table
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  phone text unique not null,
  trade_name text,
  business_subtitle text,
  legal_name text,
  company_phone text,
  company_email text,
  gstin text,
  pan text,
  website text,
  logo text,
  addresses jsonb default '[]'::jsonb,
  bank_name text,
  account_number text,
  branch text,
  ifsc_code text,
  is_setup_completed boolean default false,
  created_at timestamptz default now()
);

-- Create products table
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  name text not null,
  sku text,
  hsn_code text not null,
  description text,
  parameters jsonb default '{"OD": false, "ID": false, "TH": false, "Table": false, "Size": false, "Quantity": true, "RF": false, "PCD": false, "HD": false}'::jsonb not null,
  price numeric not null,
  gst_rate numeric not null,
  unit text not null,
  created_at timestamptz default now()
);

-- Create customers table
create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  company_name text not null,
  addresses jsonb default '[]'::jsonb not null,
  bank_details jsonb default '{}'::jsonb,
  spoc_details jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Create invoices table
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  invoice_number text not null,
  date date not null,
  customer_name text not null,
  customer_id uuid references public.customers(id) on delete set null,
  amount numeric not null,
  status text not null default 'Pending',
  payment_mode text,
  eway_bill_no text,
  delivery_note text,
  reference_number text,
  reference_date date,
  dispatch_doc_no text,
  dispatch_through text,
  destination text,
  terms_of_delivery text,
  billing_address jsonb not null,
  shipping_address jsonb not null,
  items jsonb default '[]'::jsonb not null,
  tax_cgst numeric not null default 0,
  tax_sgst numeric not null default 0,
  tax_igst numeric not null default 0,
  pdf_data text,
  created_at timestamptz default now()
);
