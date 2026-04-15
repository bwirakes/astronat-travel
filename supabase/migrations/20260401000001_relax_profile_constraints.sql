-- Relax NOT NULL constraints on profiles since users authenticate before filling out their birth data
ALTER TABLE public.profiles ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN birth_date DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN birth_city DROP NOT NULL;
