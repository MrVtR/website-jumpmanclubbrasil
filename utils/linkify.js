// Finds links typed as plain text (e.g. in comments) and splits the text into
// segments: { type: "text", value } and { type: "link", text, href, internal }.
// Pure function (no React), so it can be tested on its own.

const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<>"]+)/gi;
const SITE_HOSTS = new Set([
  "jumpmanclubbrasil.com.br",
  "www.jumpmanclubbrasil.com.br"
]);

// "veja https://site.com." -> the final "." is punctuation, not part of the
// link. Same for , ! ? ; : quotes and an unbalanced closing parenthesis.
function splitTrailingPunctuation(raw) {
  let url = raw;
  let trailing = "";
  while (/[.,!?;:'")\]]$/.test(url)) {
    const last = url.slice(-1);
    if (last === ")") {
      const opens = (url.match(/\(/g) || []).length;
      const closes = (url.match(/\)/g) || []).length;
      if (opens >= closes) break; // e.g. wikipedia.org/wiki/Foo_(bar)
    }
    trailing = last + trailing;
    url = url.slice(0, -1);
  }
  return [url, trailing];
}

export function parseLinks(text = "") {
  const segments = [];
  const pushText = value => {
    if (!value) return;
    const prev = segments[segments.length - 1];
    if (prev?.type === "text") prev.value += value;
    else segments.push({ type: "text", value });
  };

  // With a capture group, split() puts the matches at the odd indexes.
  String(text)
    .split(URL_PATTERN)
    .forEach((part, index) => {
      if (index % 2 === 0) return pushText(part);

      const [raw, trailing] = splitTrailingPunctuation(part);
      let url;
      try {
        url = new URL(/^www\./i.test(raw) ? `https://${raw}` : raw);
      } catch {
        return pushText(part);
      }
      // Only real web links; never javascript:, data:, etc.
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) {
        return pushText(part);
      }

      const internal = SITE_HOSTS.has(url.hostname.toLowerCase());
      segments.push({
        type: "link",
        text: raw,
        // Links to this site stay on the site (relative URL, same tab).
        href: internal ? `${url.pathname}${url.search}${url.hash}` : url.href,
        internal
      });
      pushText(trailing);
    });

  return segments;
}
