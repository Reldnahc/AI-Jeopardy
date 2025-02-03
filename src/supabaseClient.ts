import { createClient } from "@supabase/supabase-js";

// Replace these values with your Supabase project details found in the Supabase dashboard
const supabaseUrl = 'https://ninlqlhpkxyckertjlyh.supabase.co'; // Your Supabase URL
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pbmxxbGhwa3h5Y2tlcnRqbHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MjgzODIsImV4cCI6MjA1NDAwNDM4Mn0.X1ArteKjxLnPxPwJmkJh9qyeatwslwJ5MS2mc_f4AI4"; // anon key safe.

export const supabase = createClient(supabaseUrl, supabaseKey);