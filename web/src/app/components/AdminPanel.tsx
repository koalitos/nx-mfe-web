import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  accessControlApi,
  AccessPage,
  AccessPageRole,
  AccessProfile,
  AccessUserGroup,
  AccessUserType,
} from "../services/accessControlApi";
import { HttpError } from "../services/httpClient";

type GroupFormState = {
  name: string;
  description: string;
  isActive: boolean;
};

type UserTypeFormState = {
  name: string;
  description: string;
  userGroupId: string;
  isActive: boolean;
};

type PageFormState = {
  key: string;
  name: string;
  path: string;
  description: string;
  isActive: boolean;
};

type RoleFormState = {
  userTypeId: string;
  pageId: string;
  role: string;
};

const defaultGroupForm: GroupFormState = {
  name: "",
  description: "",
  isActive: true,
};

const defaultUserTypeForm: UserTypeFormState = {
  name: "",
  description: "",
  userGroupId: "",
  isActive: true,
};

const defaultPageForm: PageFormState = {
  key: "",
  name: "",
  path: "",
  description: "",
  isActive: true,
};

const defaultRoleForm: RoleFormState = {
  userTypeId: "",
  pageId: "",
  role: "",
};

const parseError = (error: unknown, fallback: string) => {
  if (error instanceof HttpError) {
    const message = (error.payload as { message?: string })?.message;
    if (message) {
      return message;
    }
  }
  return fallback;
};

