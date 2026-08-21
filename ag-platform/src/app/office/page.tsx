"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_AG_API || "http://localhost:8000";

type Win = {
  id: string;
  kind: "browser" | "workforce" | "voice" | "cases" | "notes" | "whatsapp";
  title: string;
  x: number; y: number; w: number; h: number;
  z: number;
  minimized?: boolean;
  data?: any;       // per-kind state (e.g. sessionId for browser)
};

type User = { email: string; name?: string; picture?: string };

let WIN_SEQ = 0;
let Z_SEQ = 10;

const SHELL_BG =
  "radial-gradient(at 15% 10%, rgba(250,204,21,0.12), transparent 40%)," +
  "radial-gradient(at 85% 85%, rgba(99,102,241,0.12), transparent 50%)," +
  "linear-gradient(180deg,#050505 0%,#0a0a0a 100%)";

export default function Office() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [windows, setWindows] = useState<Win[]>([]);

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setUser)
      .catch(() => { window.location.href = "/login"; })
      .finally(() => setAuthChecked(true));
  }, []);

  const focus = (id: string) =>
    setWindows((w) => w.map((win) => (win.id === id ? { ...win, z: ++Z_SEQ } : win)));

  const open = (kind: Win["kind"], title: string) => {
    const id = `w${++WIN_SEQ}`;
    const offset = WIN_SEQ * 26;
    const isBrowser = kind === "browser";
    const isWhatsApp = kind === "whatsapp";
    setWindows((w) => [
      ...w,
      {
        id, kind, title,
        x: 80 + offset, y: 80 + offset,
        w: isBrowser ? 900 : isWhatsApp ? 420 : 520,
        h: isBrowser ? 620 : isWhatsApp ? 580 : 480,
        z: ++Z_SEQ,
      },
    ]);
  };

  const close = (id: string) => setWindows((w) => w.filter((win) => win.id !== id));
  const update = (id: string, patch: Partial<Win>) =>
    setWindows((w) => w.map((win) => (win.id === id ? { ...win, ...patch } : win)));

  if (!authChecked) return <div style={{ background: "#0a0a0a", minHeight: "100vh" }} />;
  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: SHELL_BG, color: "#fff", fontFamily: "system-ui", position: "relative", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 48, zIndex: 1000,
        background: "rgba(10,10,10,0.6)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#facc15,#a16207)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#000", fontSize: 12 }}>AG</div>
          <strong style={{ letterSpacing: -0.3 }}>AG Digital Office</strong>
          <span style={{ color: "#737373", fontSize: 12 }}>· {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#a3a3a3", fontSize: 13 }}>{user.email}</span>
          {user.picture && <img src={user.picture} alt="" style={{ width: 28, height: 28, borderRadius: 14 }} />}
          <button onClick={() => fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" }).then(() => (window.location.href = "/login"))}
                  style={{ background: "transparent", color: "#a3a3a3", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Desktop */}
      <div style={{ position: "absolute", top: 48, bottom: 72, left: 0, right: 0 }}>
        {windows.map((win) => (
          <Window key={win.id} win={win} onFocus={focus} onClose={close} onUpdate={update} />
        ))}
        {windows.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#525252" }}>
            <h2 style={{ fontSize: 36, margin: 0, fontWeight: 800, letterSpacing: -1, background: "linear-gradient(135deg,#facc15,#fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Welcome back, {user.name?.split(" ")[0] || "Counsel"}.
            </h2>
            <p style={{ marginTop: 6, fontSize: 14, color: "#737373" }}>
              Launch an app from the dock below to start working.
            </p>
          </div>
        )}
      </div>

      {/* Dock */}
      <div style={{
        position: "fixed", bottom: 12, left: "50%", transform: "translateX(-50%)",
        background: "rgba(15,15,15,0.7)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18,
        padding: 8, display: "flex", gap: 6, boxShadow: "0 10px 40px rgba(0,0,0,0.4)", zIndex: 1000,
      }}>
        <DockBtn label="Browser"   icon="🌐" onClick={() => open("browser",  "Browser Sandbox")} />
        <DockBtn label="Workforce" icon="👥" onClick={() => open("workforce","Workforce Control")} />
        <DockBtn label="Voice"     icon="🎙" onClick={() => open("voice",    "Vyasa Voice")} />
        <DockBtn label="Cases"     icon="📁" onClick={() => open("cases",    "Cases")} />
        <DockBtn label="Notes"     icon="📝" onClick={() => open("notes",    "Notes")} />
        <DockBtn label="WhatsApp" icon="📱" onClick={() => open("whatsapp","WhatsApp Connect")} />
      </div>
    </div>
  );
}

function DockBtn({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label}
            style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)",
                     fontSize: 22, color: "#fff", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.background = "rgba(250,204,21,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}>
      {icon}
    </button>
  );
}

