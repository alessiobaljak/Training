/**
 * Il giro dei nove test, guidato dal browser.
 *
 * Lo usano sia la prova di fumo sia la prova offline: senza un giro di test
 * completo l'app non ha un programma da mostrare, quindi qualunque verifica
 * che parta dalla Home deve prima passare di qui.
 */

/**
 * Valori di esempio del foglio Test_Livelli e il gradino da cui ciascuno fa
 * partire il circuito.
 *
 * Prima qui c'era il range calcolato dal massimale, «6-8», «17-23»: la
 * formula del programma archiviato, che nel circuito non decide niente. Il
 * circuito ha i range scritti nella scheda; il test decide il gradino.
 */
export const CASES = [
  /* Dieci trazioni coprono sei-otto con due di riserva: a corpo libero. */
  { value: 10, parte: /Trazioni prona presa media/ },
  { value: 12, parte: /Dip alle parallele/ },
  { value: 30, parte: /push-up/i },
  { value: 18, parte: /Rematore inverso TRX/ },
  { value: 8, parte: /Pike push-up/ },
  { value: 15, parte: /Bulgarian split squat/ },
  /* Il nordic non è in nessuna seduta: lo dice, invece di inventare un gradino. */
  { value: 4, parte: /non decide niente/ },
  { value: 45, parte: /Hollow hold/ },
  /* Il dead hang sta solo nella decompressione, che non si giudica. */
  { value: 60, parte: /non decide niente/ },
];

/**
 * Compila e chiude i nove test.
 *
 * `onRange(shown, testCase, index)` viene chiamato a ogni test con il gradino
 * di partenza che la schermata sta mostrando: serve alla prova di fumo per
 * confrontarlo con quello atteso. Chi non deve verificare niente lo omette.
 */
export async function completeOnboarding(page, base, { onRange } = {}) {
  await page.goto(`${base}/#/test`, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Inizia i test' }).click();
  await page.waitForTimeout(400);

  for (const [index, testCase] of CASES.entries()) {
    const inputs = page.locator('input[type=number]');
    const count = await inputs.count();
    for (let k = 0; k < count; k += 1) await inputs.nth(k).fill(String(testCase.value));
    await page.waitForTimeout(200);

    if (onRange !== undefined) {
      onRange((await page.getByTestId('partenza').innerText()).trim(), testCase, index);
    }

    await page.getByRole('button', { name: 'Salva e continua' }).click();
    await page.waitForTimeout(400);
    const skip = page.getByRole('button', { name: 'Salta il recupero' });
    if ((await skip.count()) > 0) {
      await skip.click();
      await page.waitForTimeout(300);
    }
  }

  await page.getByRole('button', { name: 'Parti questa settimana' }).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Conferma e vai alla Home' }).click();
  await page.waitForTimeout(900);
}
