import { createClient } from "@supabase/supabase-js";

// Falls back to the project's public values so the app runs even without a
// local .env. The publishable (anon) key is meant to be shipped to the
// browser; row-level security controls what it can actually touch.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://ycemutfyuvivrobozsmn.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_ALVmE9cpJrlSahhpOKRzfg_DghR_yne";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