function Window({ win, onFocus, onClose, onUpdate }:
                { win: Win; onFocus: (id: string) => void; onClose: (id: string) => void; onUpdate: (id: string, p: Partial<Win>) => void }) {
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const startDrag = (e: React.MouseEvent) => {
    onFocus(win.id);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: win.x, oy: win.y };
    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      onUpdate(win.id, {
        x: Math.max(0, dragRef.current.ox + ev.clientX - dragRef.current.x),
        y: Math.max(0, dragRef.current.oy + ev.clientY - dragRef.current.y),
      });
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <div onMouseDown={() => onFocus(win.id)}
         style={{
           position: "absolute", left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z,
           background: "rgba(15,15,15,0.85)", backdropFilter: "blur(20px)",
           border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14,
           boxShadow: "0 20px 60px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", overflow: "hidden",
         }}>
      <div onMouseDown={startDrag}
           style={{ height: 36, padding: "0 12px", display: "flex", alignItems: "center", gap: 8,
                    borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "move",
                    background: "rgba(255,255,255,0.02)" }}>
        <button onClick={() => onClose(win.id)} title="Close"
                style={{ width: 12, height: 12, borderRadius: 6, background: "#ef4444", border: 0, cursor: "pointer" }} />
        <span style={{ width: 12, height: 12, borderRadius: 6, background: "#facc15" }} />
        <span style={{ width: 12, height: 12, borderRadius: 6, background: "#22c55e" }} />
        <strong style={{ marginLeft: 8, fontSize: 13, color: "#e5e5e5" }}>{win.title}</strong>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {win.kind === "browser"  && <BrowserApp win={win} onUpdate={onUpdate} />}
        {win.kind === "workforce" && <iframe src="/admin/workforce"  style={{ width: "100%", height: "100%", border: 0 }} />}
        {win.kind === "voice"     && <iframe src="/admin/voice"      style={{ width: "100%", height: "100%", border: 0 }} />}
        {win.kind === "cases"     && <iframe src="/my-cases"         style={{ width: "100%", height: "100%", border: 0 }} />}
        {win.kind === "notes"     && <NotesApp winId={win.id} />}
        {win.kind === "whatsapp"  && <WhatsAppConnectApp win={win} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}

function BrowserApp({ win, onUpdate }: { win: Win; onUpdate: (id: string, p: Partial<Win>) => void }) {
  const sessionId = win.data?.sessionId as string | undefined;
  const [url, setUrl] = useState<string>(win.data?.url || "https://www.google.com");
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    const r = await fetch(`${API}/playground/sessions`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "office", url }),
    });
    if (!r.ok) throw new Error(`session create failed: ${r.status}`);
    const data = await r.json();
    onUpdate(win.id, { data: { ...(win.data || {}), sessionId: data.id, url } });
    return data.id as string;
  }, [sessionId, url, win.id, win.data, onUpdate]);

  const pollScreenshot = useCallback(async (sid: string) => {
    try {
      const r = await fetch(`${API}/playground/sessions/${sid}/screenshot`, { credentials: "include" });
      if (!r.ok) throw new Error(`screenshot ${r.status}`);
      const data = await r.json();
      setImg(`data:image/jpeg;base64,${data.image}`);
    } catch (e: any) {
      setErr(e?.message || "screenshot failed");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let sid: string | null = null;

    (async () => {
      try {
        sid = await ensureSession();
        if (!mounted) {
          if (sid) fetch(`${API}/playground/sessions/${sid}`, { method: "DELETE", credentials: "include" }).catch(() => {});
          return;
        }
        await pollScreenshot(sid);
        pollRef.current = setInterval(() => pollScreenshot(sid!), 800);
      } catch (e: any) { setErr(e?.message || "init failed"); }
    })();

    return () => {
      mounted = false;
      if (pollRef.current) clearInterval(pollRef.current);
      if (sid) {
        fetch(`${API}/playground/sessions/${sid}`, { method: "DELETE", credentials: "include" }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doAction = async (kind: string, args: any = {}) => {
    setLoading(true); setErr(null);
    try {
      const sid = await ensureSession();
      const r = await fetch(`${API}/playground/sessions/${sid}/action`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...args }),
      });
      const data = await r.json();
      if (data.url) setUrl(data.url);
      if (!data.ok) setErr(data.error || "action failed");
      await pollScreenshot(sid);
    } catch (e: any) { setErr(e?.message || "action error"); }
    finally { setLoading(false); }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doAction("goto", { url });
  };

  const onClickOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width)  * 1280);
    const y = Math.round(((e.clientY - rect.top)  / rect.height) * 800);
    doAction("click", { x, y });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0a0a0a" }}>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 6, padding: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button type="button" onClick={() => doAction("back")}    style={btn}>←</button>
        <button type="button" onClick={() => doAction("forward")} style={btn}>→</button>
        <button type="button" onClick={() => doAction("reload")}  style={btn}>↻</button>
        <input value={url} onChange={(e) => setUrl(e.target.value)}
               style={{ flex: 1, padding: "6px 10px", background: "#171717", color: "#fff",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, fontSize: 13 }} />
        <button type="submit" style={{ ...btn, background: "#facc15", color: "#000", fontWeight: 700 }}>Go</button>
      </form>
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#000" }}
           onClick={onClickOverlay}>
        {img
          ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          : <div style={{ color: "#737373", padding: 16 }}>{loading ? "Loading…" : "Connecting Chromium…"}</div>}
        {err && <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, background: "rgba(220,38,38,0.85)", padding: 8, borderRadius: 6, fontSize: 12 }}>{err}</div>}
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)", color: "#fff",
  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
  padding: "6px 10px", cursor: "pointer", fontSize: 13,
};

