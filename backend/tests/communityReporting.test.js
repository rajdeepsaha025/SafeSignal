import { describe, it, expect, vi, beforeEach } from 'vitest';
import reportService from '../src/services/ReportService.js';
import moderationService from '../src/services/ModerationService.js';
import reportRepository from '../src/repositories/ReportRepository.js';
import { firestore } from '../src/config/firebaseAdmin.js';
import { REPORT_STATUS } from '../src/config/constants.js';
import riskService from '../src/services/RiskService.js';

vi.mock('../src/repositories/ReportRepository.js', () => ({
  default: {
    hasUserReported: vi.fn(),
    findById: vi.fn(),
    findPending: vi.fn(),
  }
}));

vi.mock('../src/config/firebaseAdmin.js', () => ({
  firestore: {
    runTransaction: vi.fn(),
    collection: vi.fn()
  }
}));

vi.mock('../src/services/RiskService.js', () => ({
  default: {
    invalidateCache: vi.fn()
  }
}));

describe('Community Reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should normalize UPI ID on submission', async () => {
    reportRepository.hasUserReported.mockResolvedValue(false);
    
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({ exists: false }),
      set: vi.fn(),
      update: vi.fn()
    };
    firestore.runTransaction.mockImplementation(async (cb) => cb(mockTransaction));
    firestore.collection.mockReturnValue({ doc: () => ({ id: 'mock-id' }) });

    await reportService.submitReport({
      upiId: ' SCAMMER@okSBI ',
      fraudType: 'marketplace_scam',
      description: 'test description'
    }, { uid: 'user123' });

    expect(reportRepository.hasUserReported).toHaveBeenCalledWith('scammer@oksbi', 'user123');
  });

  it('should throw Conflict if duplicate report found', async () => {
    reportRepository.hasUserReported.mockResolvedValue(true);

    await expect(reportService.submitReport({
      upiId: 'scammer@oksbi',
      fraudType: 'marketplace_scam',
      description: 'test'
    }, { uid: 'user123' })).rejects.toThrow('already submitted');
  });

  it('should enforce report viewing ownership', async () => {
    reportRepository.findById.mockResolvedValue({
      id: 'rep-1',
      reporterUid: 'other-user',
      status: REPORT_STATUS.PENDING
    });

    await expect(reportService.getReportById('rep-1', { uid: 'user123', role: 'USER' }))
      .rejects.toThrow('permission to view');
  });
  
  it('should allow moderator to view any report', async () => {
    reportRepository.findById.mockResolvedValue({
      id: 'rep-1',
      reporterUid: 'other-user',
      status: REPORT_STATUS.PENDING
    });

    const report = await reportService.getReportById('rep-1', { uid: 'mod1', role: 'MODERATOR' });
    expect(report.id).toBe('rep-1');
  });
});

describe('Report Moderation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should approve a pending report and invalidate risk cache', async () => {
    const mockTransaction = {
      get: vi.fn().mockImplementation((ref) => {
        if (ref.id === 'rep-1') {
          return Promise.resolve({
            exists: true,
            data: () => ({ upiId: 'scam@ybl', status: REPORT_STATUS.PENDING, fraudType: 'phishing' })
          });
        }
        return Promise.resolve({ exists: false });
      }),
      set: vi.fn(),
      update: vi.fn()
    };
    
    firestore.runTransaction.mockImplementation(async (cb) => cb(mockTransaction));
    firestore.collection.mockReturnValue({ doc: (id) => ({ id: id || 'mock-id' }) });
    reportRepository.findById.mockResolvedValue({ upiId: 'scam@ybl', status: REPORT_STATUS.APPROVED });

    await moderationService.approveReport('rep-1', 'Valid evidence', { uid: 'mod1' });

    expect(mockTransaction.update).toHaveBeenCalled(); // Should update report and profile
    expect(riskService.invalidateCache).toHaveBeenCalledWith('scam@ybl');
  });

  it('should reject already moderated reports', async () => {
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ status: REPORT_STATUS.APPROVED }) // Already approved
      })
    };
    firestore.runTransaction.mockImplementation(async (cb) => cb(mockTransaction));
    firestore.collection.mockReturnValue({ doc: () => ({ id: 'rep-1' }) });

    await expect(moderationService.approveReport('rep-1', 'Test', { uid: 'mod1' }))
      .rejects.toThrow('already been moderated');
  });
});
