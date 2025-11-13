import type { AccessProfile, AccessUserType } from "../../services/accessControlApi";

type ProfilesSectionProps = {
  profiles: AccessProfile[];
  sortedProfiles: AccessProfile[];
  activeUserTypes: AccessUserType[];
  isBusy: (key: string) => boolean;
  onProfileUserTypeChange: (profile: AccessProfile, userTypeId: string) => void;
};

export const ProfilesSection = ({
  profiles,
  sortedProfiles,
  activeUserTypes,
  isBusy,
  onProfileUserTypeChange,
}: ProfilesSectionProps) => {
  if (profiles.length === 0) {
    return (
      <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        Nenhum perfil encontrado. Assim que usuarios fizerem login eles aparecerao aqui.
      </p>
    );
  }

  return (
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
              <tr key={profile.supabaseUserId} className="border-t border-slate-800/60">
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{profile.displayName ?? "Sem nome"}</div>
                  <p className="text-xs text-slate-400">{profile.supabaseUserId}</p>
                </td>
                <td className="px-4 py-3 text-slate-200">
                  {profile.userType?.userGroup?.name ?? "Nao definido"}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={selectedTypeId}
                    onChange={(event) => onProfileUserTypeChange(profile, event.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    disabled={busy}
                  >
                    <option value="">Sem tipo</option>
                    {activeUserTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                        {type.userGroup ? ` (${type.userGroup.name})` : ""}
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
  );
};
