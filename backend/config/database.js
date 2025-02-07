import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
    'https://ninlqlhpkxyckertjlyh.supabase.co',
    process.env.SUPABASE_KEY
);