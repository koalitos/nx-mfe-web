import type { FormEvent } from "react";
import type { AccessUserGroup } from "../../services/accessControlApi";
import type { UserTypeFormState } from "./adminForms";

type UserTypeFormProps = {
  value: UserTypeFormState;
  userGroups: AccessUserGroup[];
  isSaving: boolean;
  onChange: (update: Partial<UserTypeFormState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const UserTypeForm = ({
  value,
  userGroups,
  isSaving,
  onChange,
  onSubmit,
}: UserTypeFormProps) => (
  <form className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4" onSubmit={onSubmit}>
    <h4 className="text-lg font-semibold text-white">Criar tipo de usuario</h4>
    <label className="block text-sm text-slate-200">
      Nome
      <input
        required
        value={value.name}
        onChange={(event) => onChange({ name: event.target.value })}
        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
      />
    </label>
    <label className="block text-sm text-slate-200">
      Descricao
      <textarea
        value={value.description}
        onChange={(event) => onChange({ description: event.target.value })}
        rows={3}
        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
      />
    </label>
    <label className="block text-sm text-slate-200">
      Grupo associado
      <select
        value={value.userGroupId}
        onChange={(event) => onChange({ userGroupId: event.target.value })}
        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
      >
        <option value="">Nenhum grupo</option>
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
        checked={value.isActive}
        onChange={(event) => onChange({ isActive: event.target.checked })}
      />
      Tipo ativo
    </label>
    <button
      type="submit"
      disabled={isSaving}
      className="w-full rounded-md bg-amber-400/80 py-2 text-sm font-semibold text-amber-950 disabled:cursor-not-allowed"
    >
      {isSaving ? "Criando..." : "Salvar tipo"}
    </button>
  </form>
);
