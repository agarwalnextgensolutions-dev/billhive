-- Add pdf_data column to invoices table
alter table public.invoices add column if not exists pdf_data text;
