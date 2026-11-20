/** Lien d’une vue de l’app (respecte le sous-chemin GitHub Pages). */
export function viewUrl(hash: string): string {
  const base = `${location.origin}${import.meta.env.BASE_URL}`
  return `${base}${hash.startsWith('#') ? hash : `#/${hash}`}`
}

/** Web Share API, sinon copie le lien dans le presse-papiers. Annulation de l’utilisateur : AbortError. */
export async function shareOrCopy(opts: { title: string; text: string; url: string }): Promise<'shared' | 'copied'> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: opts.title, text: opts.text, url: opts.url })
      return 'shared'
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') throw e
    }
  }
  await navigator.clipboard.writeText(opts.url)
  return 'copied'
}
