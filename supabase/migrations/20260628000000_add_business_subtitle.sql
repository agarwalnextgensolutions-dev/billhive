-- Add business_subtitle column to companies table
alter table public.companies add column if not exists business_subtitle text;
