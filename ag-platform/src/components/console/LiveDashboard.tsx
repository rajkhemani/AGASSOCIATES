import { useDashboardRealtime } from "../../hooks/useDashboardRealtime";
import { Dashboard } from "./screens";
import { MONO, SERIF } from "../ag/primitives";

export function LiveDashboard() {
  const { isConnected, recentActivity } = useDashboardRealtime();

  return (
    <div style={{ position: "relative" }}>
      {recentActivity.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 100,
            background: "var(--paper)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            padding: "12px 16px",
            maxWidth: 320,
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 9,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 8,
            }}
          >
            Live activity
          </div>
          {recentActivity.slice(0, 5).map((a) => (
            <div
              key={a.id}
              style={{
                fontSize: 11.5,
                color: "var(--ink-2)",
                padding: "4px 0",
                borderBottom: "1px dashed var(--line)",
                fontFamily: MONO,
              }}
            >
              {a.action}
              {a.target ? ` → ${a.target}` : ""}
            </div>
          ))}
        </div>
      )}
      <Dashboard />
    </div>
  );
}
