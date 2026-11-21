import { useState } from 'react';
import { repository } from '../../db/repository.ts';
import { todayIso } from '../../engine/dates.ts';
import type { PropostaRitest } from '../../engine/ritest.ts';
import { Badge, Button, Card } from './primitives.tsx';

/**
 * R9b: le discese proposte da un ritest, con «Applica» e «Lascia com'è».
 *
 * Le stesse schede della revisione settimanale: titolo, numeri, cosa cambia,
 * avvertenza. Una scheda decisa sparisce subito, prima ancora che il
 * registro torni indietro dal magazzino.
 */
export function ProposteRitest({ proposte }: { readonly proposte: readonly PropostaRitest[] }) {
  const [decise, setDecise] = useState<ReadonlySet<string>>(new Set());
  const aperte = proposte.filter((proposta) => !decise.has(proposta.id));

  const decidi = (proposta: PropostaRitest, accettata: boolean): void => {
    setDecise((correnti) => new Set(correnti).add(proposta.id));
    void repository.decidiRitest(proposta, accettata, todayIso());
  };

  return (
    <div className="space-y-3">
      {aperte.map(({ id, verdict }) => (
        <Card key={id} tone="warn">
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg font-semibold">{verdict.title}</p>
            <Badge tone="warn">{verdict.exerciseName}</Badge>
          </div>
          <p className="tabular mt-3 text-sm leading-relaxed text-dim">{verdict.evidence}</p>
          <p className="mt-3 text-sm leading-relaxed">{verdict.change}</p>
          {verdict.caution === null ? null : (
            <p className="mt-3 text-sm leading-relaxed text-dim">{verdict.caution}</p>
          )}
          <div className="mt-4 flex gap-2">
            <Button
              full
              onClick={() => {
                const proposta = proposte.find((p) => p.id === id);
                if (proposta !== undefined) decidi(proposta, true);
              }}
            >
              Applica
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                const proposta = proposte.find((p) => p.id === id);
                if (proposta !== undefined) decidi(proposta, false);
              }}
            >
              Lascia com’è
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
