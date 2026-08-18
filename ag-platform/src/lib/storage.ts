import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'crypto';

// Supabase client for storage operations
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseStorageClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      throw new Error('Supabase URL and Service Role Key required for storage operations');
    }
    
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
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
  const random = uuidv4().slice(0, 8);
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${bucket}/${caseId}/${category || 'general'}/${timestamp}-${random}-${safeName}`;
}

export async function createSignedUploadUrl(options: DocumentUploadOptions): Promise<SignedUploadUrl> {
  const supabase = getSupabaseStorageClient();
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
  const supabase = getSupabaseStorageClient();
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

export async function downloadFile(bucketId: string, path: string): Promise<Blob> {
  const supabase = getSupabaseStorageClient();
  
  const { data, error } = await supabase.storage
    .from(bucketId)
    .download(path);
  
  if (error) {
    throw new Error(`File download failed: ${error.message}`);
  }
  
  return data;
}

export async function createSignedDownloadUrl(bucketId: string, path: string, expiresIn = 3600): Promise<string> {
  const supabase = getSupabaseStorageClient();
  
  const { data, error } = await supabase.storage
    .from(bucketId)
    .createSignedUrl(path, expiresIn);
  
  if (error) {
    throw new Error(`Failed to create signed download URL: ${error.message}`);
  }
  
  return data.signedUrl;
}

export async function deleteFile(bucketId: string, path: string): Promise<void> {
  const supabase = getSupabaseStorageClient();
  
  const { error } = await supabase.storage
    .from(bucketId)
    .remove([path]);
  
  if (error) {
    throw new Error(`File deletion failed: ${error.message}`);
  }
}

export async function listFiles(bucketId: string, prefix: string): Promise<string[]> {
  const supabase = getSupabaseStorageClient();
  
  const { data, error } = await supabase.storage
    .from(bucketId)
    .list(prefix);
  
  if (error) {
    throw new Error(`File listing failed: ${error.message}`);
  }
  
  return data?.map(f => f.name) || [];
}

export async function getFileMetadata(bucketId: string, path: string) {
  const supabase = getSupabaseStorageClient();
  
  const { data, error } = await supabase.storage
    .from(bucketId)
    .getMetadata(path);
  
  if (error) {
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }
  
  return data;
}

export async function moveFile(bucketId: string, fromPath: string, toPath: string): Promise<void> {
  const supabase = getSupabaseStorageClient();
  
  const { error } = await supabase.storage
    .from(bucketId)
    .move(fromPath, toPath);
  
  if (error) {
    throw new Error(`File move failed: ${error.message}`);
  }
}

export async function copyFile(bucketId: string, fromPath: string, toPath: string): Promise<void> {
  const supabase = getSupabaseStorageClient();
  
  const { error } = await supabase.storage
    .from(bucketId)
    .copy(fromPath, toPath);
  
  if (error) {
    throw new Error(`File copy failed: ${error.message}`);
  }
}

export { BUCKETS };