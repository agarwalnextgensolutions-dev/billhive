-- Create pincode_mappings table
create table if not exists public.pincode_mappings (
  pincode text primary key,
  district text not null,
  state text not null
);
