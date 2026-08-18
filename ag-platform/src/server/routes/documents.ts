import express from 'express';
import { pool } from '../db.ts';
import { createSupabaseMiddleware, requireOrgAccess } from '../auth.ts';
import { validate, validateParams, CreateDocumentSchema } from '../validation.ts';
import { z } from 'zod';
import { createSignedUploadUrl, createSignedDownloadUrl, deleteFile, getFileMetadata, listFiles, BUCKETS } from '../../lib/storage.ts';

const router = express.Router();

const authOrg = [createSupabaseMiddleware(), requireOrgAccess()];

// All document routes require authentication + org access
router.use(...authOrg);

const uuidParam = z.object({ caseId: z.string().uuid() });

// GET /cases/:caseId/documents - List documents for a case
router.get('/cases/:caseId/documents', validateParams(uuidParam), async (req, res) => {
  try {
    const userOrgId = req.user!.orgId!;

    // Verify case belongs to user's org
    const caseCheck = await pool.query('SELECT id FROM cases WHERE id = $1 AND org_id = $2', [req.params.caseId, userOrgId]);
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const result = await pool.query(
      'SELECT * FROM documents WHERE case_id = $1 ORDER BY uploaded_at DESC',
      [req.params.caseId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Document fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// POST /cases/:caseId/documents - Create document record (after upload)
router.post('/cases/:caseId/documents', validateParams(uuidParam), validate(CreateDocumentSchema), async (req, res) => {
  try {
    const { name, storage_path, bucket_id, content_type, size_bytes, category } = req.body;
    const userOrgId = req.user!.orgId!;
    const userId = req.user!.id;

    // Verify case belongs to user's org
    const caseCheck = await pool.query('SELECT id, org_id FROM cases WHERE id = $1', [req.params.caseId]);
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    if (caseCheck.rows[0].org_id !== userOrgId && req.user!.role !== 'PRINCIPAL') {
      return res.status(403).json({ error: 'Cannot upload to case in another organization' });
    }

    const result = await pool.query(
      `INSERT INTO documents (case_id, org_id, uploader_id, name, storage_path, bucket_id, content_type, size_bytes, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.params.caseId, userOrgId, userId, name, storage_path, bucket_id || 'case-documents', content_type, size_bytes || 0, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Document create error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// POST /cases/:caseId/documents/upload-url - Get signed upload URL for direct Supabase Storage upload
router.post('/cases/:caseId/documents/upload-url', validateParams(uuidParam), async (req, res) => {
  try {
    const { fileName, contentType, category, bucketId } = req.body;
    const userOrgId = req.user!.orgId!;
    const userId = req.user!.id;

    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'fileName and contentType are required' });
    }

    // Verify case belongs to user's org
    const caseId = Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId;
    const caseCheck = await pool.query('SELECT id, org_id FROM cases WHERE id = $1', [caseId]);
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    if (caseCheck.rows[0].org_id !== userOrgId && req.user!.role !== 'PRINCIPAL') {
      return res.status(403).json({ error: 'Cannot upload to case in another organization' });
    }

    const uploadUrl = await createSignedUploadUrl({
      caseId,
      orgId: userOrgId,
      fileName,
      contentType,
      category,
      bucketId,
      userId,
    });

    res.json({
      success: true,
      uploadUrl: uploadUrl.signedUrl,
      path: uploadUrl.path,
      bucketId: uploadUrl.bucketId,
      expiresAt: uploadUrl.expiresAt,
    });
  } catch (error: any) {
    console.error('Signed upload URL error:', error);
    res.status(500).json({ error: error.message || 'Failed to create upload URL' });
  }
});

// POST /cases/:caseId/documents/complete - Complete upload (create document record after client upload)
router.post('/cases/:caseId/documents/complete', validateParams(uuidParam), async (req, res) => {
  try {
    const { name, path, bucketId, contentType, sizeBytes, category } = req.body;
    const userOrgId = req.user!.orgId!;
    const userId = req.user!.id;

    if (!name || !path || !bucketId || !contentType) {
      return res.status(400).json({ error: 'name, path, bucketId, and contentType are required' });
    }

    // Verify case belongs to user's org
    const caseId = Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId;
    const caseCheck = await pool.query('SELECT id, org_id FROM cases WHERE id = $1', [caseId]);
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    if (caseCheck.rows[0].org_id !== userOrgId && req.user!.role !== 'PRINCIPAL') {
      return res.status(403).json({ error: 'Cannot upload to case in another organization' });
    }

    // Verify file exists in storage
    try {
      await getFileMetadata(bucketId, path);
    } catch (storageError) {
      return res.status(400).json({ error: 'File not found in storage. Upload may have failed.' });
    }

    const result = await pool.query(
      `INSERT INTO documents (case_id, org_id, uploader_id, name, storage_path, bucket_id, content_type, size_bytes, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [caseId, userOrgId, userId, name, path, bucketId, contentType, sizeBytes || 0, category]
    );
    res.status(201).json({ success: true, document: result.rows[0] });
  } catch (error: any) {
    console.error('Document complete error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete document upload' });
  }
});

// GET /cases/:caseId/documents/:documentId/download - Get signed download URL
router.get('/cases/:caseId/documents/:documentId/download', validateParams(uuidParam), validateParams(z.object({ documentId: z.string().uuid() })), async (req, res) => {
  try {
    const userOrgId = req.user!.orgId!;
    const caseId = Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId;
    const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;

    // Verify document belongs to case and user's org
    const docCheck = await pool.query(
      `SELECT d.*, c.org_id FROM documents d
       JOIN cases c ON c.id = d.case_id
       WHERE d.id = $1 AND d.case_id = $2`,
      [documentId, caseId]
    );

    if (docCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (docCheck.rows[0].org_id !== userOrgId && req.user!.role !== 'PRINCIPAL') {
      return res.status(403).json({ error: 'Cannot access document in another organization' });
    }

    const document = docCheck.rows[0];
    const downloadUrl = await createSignedDownloadUrl(document.bucket_id, document.storage_path);

    res.json({
      success: true,
      downloadUrl,
      fileName: document.name,
      contentType: document.content_type,
    });
  } catch (error: any) {
    console.error('Download URL error:', error);
    res.status(500).json({ error: error.message || 'Failed to create download URL' });
  }
});

// DELETE /cases/:caseId/documents/:documentId - Delete document
router.delete('/cases/:caseId/documents/:documentId', validateParams(uuidParam), validateParams(z.object({ documentId: z.string().uuid() })), async (req, res) => {
  try {
    const userOrgId = req.user!.orgId!;
    const caseId = Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId;
    const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;

    // Verify document belongs to case and user's org
    const docCheck = await pool.query(
      `SELECT d.*, c.org_id FROM documents d
       JOIN cases c ON c.id = d.case_id
       WHERE d.id = $1 AND d.case_id = $2`,
      [documentId, caseId]
    );

    if (docCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (docCheck.rows[0].org_id !== userOrgId && req.user!.role !== 'PRINCIPAL') {
      return res.status(403).json({ error: 'Cannot delete document in another organization' });
    }

    const document = docCheck.rows[0];

    // Delete from Supabase Storage
    try {
      await deleteFile(document.bucket_id, document.storage_path);
    } catch (storageError) {
      console.warn('Storage deletion failed:', storageError);
      // Continue with DB deletion even if storage deletion fails
    }

    // Delete from database
    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.documentId]);

    res.json({ success: true, message: 'Document deleted' });
  } catch (error: any) {
    console.error('Document delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete document' });
  }
});

// GET /cases/:caseId/documents/list - List files in Supabase Storage for a case
router.get('/cases/:caseId/documents/list', validateParams(uuidParam), async (req, res) => {
  try {
    const userOrgId = req.user!.orgId!;
    const { bucketId = BUCKETS.CASE_DOCUMENTS } = req.query;

    // Verify case belongs to user's org
    const caseId = Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId;
    const caseCheck = await pool.query('SELECT id FROM cases WHERE id = $1 AND org_id = $2', [caseId, userOrgId]);
    if (caseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const files = await listFiles(bucketId as string, caseId);

    res.json({
      success: true,
      files,
      bucketId,
      prefix: caseId,
    });
  } catch (error: any) {
    console.error('Storage list error:', error);
    res.status(500).json({ error: error.message || 'Failed to list files' });
  }
});

export default router;