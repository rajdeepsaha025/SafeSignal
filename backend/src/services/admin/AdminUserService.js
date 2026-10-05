import userRepository from '../../repositories/UserRepository.js';
import auditRepository from '../../repositories/AuditRepository.js';
import { ApiError } from '../../utils/ApiError.js';
import { HTTP_STATUS, USER_STATUS, ROLES } from '../../config/constants.js';
import { runTransaction, offsetPaginate } from '../../utils/firestoreHelpers.js';

class AdminUserService {
  /**
   * List registered users with pagination and filtering.
   */
  async listUsers(queryParams) {
    const { page, limit, role, status, search, createdAfter, createdBefore } = queryParams;
    let query = userRepository.collection();

    if (role) query = query.where('role', '==', role);
    if (status) query = query.where('status', '==', status);
    if (createdAfter) query = query.where('createdAt', '>=', new Date(createdAfter));
    if (createdBefore) query = query.where('createdAt', '<=', new Date(createdBefore));
    
    // Simplistic search (usually email)
    if (search) {
      const end = search + '\uf8ff';
      query = query.where('email', '>=', search).where('email', '<=', end).orderBy('email');
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    const { docs, ...meta } = await offsetPaginate(query, page, limit);
    const items = docs.map(d => d.data());

    // Sanitize output
    const sanitizedItems = items.map(user => this._sanitizeUser(user));

    return { items: sanitizedItems, ...meta };
  }

  /**
   * Get user details
   */
  async getUserDetails(uid) {
    const user = await userRepository.findById(uid);
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, `User with ID ${uid} not found`);
    }
    return this._sanitizeUser(user);
  }

  /**
   * Block a user
   */
  async blockUser(uid, reason, adminUid) {
    const user = await userRepository.findById(uid);
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }
    
    if (user.role === ROLES.ADMIN) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'Cannot block an administrator.');
    }

    await userRepository.update(uid, {
      status: USER_STATUS.BLOCKED,
      blockedAt: new Date(),
      blockedBy: adminUid,
      blockReason: reason
    });

    await auditRepository.log({
      userId: adminUid,
      action: 'USER_BLOCKED',
      resource: uid,
      metadata: { reason }
    });
  }

  /**
   * Unblock a user
   */
  async unblockUser(uid, adminUid) {
    const user = await userRepository.findById(uid);
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    await userRepository.update(uid, {
      status: USER_STATUS.ACTIVE,
      unblockedAt: new Date(),
      unblockedBy: adminUid,
    });

    await auditRepository.log({
      userId: adminUid,
      action: 'USER_UNBLOCKED',
      resource: uid,
    });
  }

  /**
   * Change user role
   */
  async changeRole(uid, newRole, adminUid) {
    if (uid === adminUid) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'You cannot change your own administrative role.');
    }

    const result = await runTransaction(async (t) => {
      const userRef = userRepository.doc(uid);
      const userDoc = await t.get(userRef);

      if (!userDoc.exists) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
      }

      const user = userDoc.data();
      const previousRole = user.role || ROLES.USER;

      if (previousRole === newRole) {
        return { previousRole, newRole };
      }

      // Last active admin protection
      if (previousRole === ROLES.ADMIN) {
        const adminsSnapshot = await userRepository.collection()
          .where('role', '==', ROLES.ADMIN)
          .where('status', '==', USER_STATUS.ACTIVE)
          .get();
        
        if (adminsSnapshot.docs.length <= 1) {
          throw new ApiError(HTTP_STATUS.CONFLICT, 'The last active administrator cannot be demoted.');
        }
      }

      t.update(userRef, {
        role: newRole,
        updatedAt: new Date()
      });

      return { previousRole, newRole };
    });

    if (result.previousRole !== result.newRole) {
      await auditRepository.log({
        userId: adminUid,
        action: 'ROLE_CHANGED',
        resource: uid,
        metadata: {
          targetUid: uid,
          previousRole: result.previousRole,
          newRole: result.newRole
        }
      });
    }
  }

  _sanitizeUser(user) {
    const { password: _password, tokens: _tokens, ...safeUser } = user;
    return safeUser;
  }
}

export default new AdminUserService();
