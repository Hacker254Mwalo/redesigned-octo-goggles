import { describe, expect, it } from "vitest";
import { MTAA_SUPABASE_PROJECT_REF, getProductionReadiness } from "./production-readiness";

describe("MtaaMarket production readiness", () => {
  it("reports the isolated Supabase foundation without declaring protected runtime traffic ready", () => {
    const readiness = getProductionReadiness();

    expect(readiness.projectRef).toBe(MTAA_SUPABASE_PROJECT_REF);
    expect(readiness.overallState).toBe("protected_runtime_blocked");
    expect(readiness.gates.find(gate => gate.id === "database")?.state).toBe("ready");
    expect(readiness.gates.find(gate => gate.id === "server")?.state).toBe("blocked");
    expect(readiness.gates.find(gate => gate.id === "auth")?.state).toBe("blocked");
    expect(readiness.gates.find(gate => gate.id === "storage")?.state).toBe("blocked");
    expect(readiness.gates.find(gate => gate.id === "commerce")?.state).toBe("intentional");
  });
});
