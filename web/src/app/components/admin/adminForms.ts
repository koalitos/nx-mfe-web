export type GroupFormState = {
  name: string;
  description: string;
  isActive: boolean;
};

export type UserTypeFormState = {
  name: string;
  description: string;
  userGroupId: string;
  isActive: boolean;
};

export type PageFormState = {
  key: string;
  name: string;
  path: string;
  description: string;
  isActive: boolean;
};

export type RoleFormState = {
  userTypeId: string;
  pageId: string;
  role: string;
};

export const createDefaultGroupForm = (): GroupFormState => ({
  name: "",
  description: "",
  isActive: true,
});

export const createDefaultUserTypeForm = (): UserTypeFormState => ({
  name: "",
  description: "",
  userGroupId: "",
  isActive: true,
});

export const createDefaultPageForm = (): PageFormState => ({
  key: "",
  name: "",
  path: "",
  description: "",
  isActive: true,
});

export const createDefaultRoleForm = (): RoleFormState => ({
  userTypeId: "",
  pageId: "",
  role: "",
});
