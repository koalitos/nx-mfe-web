import type { FormEvent } from "react";
import type { GroupFormState } from "./adminForms";

type GroupFormProps = {
  value: GroupFormState;
  isSaving: boolean;
  onChange: (update: Partial<GroupFormState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const GroupForm = ({ value, isSaving, onChange, onSubmit }: GroupFormProps) => (
  <form className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4" onSubmit={onSubmit}>
    <h4 className="text-lg font-semibold text-white">Criar grupo</h4>
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
    <label className="flex items-center gap-2 text-sm text-slate-200">
      <input
        type="checkbox"
        checked={value.isActive}
        onChange={(event) => onChange({ isActive: event.target.checked })}
      />
      Grupo ativo
    </label>
    <button
      type="submit"
      disabled={isSaving}
      className="w-full rounded-md bg-amber-400/80 py-2 text-sm font-semibold text-amber-950 disabled:cursor-not-allowed"
    >
      {isSaving ? "Criando..." : "Salvar grupo"}
    </button>
  </form>
);
