import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  accessControlApi,
  type AccessPage,
  type AccessPageRole,
  type AccessProfile,
  type AccessUserGroup,
  type AccessUserType,
} from "../../services/accessControlApi";
import { HttpError } from "../../services/httpClient";
import {
  createDefaultGroupForm,
  createDefaultPageForm,
  createDefaultRoleForm,
  createDefaultUserTypeForm,
  type GroupFormState,
  type PageFormState,
  type RoleFormState,
  type UserTypeFormState,
} from "./adminForms";

const parseError = (error: unknown, fallback: string) => {
  if (error instanceof HttpError) {
    const message = (error.payload as { message?: string })?.message;
    if (message) {
      return message;
    }
  }
  return fallback;
};

export const useAdminPanel = () => {
  const { profile: currentProfile, refreshProfile } = useAuth();
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [userGroups, setUserGroups] = useState<AccessUserGroup[]>([]);
  const [userTypes, setUserTypes] = useState<AccessUserType[]>([]);
  const [pages, setPages] = useState<AccessPage[]>([]);
  const [pageRoles, setPageRoles] = useState<AccessPageRole[]>([]);
  const [groupForm, setGroupForm] = useState<GroupFormState>(() => createDefaultGroupForm());
  const [userTypeForm, setUserTypeForm] = useState<UserTypeFormState>(() => createDefaultUserTypeForm());
  const [pageForm, setPageForm] = useState<PageFormState>(() => createDefaultPageForm());
  const [roleForm, setRoleForm] = useState<RoleFormState>(() => createDefaultRoleForm());
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const updateGroupForm = useCallback(
    (update: Partial<GroupFormState>) => {
      setGroupForm((prev) => ({
        ...prev,
        ...update,
      }));
    },
    []
  );
  const updateUserTypeForm = useCallback(
    (update: Partial<UserTypeFormState>) => {
      setUserTypeForm((prev) => ({
        ...prev,
        ...update,
      }));
    },
    []
  );
  const updatePageForm = useCallback(
    (update: Partial<PageFormState>) => {
      setPageForm((prev) => ({
        ...prev,
        ...update,
      }));
    },
    []
  );
  const updateRoleForm = useCallback(
    (update: Partial<RoleFormState>) => {
      setRoleForm((prev) => ({
        ...prev,
        ...update,
      }));
    },
    []
  );

  const loadAccessData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsLoading(true);
      }
      setErrorMessage(null);
      try {
        const [profilesData, groupsData, userTypesData, pagesData, rolesData] = await Promise.all([
          accessControlApi.listProfiles(),
          accessControlApi.listUserGroups(),
          accessControlApi.listUserTypes(),
          accessControlApi.listPages(),
          accessControlApi.listUserTypePageRoles(),
        ]);

        setProfiles(profilesData ?? []);
        setUserGroups(groupsData ?? []);
        setUserTypes(userTypesData ?? []);
        setPages(pagesData ?? []);
        setPageRoles(rolesData ?? []);
      } catch (error) {
        setErrorMessage(parseError(error, "Nao foi possivel carregar as configuracoes de acesso."));
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    void loadAccessData();
  }, [loadAccessData]);

  const sortedProfiles = useMemo(
    () =>
      [...profiles].sort((a, b) => (a.displayName ?? a.supabaseUserId).localeCompare(b.displayName ?? b.supabaseUserId)),
    [profiles]
  );

  const activeUserTypes = useMemo(() => userTypes.filter((type) => type.isActive), [userTypes]);

  const isBusy = useCallback((key: string) => pendingAction === key, [pendingAction]);

  const handleCreateGroup = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setPendingAction("create-group");
      setStatusMessage(null);
      setErrorMessage(null);
      try {
        await accessControlApi.createUserGroup({
          name: groupForm.name,
          description: groupForm.description || undefined,
          isActive: groupForm.isActive,
        });
        setGroupForm(createDefaultGroupForm());
        setStatusMessage("Grupo criado com sucesso.");
        await loadAccessData({ silent: true });
      } catch (error) {
        setErrorMessage(parseError(error, "Erro ao criar grupo."));
      } finally {
        setPendingAction(null);
      }
    },
    [groupForm, loadAccessData]
  );

  const handleCreateUserType = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setPendingAction("create-user-type");
      setStatusMessage(null);
      setErrorMessage(null);
      try {
        await accessControlApi.createUserType({
          name: userTypeForm.name,
          description: userTypeForm.description || undefined,
          userGroupId: userTypeForm.userGroupId || null,
          isActive: userTypeForm.isActive,
        });
        setUserTypeForm(createDefaultUserTypeForm());
        setStatusMessage("Tipo de usuario criado.");
        await loadAccessData({ silent: true });
      } catch (error) {
        setErrorMessage(parseError(error, "Erro ao criar tipo de usuario."));
      } finally {
        setPendingAction(null);
      }
    },
    [loadAccessData, userTypeForm]
  );

  const handleCreatePage = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setPendingAction("create-page");
      setStatusMessage(null);
      setErrorMessage(null);
      try {
        await accessControlApi.createPage({
          key: pageForm.key,
          name: pageForm.name,
          path: pageForm.path || undefined,
          description: pageForm.description || undefined,
          isActive: pageForm.isActive,
        });
        setPageForm(createDefaultPageForm());
        setStatusMessage("Pagina registrada.");
        await loadAccessData({ silent: true });
      } catch (error) {
        setErrorMessage(parseError(error, "Erro ao registrar pagina."));
      } finally {
        setPendingAction(null);
      }
    },
    [loadAccessData, pageForm]
  );

  const handleCreateRole = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!roleForm.userTypeId || !roleForm.pageId || !roleForm.role) {
        setErrorMessage("Selecione um tipo, uma pagina e informe a role.");
        return;
      }
      setPendingAction("create-role");
      setStatusMessage(null);
      setErrorMessage(null);
      try {
        await accessControlApi.createUserTypePageRole({
          userTypeId: roleForm.userTypeId,
          pageId: roleForm.pageId,
          role: roleForm.role,
        });
        setRoleForm(createDefaultRoleForm());
        setStatusMessage("Role vinculada com sucesso.");
        await loadAccessData({ silent: true });
      } catch (error) {
        setErrorMessage(parseError(error, "Erro ao criar role."));
      } finally {
        setPendingAction(null);
      }
    },
    [loadAccessData, roleForm]
  );

  const handleRemoveRole = useCallback(
    async (role: AccessPageRole) => {
      const actionKey = `delete-role-${role.id}`;
      setPendingAction(actionKey);
      setStatusMessage(null);
      setErrorMessage(null);
      try {
        await accessControlApi.deleteUserTypePageRole(role.id);
        setStatusMessage("Role removida.");
        await loadAccessData({ silent: true });
      } catch (error) {
        setErrorMessage(parseError(error, "Erro ao remover role."));
      } finally {
        setPendingAction(null);
      }
    },
    [loadAccessData]
  );

  const handleProfileUserTypeChange = useCallback(
    async (profile: AccessProfile, userTypeId: string) => {
      const actionKey = `profile-${profile.supabaseUserId}`;
      setPendingAction(actionKey);
      setStatusMessage(null);
      setErrorMessage(null);
      try {
        const updated = await accessControlApi.updateProfileUserType(profile.supabaseUserId, {
          userTypeId: userTypeId || null,
        });
        setProfiles((current) =>
          current.map((item) => (item.supabaseUserId === updated.supabaseUserId ? updated : item))
        );
        if (currentProfile?.supabaseUserId && updated.supabaseUserId === currentProfile.supabaseUserId) {
          await refreshProfile();
        }
        setStatusMessage("Perfil atualizado.");
      } catch (error) {
        setErrorMessage(parseError(error, "Erro ao atualizar perfil."));
      } finally {
        setPendingAction(null);
      }
    },
    [currentProfile?.supabaseUserId, refreshProfile]
  );

  const handleRefresh = useCallback(() => {
    void loadAccessData();
  }, [loadAccessData]);

  return {
    data: {
      profiles,
      sortedProfiles,
      userGroups,
      userTypes,
      activeUserTypes,
      pages,
      pageRoles,
    },
    forms: {
      groupForm,
      userTypeForm,
      pageForm,
      roleForm,
      updateGroupForm,
      updateUserTypeForm,
      updatePageForm,
      updateRoleForm,
    },
    ui: {
      isBusy,
      isLoading,
      errorMessage,
      statusMessage,
    },
    actions: {
      handleCreateGroup,
      handleCreateUserType,
      handleCreatePage,
      handleCreateRole,
      handleRemoveRole,
      handleProfileUserTypeChange,
      handleRefresh,
    },
  };
};
