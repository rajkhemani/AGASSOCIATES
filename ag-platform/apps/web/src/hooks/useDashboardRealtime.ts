import { useEffect, useState } from "react";
import { supabase } from "./useLivePresence";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export interface CaseUpdate {
  id: string;
  status: string;
  borrower_name: string;
  case_type: string;
  loan_amount: number;
  created_at: string;
}

export interface ActivityUpdate {
  id: string;
  user_id: string;
  action: string;
  target?: string;
  created_at: string;
}

function isConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url !== 'https://placeholder.supabase.co');
}

export function useDashboardRealtime() {
  const [caseUpdates, setCaseUpdates] = useState<CaseUpdate[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const channels: ReturnType<typeof supabase.channel>[] = [];

    if (!isConfigured()) {
      setIsConnected(false);
      return;
    }

    const handleCaseChange = (payload: RealtimePostgresChangesPayload<CaseUpdate>) => {
      if (!isMounted || !payload.new) return;
      setCaseUpdates(prev => {
        const existing = prev.findIndex(c => c.id === (payload.new as CaseUpdate).id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = payload.new as CaseUpdate;
          return updated;
        }
        return [payload.new as CaseUpdate, ...prev].slice(0, 100);
      });
    };

    const handleActivity = (payload: RealtimePostgresChangesPayload<ActivityUpdate>) => {
      if (!isMounted || !payload.new) return;
      setRecentActivity(prev => [payload.new as ActivityUpdate, ...prev].slice(0, 50));
    };

    const casesChannel = supabase.channel('dashboard-cases-realtime');
    casesChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, handleCaseChange)
      .subscribe((status) => {
        if (isMounted && status === 'SUBSCRIBED') setIsConnected(true);
      });
    channels.push(casesChannel);

    const activityChannel = supabase.channel('dashboard-activity-realtime');
    activityChannel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, handleActivity)
      .subscribe();
    channels.push(activityChannel);

    return () => {
      isMounted = false;
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, []);

  return { caseUpdates, recentActivity, isConnected };
}
