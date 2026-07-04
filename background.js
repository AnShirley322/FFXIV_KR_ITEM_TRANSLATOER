const TAR_TO_ORIGIN = 'https://ff14.tar.to';
const TAR_TO_SEARCH_URL = `${TAR_TO_ORIGIN}/item/list?keyword=`;
const cache = new Map();

function normalize(text) {
  return (text || '')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function comparable(text) {
  return normalize(text).toLowerCase();
}

function decodeHtml(text) {
  return (text || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

function hasHangul(text) {
  return /[가-힣]/.test(text || '');
}

function stripTags(html) {
  return decodeHtml(String(html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function findBalancedArrayAfter(html, marker, fromIndex = 0) {
  const markerIndex = html.indexOf(marker, fromIndex);
  if (markerIndex < 0) return null;

  const start = html.indexOf('[', markerIndex);
  if (start < 0) return null;

  let depth = 0;
  let quote = null;
  let escape = false;

  for (let i = start; i < html.length; i += 1) {
    const ch = html[i];

    if (quote) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === '[') {
      depth += 1;
    } else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        return html.slice(start, i + 1);
      }
    }
  }

  return null;
}

function extractItemsFromInitialData(html) {
  const initialDataIndex = html.indexOf('window.initialData');
  if (initialDataIndex < 0) return [];

  const arrayText = findBalancedArrayAfter(html, 'items:', initialDataIndex);
  if (!arrayText) return [];

  try {
    const items = JSON.parse(arrayText);
    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.warn('[Eorzea Tarto KO] initialData items JSON parse failed:', error);
    return [];
  }
}

function getItemNamesForCompare(item) {
  return [item?.name_eng, item?.name_jpn, item?.name]
    .map(comparable)
    .filter(Boolean);
}

function isProbablyDyeItem(item) {
  const joined = [item?.name, item?.name_eng, item?.name_jpn]
    .map((value) => normalize(value))
    .filter(Boolean)
    .join(' ');

  return /염료|dye|カララント/i.test(joined);
}

function pickBestItemFromList(items, queryName, allowLooseFallback = true) {
  const target = comparable(queryName);
  if (!Array.isArray(items) || items.length === 0 || !target) return null;

  return (
    items.find((item) => getItemNamesForCompare(item).some((name) => name === target)) ||
    items.find((item) => getItemNamesForCompare(item).some((name) => name.includes(target))) ||
    items.find((item) => getItemNamesForCompare(item).some((name) => target.includes(name))) ||
    (allowLooseFallback ? items.find((item) => item?.name && item?.id) : null) ||
    null
  );
}

function pickBestItem(items, queryName, options = {}) {
  const target = comparable(queryName);
  if (!Array.isArray(items) || items.length === 0 || !target) return null;

  if (options.preferDye) {
    const dyeItems = items.filter(isProbablyDyeItem);
    const dyeMatch = pickBestItemFromList(dyeItems, queryName, false);
    if (dyeMatch) return dyeMatch;

    // For dye lookups, do not fall back to non-dye items such as furniture or rugs
    // that merely contain the same color words. Showing no translation is safer
    // than displaying a wrong item name.
    return null;
  }

  return pickBestItemFromList(items, queryName, true);
}

function extractFromInitialData(html, englishName, options = {}) {
  const items = extractItemsFromInitialData(html);
  const item = pickBestItem(items, englishName, options);

  if (!item || !item.name || !item.id) {
    return null;
  }

  const koreanName = normalize(decodeHtml(item.name));
  if (!hasHangul(koreanName)) {
    return null;
  }

  return {
    koreanName,
    itemId: String(item.id),
    itemUrl: `${TAR_TO_ORIGIN}/item/view/${encodeURIComponent(String(item.id))}`,
    source: 'initialData'
  };
}

function extractFromRenderedHtml(html, englishName, options = {}) {
  const matches = [...html.matchAll(/<a\b[^>]*href=["'](?:https?:\/\/ff14\.tar\.to)?\/item\/view\/(\d+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  if (!matches.length) return null;

  const candidates = matches
    .map((match) => {
      const itemId = match[1];
      const koreanName = normalize(stripTags(match[2]));
      const start = Math.max(0, match.index - 300);
      const end = Math.min(html.length, match.index + match[0].length + 300);
      const nearby = stripTags(html.slice(start, end));
      return {
        koreanName,
        itemId,
        itemUrl: `${TAR_TO_ORIGIN}/item/view/${encodeURIComponent(itemId)}`,
        nearby,
        exact: comparable(nearby).includes(comparable(englishName)),
        source: 'renderedHtml'
      };
    })
    .filter((candidate) => hasHangul(candidate.koreanName));

  const scopedCandidates = options.preferDye
    ? candidates.filter((candidate) => /염료/.test(candidate.koreanName))
    : candidates;

  return scopedCandidates.find((candidate) => candidate.exact) || scopedCandidates[0] || null;
}

function extractKoreanNameResult(html, englishName, options = {}) {
  return extractFromInitialData(html, englishName, options) || extractFromRenderedHtml(html, englishName, options);
}

async function fetchWithTimeout(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      credentials: 'omit',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    const html = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      html
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function lookupOnTarto(englishName, options = {}) {
  const key = normalize(englishName);
  if (!key) return { ok: false, error: 'empty_item_name' };

  const cacheKey = `${options.preferDye ? 'dye:' : 'item:'}${key}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const promise = (async () => {
    const requestUrl = `${TAR_TO_SEARCH_URL}${encodeURIComponent(key)}`;

    try {
      const response = await fetchWithTimeout(requestUrl);
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}`, searchUrl: requestUrl };
      }

      const result = extractKoreanNameResult(response.html, key, options);
      if (!result) {
        console.debug('[Eorzea Tarto KO] not found', {
          itemName: key,
          preferDye: !!options.preferDye,
          searchUrl: requestUrl,
          finalUrl: response.finalUrl,
          htmlLength: response.html.length,
          hasInitialData: response.html.includes('window.initialData'),
          hasItemsMarker: response.html.includes('items:')
        });
        return { ok: false, error: 'not_found', searchUrl: requestUrl };
      }

      console.debug('[Eorzea Tarto KO] found', { itemName: key, preferDye: !!options.preferDye, ...result });
      return { ok: true, searchUrl: requestUrl, ...result };
    } catch (error) {
      return { ok: false, error: error.message || String(error), searchUrl: requestUrl };
    }
  })();

  cache.set(cacheKey, promise);
  return promise;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'EC_TARTO_LOOKUP') return false;

  lookupOnTarto(message.itemName, { preferDye: !!message.preferDye })
    .then((result) => sendResponse(result))
    .catch((error) => sendResponse({ ok: false, error: error.message || String(error) }));

  return true;
});
