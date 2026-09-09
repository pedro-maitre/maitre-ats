import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  if (process.env.NODE_ENV === "production") {
    console.error("ERRO CRÍTICO: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes no ambiente.");
  }
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-anon-key"
);

