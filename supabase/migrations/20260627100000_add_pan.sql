-- Add pan column to companies table
alter table public.companies add column if not exists pan text;
