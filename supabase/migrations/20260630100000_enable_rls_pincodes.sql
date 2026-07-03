-- Enable Row Level Security (RLS) on pincode_mappings
alter table public.pincode_mappings enable row level security;

-- Create policy to allow public select/read access to pincodes
create policy "Allow public read access to pincode_mappings"
on public.pincode_mappings
for select
using (true);
