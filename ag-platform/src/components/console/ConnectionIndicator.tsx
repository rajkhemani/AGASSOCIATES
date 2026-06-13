import { useDashboardRealtime } from "../../hooks/useDashboardRealtime";
import { MONO } from "../ag/primitives";

export function ConnectionIndicator() {
  const { isConnected } = useDashboardRealtime();
  const dotColor = isConnected ? "var(--green)" : "var(--muted)";
  const label = isConnected ? "LIVE" : "POLLING";

  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: "var(--muted)",
        fontFamily: MONO,
      }}
      title={isConnected ? "Realtime connected" : "Fallback polling mode"}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dotColor,
          display: "inline-block",
          animation: isConnected ? "ag-pulse-dot 1.6s ease-in-out infinite" : "none",
        }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
