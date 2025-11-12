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

export const accessControlApi = {
  listProfiles(signal?: AbortSignal) {
    return authClient.get<AccessProfile[]>('/auth/profiles', {
      auth: true,
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
      signal,
    });
  },
  createUserGroup(payload: CreateUserGroupPayload) {
    return authClient.post<CreateUserGroupPayload, AccessUserGroup>(
      '/auth/user-groups',
      payload,
      { auth: true }
    );
  },
  listUserTypes(signal?: AbortSignal) {
    return authClient.get<AccessUserType[]>('/auth/user-types', {
      auth: true,
      signal,
    });
  },
  createUserType(payload: CreateUserTypePayload) {
    return authClient.post<CreateUserTypePayload, AccessUserType>(
      '/auth/user-types',
      payload,
      { auth: true }
    );
  },
  listPages(signal?: AbortSignal) {
    return authClient.get<AccessPage[]>('/auth/pages', {
      auth: true,
      signal,
    });
  },
  createPage(payload: CreatePagePayload) {
    return authClient.post<CreatePagePayload, AccessPage>(
      '/auth/pages',
      payload,
      { auth: true }
    );
  },
  listUserTypePageRoles(signal?: AbortSignal) {
    return authClient.get<AccessPageRole[]>('/auth/user-type-page-roles', {
      auth: true,
      signal,
    });
  },
  createUserTypePageRole(payload: CreatePageRolePayload) {
    return authClient.post<CreatePageRolePayload, AccessPageRole>(
      '/auth/user-type-page-roles',
      payload,
      { auth: true }
    );
  },
  deleteUserTypePageRole(id: string) {
    return authClient.delete<AccessPageRole>(`/auth/user-type-page-roles/${id}`, {
      auth: true,
    });
  },
};
