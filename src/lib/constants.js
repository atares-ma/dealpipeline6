/* Deal Pipeline — presentation config.
   Stages (order), sectors (colors) and leads (avatars) are display reference
   data, not mutable business records, so they live in the frontend. The
   mutable records — deals, targets, mandates — come from Supabase. */

export const STAGES = [
  { id: "sourcing", name: "Sourcing" },
  { id: "nda", name: "NDA Signed" },
  { id: "loi", name: "LOI" },
  { id: "dd", name: "Due Diligence" },
  { id: "closing", name: "Closing" },
];

export const SECTORS = {
  Industrials: "#3E5C8A",
  Healthcare: "#0E9D6B",
  Technology: "#5B6FB0",
  Consumer: "#B07B4F",
  "Financial Services": "#4A6FA5",
  Energy: "#7A8550",
  Logistics: "#6B7A99",
};

export const LEADS = [
  { id: "ml", name: "Marta Lindqvist", initials: "ML" },
  { id: "jd", name: "Julien Doré", initials: "JD" },
  { id: "av", name: "Anders Vik", initials: "AV" },
  { id: "ph", name: "Priya Haldar", initials: "PH" },
  { id: "ck", name: "Clara Köhler", initials: "CK" },
  { id: "tr", name: "Tomas Renner", initials: "TR" },
];

// deterministic navy/teal-tinted hue per lead, used by the avatar gradient
export const LEAD_HUES = { ml: 212, jd: 26, av: 168, ph: 280, ck: 200, tr: 142 };

// Baked-in defaults from the design exploration (formerly the tweaks panel).
export const SETTINGS = {
  cardStyle: "detailed", // detailed | compact | editorial
  accent: "#A8CE3A",
  showSummaryValue: true,
  boardDensity: "regular", // compact | regular | comfy
  firmName: "atares",
};

/* ---------- formatting + lookup helpers ---------- */
export function fmtEur(m) {
  // m is in € millions
  if (m >= 1000) return "€" + (m / 1000).toFixed(m % 1000 === 0 ? 0 : 1) + "B";
  return "€" + m + "M";
}

export function sectorColor(sector) {
  return SECTORS[sector] || "#6B7A99";
}

export function leadById(id) {
  return LEADS.find((l) => l.id === id) || { initials: "?", name: "Unassigned" };
}

export function stageName(id) {
  return (STAGES.find((s) => s.id === id) || {}).name;
}