function NotesApp({ winId }: { winId: string }) {
  const key = `ag-office-notes-${winId}`;
  const [text, setText] = useState(() => (typeof window !== "undefined" ? localStorage.getItem(key) || "" : ""));
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(key, text);
  }, [text, key]);
  return (
    <textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Sticky note — saved locally"
              style={{ width: "100%", height: "100%", background: "transparent", color: "#facc15",
                       border: 0, padding: 16, fontSize: 14, fontFamily: "ui-monospace, Menlo, monospace", resize: "none" }} />
  );
}

function WhatsAppConnectApp({ win, onUpdate }: { win: Win; onUpdate: (id: string, p: Partial<Win>) => void }) {
  const [qrData, setQrData] = useState<{ qr: string; session_id: string; expires_in_seconds: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "awaiting_scan" | "connected" | "expired" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const fetchQr = async () => {
    setStatus("loading");
    setError(null);
    try {
      const r = await fetch(`${API}/api/whatsapp/directConnect/qr`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error(`Failed to get QR: ${r.status}`);
      const data = await r.json();
      if (data.qr && data.session_id) {
        setQrData(data);
        sessionIdRef.current = data.session_id;
        setStatus(data.status || "awaiting_scan");
        startPolling(data.session_id, data.expires_in_seconds || 120);
      } else {
        throw new Error(data.message || "Invalid QR response");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to generate QR code");
      setStatus("error");
    }
  };

  const pollStatus = async (sessionId: string) => {
    try {
      const r = await fetch(`${API}/api/whatsapp/directConnect/status/${sessionId}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error(`Status check failed: ${r.status}`);
      const data = await r.json();
      setStatus(data.status);
      if (data.status === "connected") {
        stopPolling();
        setQrData(prev => prev ? { ...prev, ...data } : null);
      } else if (data.status === "expired" || data.status === "error") {
        stopPolling();
      }
    } catch (e: any) {
      console.warn("WhatsApp status poll failed:", e?.message);
    }
  };

  const startPolling = (sessionId: string, ttl: number) => {
    stopPolling();
    pollRef.current = setInterval(() => pollStatus(sessionId), 3000);
    setTimeout(() => stopPolling(), ttl * 1000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const refreshQr = () => {
    stopPolling();
    setQrData(null);
    sessionIdRef.current = null;
    fetchQr();
  };

  useEffect(() => {
    fetchQr();
    return () => stopPolling();
  }, []);

  const statusColors: Record<string, string> = {
    idle: "#737373",
    loading: "#facc15",
    awaiting_scan: "#3b82f6",
    connected: "#22c55e",
    expired: "#ef4444",
    error: "#ef4444",
  };

  const statusLabels: Record<string, string> = {
    idle: "Ready",
    loading: "Generating QR…",
    awaiting_scan: "Awaiting Scan",
    connected: "Connected",
    expired: "Expired",
    error: "Error",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0a0a0a", color: "#fff" }}>
      <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>WhatsApp Business Connect</h3>
          <button onClick={refreshQr} disabled={status === "loading"}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)",
                           background: "rgba(255,255,255,0.05)", color: "#fff", cursor: "pointer", fontSize: 12 }}>
            Refresh QR
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#a3a3a3" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColors[status] }} />
          <span>{statusLabels[status]}</span>
          {qrData && status === "awaiting_scan" && (
            <span style={{ color: "#facc15" }}>⏱ {qrData.expires_in_seconds}s</span>
          )}
        </div>
        {error && (
          <div style={{ marginTop: 8, padding: 8, background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 6, fontSize: 12, color: "#fca5a5" }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
        {status === "loading" && (
          <div style={{ textAlign: "center", color: "#737373" }}>
            <div style={{ width: 32, height: 32, border: "3px solid rgba(250,204,21,0.3)", borderTopColor: "#facc15", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
            Generating WhatsApp QR code…
          </div>
        )}

        {status === "awaiting_scan" && qrData && (
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ marginBottom: 16 }}>
              <img src={qrData.qr} alt="WhatsApp QR Code"
                   style={{ width: 280, height: 280, borderRadius: 12, background: "#fff", padding: 8, boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }} />
            </div>
            <p style={{ fontSize: 14, color: "#a3a3a3", marginBottom: 8 }}>
              Open WhatsApp → <strong>Linked Devices</strong> → <strong>Link a Device</strong>
            </p>
            <p style={{ fontSize: 12, color: "#737373" }}>
              Scan the QR code above to connect WhatsApp Business
            </p>
            <div style={{ marginTop: 16, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 11, color: "#737373", textAlign: "left" }}>
              <strong>Session:</strong> {qrData.session_id.slice(0, 8)}…<br/>
              <strong>Expires in:</strong> {qrData.expires_in_seconds} seconds
            </div>
          </div>
        )}

        {status === "connected" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.2)",
                         display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <span style={{ fontSize: 28 }}>✓</span>
            </div>
            <h4 style={{ margin: "0 0 8px", fontSize: 18, color: "#22c55e" }}>WhatsApp Connected</h4>
            <p style={{ color: "#a3a3a3", fontSize: 14 }}>Your WhatsApp Business account is now linked.</p>
            {sessionIdRef.current && (
              <div style={{ marginTop: 12, padding: 8, background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 11, color: "#737373" }}>
                Session: {sessionIdRef.current.slice(0, 8)}…
              </div>
            )}
          </div>
        )}

        {status === "expired" && (
          <div style={{ textAlign: "center", color: "#737373" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h4 style={{ margin: "0 0 8px" }}>QR Code Expired</h4>
            <p style={{ marginBottom: 16 }}>The QR code has expired. Click <strong>Refresh QR</strong> to generate a new one.</p>
            <button onClick={refreshQr} style={{ ...btn, background: "#facc15", color: "#000", fontWeight: 700 }}>
              Generate New QR
            </button>
          </div>
        )}

        {status === "error" && (
          <div style={{ textAlign: "center", color: "#ef4444" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
            <h4 style={{ margin: "0 0 8px" }}>Connection Error</h4>
            <p style={{ marginBottom: 16, color: "#a3a3a3" }}>{error || "Unknown error occurred"}</p>
            <button onClick={refreshQr} style={{ ...btn, background: "#ef4444", color: "#fff", fontWeight: 700 }}>
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
