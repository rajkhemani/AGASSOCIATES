import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { BankName } from '../schemas/intake.schema';

let _supabase: SupabaseClient | null = null;

/**
 * Get Supabase client using ANON key (not service role key).
 * RLS policies enforce tenant isolation via X-Org-ID header or user JWT.
 */
export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing required Supabase configuration: SUPABASE_URL and SUPABASE_ANON_KEY must be set.',
    );
  }
  _supabase = createClient(supabaseUrl, supabaseAnonKey);
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

/**
 * Create a case with org_id context for RLS.
 * The org_id is passed via X-Org-ID header for PostgREST pre-request function.
 */
export async function createCase(params: CreateCaseParams) {
  const supabase = getSupabase();
  
  // Use PostgREST header to set app.current_org_id for RLS
  const { data, error } = await supabase
    .from('cases')
    .insert([params])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a case with explicit org_id header for RLS enforcement.
 * Use this when the caller has validated the org context (e.g., webhook auth).
 */
export async function createCaseWithOrgContext(
  params: CreateCaseParams,
  orgId: string
) {
  const supabase = getSupabase();
  
  // Set org_id header for RLS - the PostgREST pre-request function 
  // will read this and set app.current_org_id
  const { data, error } = await supabase
    .from('cases')
    .insert([{ ...params, org_id: orgId }])
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