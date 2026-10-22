import { AppResult, UserSession } from '../../domain/models/models';
import type { Profile, UserRole } from '../../domain/models/models';
import type { AuthRepository } from '../../domain/repository/repositories';
import {
  getOrSeedLocalDatabase,
  mapCampusIdToEnum,
  mapDomainRoleToUserRole,
  STORAGE_KEYS,
  writeLocalJson,
} from '../repository/FakeRepositories';
import {
  clearTokens,
  getAccessToken,
  readTokens,
  signInWithPassword,
  signOutRemote,
  SupabaseError,
  updateOwnPassword,
} from './client';
import { forgetCloudData, hasUnsavedChanges, markPulled, pullAll, pushNow, restoreUnsentEdits } from './sync';

function buildSession(profile: Profile, authenticatedAtIso?: string): UserSession {
  const session: UserSession = {
    loginId: profile.loginId,
    role: mapDomainRoleToUserRole(profile.role),
    campus: mapCampusIdToEnum(profile.campusId),
    authenticatedAtIso: authenticatedAtIso ?? new Date().toISOString(),
    profile,
  };
  writeLocalJson(STORAGE_KEYS.SESSION, session);
  return session;
}

function explain(e: unknown): Error {
  if (e instanceof SupabaseError) {
    if (e.status === 0 || e.transient) return new Error('NETWORK');
    return new Error('INVALID_CREDENTIALS');
  }
  return e instanceof Error ? e : new Error('INVALID_CREDENTIALS');
}

export class SupabaseAuthRepository implements AuthRepository {
  async currentUser(): Promise<Profile | null> {
    return (await this.getCurrentSession())?.profile ?? null;
  }

  async login(loginId: string, password: string): Promise<AppResult<Profile>> {
    try {
      const s = await this.loginWithId(loginId, password);
      return AppResult.success(s.profile);
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'ACCOUNT_INACTIVE') {
        return AppResult.failure({ kind: 'AccountInactive', message: 'This account is inactive. Please contact the school administrator.' });
      }
      return AppResult.failure({ kind: 'InvalidCredentials', message: code === 'NETWORK' ? 'Cannot reach the server.' : 'Invalid Login ID or password.' });
    }
  }

  async loginWithId(loginId: string, password: string): Promise<UserSession> {
    const id = loginId.trim();
    if (!id || !password.trim()) throw new Error('EMPTY_CREDENTIALS');
    let tokens;
    try {
      tokens = await signInWithPassword(id, password);
    } catch (e) {
      throw explain(e);
    }
    let snap;
    try {
      snap = await pullAll(tokens.userId);
    } catch (e) {
      await signOutRemote();
      forgetCloudData();
      throw explain(e);
    }
    const profile = snap.profiles.find((p) => p.id === tokens.userId);
    if (!profile) {
      await signOutRemote();
      forgetCloudData();
      throw new Error('INVALID_CREDENTIALS');
    }
    if (!profile.isActive) {
      await signOutRemote();
      forgetCloudData();
      throw new Error('ACCOUNT_INACTIVE');
    }
    markPulled();
    return buildSession(profile);
  }

  async getCurrentSession(): Promise<UserSession | null> {
    const tokens = readTokens();
    if (!tokens) return null;
    const cached = getOrSeedLocalDatabase().profiles.find((p) => p.id === tokens.userId);
    try {
      await getAccessToken(); // refreshes the sign-in if it expired
      if (!hasUnsavedChanges() && !(await restoreUnsentEdits(tokens.userId))) {
        const snap = await pullAll(tokens.userId);
        markPulled();
        const fresh = snap.profiles.find((p) => p.id === tokens.userId);
        if (!fresh || !fresh.isActive) {
          await signOutRemote();
          forgetCloudData();
          return null;
        }
        return buildSession(fresh, readSavedAt());
      }
    } catch (e) {
      if (e instanceof SupabaseError && !e.transient) {
        clearTokens();
        forgetCloudData();
        return null;
      }
      // offline: carry on with the copy kept on this phone
    }
    return cached ? buildSession(cached, readSavedAt()) : null;
  }

  async logout(): Promise<AppResult<void>> {
    try {
      if (hasUnsavedChanges()) await pushNow();
    } catch {
      /* leave */
    }
    await signOutRemote();
    forgetCloudData();
    return AppResult.success(undefined);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<AppResult<void>> {
    const profile = getOrSeedLocalDatabase().profiles.find((p) => p.id === userId);
    if (!profile) {
      return AppResult.failure({ kind: 'NotFound', entity: 'Profile', id: userId, message: 'User profile not found.' });
    }
    if (newPassword.trim().length < 4) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'New password must be at least 4 characters.' });
    }
    try {
      await signInWithPassword(profile.loginId, oldPassword); // proves the old password (also refreshes tokens)
    } catch (e) {
      if (e instanceof SupabaseError && e.transient) {
        return AppResult.failure({ kind: 'ValidationFailed', message: 'Cannot reach the server.' });
      }
      return AppResult.failure({ kind: 'InvalidCredentials', message: 'Current password is incorrect.' });
    }
    try {
      await updateOwnPassword(newPassword);
    } catch (e) {
      return AppResult.failure({ kind: 'ValidationFailed', message: e instanceof Error ? e.message : 'Could not change password.' });
    }
    return AppResult.success(undefined);
  }

  async switchRoleSession(_role: UserRole): Promise<UserSession> {
    const s = await this.getCurrentSession();
    if (!s) throw new Error('INVALID_CREDENTIALS');
    return s;
  }
}

function readSavedAt(): string | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? (JSON.parse(raw) as UserSession).authenticatedAtIso : undefined;
  } catch {
    return undefined;
  }
}
