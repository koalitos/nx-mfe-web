import { useEffect, useState } from 'react';
import { env } from '../../config/env';
import { supabaseClient } from '../services/supabaseClient';

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

type CalculationEvent = {
  id: string;
  payload: Record<string, unknown>;
  recordedAt: string;
};

export const RealtimeFeed = () => {
  const [events, setEvents] = useState<CalculationEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const channel = supabaseClient
      .channel(env.supabaseChannel, {
        config: {
          broadcast: { ack: true },
        },
      })
      .on(
        'broadcast',
        { event: 'calculation.performed' },
        ({ payload, timestamp }) => {
          setEvents((current) =>
            [
              {
                id: createId(),
                payload: payload as Record<string, unknown>,
                recordedAt: timestamp ?? new Date().toISOString(),
              },
              ...current,
            ].slice(0, 20)
          );
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  return (
    <div className="rounded-lg bg-slate-900/70 p-6 shadow-lg shadow-slate-900/50">
      <div className="flex items-center justify-between text-white">
        <div>
          <h2 className="text-xl font-semibold">Realtime - Supabase</h2>
          <p className="text-sm text-slate-300">
            Monitorando o canal <code>{env.supabaseChannel}</code>
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
            connected
              ? 'bg-emerald-500/20 text-emerald-200'
              : 'bg-slate-700 text-slate-300'
          }`}
        >
          {connected ? 'Conectado' : 'Conectando...'}
        </span>
      </div>

      <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-2">
        {events.length === 0 && (
          <p className="text-sm text-slate-300">
            Nenhum evento recebido ainda. Execute um calculo para ver o payload
            em tempo real.
          </p>
        )}

        {events.map((event) => (
          <article
            key={event.id}
            className="rounded border border-slate-700 bg-slate-800/70 p-3 text-xs text-slate-200"
          >
            <p className="text-[11px] text-slate-400">
              {new Date(event.recordedAt).toLocaleTimeString('pt-BR', {
                hour12: false,
              })}
            </p>
            <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-tight">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </article>
        ))}
      </div>
    </div>
  );
};
