import { AdminPanelHeader } from "./admin/AdminPanelHeader";
import { GroupForm } from "./admin/GroupForm";
import { PageForm } from "./admin/PageForm";
import { PagesList } from "./admin/PagesList";
import { ProfilesSection } from "./admin/ProfilesSection";
import { RoleForm } from "./admin/RoleForm";
import { RolesList } from "./admin/RolesList";
import { SectionContainer } from "./admin/SectionContainer";
import { UserTypeForm } from "./admin/UserTypeForm";
import { useAdminPanel } from "./admin/useAdminPanel";

export const AdminPanel = () => {
  const {
    data: { profiles, sortedProfiles, userGroups, userTypes, activeUserTypes, pages, pageRoles },
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
    ui: { isBusy, isLoading, errorMessage, statusMessage },
    actions: {
      handleCreateGroup,
      handleCreateUserType,
      handleCreatePage,
      handleCreateRole,
      handleRemoveRole,
      handleProfileUserTypeChange,
      handleRefresh,
    },
  } = useAdminPanel();

  return (
    <div className="rounded-2xl border border-[#4d1d88]/50 bg-[#110020]/90 p-6 text-white shadow-2xl shadow-slate-900/40">
      <div className="h-4" />
      <AdminPanelHeader isLoading={isLoading} onRefresh={handleRefresh} />

      {errorMessage && (
        <p role="alert" className="mt-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
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
          <SectionContainer
            summaryPrefix="Sessao 1"
            summaryTitle="Perfis sincronizados (lista de usuarios)"
            summaryDescription="Use a coluna Tipo para mover usuarios entre grupos sem solicitar um novo login."
          >
            <ProfilesSection
              profiles={profiles}
              sortedProfiles={sortedProfiles}
              activeUserTypes={activeUserTypes}
              isBusy={isBusy}
              onProfileUserTypeChange={handleProfileUserTypeChange}
            />
          </SectionContainer>

          <SectionContainer
            summaryPrefix="Sessao 2"
            summaryTitle="Estrutura organizacional (grupos e tipos)"
            summaryDescription="Crie grupos para segmentar responsabilidades e associe tipos de usuario."
            className="space-y-5"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <GroupForm
                value={groupForm}
                isSaving={isBusy("create-group")}
                onChange={updateGroupForm}
                onSubmit={handleCreateGroup}
              />
              <UserTypeForm
                value={userTypeForm}
                userGroups={userGroups}
                isSaving={isBusy("create-user-type")}
                onChange={updateUserTypeForm}
                onSubmit={handleCreateUserType}
              />
              <PageForm
                value={pageForm}
                isSaving={isBusy("create-page")}
                onChange={updatePageForm}
                onSubmit={handleCreatePage}
              />
              <RoleForm
                value={roleForm}
                userTypes={userTypes}
                pages={pages}
                isSaving={isBusy("create-role")}
                onChange={updateRoleForm}
                onSubmit={handleCreateRole}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <h4 className="text-lg font-semibold text-white">Roles cadastradas</h4>
                <RolesList roles={pageRoles} isBusy={isBusy} onRemove={handleRemoveRole} />
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <h4 className="text-lg font-semibold text-white">Paginas registradas</h4>
                <PagesList pages={pages} />
              </div>
            </div>
          </SectionContainer>
        </div>
      )}
    </div>
  );
};
