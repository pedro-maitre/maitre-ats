import { createClient } from "@supabase/supabase-js";

// Hardcoded fallback for Vercel deployments where env vars might not be set yet
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yqnlcwglyxqsemqhjkmp.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Gaj8GoRPDXpDZ0mGaVJU9Q_fXOEir_3";

export const supabase = createClient(supabaseUrl, supabaseKey);
