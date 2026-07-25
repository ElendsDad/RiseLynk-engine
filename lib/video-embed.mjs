// ============================================================
// site-engine - allowlisted privacy-first video embed resolver
// (teardown P2 item 7j)
//
// Fail-closed: an unknown host, malformed URL, or missing title yields null
// and the section renders nothing. YouTube always rewrites to
// www.youtube-nocookie.com (never youtube.com). Autoplay is never enabled.
//
// CSP: the resolved iframe origin must ALSO appear in security.frameSrc
// (wired by next.config.ts via lib/csp.mjs). This module does not touch CSP;
// it only shapes a safe embed URL.
// ============================================================

const YT_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
]);

const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function youtubeIdFrom(raw) {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  // Bare id: 11 chars typical YouTube alphabet
  if (/^[\w-]{11}$/.test(s)) return s;
  let url;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  if (!YT_HOSTS.has(url.hostname)) return null;
  if (url.hostname === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0];
    return /^[\w-]{11}$/.test(id) ? id : null;
  }
  if (url.pathname.startsWith("/embed/")) {
    const id = url.pathname.slice("/embed/".length).split("/")[0];
    return /^[\w-]{11}$/.test(id) ? id : null;
  }
  if (url.pathname.startsWith("/shorts/")) {
    const id = url.pathname.slice("/shorts/".length).split("/")[0];
    return /^[\w-]{11}$/.test(id) ? id : null;
  }
  const v = url.searchParams.get("v");
  return v && /^[\w-]{11}$/.test(v) ? v : null;
}

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function vimeoIdFrom(raw) {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  if (/^\d{6,12}$/.test(s)) return s;
  let url;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  if (!VIMEO_HOSTS.has(url.hostname)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  // /video/123 or /123
  const id = parts[0] === "video" ? parts[1] : parts[0];
  return id && /^\d{6,12}$/.test(id) ? id : null;
}

/**
 * Resolve a VideoEmbedConfig-shaped input to a privacy-first iframe src.
 * @param {unknown} video
 * @returns {{ embedUrl: string, provider: "youtube" | "vimeo", title: string, frameOrigin: string } | null}
 */
export function resolveVideoEmbed(video) {
  if (!video || typeof video !== "object") return null;
  const title = typeof video.title === "string" ? video.title.trim() : "";
  if (!title) return null;
  const src = typeof video.src === "string" ? video.src.trim() : "";
  if (!src) return null;

  const want = video.provider === "youtube" || video.provider === "vimeo" ? video.provider : null;

  if (!want || want === "youtube") {
    const id = youtubeIdFrom(src);
    if (id) {
      return {
        provider: "youtube",
        title,
        // privacy-enhanced, no autoplay, modest branding
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`,
        frameOrigin: "https://www.youtube-nocookie.com",
      };
    }
    if (want === "youtube") return null;
  }

  if (!want || want === "vimeo") {
    const id = vimeoIdFrom(src);
    if (id) {
      return {
        provider: "vimeo",
        title,
        embedUrl: `https://player.vimeo.com/video/${id}?dnt=1`,
        frameOrigin: "https://player.vimeo.com",
      };
    }
  }

  return null;
}