export const AdminPanel = () => {
  const { profile: currentProfile, refreshProfile } = useAuth();
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [userGroups, setUserGroups] = useState<AccessUserGroup[]>([]);
  const [userTypes, setUserTypes] = useState<AccessUserType[]>([]);
  const [pages, setPages] = useState<AccessPage[]>([]);
  const [pageRoles, setPageRoles] = useState<AccessPageRole[]>([]);
  const [groupForm, setGroupForm] = useState<GroupFormState>(defaultGroupForm);
  const [userTypeForm, setUserTypeForm] =
    useState<UserTypeFormState>(defaultUserTypeForm);
  const [pageForm, setPageForm] = useState<PageFormState>(defaultPageForm);
  const [roleForm, setRoleForm] = useState<RoleFormState>(defaultRoleForm);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const loadAccessData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsLoading(true);
      }
      setErrorMessage(null);
      try {
        const [profilesData, groupsData, userTypesData, pagesData, rolesData] =
          await Promise.all([
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
        setErrorMessage(
          parseError(error, "Nao foi possivel carregar as configuracoes de acesso.")
        );
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadAccessData();
  }, [loadAccessData]);

  const sortedProfiles = useMemo(
    () =>
      [...profiles].sort((a, b) =>
        (a.displayName ?? a.supabaseUserId).localeCompare(
          b.displayName ?? b.supabaseUserId
        )
      ),
    [profiles]
  );

  const activeUserTypes = useMemo(
    () => userTypes.filter((type) => type.isActive),
    [userTypes]
  );

  const isBusy = (key: string) => pendingAction === key;

  const handleCreateGroup = async (event: FormEvent<HTMLFormElement>) => {
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
      setGroupForm(defaultGroupForm);
      setStatusMessage("Grupo criado com sucesso.");
      await loadAccessData({ silent: true });
    } catch (error) {
      setErrorMessage(parseError(error, "Erro ao criar grupo."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleCreateUserType = async (event: FormEvent<HTMLFormElement>) => {
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
      setUserTypeForm(defaultUserTypeForm);
      setStatusMessage("Tipo de usuario criado.");
      await loadAccessData({ silent: true });
    } catch (error) {
      setErrorMessage(parseError(error, "Erro ao criar tipo de usuario."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleCreatePage = async (event: FormEvent<HTMLFormElement>) => {
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
      setPageForm(defaultPageForm);
      setStatusMessage("Pagina registrada.");
      await loadAccessData({ silent: true });
    } catch (error) {
      setErrorMessage(parseError(error, "Erro ao registrar pagina."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleCreateRole = async (event: FormEvent<HTMLFormElement>) => {
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
      setRoleForm(defaultRoleForm);
      setStatusMessage("Role vinculada com sucesso.");
      await loadAccessData({ silent: true });
    } catch (error) {
      setErrorMessage(parseError(error, "Erro ao criar role."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemoveRole = async (role: AccessPageRole) => {
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
  };

  const handleProfileUserTypeChange = async (
    profile: AccessProfile,
    userTypeId: string
  ) => {
    const actionKey = `profile-${profile.supabaseUserId}`;
    setPendingAction(actionKey);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const updated = await accessControlApi.updateProfileUserType(
        profile.supabaseUserId,
        { userTypeId: userTypeId || null }
      );
      setProfiles((current) =>
        current.map((item) =>
          item.supabaseUserId === updated.supabaseUserId ? updated : item
        )
      );
      if (
        currentProfile?.supabaseUserId &&
        updated.supabaseUserId === currentProfile.supabaseUserId
      ) {
        await refreshProfile();
      }
      setStatusMessage("Perfil atualizado.");
    } catch (error) {
      setErrorMessage(parseError(error, "Erro ao atualizar perfil."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleRefresh = () => {
    loadAccessData();
  };

  return (
    <div className="rounded-2xl border border-[#4d1d88]/50 bg-[#110020]/90 p-6 text-white shadow-2xl shadow-slate-900/40">
      <div className="h-4" />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-amber-300">
            Controle de acesso
          </p>
          <h2 className="text-2xl font-semibold">
            Perfis, grupos e paginas protegidas
          </h2>
          <p className="text-sm text-slate-300">
            Atualize perfis sincronizados, organize grupos e defina quais rotas
            estao liberadas no frontend.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-md border border-amber-400/60 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-300 hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
        >
          {isLoading ? "Carregando..." : "Recarregar dados"}
        </button>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="mt-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100"
        >
          {errorMessage}
        </p>
      )}

      {statusMessage && !errorMessage && (
        <p className="mt-4 rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {statusMessage}
        </p>
      )}
      <div className="h-4" />

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-300">Sincronizando dados...</p>
      ) : (
        <div className="mt-8 space-y-10">
          <details className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
            <summary className="cursor-pointer list-none rounded-xl border border-slate-800/70 bg-slate-900/70 p-4 focus:outline-none focus:ring-2 focus:ring-emerald-400/40">
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Sessao 1
              </p>
              <h3 className="text-xl font-semibold text-white">
                Perfis sincronizados (lista de usuarios)
              </h3>
              <p className="text-sm text-slate-300">
                Use a coluna Tipo para mover usuarios entre grupos sem solicitar
                um novo login.
              </p>
            </summary>
            {profiles.length === 0 ? (
              <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
                Nenhum perfil encontrado. Assim que usuarios fizerem login eles
                aparecerao aqui.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800/70 bg-slate-950/40 p-2">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Usuario</th>
                      <th className="px-4 py-3">Grupo</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProfiles.map((profile) => {
                      const busy = isBusy(`profile-${profile.supabaseUserId}`);
                      const selectedTypeId = profile.userType?.id ?? "";
                      return (
                        <tr
                          key={profile.supabaseUserId}
                          className="border-t border-slate-800/60"
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">
                              {profile.displayName ?? "Sem nome"}
                            </div>
                            <p className="text-xs text-slate-400">
                              {profile.supabaseUserId}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-200">
                            {profile.userType?.userGroup?.name ?? "Nao definido"}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={selectedTypeId}
                              onChange={(event) =>
                                handleProfileUserTypeChange(
                                  profile,
                                  event.target.value
                                )
                              }
                              className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                              disabled={busy}
                            >
                              <option value="">Sem tipo</option>
                              {activeUserTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                  {type.name}
                                  {type.userGroup
                                    ? ` (${type.userGroup.name})`
                                    : ""}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {busy ? "Aplicando..." : "Atualizado"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </details>

          <details className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-5">
            <summary className="cursor-pointer list-none rounded-xl border border-slate-800/70 bg-slate-900/70 p-4 focus:outline-none focus:ring-2 focus:ring-emerald-400/40">
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Sessao 2
              </p>
              <h3 className="text-xl font-semibold text-white">
                Estrutura organizacional (grupos e tipos)
              </h3>
              <p className="text-sm text-slate-300">
                Crie grupos para segmentar responsabilidades e associe tipos de
                usuario.
              </p>
            </summary>

            <div className="grid gap-6 lg:grid-cols-2">
              <form
                className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                onSubmit={handleCreateGroup}
              >
                <h4 className="text-lg font-semibold text-white">Criar grupo</h4>
                <label className="block text-sm text-slate-200">
                  Nome
                  <input
                    required
                    value={groupForm.name}
                    onChange={(event) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
                  />
                </label>
                <label className="block text-sm text-slate-200">
                  Descricao
                  <textarea
                    value={groupForm.description}
                    onChange={(event) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={groupForm.isActive}
                    onChange={(event) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Grupo ativo
                </label>
                <button
                  type="submit"
                  disabled={isBusy("create-group")}
                  className="w-full rounded-md bg-amber-400/80 py-2 text-sm font-semibold text-amber-950 disabled:cursor-not-allowed"
                >
                  {isBusy("create-group") ? "Criando..." : "Salvar grupo"}
                </button>
              </form>

              <form
                className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                onSubmit={handleCreateUserType}
              >
                <h4 className="text-lg font-semibold text-white">
                  Criar tipo de usuario
                </h4>
                <label className="block text-sm text-slate-200">
                  Nome
                  <input
                    required
                    value={userTypeForm.name}
                    onChange={(event) =>
                      setUserTypeForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
                  />
                </label>
                <label className="block text-sm text-slate-200">
                  Descricao
                  <textarea
                    value={userTypeForm.description}
                    onChange={(event) =>
                      setUserTypeForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
                  />
                </label>
                <label className="block text-sm text-slate-200">
                  Grupo associado
                  <select
                    value={userTypeForm.userGroupId}
                    onChange={(event) =>
                      setUserTypeForm((prev) => ({
                        ...prev,
                        userGroupId: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
                  >
                    <option value="">Sem grupo</option>
                    {userGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={userTypeForm.isActive}
                    onChange={(event) =>
                      setUserTypeForm((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Tipo ativo
                </label>
                <button
                  type="submit"
                  disabled={isBusy("create-user-type")}
                  className="w-full rounded-md bg-amber-400/80 py-2 text-sm font-semibold text-amber-950 disabled:cursor-not-allowed"
                >
                  {isBusy("create-user-type") ? "Salvando..." : "Salvar tipo"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <h4 className="text-lg font-semibold text-white">
                Visao geral dos grupos
              </h4>
              {userGroups.length === 0 ? (
                <p className="mt-3 text-sm text-slate-300">
                  Nenhum grupo cadastrado.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {userGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm"
                    >
                      <p className="font-semibold text-white">{group.name}</p>
                      {group.description && (
                        <p className="text-xs text-slate-300">
                          {group.description}
                        </p>
                      )}
                      <p className="text-xs text-slate-400">
                        {group.isActive ? "Ativo" : "Inativo"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {group.userTypes.length === 0 ? (
                          <span className="text-xs text-slate-500">
                            Sem tipos vinculados.
                          </span>
                        ) : (
                          group.userTypes.map((type) => (
                            <span
                              key={type.id}
                              className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200"
                            >
                              {type.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>

          <details className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-5">
            <summary className="cursor-pointer list-none rounded-xl border border-slate-800/70 bg-slate-900/70 p-4 focus:outline-none focus:ring-2 focus:ring-emerald-400/40">
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Sessao 3
              </p>
              <h3 className="text-xl font-semibold text-white">
                Paginas protegidas e roles
              </h3>
              <p className="text-sm text-slate-300">
                Registre as paginas usadas no frontend e vincule cada uma a um
                tipo de usuario com uma role.
              </p>
            </summary>

            <div className="grid gap-6 lg:grid-cols-2">
              <form
                className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                onSubmit={handleCreatePage}
              >
                <h4 className="text-lg font-semibold text-white">
                  Registrar pagina
                </h4>
                <label className="block text-sm text-slate-200">
                  Chave (ex: dashboard.home)
                  <input
                    required
                    value={pageForm.key}
                    onChange={(event) =>
                      setPageForm((prev) => ({
                        ...prev,
                        key: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
                  />
                </label>
                <label className="block text-sm text-slate-200">
                  Nome exibido
                  <input
                    required
                    value={pageForm.name}
                    onChange={(event) =>
                      setPageForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
                  />
                </label>
                <label className="block text-sm text-slate-200">
                  Path relativo
                  <input
                    value={pageForm.path}
                    onChange={(event) =>
                      setPageForm((prev) => ({
                        ...prev,
                        path: event.target.value,
                      }))
                    }
                    placeholder="/dashboard"
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
                  />
                </label>
                <label className="block text-sm text-slate-200">
                  Descricao
                  <textarea
                    value={pageForm.description}
                    onChange={(event) =>
                      setPageForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={pageForm.isActive}
                    onChange={(event) =>
                      setPageForm((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Pagina ativa
                </label>
                <button
                  type="submit"
                  disabled={isBusy("create-page")}
                  className="w-full rounded-md bg-amber-400/80 py-2 text-sm font-semibold text-amber-950 disabled:cursor-not-allowed"
                >
                  {isBusy("create-page") ? "Gravando..." : "Salvar pagina"}
                </button>
              </form>

              <form
                className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                onSubmit={handleCreateRole}
              >
                <h4 className="text-lg font-semibold text-white">
                  Vincular role
                </h4>
                <label className="block text-sm text-slate-200">
                  Tipo de usuario
                  <select
                    required
                    value={roleForm.userTypeId}
                    onChange={(event) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        userTypeId: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
                  >
                    <option value="">Selecione</option>
                    {userTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                        {type.userGroup ? ` (${type.userGroup.name})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-slate-200">
                  Pagina
                  <select
                    required
                    value={roleForm.pageId}
                    onChange={(event) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        pageId: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
                  >
                    <option value="">Selecione</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.name} ({page.key})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-slate-200">
                  Role (ex: viewer, editor)
                  <input
                    required
                    value={roleForm.role}
                    onChange={(event) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        role: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isBusy("create-role")}
                  className="w-full rounded-md bg-amber-400/80 py-2 text-sm font-semibold text-amber-950 disabled:cursor-not-allowed"
                >
                  {isBusy("create-role") ? "Vinculando..." : "Salvar role"}
                </button>
              </form>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <h4 className="text-lg font-semibold text-white">
                  Roles cadastradas
                </h4>
                {pageRoles.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-300">
                    Nenhuma role definida.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {pageRoles.map((role) => (
                      <div
                        key={role.id}
                        className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {role.userType?.name ?? "Tipo removido"}
                          </p>
                          <p className="text-xs text-slate-400">
                            Pagina: {role.page?.name ?? "Indefinida"} (
                            {role.page?.key ?? "sem chave"})
                          </p>
                          <p className="text-xs text-slate-400">
                            Role: {role.role || "N/A"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(role)}
                          disabled={isBusy(`delete-role-${role.id}`)}
                          className="rounded-md border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-200 transition hover:border-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed"
                        >
                          {isBusy(`delete-role-${role.id}`) ? "Removendo..." : "Remover"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <h4 className="text-lg font-semibold text-white">
                  Paginas registradas
                </h4>
                {pages.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-300">
                    Nenhuma pagina registrada.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3 text-sm">
                    {pages.map((page) => (
                      <div
                        key={page.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"
                      >
                        <p className="font-semibold text-white">
                          {page.name}{" "}
                          <span className="text-xs text-slate-400">({page.key})</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          Path: {page.path ?? "Nao definido"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {page.isActive ? "Ativa" : "Inativa"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {page.roles.length === 0 ? (
                            <span className="text-xs text-slate-500">
                              Sem roles vinculadas.
                            </span>
                          ) : (
                            page.roles.map((role) => (
                              <span
                                key={role.id}
                                className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200"
                              >
                                {role.userType?.name ?? "Tipo removido"} - {role.role}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

