# Artefatti del Passo 7

Materiale costruito apposta per verificare che i subagent trovino i difetti che
devono trovare. **Nessuno di questi file entra nell'app**: stanno fuori da
`src/`, quindi non li vede né il bundle né i test della libreria immagini.

- `stacco-schiena-curva.svg` — figura tecnicamente sbagliata, costruita a mano.
  Mostra una cerniera d'anca con la colonna **flessa**: tronco disegnato come
  curva invece che come segmento, testa caduta sotto la linea delle spalle,
  bacino troppo basso e tibie inclinate in avanti. È l'errore che in palestra
  manda la gente dal fisioterapista, ed è anche quello che un occhio distratto
  scambia per «si sta piegando in avanti, giusto».

  `training-quality` deve scartarla contro la scheda di `stacco-rumeno-manubri`,
  i cui cue dicono «schiena neutra», «tibie verticali» e «il punto di arrivo lo
  decide la schiena neutra».

  Per confronto, la figura giusta è `src/assets/exercises/stacco-rumeno-manubri.svg`.
