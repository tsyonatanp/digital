-- Remove apartment_number column from users table
ALTER TABLE public.users DROP COLUMN IF EXISTS apartment_number; 