import { env } from '../../config/env';
import { authClient } from './httpClient';

export interface AccessPageSummary {
  id: string;
  key: string;
  name: string;
  path?: string | null;
}

export interface AccessUserGroupSummary {
  id: string;
  name: string;
}

export interface AccessUserTypeSummary {
  id: string;
  name: string;
  userGroup?: AccessUserGroupSummary | null;
}

export interface AccessPageRole {
  id: string;
  role: string;
  userType?: AccessUserTypeSummary;
  page?: AccessPageSummary | null;
}

export interface AccessUserType extends AccessUserTypeSummary {
  description?: string | null;
  isActive: boolean;
  pageRoles: AccessPageRole[];
}

export interface AccessUserGroup extends AccessUserGroupSummary {
  description?: string | null;
  isActive: boolean;
  userTypes: AccessUserType[];
}

export interface AccessPage extends AccessPageSummary {
  description?: string | null;
  isActive: boolean;
  roles: AccessPageRole[];
}

export interface AccessProfile {
  id: string;
  supabaseUserId: string;
  handle?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  userType?: AccessUserType | null;
}

export interface CreateUserGroupPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateUserTypePayload {
  name: string;
  description?: string;
  isActive?: boolean;
  userGroupId?: string | null;
}

export interface CreatePagePayload {
  key: string;
  name: string;
  path?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreatePageRolePayload {
  userTypeId: string;
  pageId: string;
  role: string;
}

export interface UpdateProfileUserTypePayload {
  userTypeId?: string | null;
}

const adminHeaders = {
  'x-admin-key': env.adminApiKey,
};

export const accessControlApi = {
  getProfile(supabaseUserId: string, signal?: AbortSignal) {
    return authClient.get<AccessProfile>(`/auth/profiles/${supabaseUserId}`, {
      auth: true,
      headers: adminHeaders,
      signal,
    });
  },
  listProfiles(signal?: AbortSignal) {
    return authClient.get<AccessProfile[]>('/auth/profiles', {
      auth: true,
      headers: adminHeaders,
      signal,
    });
  },
  updateProfileUserType(
    supabaseUserId: string,
    payload: UpdateProfileUserTypePayload
  ) {
    return authClient.patch<UpdateProfileUserTypePayload, AccessProfile>(
      `/auth/profiles/${supabaseUserId}/user-type`,
      payload,
      {
        auth: true,
      }
    );
  },
  listUserGroups(signal?: AbortSignal) {
    return authClient.get<AccessUserGroup[]>('/auth/user-groups', {
      auth: true,
      headers: adminHeaders,
      signal,
    });
  },
  createUserGroup(payload: CreateUserGroupPayload) {
    return authClient.post<CreateUserGroupPayload, AccessUserGroup>(
      '/auth/user-groups',
      payload,
      {
        auth: true,
        headers: adminHeaders,
      }
    );
  },
  listUserTypes(signal?: AbortSignal) {
    return authClient.get<AccessUserType[]>('/auth/user-types', {
      auth: true,
      headers: adminHeaders,
      signal,
    });
  },
  createUserType(payload: CreateUserTypePayload) {
    return authClient.post<CreateUserTypePayload, AccessUserType>(
      '/auth/user-types',
      payload,
      {
        auth: true,
        headers: adminHeaders,
      }
    );
  },
  listPages(signal?: AbortSignal) {
    return authClient.get<AccessPage[]>('/auth/pages', {
      auth: true,
      headers: adminHeaders,
      signal,
    });
  },
  createPage(payload: CreatePagePayload) {
    return authClient.post<CreatePagePayload, AccessPage>(
      '/auth/pages',
      payload,
      {
        auth: true,
        headers: adminHeaders,
      }
    );
  },
  listUserTypePageRoles(signal?: AbortSignal) {
    return authClient.get<AccessPageRole[]>('/auth/user-type-page-roles', {
      auth: true,
      headers: adminHeaders,
      signal,
    });
  },
  createUserTypePageRole(payload: CreatePageRolePayload) {
    return authClient.post<CreatePageRolePayload, AccessPageRole>(
      '/auth/user-type-page-roles',
      payload,
      {
        auth: true,
        headers: adminHeaders,
      }
    );
  },
  deleteUserTypePageRole(id: string) {
    return authClient.delete<AccessPageRole>(`/auth/user-type-page-roles/${id}`, {
      auth: true,
      headers: adminHeaders,
    });
  },
};
