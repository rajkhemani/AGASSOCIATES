import express from 'express';
import { pool } from '../db.ts';
import { createSupabaseMiddleware, requireOrgAccess } from '../auth.ts';
import { validate, validateParams, CreateDocumentSchema } from '../validation.ts';
import { z } from 'zod';

const router = express.Router();

const authOrg = [createSupabaseMiddleware(), requireOrgAccess()];

// All document routes require authentication + org access
router.use(...authOrg);

const uuidParam = z.object({ caseId: z.string().uuid() });

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

export default router;