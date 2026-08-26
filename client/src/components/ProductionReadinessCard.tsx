import { trpc } from "@/lib/trpc";
import { CheckCircle2, CircleAlert, Loader2, ShieldCheck } from "lucide-react";

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase());
}

export function ProductionReadinessCard() {
  const readiness = trpc.marketplace.adminProductionReadiness.useQuery();

  return (
    <article className="workspace-card production-readiness-card">
      <div className="card-title">
        <div>
          <p className="eyebrow">Production control</p>
          <h2>Launch readiness</h2>
        </div>
        <ShieldCheck />
      </div>
      {readiness.isLoading ? (
        <p className="muted-copy"><Loader2 className="inline animate-spin" size={14} /> Checking the launch gate…</p>
      ) : readiness.data ? (
        <>
          <p className="muted-copy">Supabase foundation: <strong>{readiness.data.readyCount} ready</strong> · Protected runtime gates: <strong>{readiness.data.blockedCount} remaining</strong>.</p>
          <div className="readiness-list">
            {readiness.data.gates.map(gate => (
              <div className={`readiness-row ${gate.state}`} key={gate.id}>
                {gate.state === "ready" ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
                <div>
                  <strong>{gate.title}</strong>
                  <p>{gate.detail}</p>
                  <small>{titleCase(gate.state)}: {gate.nextAction}</small>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : <p className="muted-copy">Launch readiness is unavailable. Refresh and try again.</p>}
    </article>
  );
}
