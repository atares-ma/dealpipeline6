import { supabase } from "./supabase";

/* Supabase column names mirror the UI field names 1:1, so mapping is light —
   we only coerce Postgres `numeric` (size/revenue/margin) to JS numbers. */
const num = (v) => (v == null ? v : Number(v));

const mapDeal = (d) => ({ ...d, size: num(d.size) });
const mapTarget = (t) => ({ ...t, revenue: num(t.revenue), margin: num(t.margin) });

export async function fetchAll() {
  const [deals, targets, mandates] = await Promise.all([
    supabase.from("deals").select("*").order("created_at", { ascending: true }).order("id", { ascending: true }),
    supabase.from("targets").select("*").order("created_at", { ascending: true }).order("id", { ascending: true }),
    supabase.from("mandates").select("*").order("created_at", { ascending: true }).order("id", { ascending: true }),
  ]);
  const err = deals.error || targets.error || mandates.error;
  if (err) throw err;
  return {
    deals: deals.data.map(mapDeal),
    targets: targets.data.map(mapTarget),
    mandates: mandates.data,
  };
}

export async function insertDeal(deal) {
  const { data, error } = await supabase.from("deals").insert(deal).select().single();
  if (error) throw error;
  return mapDeal(data);
}

export async function updateDeal(id, patch) {
  const { data, error } = await supabase.from("deals").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return mapDeal(data);
}
