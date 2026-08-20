import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Supabase client for storage operations
let supabaseClient: SupabaseClient | null = null;

function _getStorageHeaders(orgId?: string): Record<string, string> {
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!anonKey) {
    throw new Error('SUPABASE_ANON_KEY not configured for storage operations');
  }
  
  const headers: Record<string, string> = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
  };
  
  if (orgId) {
    headers['X-Org-ID'] = orgId;
  }
  
  return headers;
}

export function getSupabaseStorageClient(orgId?: string): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !anonKey) {
      throw new Error('Supabase URL and Anon Key required for storage operations');
    }
    
    supabaseClient = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: {
        headers: _getStorageHeaders(orgId),
      },
    });
  }
  return supabaseClient;
}

export interface UploadResult {
  path: string;
  fullPath: string;
  bucketId: string;
  size: number;
  mimeType: string;
}

export interface SignedUploadUrl {
  signedUrl: string;
  path: string;
  bucketId: string;
  expiresAt: string;
  token: string;
}

export interface DocumentUploadOptions {
  caseId: string;
  orgId: string;
  fileName: string;
  contentType: string;
  category?: string;
  bucketId?: string;
  userId: string;
}

const BUCKETS = {
  CASE_DOCUMENTS: 'case-documents',
  INVOICES: 'invoices',
  EXPORTS: 'exports',
  TEMP: 'temp-uploads',
} as const;

function getBucketId(category?: string, customBucket?: string): string {
  if (customBucket) return customBucket;
  if (!category) return BUCKETS.CASE_DOCUMENTS;
  
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('invoice') || categoryLower.includes('bill')) return BUCKETS.INVOICES;
  if (categoryLower.includes('export') || categoryLower.includes('report')) return BUCKETS.EXPORTS;
  
  return BUCKETS.CASE_DOCUMENTS;
}

function generateStoragePath(caseId: string, fileName: string, category?: string): string {
  const bucket = getBucketId(category);
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const timestamp = Date.now();
  const random = randomUUID().slice(0, 8);
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${bucket}/${caseId}/${category || 'general'}/${timestamp}-${random}-${safeName}`;
}

export async function createSignedUploadUrl(options: DocumentUploadOptions): Promise<SignedUploadUrl> {
  const supabase = getSupabaseStorageClient(options.orgId);
  const bucketId = getBucketId(options.category, options.bucketId);
  const path = generateStoragePath(options.caseId, options.fileName, options.category);
  
  const expiresIn = 3600; // 1 hour
  
  const { data, error } = await supabase.storage
    .from(bucketId)
    .createSignedUploadUrl(path);
  
  if (error) {
    throw new Error(`Failed to create signed upload URL: ${error.message}`);
  }
  
  return {
    signedUrl: data.signedUrl,
    path: data.path,
    bucketId,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    token: data.token,
  };
}

export async function uploadFile(
  file: Buffer | ReadableStream | Blob,
  options: DocumentUploadOptions
): Promise<UploadResult> {
  const supabase = getSupabaseStorageClient(options.orgId);
  const bucketId = getBucketId(options.category, options.bucketId);
  const path = generateStoragePath(options.caseId, options.fileName, options.category);
  
  const { data, error } = await supabase.storage
    .from(bucketId)
    .upload(path, file, {
      contentType: options.contentType,
      upsert: false,
    });
  
  if (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }
  
  return {
    path: data.path,
    fullPath: `${bucketId}/${data.path}`,
    bucketId,
    size: 0, // Would need to track separately
    mimeType: options.contentType,
  };
}

export async function downloadFile(bucketId: string, path: string, orgId?: string): Promise<Blob> {
  const supabase = getSupabaseStorageClient(orgId);
  
  const { data, error } = await supabase.storage
    .from(bucketId)
    .download(path);
  
  if (error) {
    throw new Error(`File download failed: ${error.message}`);
  }
  
  return data;
}

export async function createSignedDownloadUrl(bucketId: string, path: string, expiresIn = 3600, orgId?: string): Promise<string> {
  const supabase = getSupabaseStorageClient(orgId);
  
  const { data, error } = await supabase.storage
    .from(bucketId)
    .createSignedUrl(path, expiresIn);
  
  if (error) {
    throw new Error(`Failed to create signed download URL: ${error.message}`);
  }
  
  return data.signedUrl;
}

export async function deleteFile(bucketId: string, path: string, orgId?: string): Promise<void> {
  const supabase = getSupabaseStorageClient(orgId);
  
  const { error } = await supabase.storage
    .from(bucketId)
    .remove([path]);
  
  if (error) {
    throw new Error(`File deletion failed: ${error.message}`);
  }
}

export async function listFiles(bucketId: string, prefix: string, orgId?: string): Promise<string[]> {
  const supabase = getSupabaseStorageClient(orgId);
  
  const { data, error } = await supabase.storage
    .from(bucketId)
    .list(prefix);
  
  if (error) {
    throw new Error(`File listing failed: ${error.message}`);
  }
  
  return data?.map(f => f.name) || [];
}

export async function getFileMetadata(bucketId: string, path: string, orgId?: string) {
  const supabase = getSupabaseStorageClient(orgId);
  
  // Supabase Storage doesn't have a getMetadata method
  // We can use list with the exact path to check if file exists
  const { data, error } = await supabase.storage
    .from(bucketId)
    .list(path, { limit: 1 });
  
  if (error) {
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    throw new Error('File not found');
  }
  
  return data[0];
}

export async function moveFile(bucketId: string, fromPath: string, toPath: string, orgId?: string): Promise<void> {
  const supabase = getSupabaseStorageClient(orgId);
  
  const { error } = await supabase.storage
    .from(bucketId)
    .move(fromPath, toPath);
  
  if (error) {
    throw new Error(`File move failed: ${error.message}`);
  }
}

export async function copyFile(bucketId: string, fromPath: string, toPath: string, orgId?: string): Promise<void> {
  const supabase = getSupabaseStorageClient(orgId);
  
  const { error } = await supabase.storage
    .from(bucketId)
    .copy(fromPath, toPath);
  
  if (error) {
    throw new Error(`File copy failed: ${error.message}`);
  }
}

export { BUCKETS };