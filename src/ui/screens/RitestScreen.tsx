import { delGiorno } from '../../engine/ritest.ts';
import { navigate } from '../router.ts';
import { useProposteRitest } from '../hooks/useData.ts';
import { ProposteRitest } from '../components/ProposteRitest.tsx';
import { Notice, Screen } from '../components/primitives.tsx';

/**
 * R9b: le discese ancora da decidere, aperte dalla scheda della Home.
 *
 * Sono le stesse del riepilogo dei test: chi chiude il riepilogo senza
 * decidere le ritrova qui.
 */
export function RitestScreen() {
  const proposte = useProposteRitest();
  const indietro = () => { navigate({ name: 'home' }); };

  if (proposte === undefined) {
    return (
      <Screen title="Dai test" onBack={indietro}>
        <p className="text-dim">Carico…</p>
      </Screen>
    );
  }

  const date = [...new Set(proposte.map((proposta) => proposta.data))].sort();
  const ultima = date.at(-1);

  return (
    <Screen
      title="Dai test"
      {...(ultima === undefined ? {} : { subtitle: `Test ${delGiorno(ultima)}` })}
      onBack={indietro}
    >
      {proposte.length === 0 ? (
        <Notice>Nessun gradino da abbassare.</Notice>
      ) : (
        <ProposteRitest proposte={proposte} />
      )}
    </Screen>
  );
}
