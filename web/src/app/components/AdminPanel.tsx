
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  accessControlApi,
  AccessPage,
  AccessPageRole,
  AccessProfile,
  AccessUserGroup,
  AccessUserType,
} from '../services/accessControlApi';
import { HttpError } from '../services/httpClient';

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
  name: '',
  description: '',
  isActive: true,
};

const defaultUserTypeForm: UserTypeFormState = {
  name: '',
  description: '',
  userGroupId: '',
  isActive: true,
};

const defaultPageForm: PageFormState = {
  key: '',
  name: '',
  path: '',
  description: '',
  isActive: true,
};

const defaultRoleForm: RoleFormState = {
  userTypeId: '',
  pageId: '',
  role: '',
};

const parseError = (error: unknown, fallback: string) => {
  if (error instanceof HttpError) {
    const payloadMessage = (error.payload as { message?: string })?.message;
    if (payloadMessage) {
      return payloadMessage;
    }
  }
  return fallback;
};

const formatPath = (path?: string | null) => (path ? path : '—');

const formatRole = (role?: string) => (role ? role : '—');
export const AdminPanel = () => {
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
        const [
          profilesResponse,
          groupsResponse,
          userTypesResponse,
          pagesResponse,
          rolesResponse,
        ] = await Promise.all([
          accessControlApi.listProfiles(),
          accessControlApi.listUserGroups(),
          accessControlApi.listUserTypes(),
          accessControlApi.listPages(),
          accessControlApi.listUserTypePageRoles(),
        ]);

        setProfiles(profilesResponse ?? []);
        setUserGroups(groupsResponse ?? []);
        setUserTypes(userTypesResponse ?? []);
        setPages(pagesResponse ?? []);
        setPageRoles(rolesResponse ?? []);
      } catch (error) {
        setErrorMessage(
          parseError(error, 'Nao foi possivel carregar as configuracoes de acesso.')
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
    setPendingAction('create-group');
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await accessControlApi.createUserGroup({
        name: groupForm.name,
        description: groupForm.description || undefined,
        isActive: groupForm.isActive,
      });
      setGroupForm(defaultGroupForm);
      setStatusMessage('Grupo criado com sucesso.');
      await loadAccessData({ silent: true });
    } catch (error) {
      setErrorMessage(parseError(error, 'Erro ao criar grupo.'));
    } finally {
      setPendingAction(null);
    }
  };

  const handleCreateUserType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPendingAction('create-user-type');
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
      setStatusMessage('Tipo de usuario criado.');
      await loadAccessData({ silent: true });
    } catch (error) {
      setErrorMessage(parseError(error, 'Erro ao criar tipo de usuario.'));
    } finally {
      setPendingAction(null);
    }
  };

  const handleCreatePage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPendingAction('create-page');
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
      setStatusMessage('Pagina registrada.');
      await loadAccessData({ silent: true });
    } catch (error) {
      setErrorMessage(parseError(error, 'Erro ao registrar pagina.'));
    } finally {
      setPendingAction(null);
    }
  };
  const handleCreateRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roleForm.userTypeId || !roleForm.pageId || !roleForm.role) {
      setErrorMessage('Selecione tipo, pagina e informe a role.');
      return;
    }
    setPendingAction('create-role');
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await accessControlApi.createUserTypePageRole({
        userTypeId: roleForm.userTypeId,
        pageId: roleForm.pageId,
        role: roleForm.role,
      });
      setRoleForm(defaultRoleForm);
      setStatusMessage('Role vinculada com sucesso.');
      await loadAccessData({ silent: true });
    } catch (error) {
      setErrorMessage(parseError(error, 'Erro ao criar role.'));
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
      setStatusMessage('Role removida.');
      await loadAccessData({ silent: true });
    } catch (error) {
      setErrorMessage(parseError(error, 'Erro ao remover role.'));
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
        {
          userTypeId: userTypeId || null,
        }
      );
      setProfiles((current) =>
        current.map((item) =>
          item.supabaseUserId === updated.supabaseUserId ? updated : item
        )
      );
      setStatusMessage('Perfil atualizado.');
    } catch (error) {
      setErrorMessage(parseError(error, 'Erro ao atualizar perfil.'));
    } finally {
      setPendingAction(null);
    }
  };

  const handleRefresh = () => {
    loadAccessData();
  };

  return (
    <div className="rounded-xl border border-amber-500/40 bg-slate-900/80 p-6 text-white shadow-2xl shadow-slate-900/50">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-amber-300">
            Controle de acesso
          </p>
          <h2 className="text-2xl font-semibold">
            Grupos, tipos, paginas e perfis
          </h2>
          <p className="text-sm text-slate-300">
            Configure grupos, vincule tipos de usuario e defina roles de acesso
            por pagina.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-md border border-amber-400/60 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-300 hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
        >
          {isLoading ? 'Carregando...' : 'Atualizar dados'}
        </button>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="mt-4 rounded border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200"
        >
          {errorMessage}
        </p>
      )}

      {statusMessage && !errorMessage && (
        <p className="mt-4 rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {statusMessage}
        </p>
      )}

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-300">
          Buscando configuracoes atualizadas...
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          <section className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Perfis sincronizados</h3>
                <p className="text-sm text-slate-300">
                  Defina o tipo de usuario (e consequentemente o grupo) de cada
                  perfil registrado.
                </p>
              </div>
              <span className="text-sm text-slate-400">
                {profiles.length} perfil(s)
              </span>
            </div>
            {profiles.length === 0 ? (
              <p className="mt-4 text-sm text-slate-300">
                Nenhum perfil encontrado. Realize logins/registrations para
                sincronizar.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {sortedProfiles.map((profile) => {
                  const userTypeId = profile.userType?.id ?? '';
                  return (
                    <div
                      key={profile.supabaseUserId}
                      className="flex flex-col gap-3 rounded border border-slate-800/80 bg-slate-900/70 p-3 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {profile.displayName ?? 'Sem nome'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {profile.supabaseUserId}
                        </p>
                        {profile.userType?.userGroup && (
                          <p className="text-xs text-slate-300">
                            Grupo:{' '}
                            <span className="font-medium">
                              {profile.userType.userGroup.name}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 text-sm text-slate-200 lg:min-w-[240px]">
                        <select
                          value={userTypeId}
                          onChange={(event) =>
                            handleProfileUserTypeChange(
                              profile,
                              event.target.value
                            )
                          }
                          className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                          disabled={isBusy(`profile-${profile.supabaseUserId}`)}
                        >
                          <option value="">Sem tipo definido</option>
                          {activeUserTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}{' '}
                              {type.userGroup
                                ? `(${type.userGroup.name})`
                                : ''}
                            </option>
                          ))}
                        </select>
                        {isBusy(`profile-${profile.supabaseUserId}`) && (
                          <span className="text-xs text-amber-300">
                            Atualizando...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <h3 className="text-lg font-semibold">Registrar grupo</h3>
              <p className="text-sm text-slate-300">
                Grupos agrupam tipos de usuarios com responsabilidades
                semelhantes.
              </p>
              <form className="mt-4 space-y-4" onSubmit={handleCreateGroup}>
                <label className="block text-sm">
                  <span className="font-medium text-slate-200">Nome</span>
                  <input
                    required
                    value={groupForm.name}
                    onChange={(event) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-200">
                    Descricao (opcional)
                  </span>
                  <textarea
                    value={groupForm.description}
                    onChange={(event) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <input
                    type="checkbox"
                    checked={groupForm.isActive}
                    onChange={(event) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-amber-400 focus:ring-amber-400"
                  />
                  Ativo para associacao
                </label>
                <button
                  type="submit"
                  disabled={isBusy('create-group')}
                  className="w-full rounded-md bg-amber-400/90 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {isBusy('create-group') ? 'Criando...' : 'Criar grupo'}
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <h3 className="text-lg font-semibold">Criar tipo de usuario</h3>
              <p className="text-sm text-slate-300">
                Tipos sao associados aos perfis e determinam o grupo e as roles.
              </p>
              <form className="mt-4 space-y-4" onSubmit={handleCreateUserType}>
                <label className="block text-sm">
                  <span className="font-medium text-slate-200">Nome</span>
                  <input
                    required
                    value={userTypeForm.name}
                    onChange={(event) =>
                      setUserTypeForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-200">
                    Descricao (opcional)
                  </span>
                  <textarea
                    value={userTypeForm.description}
                    onChange={(event) =>
                      setUserTypeForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-200">Grupo</span>
                  <select
                    value={userTypeForm.userGroupId}
                    onChange={(event) =>
                      setUserTypeForm((prev) => ({
                        ...prev,
                        userGroupId: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  >
                    <option value="">Sem grupo</option>
                    {userGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <input
                    type="checkbox"
                    checked={userTypeForm.isActive}
                    onChange={(event) =>
                      setUserTypeForm((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-amber-400 focus:ring-amber-400"
                  />
                  Tipo ativo
                </label>
                <button
                  type="submit"
                  disabled={isBusy('create-user-type')}
                  className="w-full rounded-md bg-amber-400/90 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {isBusy('create-user-type') ? 'Registrando...' : 'Criar tipo'}
                </button>
              </form>
            </div>
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <h3 className="text-lg font-semibold">Paginas protegidas</h3>
              <p className="text-sm text-slate-300">
                Registre paginas para vincular roles.
              </p>
              <form className="mt-4 space-y-4" onSubmit={handleCreatePage}>
                <label className="block text-sm">
                  <span className="font-medium text-slate-200">
                    Chave (ex.: dashboard.home)
                  </span>
                  <input
                    required
                    value={pageForm.key}
                    onChange={(event) =>
                      setPageForm((prev) => ({
                        ...prev,
                        key: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-200">Nome</span>
                  <input
                    required
                    value={pageForm.name}
                    onChange={(event) =>
                      setPageForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-200">
                    Path relativo
                  </span>
                  <input
                    value={pageForm.path}
                    onChange={(event) =>
                      setPageForm((prev) => ({
                        ...prev,
                        path: event.target.value,
                      }))
                    }
                    placeholder="/dashboard"
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-200">
                    Descricao (opcional)
                  </span>
                  <textarea
                    value={pageForm.description}
                    onChange={(event) =>
                      setPageForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <input
                    type="checkbox"
                    checked={pageForm.isActive}
                    onChange={(event) =>
                      setPageForm((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-amber-400 focus:ring-amber-400"
                  />
                  Pagina ativa
                </label>
                <button
                  type="submit"
                  disabled={isBusy('create-page')}
                  className="w-full rounded-md bg-amber-400/90 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {isBusy('create-page') ? 'Salvando...' : 'Registrar pagina'}
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <h3 className="text-lg font-semibold">Roles por pagina</h3>
              <p className="text-sm text-slate-300">
                Vincule tipos de usuario a paginas com uma role (viewer, editor,
                etc).
              </p>
              <form className="mt-4 space-y-4" onSubmit={handleCreateRole}>
                <label className="block text-sm">
                  <span className="font-medium text-slate-200">
                    Tipo de usuario
                  </span>
                  <select
                    required
                    value={roleForm.userTypeId}
                    onChange={(event) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        userTypeId: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  >
                    <option value="">Selecione</option>
                    {userTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                        {type.userGroup ? ` (${type.userGroup.name})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-200">Pagina</span>
                  <select
                    required
                    value={roleForm.pageId}
                    onChange={(event) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        pageId: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  >
                    <option value="">Selecione</option>
                    {pages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.name} ({page.key})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-200">Role</span>
                  <input
                    required
                    value={roleForm.role}
                    onChange={(event) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        role: event.target.value,
                      }))
                    }
                    placeholder="viewer, editor..."
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isBusy('create-role')}
                  className="w-full rounded-md bg-amber-400/90 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {isBusy('create-role') ? 'Gravando...' : 'Vincular role'}
                </button>
              </form>
              <div className="mt-6 space-y-3">
                {pageRoles.length === 0 ? (
                  <p className="text-sm text-slate-300">
                    Nenhuma role cadastrada ainda.
                  </p>
                ) : (
                  pageRoles.map((role) => (
                    <div
                      key={role.id}
                      className="flex flex-col gap-2 rounded border border-slate-800/70 bg-slate-900/70 p-3 text-sm lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-white">
                          {role.userType?.name ?? 'Tipo removido'}
                        </p>
                        <p className="text-xs text-slate-400">
                          Pagina: {role.page?.name ?? 'Indefinida'} (
                          {role.page?.key ?? 'sem chave'})
                        </p>
                        <p className="text-xs text-slate-400">
                          Role: {formatRole(role.role)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(role)}
                        disabled={isBusy(`delete-role-${role.id}`)}
                        className="inline-flex items-center justify-center rounded border border-red-500/50 px-3 py-1 text-xs font-semibold text-red-200 transition hover:border-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                      >
                        {isBusy(`delete-role-${role.id}`) ? 'Removendo...' : 'Remover'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <h3 className="text-lg font-semibold">Grupos & tipos</h3>
              {userGroups.length === 0 ? (
                <p className="text-sm text-slate-300">Nenhum grupo registrado.</p>
              ) : (
                <div className="mt-3 space-y-3 text-sm">
                  {userGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded border border-slate-800/70 bg-slate-900/70 p-3"
                    >
                      <p className="font-semibold text-white">{group.name}</p>
                      {group.description && (
                        <p className="text-xs text-slate-300">{group.description}</p>
                      )}
                      <p className="text-xs text-slate-400">
                        {group.isActive ? 'Ativo' : 'Inativo'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {group.userTypes.length === 0 ? (
                          <span className="text-xs text-slate-400">
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

            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <h3 className="text-lg font-semibold">Paginas cadastradas</h3>
              {pages.length === 0 ? (
                <p className="text-sm text-slate-300">Nenhuma pagina registrada.</p>
              ) : (
                <div className="mt-3 space-y-3 text-sm">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      className="rounded border border-slate-800/70 bg-slate-900/70 p-3"
                    >
                      <p className="font-semibold text-white">
                        {page.name} <span className="text-xs">({page.key})</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Path: {formatPath(page.path)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {page.isActive ? 'Ativa' : 'Inativa'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {page.roles.length === 0 ? (
                          <span className="text-xs text-slate-400">
                            Sem roles vinculadas.
                          </span>
                        ) : (
                          page.roles.map((role) => (
                            <span
                              key={role.id}
                              className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200"
                            >
                              {role.userType?.name ?? 'Tipo removido'} — {role.role}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
