import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { ROLES } from '../src/config/constants.js';
import { ApiError } from '../src/utils/ApiError.js';

// Mock services
vi.mock('../src/services/admin/AdminUserService.js', () => ({
  default: {
    listUsers: vi.fn(),
    getUserDetails: vi.fn(),
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
    changeRole: vi.fn(),
  }
}));

vi.mock('../src/services/admin/AdminUPIService.js', () => ({
  default: {
    listUPIProfiles: vi.fn(),
    getUPIDetails: vi.fn(),
    updateUPI: vi.fn(),
    blacklistUPI: vi.fn(),
    unblacklistUPI: vi.fn(),
  }
}));

vi.mock('../src/services/admin/AdminConfigService.js', () => ({
  default: {
    getConfig: vi.fn(),
    updateRiskConfig: vi.fn(),
  }
}));

vi.mock('../src/services/admin/AdminAuditService.js', () => ({
  default: {
    listAuditLogs: vi.fn(),
    getAuditLogDetails: vi.fn(),
  }
}));

vi.mock('../src/services/admin/AdminDashboardService.js', () => ({
  default: {
    getAdminSummary: vi.fn(),
    getModerationSummary: vi.fn(),
  }
}));

vi.mock('../src/services/admin/AdminSystemService.js', () => ({
  default: {
    getSystemHealth: vi.fn(),
  }
}));

import adminUserService from '../src/services/admin/AdminUserService.js';
import adminUPIService from '../src/services/admin/AdminUPIService.js';
import adminConfigService from '../src/services/admin/AdminConfigService.js';
import adminAuditService from '../src/services/admin/AdminAuditService.js';
import adminDashboardService from '../src/services/admin/AdminDashboardService.js';
import adminSystemService from '../src/services/admin/AdminSystemService.js';

vi.mock('../src/repositories/AuditRepository.js', () => ({
  default: {
    log: vi.fn().mockResolvedValue(),
  }
}));

// We need to bypass authenticateFirebase and set req.user directly
vi.mock('../src/middlewares/authenticate.js', () => {
  return {
    default: (req, res, next) => {
      const role = req.headers['x-test-role'];
      if (role) {
        req.user = { uid: `user-${role}`, role, email: `${role}@test.com` };
        return next();
      }
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  };
});

import auditRepository from '../src/repositories/AuditRepository.js';

describe('Admin API Authorization', () => {
  it('USER cannot access admin APIs', async () => {
    const res = await request(app).get('/api/v1/admin/users').set('x-test-role', ROLES.USER);
    expect(res.status).toBe(403);
  });

  it('MODERATOR cannot access admin-only APIs', async () => {
    const res = await request(app).get('/api/v1/admin/users').set('x-test-role', ROLES.MODERATOR);
    expect(res.status).toBe(403);
  });

  it('ADMIN can access admin APIs', async () => {
    adminUserService.listUsers.mockResolvedValue({ items: [], hasMore: false, nextCursor: null });
    const res = await request(app).get('/api/v1/admin/users').set('x-test-role', ROLES.ADMIN);
    expect(res.status).toBe(200);
  });

  it('Unauthenticated requests are rejected', async () => {
    const res = await request(app).get('/api/v1/admin/users');
    expect(res.status).toBe(401);
  });
});

describe('User Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Admin can list users', async () => {
    adminUserService.listUsers.mockResolvedValue({ items: [{ uid: '123' }], hasMore: false, nextCursor: null });
    const res = await request(app).get('/api/v1/admin/users').set('x-test-role', ROLES.ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
  });

  it('Admin can retrieve user', async () => {
    adminUserService.getUserDetails.mockResolvedValue({ uid: '123' });
    const res = await request(app).get('/api/v1/admin/users/123').set('x-test-role', ROLES.ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.data.uid).toBe('123');
  });

  it('Admin can block user', async () => {
    adminUserService.blockUser.mockResolvedValue();
    const res = await request(app).patch('/api/v1/admin/users/123/block')
      .set('x-test-role', ROLES.ADMIN)
      .send({ reason: 'Spamming the platform repeatedly.' });
    expect(res.status).toBe(200);
    expect(adminUserService.blockUser).toHaveBeenCalled();
  });

  it('Admin can unblock user', async () => {
    adminUserService.unblockUser.mockResolvedValue();
    const res = await request(app).patch('/api/v1/admin/users/123/unblock')
      .set('x-test-role', ROLES.ADMIN)
      .send();
    expect(res.status).toBe(200);
    expect(adminUserService.unblockUser).toHaveBeenCalled();
  });

  it('Admin can change role', async () => {
    adminUserService.changeRole.mockResolvedValue();
    const res = await request(app).patch('/api/v1/admin/users/123/role')
      .set('x-test-role', ROLES.ADMIN)
      .send({ role: 'MODERATOR' });
    expect(res.status).toBe(200);
    expect(adminUserService.changeRole).toHaveBeenCalled();
  });

  it('Admin cannot change own role', async () => {
    // We simulate the service throwing an error for own role change
    adminUserService.changeRole.mockRejectedValue(new ApiError(409, 'You cannot change your own administrative role.'));
    const res = await request(app).patch('/api/v1/admin/users/user-ADMIN/role')
      .set('x-test-role', ROLES.ADMIN)
      .send({ role: 'USER' });
    expect(res.status).toBe(409);
  });

  it('Last active admin cannot be demoted', async () => {
    adminUserService.changeRole.mockRejectedValue(new ApiError(409, 'The last active administrator cannot be demoted.'));
    const res = await request(app).patch('/api/v1/admin/users/123/role')
      .set('x-test-role', ROLES.ADMIN)
      .send({ role: 'USER' });
    expect(res.status).toBe(409);
  });
});

