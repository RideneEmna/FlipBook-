/**
 * Utilitaire pour extraire et formater les liens YouTube
 * Supporte : standard (?v=), raccourci (youtu.be/), embed (/embed/), shorts (/shorts/), live (/live/)
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // 1. Format standard avec paramètre v= (ex: ?v=VIDEO_ID ou &v=VIDEO_ID)
  const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch && vMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${vMatch[1]}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
  }

  // 2. Format raccourci youtu.be/VIDEO_ID ou chemins /embed/, /shorts/, /live/
  const pathMatch = trimmed.match(/(?:youtu\.be\/|\/(?:embed|shorts|live)\/)([a-zA-Z0-9_-]{11})/);
  if (pathMatch && pathMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${pathMatch[1]}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
  }

  return null;
}
