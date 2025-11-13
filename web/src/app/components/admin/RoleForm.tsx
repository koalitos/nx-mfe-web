import type { FormEvent } from "react";
import type { AccessPage, AccessUserType } from "../../services/accessControlApi";
import type { RoleFormState } from "./adminForms";

type RoleFormProps = {
  value: RoleFormState;
  userTypes: AccessUserType[];
  pages: AccessPage[];
  isSaving: boolean;
  onChange: (update: Partial<RoleFormState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const RoleForm = ({
  value,
  userTypes,
  pages,
  isSaving,
  onChange,
  onSubmit,
}: RoleFormProps) => (
  <form className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4" onSubmit={onSubmit}>
    <h4 className="text-lg font-semibold text-white">Vincular role</h4>
    <label className="block text-sm text-slate-200">
      Tipo de usuario
      <select
        required
        value={value.userTypeId}
        onChange={(event) => onChange({ userTypeId: event.target.value })}
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
        value={value.pageId}
        onChange={(event) => onChange({ pageId: event.target.value })}
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
        value={value.role}
        onChange={(event) => onChange({ role: event.target.value })}
        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white"
      />
    </label>
    <button
      type="submit"
      disabled={isSaving}
      className="w-full rounded-md bg-amber-400/80 py-2 text-sm font-semibold text-amber-950 disabled:cursor-not-allowed"
    >
      {isSaving ? "Vinculando..." : "Salvar role"}
    </button>
  </form>
);