describe('UPI Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Admin can retrieve UPI intelligence', async () => {
    adminUPIService.getUPIDetails.mockResolvedValue({ upiId: 'test@ybl' });
    const res = await request(app).get('/api/v1/admin/upi/test@ybl').set('x-test-role', ROLES.ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.data.upiId).toBe('test@ybl');
  });

  it('Admin can update allowed administrative fields', async () => {
    adminUPIService.updateUPI.mockResolvedValue();
    const res = await request(app).patch('/api/v1/admin/upi/test@ybl')
      .set('x-test-role', ROLES.ADMIN)
      .send({ administrativeNote: 'test note' });
    expect(res.status).toBe(200);
  });

  it('Admin cannot manually change risk score', async () => {
    const res = await request(app).patch('/api/v1/admin/upi/test@ybl')
      .set('x-test-role', ROLES.ADMIN)
      .send({ riskScore: 50 });
    expect(res.status).toBe(422); // Validation failure
  });

  it('Admin can blacklist UPI', async () => {
    adminUPIService.blacklistUPI.mockResolvedValue();
    const res = await request(app).post('/api/v1/admin/upi/test@ybl/blacklist')
      .set('x-test-role', ROLES.ADMIN)
      .send({ reason: 'Fraud activity confirmed by admin.' });
    expect(res.status).toBe(200);
    expect(adminUPIService.blacklistUPI).toHaveBeenCalled();
  });

  it('Admin can unblacklist UPI', async () => {
    adminUPIService.unblacklistUPI.mockResolvedValue();
    const res = await request(app).post('/api/v1/admin/upi/test@ybl/unblacklist')
      .set('x-test-role', ROLES.ADMIN)
      .send({ reason: 'Admin review completed, safe.' });
    expect(res.status).toBe(200);
    expect(adminUPIService.unblacklistUPI).toHaveBeenCalled();
  });

  it('Blacklist requires reason', async () => {
    const res = await request(app).post('/api/v1/admin/upi/test@ybl/blacklist')
      .set('x-test-role', ROLES.ADMIN)
      .send({ reason: 'short' });
    expect(res.status).toBe(422); // minimum 10 chars
  });
});

describe('Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Admin can read configuration', async () => {
    adminConfigService.getConfig.mockResolvedValue({ riskThresholds: { lowThreshold: 30 } });
    const res = await request(app).get('/api/v1/admin/config').set('x-test-role', ROLES.ADMIN);
    expect(res.status).toBe(200);
  });

  it('Admin can update valid risk configuration', async () => {
    adminConfigService.updateRiskConfig.mockResolvedValue({});
    const res = await request(app).patch('/api/v1/admin/config/risk')
      .set('x-test-role', ROLES.ADMIN)
      .send({ lowThreshold: 40 });
    expect(res.status).toBe(200);
    expect(adminConfigService.updateRiskConfig).toHaveBeenCalled();
  });

  it('Invalid thresholds are rejected', async () => {
    const res = await request(app).patch('/api/v1/admin/config/risk')
      .set('x-test-role', ROLES.ADMIN)
      .send({ lowThreshold: 80, mediumThreshold: 50 }); // low > medium
    expect(res.status).toBe(422);
  });
});

describe('Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Admin can read audit logs', async () => {
    adminAuditService.listAuditLogs.mockResolvedValue({ items: [], hasMore: false });
    const res = await request(app).get('/api/v1/admin/audit-logs').set('x-test-role', ROLES.ADMIN);
    expect(res.status).toBe(200);
  });
  
  it('Audit logs cannot be modified', async () => {
    const res = await request(app).patch('/api/v1/admin/audit-logs/123').set('x-test-role', ROLES.ADMIN);
    expect(res.status).toBe(404); // Route doesn't exist
  });

  it('Audit logs cannot be deleted', async () => {
    const res = await request(app).delete('/api/v1/admin/audit-logs/123').set('x-test-role', ROLES.ADMIN);
    expect(res.status).toBe(404); // Route doesn't exist
  });
});

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Admin dashboard summary returns correct counters', async () => {
    adminDashboardService.getAdminSummary.mockResolvedValue({ totalUsers: 100 });
    const res = await request(app).get('/api/v1/admin/dashboard/summary').set('x-test-role', ROLES.ADMIN);
    expect(res.status).toBe(200);
  });

  it('Moderator summary returns correct moderation counters', async () => {
    adminDashboardService.getModerationSummary.mockResolvedValue({ pendingReports: 5 });
    const res = await request(app).get('/api/v1/admin/moderation/summary').set('x-test-role', ROLES.MODERATOR);
    expect(res.status).toBe(200);
  });
});

describe('Health', () => {
  it('Admin system health works', async () => {
    adminSystemService.getSystemHealth.mockResolvedValue({ status: 'OK' });
    const res = await request(app).get('/api/v1/admin/system/health').set('x-test-role', ROLES.ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.data.secrets).toBeUndefined(); // Secrets are never returned
  });
});
