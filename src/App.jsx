/* Deal Pipeline — app shell, wired to Supabase */
import { useEffect, useState } from "react";
import { LEADS, SETTINGS, STAGES, fmtEur, stageName } from "./lib/constants";
import { fetchAll, insertDeal, updateDeal } from "./lib/api";
import { Avatar } from "./components/primitives";
import { Column } from "./components/Column";
import { DealDetail } from "./components/DealDetail";
import { NewDeal } from "./components/NewDeal";
import { TargetsView } from "./components/TargetsView";
import { MandatesView } from "./components/MandatesView";
import { ReportsView } from "./components/ReportsView";

const NAV = [
  { id: "pipeline", label: "Pipeline" },
  { id: "targets", label: "Targets" },
  { id: "mandates", label: "Mandates" },
  { id: "reports", label: "Reports" },
];

export default function App() {
  const t = SETTINGS;

  const [deals, setDeals] = useState([]);
  const [targets, setTargets] = useState([]);
  const [mandates, setMandates] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errMsg, setErrMsg] = useState("");

  const [open, setOpen] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newStage, setNewStage] = useState("sourcing");
  const [dragId, setDragId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("pipeline");

  // live accent
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
  }, [t.accent]);

  // initial load
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchAll();
        if (!alive) return;
        setDeals(data.deals);
        setTargets(data.targets);
        setMandates(data.mandates);
        setStatus("ready");
      } catch (e) {
        if (!alive) return;
        setErrMsg(e.message || String(e));
        setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // refetch deals from the server (used as a fallback when a write fails)
  const reload = async () => {
    try {
      const data = await fetchAll();
      setDeals(data.deals);
    } catch (e) {
      console.error("Reload failed", e);
    }
  };

  const filtered = query.trim()
    ? deals.filter((d) => (d.name + " " + d.sector).toLowerCase().includes(query.toLowerCase()))
    : deals;
  const byStage = (sid) => filtered.filter((d) => d.stage === sid);
  const totalValue = deals.reduce((s, d) => s + d.size, 0);

  /* drag handlers */
  const onDragStartCard = (e, deal) => {
    setDragId(deal.id);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", deal.id);
    } catch (_) {}
  };
  const onDragEndCard = () => {
    setDragId(null);
    setDragOverStage(null);
  };
  const onDropStage = (sid) => {
    if (!dragId) return;
    const moving = deals.find((d) => d.id === dragId);
    setDragId(null);
    setDragOverStage(null);
    if (!moving || moving.stage === sid) return;
    // optimistic — restage locally, then persist
    setDeals((ds) => ds.map((d) => (d.id === moving.id ? { ...d, stage: sid, days: 0 } : d)));
    updateDeal(moving.id, { stage: sid, days: 0 }).catch((e) => {
      console.error("Restage failed", e);
      reload();
    });
  };

  const advance = (deal) => {
    const idx = STAGES.findIndex((s) => s.id === deal.stage);
    if (idx >= STAGES.length - 1) return;
    const next = STAGES[idx + 1].id;
    setDeals((ds) => ds.map((d) => (d.id === deal.id ? { ...d, stage: next, days: 0 } : d)));
    setOpen((o) => (o ? { ...o, stage: next, days: 0 } : o));
    updateDeal(deal.id, { stage: next, days: 0 }).catch((e) => {
      console.error("Advance failed", e);
      reload();
    });
  };

  const createDeal = async (form) => {
    const id = "n" + Date.now();
    const row = { ...form, id };
    setShowNew(false);
    // optimistic insert at the top, then persist
    setDeals((ds) => [{ ...row }, ...ds]);
    try {
      const saved = await insertDeal(row);
      setDeals((ds) => ds.map((d) => (d.id === id ? saved : d)));
    } catch (e) {
      console.error("Create failed", e);
      setDeals((ds) => ds.filter((d) => d.id !== id));
      alert("Could not save the new deal. Please try again.");
    }
  };

  const openNew = (sid) => {
    setNewStage(sid || "sourcing");
    setShowNew(true);
  };

  const promoteTarget = async (tg) => {
    const id = "p" + Date.now();
    const row = {
      id,
      name: tg.name,
      sector: tg.sector,
      size: tg.revenue,
      stage: "sourcing",
      lead: tg.owner,
      days: 0,
      prob: tg.fit * 8,
      priority: tg.fit >= 5,
      next: "Open dialogue",
      due: "TBD",
      note: "Promoted from target research. HQ: " + tg.hq + ".",
    };
    setDeals((ds) => [{ ...row }, ...ds]);
    setView("pipeline");
    try {
      const saved = await insertDeal(row);
      setDeals((ds) => ds.map((d) => (d.id === id ? saved : d)));
    } catch (e) {
      console.error("Promote failed", e);
      setDeals((ds) => ds.filter((d) => d.id !== id));
      alert("Could not promote this target. Please try again.");
    }
  };

  if (status === "loading") {
    return (
      <div className="app">
        <div className="boot">Loading pipeline…</div>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="app">
        <div className="boot error">
          <strong>Could not reach the backend.</strong>
          <span>{errMsg}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
                <line x1="16" y1="16" x2="16" y2="2.5" />
                <line x1="16" y1="16" x2="27.5" y2="8" />
                <line x1="16" y1="16" x2="29.5" y2="19" />
                <line x1="16" y1="16" x2="18.5" y2="29.5" />
                <line x1="16" y1="16" x2="6" y2="26.5" />
                <line x1="16" y1="16" x2="3" y2="13" />
                <line x1="16" y1="16" x2="8.5" y2="4.5" />
              </g>
              <circle cx="16" cy="2.5" r="1.5" fill="currentColor" />
              <circle cx="29.5" cy="19" r="1.3" fill="currentColor" />
              <circle cx="6" cy="26.5" r="1.2" fill="currentColor" />
              <circle cx="16" cy="16" r="1.7" fill="currentColor" />
            </svg>
          </span>
          <div className="brand-text">
            <span className="brand-name">{t.firmName}</span>
            <span className="brand-sub">passion for tech M&amp;A</span>
          </div>
        </div>

        <nav className="topnav">
          {NAV.map((n) => (
            <a key={n.id} className={view === n.id ? "active" : ""} onClick={() => setView(n.id)}>
              {n.label}
            </a>
          ))}
        </nav>

        <div className="top-actions">
          {view === "pipeline" && (
            <label className="search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search deals" />
            </label>
          )}
          <button className="btn export" onClick={() => window.print()} title="Export the current view to PDF">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v11m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Export PDF
          </button>
          <button className="btn primary" onClick={() => openNew("sourcing")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            New Deal
          </button>
        </div>
      </header>

      {view === "pipeline" && (
        <div className="subbar">
          <div className="sub-stats">
            <span className="sub-stat">
              <strong>{deals.length}</strong> active deals
            </span>
            <span className="sub-div" />
            <span className="sub-stat">
              <strong>{fmtEur(totalValue)}</strong> total pipeline value
            </span>
          </div>
          <div className="legend">
            {LEADS.slice(0, 6).map((l) => (
              <Avatar key={l.id} leadId={l.id} size={24} />
            ))}
          </div>
        </div>
      )}

      {view === "pipeline" && (
        <main className="board">
          {STAGES.map((s) => (
            <Column
              key={s.id}
              stage={s}
              deals={byStage(s.id)}
              accent={t.accent}
              showVal={t.showSummaryValue}
              density={t.boardDensity}
              cardStyle={t.cardStyle}
              dragId={dragId}
              dragOverStage={dragOverStage}
              onOpen={setOpen}
              onDragStartCard={onDragStartCard}
              onDragEndCard={onDragEndCard}
              onDropStage={onDropStage}
              onDragOverStage={setDragOverStage}
              onDragLeaveStage={() => setDragOverStage(null)}
              onNewInStage={openNew}
            />
          ))}
        </main>
      )}

      {view === "targets" && <TargetsView targets={targets} onPromote={promoteTarget} />}
      {view === "mandates" && <MandatesView mandates={mandates} />}
      {view === "reports" && <ReportsView deals={deals} />}

      {open && (
        <DealDetail
          deal={open}
          stageName={stageName(open.stage)}
          canAdvance={STAGES.findIndex((s) => s.id === open.stage) < STAGES.length - 1}
          onClose={() => setOpen(null)}
          onAdvance={advance}
        />
      )}

      {showNew && (
        <NewDeal
          initialStage={newStage}
          onClose={() => setShowNew(false)}
          onCreate={(f) => createDeal({ ...f, stage: f.stage || newStage })}
        />
      )}
    </div>
  );
}
