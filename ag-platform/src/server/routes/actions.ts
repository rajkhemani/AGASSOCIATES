import express from 'express';
import { z } from 'zod';
import { createSupabaseMiddleware, requireOrgAccess } from '../auth.ts';
import { ACTION_DEFINITIONS, evaluateAction, ActionApproval } from '../actionGateway.ts';

const router = express.Router();
router.use(createSupabaseMiddleware(), requireOrgAccess());

const requestSchema = z.object({
  action: z.string().min(1),
  approvals: z.array(z.object({ approverId: z.string().uuid(), role: z.string() })).default([]),
});

router.post('/actions/authorize', (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid action request' } });
    return;
  }
  const decision = evaluateAction(parsed.data.action, req.user!, parsed.data.approvals as ActionApproval[]);
  res.status(decision.allowed ? 200 : 403).json({
    action: parsed.data.action,
    definition: ACTION_DEFINITIONS[parsed.data.action] || null,
    decision,
  });
});

export default router;
