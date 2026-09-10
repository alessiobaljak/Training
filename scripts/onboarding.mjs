/**
 * Il giro dei nove test, guidato dal browser.
 *
 * Lo usano sia la prova di fumo sia la prova offline: senza un giro di test
 * completo l'app non ha un programma da mostrare, quindi qualunque verifica
 * che parta dalla Home deve prima passare di qui.
 */

/** Valori di esempio del foglio Test_Livelli e range che la scheda scrive. */
export const CASES = [
  { value: 10, range: '6-8' },
  { value: 12, range: '7-9' },
  { value: 30, range: '17-23' },
  { value: 18, range: '10-14' },
  { value: 8, range: '4-6' },
  { value: 15, range: '8-11' },
  // Nordic curl: la scheda scrive 3-5, la formula dà 2-3. Vince la formula.
  { value: 4, range: '2-3' },
  { value: 45, range: '25-34"' },
  { value: 60, range: '33-45"' },
];

/**
 * Compila e chiude i nove test.
 *
 * `onRange(shown, testCase, index)` viene chiamato a ogni test con il range
 * che la schermata sta mostrando: serve alla prova di fumo per confrontarlo
 * con la scheda. Chi non deve verificare niente lo omette.
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
      onRange((await page.getByTestId('range').innerText()).trim(), testCase, index);
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
