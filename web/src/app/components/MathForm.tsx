import { FormEvent, useState } from 'react';
import { mathApi, MathResponse } from '../services/mathApi';
import { HttpError } from '../services/httpClient';

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString('pt-BR', { hour12: false });

export const MathForm = () => {
  const [a, setA] = useState('0');
  const [b, setB] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MathResponse | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const first = Number(a);
    const second = Number(b);

    if (Number.isNaN(first) || Number.isNaN(second)) {
      setError('Os valores precisam ser numeros validos.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await mathApi.add({ a: first, b: second });
      setResult(response);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(
          (err.payload as { message?: string })?.message ??
            'Nao foi possivel calcular a soma.'
        );
        return;
      }
      setError('Erro inesperado ao chamar a API.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-slate-900/70 p-6 shadow-lg shadow-slate-900/50">
      <h2 className="text-xl font-semibold text-white">Somar numeros</h2>
      <p className="mt-1 text-sm text-slate-300">
        Esta chamada usa a rota protegida <code>/api/math/add</code>.
      </p>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-200">
            Primeiro numero
          </span>
          <input
            type="number"
            value={a}
            onChange={(event) => setA(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">
            Segundo numero
          </span>
          <input
            type="number"
            value={b}
            onChange={(event) => setB(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2 text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center rounded-md bg-emerald-500 px-4 py-2 font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-800 disabled:text-emerald-200"
        >
          {isLoading ? 'Calculando...' : 'Chamar API protegida'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 rounded border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 rounded border border-slate-700 bg-slate-800 p-3 text-sm text-slate-200">
          <p>
            <span className="font-semibold text-white">Resultado:</span>{' '}
            {result.result}
          </p>
          <p>
            <span className="font-semibold text-white">logId:</span>{' '}
            {result.logId}
          </p>
          <p>
            <span className="font-semibold text-white">Supabase user:</span>{' '}
            {result.supabaseUserId}
          </p>
          <p>
            <span className="font-semibold text-white">Registrado em:</span>{' '}
            {formatTimestamp(result.recordedAt)}
          </p>
        </div>
      )}
    </div>
  );
};
