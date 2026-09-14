/**
 * routes/index.js — Route aggregator
 * Mounts all feature routers under /api/v1.
 *
 * Convention:
 *   Each feature has its own router file (e.g., routes/authRoutes.js)
 *   imported and mounted here.
 */

import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes   from './authRoutes.js';
import testRoutes   from './testRoutes.js';
import riskRoutes   from './riskRoutes.js';

const router = Router();

// ─── Health ──────────────────────────────────────────────────────────────────
router.use('/health', healthRoutes);

// ─── Authentication ───────────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ─── RBAC Test (remove or guard in production) ────────────────────────────────
router.use('/test', testRoutes);

// ─── Feature routes (to be added as features are built) ──────────────────────
// router.use('/reports', reportRoutes);
router.use('/check', riskRoutes);
// router.use('/admin',   adminRoutes);

export default router;
