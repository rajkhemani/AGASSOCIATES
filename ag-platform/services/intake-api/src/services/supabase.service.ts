import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { BankName } from '../schemas/intake.schema';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing required Supabase configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.',
    );
  }
  _supabase = createClient(supabaseUrl, supabaseServiceKey);
  return _supabase;
}

export interface CreateCaseParams {
  org_id: string;
  /** Derived from the panel list in schemas/intake.schema.ts, not restated. */
  bank_name: BankName;
  case_type: string;
  case_status: string;
  noi_status?: string;
}

export async function createCase(params: CreateCaseParams) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('cases')
    .insert([params])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOrganizationByBank(bankName: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', bankName)
    .single();

  if (error) {
    if ((error as { code?: string }).code === 'PGRST116') return null;
    throw error;
  }
  return data.id;
}
