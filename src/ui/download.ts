/**
 * Salvataggio di un file dal browser.
 *
 * Su Android scarica, su iOS Safari apre il foglio di condivisione: in
 * entrambi i casi il file esce dall'app e finisce dove decide l'utente.
 * Nessuna rete, nessun servizio esterno.
 */
export function downloadTextFile(fileName: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Il revoke immediato può interrompere il download su alcuni browser.
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10_000);
}

export function readTextFile(file: File): Promise<string> {
  return file.text();
}
