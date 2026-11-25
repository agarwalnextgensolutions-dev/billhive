import { AppUser, UserAccesses } from '../types';
import { supabase } from './supabaseClient';

export const SINGLE_ENTITY_PHONE = '9999999999';

export const createDefaultAccesses = (allowAll: boolean = false): UserAccesses => ({
  invoicing: {
    view: allowAll,
    update: allowAll,
    delete: allowAll,
    export: allowAll,
  },
  customers: {
    view: allowAll,
    update: allowAll,
    delete: allowAll,
    export: allowAll,
    viewContact: allowAll,
    updateContact: allowAll,
    viewBank: allowAll,
    updateBank: allowAll,
  },
  product: {
    view: allowAll,
    update: allowAll,
    delete: allowAll,
    export: allowAll,
  },
  ewayBill: {
    view: allowAll,
    update: allowAll,
    delete: allowAll,
    export: allowAll,
  },
  companyDetails: {
    view: allowAll,
    update: allowAll,
    delete: allowAll,
    export: allowAll,
  },
  userManagement: {
    view: allowAll,
    update: allowAll,
    delete: allowAll,
    export: allowAll,
  },
});

export const DEFAULT_ADMIN_USER: AppUser = {
  id: 'admin-angs',
  userId: 'Angs',
  name: 'Administrator',
  email: 'admin@agarwalnextgen.com',
  phone: '9999999999',
  password: 'Angs@9748',
  role: 'admin',
  accesses: createDefaultAccesses(true),
  createdAt: '2026-01-01T00:00:00.000Z',
};

const USERS_CACHE_KEY = 'billhive_users_store';
const CURRENT_USER_SESSION_KEY = 'billhive_user_session';

/**
 * Loads all users from Supabase __SYSTEM_USERS__ row, falling back to localStorage cache and DEFAULT_ADMIN_USER.
 */
export async function loadUsersFromDB(companyId?: string): Promise<AppUser[]> {
  try {
    let query = supabase.from('customers').select('*').eq('company_name', '__SYSTEM_USERS__');
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    const { data, error } = await query.maybeSingle();

    if (!error && data && Array.isArray(data.spoc_details) && data.spoc_details.length > 0) {
      const users: AppUser[] = data.spoc_details;
      // Ensure admin exists
      const hasAdmin = users.some(u => u.userId.toLowerCase() === DEFAULT_ADMIN_USER.userId.toLowerCase());
      if (!hasAdmin) {
        users.unshift(DEFAULT_ADMIN_USER);
      }
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(users));
      return users;
    }

    // If row doesn't exist yet and we have companyId, create it
    if (companyId && (!data || error)) {
      const initialUsers = [DEFAULT_ADMIN_USER];
      await supabase.from('customers').insert([{
        company_id: companyId,
        company_name: '__SYSTEM_USERS__',
        addresses: [],
        bank_details: {},
        spoc_details: initialUsers,
      }]);
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
  } catch (err) {
    console.warn('Could not load users from Supabase, using local cache:', err);
  }

  // Fallback to local cache
  const cached = localStorage.getItem(USERS_CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore parse error
    }
  }

  return [DEFAULT_ADMIN_USER];
}

/**
 * Saves users list to Supabase and local cache.
 */
export async function saveUsersToDB(
  arg1: AppUser[] | string,
  arg2?: AppUser[] | string
): Promise<void> {
  const users: AppUser[] = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : []);
  const companyId: string = typeof arg1 === 'string' ? arg1 : (typeof arg2 === 'string' ? arg2 : '');

  // Ensure default admin user is always preserved
  const hasAdmin = users.some(u => u.userId.toLowerCase() === DEFAULT_ADMIN_USER.userId.toLowerCase());
  const finalUsers = hasAdmin ? users : [DEFAULT_ADMIN_USER, ...users];

  localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(finalUsers));

  try {
    let query = supabase.from('customers').select('id').eq('company_name', '__SYSTEM_USERS__');
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    const { data: existing } = await query.maybeSingle();

    if (existing) {
      await supabase
        .from('customers')
        .update({ spoc_details: finalUsers })
        .eq('id', existing.id);
    } else if (companyId) {
      await supabase.from('customers').insert([{
        company_id: companyId,
        company_name: '__SYSTEM_USERS__',
        addresses: [],
        bank_details: {},
        spoc_details: finalUsers,
      }]);
    }
  } catch (err) {
    console.error('Failed to sync users to Supabase:', err);
  }
}

/**
 * Authenticates user credentials.
 */
export async function authenticateUser(userIdInput: string, passwordInput: string): Promise<AppUser | null> {
  const cleanId = (userIdInput || '').trim();
  const cleanPass = (passwordInput || '').trim();

  if (!cleanId || !cleanPass) return null;

  // Direct check for primary admin Angs / Angs@9748
  if (cleanId.toLowerCase() === DEFAULT_ADMIN_USER.userId.toLowerCase() && cleanPass === DEFAULT_ADMIN_USER.password) {
    return DEFAULT_ADMIN_USER;
  }

  // Load latest users
  const users = await loadUsersFromDB();
  const matched = users.find(
    u => u.userId.toLowerCase() === cleanId.toLowerCase() && u.password === cleanPass
  );

  return matched || null;
}

/**
 * Gets currently logged in user from localStorage.
 */
export function getCurrentUserSession(): AppUser | null {
  const saved = localStorage.getItem(CURRENT_USER_SESSION_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

/**
 * Sets current user session.
 */
export function setCurrentUserSession(user: AppUser | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_SESSION_KEY);
  }
}

// Permission helpers
export function isUserAdmin(user: AppUser | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.userId.toLowerCase() === 'angs';
}

export function canUserView(user: AppUser | null, module: keyof UserAccesses): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return !!user.accesses?.[module]?.view;
}

export function canUserUpdate(user: AppUser | null, module: keyof UserAccesses): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return !!user.accesses?.[module]?.update;
}

export function canUserDelete(user: AppUser | null, module: keyof UserAccesses): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return !!user.accesses?.[module]?.delete;
}

export function canUserExport(user: AppUser | null, module: keyof UserAccesses): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return !!user.accesses?.[module]?.export;
}

export function canUserViewCustomerContact(user: AppUser | null): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return !!user.accesses?.customers?.viewContact;
}

export function canUserUpdateCustomerContact(user: AppUser | null): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return !!user.accesses?.customers?.updateContact;
}

export function canUserViewCustomerBank(user: AppUser | null): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return !!user.accesses?.customers?.viewBank;
}

export function canUserUpdateCustomerBank(user: AppUser | null): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return !!user.accesses?.customers?.updateBank;
}
