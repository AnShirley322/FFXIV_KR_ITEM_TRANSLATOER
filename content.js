(() => {
  const TAR_TO_SEARCH_URL = 'https://ff14.tar.to/item/list?keyword=';
  const MARKER_CLASS = 'ec-tarto-ko-name';
  const BADGE_WRAP_CLASS = 'ec-tarto-ko-wrap';
  const LOOKUP_TIMEOUT_MS = 15000;

  // itemName -> { state: 'pending'|'done', promise?, result? }
  const lookupState = new Map();

  // dyeName -> { state: 'pending'|'done', promise?, result? }
  const dyeLookupState = new Map();
  const DYE_MARKER_CLASS = 'ec-tarto-dye-ko-name';
  const DYE_ROW_CLASS = 'ec-tarto-dye-ko-row';

  const DYE_NAMES = [
    'Undyed',
    'Snow White', 'Ash Grey', 'Goobbue Grey', 'Slate Grey', 'Charcoal Grey', 'Soot Black',
    'Pure White', 'Jet Black',
    'Rose Pink', 'Lilac Purple', 'Rolanberry Red', 'Dalamud Red', 'Rust Red', 'Wine Red',
    'Ruby Red', 'Coral Pink', 'Blood Red', 'Salmon Pink', 'Sunset Orange', 'Mesa Red',
    'Bark Brown', 'Chocolate Brown', 'Russet Brown', 'Kobold Brown', 'Cork Brown', 'Qiqirn Brown',
    'Opo-opo Brown', 'Aldgoat Brown', 'Pumpkin Orange', 'Acorn Brown', 'Orchard Brown',
    'Chestnut Brown', 'Gobbiebag Brown', 'Shale Brown', 'Mole Brown', 'Loam Brown',
    'Bone White', 'Ul Brown', 'Desert Yellow', 'Honey Yellow', 'Millioncorn Yellow', 'Coeurl Yellow',
    'Cream Yellow', 'Halatali Yellow', 'Raisin Brown',
    'Mud Green', 'Sylph Green', 'Lime Green', 'Moss Green', 'Meadow Green', 'Olive Green',
    'Marsh Green', 'Apple Green', 'Cactuar Green', 'Hunter Green', 'Ochu Green',
    'Adamantoise Green', 'Nophica Green', 'Deepwood Green', 'Celeste Green', 'Turquoise Green',
    'Morbol Green',
    'Ice Blue', 'Sky Blue', 'Ink Blue', 'Seafog Blue', 'Peacock Blue', 'Rhotano Blue', 'Corpse Blue',
    'Ceruleum Blue', 'Woad Blue', 'Storm Blue', 'Void Blue', 'Royal Blue', 'Midnight Blue',
    'Shadow Blue', 'Abyssal Blue',
    'Lavender Purple', 'Gloom Purple', 'Currant Purple', 'Iris Purple', 'Grape Purple',
    'Lotus Pink', 'Colibri Pink', 'Plum Purple', 'Regal Purple', 'Cherry Pink',
    'Metallic Red', 'Metallic Orange', 'Metallic Yellow', 'Metallic Green', 'Metallic Sky Blue', 'Metallic Silver',
    'Metallic Blue', 'Metallic Purple', 'Gunmetal Black', 'Pearl White',
    'Pastel Pink', 'Pastel Green', 'Pastel Blue', 'Pastel Purple', 'Pastel Yellow',
    'Dark Red', 'Dark Brown', 'Dark Green', 'Dark Blue', 'Dark Purple',
    'Gold', 'Silver', 'Bronze', 'Brass'
  ];

  const DYE_NAME_BY_KEY = new Map(DYE_NAMES.map((name) => [name.toLowerCase(), name]));

  const MIRAPRI_STATIC_DYE_LABELS = new Set(['デフォルト色', '染色なし', 'なし']);
  const MIRAPRI_JA_DYE_HINTS = [
    'スートブラック', 'スノウホワイト', 'ピュアホワイト', 'ブライトオレンジ', 'インクブルー',
    'メタリックシルバー', 'メタリックレッド', 'メタリックオレンジ', 'メタリックイエロー',
    'メタリックグリーン', 'メタリックスカイブルー', 'メタリックブルー', 'メタリックパープル',
    'ガンメタル', 'パールホワイト', 'ジェットブラック',
    'アッシュグレイ', 'グゥーブーグレイ', 'スレートグレイ', 'チャコールグレイ',
    'ローズピンク', 'ライラックパープル', 'ロランベリーレッド', 'ダラガブレッド',
    'ラストレッド', 'ワインレッド', 'コーラルピンク', 'ブラッドレッド', 'サーモンピンク',
    'サンセットオレンジ', 'メサレッド', 'バークブラウン', 'チョコレートブラウン',
    'ラセットブラウン', 'コボルドブラウン', 'コルクブラウン', 'キキルンブラウン',
    'オポオポブラウン', 'アルドゴートブラウン', 'パンプキンオレンジ', 'エーコンブラウン',
    'オーチャードブラウン', 'チェスナットブラウン', 'シェールブラウン', 'モールブラウン',
    'ロームブラウン', 'ボーンホワイト', 'ウルブラウン', 'デザートイエロー', 'ハニーイエロー',
    'ミリオンコーンイエロー', 'クァールイエロー', 'クリームイエロー', 'ハラタリイエロー',
    'レーズンブラウン', 'マッドグリーン', 'シルフグリーン', 'ライムグリーン', 'モスグリーン',
    'メドウグリーン', 'オリーヴグリーン', 'マーシュグリーン', 'アップルグリーン',
    'サボテンダーグリーン', 'ハンターグリーン', 'オチューグリーン', 'アダマンタスグリーン',
    'ノフィカグリーン', 'ディープウッドグリーン', 'セレストグリーン', 'ターコイズグリーン',
    'モルボルグリーン', 'アイスブルー', 'スカイブルー', 'シーフォグブルー', 'ピーコックブルー',
    'ロタノブルー', 'コープスブルー', 'セルレアムブルー', 'ウォードブルー', 'ストームブルー',
    'ヴォイドブルー', 'ロイヤルブルー', 'ミッドナイトブルー', 'シャドウブルー', 'アビサルブルー',
    'ラベンダーパープル', 'グルームパープル', 'カラントパープル', 'アイリスパープル',
    'グレープパープル', 'ロータスピンク', 'コリブリピンク', 'プラムパープル', 'リーガルパープル',
    'チェリーピンク', 'パステルピンク', 'パステルグリーン', 'パステルブルー', 'パステルパープル',
    'パステルイエロー', 'ダークレッド', 'ダークブラウン', 'ダークグリーン', 'ダークブルー',
    'ダークパープル', 'ゴールド', 'シルバー', 'ブロンズ', 'ブラス'
  ];
  const MIRAPRI_JA_DYE_HINT_SET = new Set(MIRAPRI_JA_DYE_HINTS.map((name) => name.toLowerCase()));

  // Common non-item color labels and no-dye labels. Real dye items are still looked up
  // through tar.to first when possible.
  const STATIC_DYE_TRANSLATIONS = new Map([
    ['undyed', { koreanName: '염색 안 함', itemUrl: '' }],
    ['デフォルト色', { koreanName: '염색 안 함', itemUrl: '' }],
    ['染色なし', { koreanName: '염색 안 함', itemUrl: '' }],
    ['なし', { koreanName: '염색 안 함', itemUrl: '' }],
    ['gold', { koreanName: '금색', itemUrl: '' }],
    ['silver', { koreanName: '은색', itemUrl: '' }],
    ['bronze', { koreanName: '청동색', itemUrl: '' }],
    ['brass', { koreanName: '황동색', itemUrl: '' }]
  ]);

  const SLOT_RE = /^(HEAD|BODY|HANDS|LEGS|FEET|WEAPON|OFF HAND|EARRINGS|NECKLACE|BRACELETS|RING|FACE)$/i;
  const END_SECTION_RE = /^(Related to|Creator|Featured in Album|About this glamour|Advertisement|More Glamours by .+|Comments?)$/i;
  const LODESTONE_ITEM_SELECTOR = 'a[href*="finalfantasyxiv.com/lodestone/playguide/db/item/"]';
  const MIRAPRI_SLOT_RE = /^(?:銃|弓|書|杖|刀|槍|斧|剣|盾|短剣|格闘武器|投擲武器|主道具|副道具|頭防具|胴防具|手防具|脚防具|足防具|耳飾り|首飾り|腕輪|指輪|顔アクセサリー|アクセサリー)$/;
  const MIRAPRI_END_RE = /^(?:OTHER POSTS|前のミラプリ|次のミラプリ|この投稿を通報する|検索メニューを閉じる)$/i;

  let currentBounds = null;
  let scanQueued = false;
  let scanTimer = null;

  function normalize(text) {
    return (text || '')
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isMirapriPage() {
    return /(^|\.)mirapri\.com$/i.test(location.hostname);
  }

  function normalizeDyeCandidate(text) {
    return normalize(text)
      .replace(/^[⬤◯●○•·\s]+/, '')
      .replace(/\s*Dye$/i, '')
      .trim();
  }

  function normalizeNonItemLabel(text) {
    return normalize(text)
      .replace(/^[⬤◯●○•·★☆\s]+/, '')
      .replace(/[|:：·•・]+$/g, '')
      .trim();
  }

  function isNonEquipmentLabel(text) {
    const value = normalizeNonItemLabel(text).toLowerCase();
    if (!value) return false;
    return /^(optional|seasonal item|seasonal|untradable|unique|market prohibited|dyeable|non-dyeable|glamour dresser|ar moire)$/.test(value);
  }

  function getCanonicalDyeName(text) {
    const key = normalizeDyeCandidate(text).toLowerCase();
    return DYE_NAME_BY_KEY.get(key) || '';
  }

  function normalizeMirapriDyeLabel(text) {
    return normalize(text)
      .replace(/^[⬤◯●○•·★☆\s]+/, '')
      .replace(/[()（）［］\[\]]/g, '')
      .trim();
  }

  function getMirapriDyeName(text) {
    const value = normalizeMirapriDyeLabel(text);
    if (!value || value.length > 36) return '';
    if (MIRAPRI_STATIC_DYE_LABELS.has(value)) return value;
    if (MIRAPRI_JA_DYE_HINT_SET.has(value.toLowerCase())) return value;
    // Some MIRAPRI dye labels are Lodestone links and are reliable even if the
    // exact Japanese color name is not in the hint list. Keep them short and
    // Japanese-looking so ordinary tags such as Seasonal Item are ignored.
    if (/^[\u3040-\u30ffー・]+$/.test(value) && /(ブラック|ホワイト|グレイ|グレー|レッド|ピンク|オレンジ|ブラウン|イエロー|グリーン|ブルー|パープル|ゴールド|シルバー|ブロンズ|ブラス|ガンメタル)$/.test(value)) {
      return value;
    }
    return '';
  }

  function isDyeLabelText(text) {
    return Boolean(getCanonicalDyeName(text));
  }

  function directTextOf(element) {
    if (!element) return '';
    return normalize([...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join(' '));
  }

  function shortTextOf(element) {
    if (!element) return '';
    const direct = directTextOf(element);
    if (direct) return direct;
    const text = normalize(element.textContent || '');
    return text.length <= 90 ? text : '';
  }

  function isVisible(element) {
    if (!element || !(element instanceof Element)) return false;
    return !!(element.offsetParent || element.getClientRects().length);
  }

  function follows(element, reference) {
    return !!(reference.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
  }

  function precedes(element, reference) {
    return !!(element.compareDocumentPosition(reference) & Node.DOCUMENT_POSITION_FOLLOWING);
  }

  function isLodestoneItemUrl(url) {
    return /(?:^|\.)finalfantasyxiv\.com\/lodestone\/playguide\/db\/item\//i.test(url || '');
  }

  function isBadItemText(text) {
    const value = normalize(text);
    const labelValue = normalizeNonItemLabel(value);
    if (!value) return true;
    if (value.length < 2) return true;
    if (value.length > 90) return true;
    if (isDyeLabelText(value)) return true;
    if (isNonEquipmentLabel(value)) return true;
    if (/^(gearset|glamours?|glamours using this piece)$/i.test(labelValue)) return true;
    if (/^(image|cover image|glamour image|fourth image)$/i.test(value)) return true;
    if (/^(all|any|tanks?|healers?|melee dps|ranged dps|caster dps|crafters?|gatherers?)$/i.test(value)) return true;
    if (/^(pld|war|drk|gnb|whm|sch|ast|sge|mnk|drg|nin|sam|rpr|vpr|brd|mch|dnc|blm|smn|rdm|blu|pct)$/i.test(value)) return true;
    if (SLOT_RE.test(value)) return true;
    if (/^(submitted on|description|tags|creator|related to|equipment|about this glamour|model|intended for|level to equip|fits|featured in album|more glamours)$/i.test(value)) return true;
    if (/^[†•·\-–—]+$/.test(value)) return true;
    if (/^[⬤◯\s]+/.test(value)) return true;
    // Exclude plain dye color labels as item candidates.
    if (/^(undyed|snow white|ash grey|goobbue grey|slate grey|charcoal grey|soot black|rose pink|lilac purple|roolanberry red|dalamud red|rust red|wine red|coral pink|blood red|salmon pink|sunset orange|mesa red|bark brown|chocolate brown|russet brown|kobold brown|cork brown|qiqirn brown|opo-opo brown|aldgoat brown|pumpkin orange|acorn brown|orchard brown|chestnut brown|gobbiebag brown|shale brown|mole brown|loam brown|bone white|ul brown|desert yellow|honey yellow|millioncorn yellow|coeurl yellow|cream yellow|halatali yellow|raisin brown|mud green|sylph green|lime green|moss green|meadow green|olive green|marsh green|apple green|cactuar green|hunter green|ochu green|adamantoise green|nophica green|deepwood green|celeste green|turquoise green|morbol green|ice blue|sky blue|ink blue|seafog blue|peacock blue|rhotano blue|corpse blue|ceruleum blue|warden blue|storm blue|void blue|royal blue|midnight blue|shadow blue|abyssal blue|lavender purple|gloom purple|currant purple|iris purple|grape purple|lotus pink|colibri pink|plum purple|regal purple|cherry pink|gold|silver|bronze|brass|gunmetal black|pearl white|metallic red|metallic orange|metallic yellow|metallic green|metallic sky blue|metallic silver|metallic blue|metallic purple|pastel pink|pastel green|pastel blue|pastel purple|pastel yellow|dark red|dark brown|dark green|dark blue|dark purple)$/i.test(value)) return true;
    return false;
  }

  function getMainRoot() {
    if (isMirapriPage()) {
      return document.querySelector('article') ||
        document.querySelector('.entry-content') ||
        document.querySelector('.post-content') ||
        document.querySelector('main') ||
        document.body;
    }
    return document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
  }

  function getEquipmentBounds() {
    if (currentBounds) return currentBounds;

    const root = getMainRoot();
    const elements = [...root.querySelectorAll('h1,h2,h3,h4,h5,h6,section,div,span,p,aside')]
      .filter(isVisible);

    const equipmentMarker = elements.find((el) => /^Equipment$/i.test(shortTextOf(el)));
    if (!equipmentMarker) {
      currentBounds = { root, start: null, end: null };
      return currentBounds;
    }

    const endMarker = elements
      .filter((el) => follows(el, equipmentMarker))
      .find((el) => END_SECTION_RE.test(shortTextOf(el)));

    currentBounds = { root, start: equipmentMarker, end: endMarker || null };
    return currentBounds;
  }

  function isInEquipmentArea(element) {
    if (!element) return false;

    if (isMirapriPage()) {
      return !!findMirapriPieceContainer(element, '');
    }

    const bounds = getEquipmentBounds();
    if (!bounds.start) {
      // Fallback for pages whose headings are hidden: require a nearby equipment-like card.
      return !!findPieceContainer(element, '');
    }

    if (!follows(element, bounds.start)) return false;
    if (bounds.end && !precedes(element, bounds.end)) return false;
    return true;
  }

  function hasEquipmentAction(text) {
    return /Glamours using this piece/i.test(text) ||
      /\bGearset\b/i.test(text) ||
      /\bOptional\b/i.test(text) ||
      /この装備品で検索/.test(text) ||
      /⬤|◯/.test(text);
  }

  function hasImageWithAlt(node, itemName) {
    if (!node || !itemName) return false;
    const imgs = node.matches?.('img[alt]') ? [node] : [...node.querySelectorAll?.('img[alt]') || []];
    return imgs.some((img) => normalize(img.getAttribute('alt')) === itemName);
  }

  function hasExcludedSectionText(text) {
    return /Featured in Album|More Glamours by|Related to|Creator|About this glamour|OTHER POSTS|検索メニューを閉じる|この投稿を通報する/i.test(text);
  }


  function containsMirapriSlotText(element) {
    if (!element) return false;
    const direct = directTextOf(element);
    if (MIRAPRI_SLOT_RE.test(direct)) return true;

    const textNodes = [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => normalize(node.textContent || ''))
      .filter(Boolean);

    return textNodes.some((text) => MIRAPRI_SLOT_RE.test(text));
  }

  function getVisibleLodestoneLinks(element) {
    if (!element) return [];
    const links = element.matches?.(LODESTONE_ITEM_SELECTOR)
      ? [element]
      : [...element.querySelectorAll?.(LODESTONE_ITEM_SELECTOR) || []];
    return links
      .filter(isVisible)
      .filter((link) => isLodestoneItemUrl(link.href || link.getAttribute('href') || ''))
      .filter((link) => !isBadItemText(directTextOf(link) || link.textContent || ''));
  }

  function findMirapriPieceContainer(element, itemName = '') {
    let fallback = null;
    let node = element instanceof Element ? element : element?.parentElement;

    for (let depth = 0; node && depth < 12; depth += 1, node = node.parentElement) {
      if (!(node instanceof Element)) continue;
      const text = normalize(node.textContent || '');
      if (!text || text.length > 900) continue;
      if (hasExcludedSectionText(text) || MIRAPRI_END_RE.test(text)) continue;
      if (itemName && !text.includes(itemName)) continue;

      const links = getVisibleLodestoneLinks(node);
      if (!links.length) continue;

      const looksLikePieceRow = /この装備品で検索/.test(text) || containsMirapriSlotText(node);
      if (looksLikePieceRow) return node;

      // Keep a compact fallback, but continue climbing in case the slot/search text is
      // on the immediate parent row rather than the anchor's direct parent.
      if (!fallback && text.length < 260) fallback = node;
    }

    return fallback;
  }

  function getMirapriPrimaryItemAnchor(container) {
    const links = getVisibleLodestoneLinks(container);
    if (!links.length) return null;
    // In MIRAPRI equipment rows the first Lodestone item link is the equipment piece;
    // subsequent Lodestone links are usually dye colors.
    return links[0];
  }

  function isMirapriPrimaryItemAnchor(anchor) {
    const container = findMirapriPieceContainer(anchor, normalize(directTextOf(anchor) || anchor.textContent || ''));
    if (!container) return false;
    return getMirapriPrimaryItemAnchor(container) === anchor;
  }

  function findPieceContainer(element, itemName = '') {
    if (isMirapriPage()) {
      return findMirapriPieceContainer(element, itemName);
    }
    let node = element;
    for (let depth = 0; node && depth < 12; depth += 1, node = node.parentElement) {
      const text = normalize(node.textContent || '');
      if (text.length > 1800) continue;
      if (hasExcludedSectionText(text)) continue;

      if (itemName) {
        if (!text.includes(itemName)) continue;
        if (hasEquipmentAction(text) || hasImageWithAlt(node, itemName) || node.querySelector?.(LODESTONE_ITEM_SELECTOR)) {
          return node;
        }
      } else if (hasEquipmentAction(text)) {
        return node;
      }
    }
    return null;
  }

  function getItemNameFromLodestoneTextAnchor(anchor) {
    const href = anchor.href || anchor.getAttribute('href') || '';
    if (!isLodestoneItemUrl(href)) return '';

    const text = normalize(directTextOf(anchor) || anchor.textContent || '');
    if (isBadItemText(text)) return '';

    if (isMirapriPage()) {
      if (!isMirapriPrimaryItemAnchor(anchor)) return '';
      return text;
    }

    if (!isInEquipmentArea(anchor)) return '';

    // Only process the actual text link. Image-only Lodestone links cause duplicate badges.
    return text;
  }

  function findNameElement(container, itemName) {
    if (!container || isBadItemText(itemName)) return null;

    const candidates = [...container.querySelectorAll('a, span, div, p, h1, h2, h3, h4, h5, strong, b')]
      .filter((el) => !el.classList?.contains(MARKER_CLASS))
      .filter((el) => !el.closest?.(`.${MARKER_CLASS}`))
      .filter(isVisible)
      .filter((el) => normalize(el.textContent || '') === itemName || directTextOf(el) === itemName)
      .sort((a, b) => normalize(a.textContent).length - normalize(b.textContent).length);

    return candidates[0] || null;
  }

  function getImageAltItem(img) {
    if (!img?.matches?.('img[alt]')) return null;
    if (!isInEquipmentArea(img)) return null;

    const alt = normalize(img.getAttribute('alt'));
    if (isBadItemText(alt)) return null;

    const container = findPieceContainer(img, alt);
    if (!container) return null;

    // If this card already has a Lodestone item link, the link path will handle it.
    if (container.querySelector(LODESTONE_ITEM_SELECTOR)) return null;

    return { itemName: alt, container, img };
  }

  function findExistingBadgeForItem(container, itemName) {
    if (!container) return null;
    return [...container.querySelectorAll(`.${MARKER_CLASS}`)]
      .find((badge) => badge.dataset.ecTartoItemName === itemName) || null;
  }

  function findExistingBadgeWrapForItem(container, itemName) {
    if (!container) return null;
    const directWrap = [...container.querySelectorAll(`.${BADGE_WRAP_CLASS}`)]
      .find((wrap) => wrap.dataset.ecTartoItemName === itemName);
    if (directWrap) return directWrap;

    const badge = findExistingBadgeForItem(container, itemName);
    return badge?.closest?.(`.${BADGE_WRAP_CLASS}`) || null;
  }

  function pruneDuplicateItemBadges(container, itemName, preferredBadge = null) {
    if (!container || !itemName) return;
    const badges = [...container.querySelectorAll(`.${MARKER_CLASS}`)]
      .filter((badge) => badge.dataset.ecTartoItemName === itemName);
    if (badges.length <= 1) return;

    const keep = preferredBadge && badges.includes(preferredBadge)
      ? preferredBadge
      : badges.find((badge) => !badge.closest?.(`.${DYE_ROW_CLASS}`)) || badges[0];

    badges.forEach((badge) => {
      if (badge === keep) return;
      const wrap = badge.closest?.(`.${BADGE_WRAP_CLASS}`);
      if (wrap && wrap.querySelectorAll(`.${MARKER_CLASS}`).length === 1) {
        wrap.remove();
      } else {
        badge.remove();
      }
    });
  }

  function createBadgeWrap(itemName) {
    const wrap = document.createElement('span');
    wrap.className = BADGE_WRAP_CLASS;
    wrap.dataset.ecTartoItemName = itemName;

    const badge = document.createElement('a');
    badge.className = MARKER_CLASS;
    wrap.appendChild(badge);
    return { wrap, badge };
  }

  function findDirectItemTextNode(element, itemName) {
    if (!element) return null;
    return [...element.childNodes].find((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return false;
      const text = normalize(node.textContent || '');
      return text === itemName || text.includes(itemName);
    }) || null;
  }

  function findTextNodeContaining(element, itemName) {
    if (!element) return null;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest?.(`.${MARKER_CLASS}, .ec-tarto-inline-host`)) return NodeFilter.FILTER_REJECT;
          if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;

          const text = normalize(node.textContent || '');
          if (!text) return NodeFilter.FILTER_REJECT;
          return text === itemName || text.includes(itemName)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    return walker.nextNode();
  }

  function splitTextNodeAroundItem(textNode, itemName) {
    const raw = textNode.textContent || '';
    const normalizedRaw = normalize(raw);
    let index = raw.indexOf(itemName);

    // Whitespace normalization can make raw.indexOf fail. In that case, wrap the whole
    // text node if its visible text is exactly the item name.
    if (index < 0 && normalizedRaw === itemName) {
      index = raw.search(/\S/);
    }

    if (index < 0) return null;

    const before = raw.slice(0, index);
    const matchedText = raw.slice(index, index + itemName.length) || itemName;
    const after = raw.slice(index + itemName.length);

    const host = document.createElement('span');
    host.className = 'ec-tarto-inline-host';
    host.dataset.ecTartoItemName = itemName;
    host.append(document.createTextNode(matchedText));

    const nodes = [];
    if (before) nodes.push(document.createTextNode(before));
    nodes.push(host);
    if (after) nodes.push(document.createTextNode(after));
    textNode.replaceWith(...nodes);
    return host;
  }

  function getOrCreateInlineHost(nameElement, itemName) {
    if (!nameElement) return null;

    const existingHost = [...nameElement.querySelectorAll?.('.ec-tarto-inline-host') || []]
      .find((host) => host.dataset.ecTartoItemName === itemName);
    if (existingHost) return existingHost;

    const directTextNode = findDirectItemTextNode(nameElement, itemName);
    const textNode = directTextNode || findTextNodeContaining(nameElement, itemName);
    if (!textNode) return null;

    return splitTextNodeAroundItem(textNode, itemName);
  }

  function applyBadgeResult(badge, itemName, result) {
    badge.dataset.ecTartoItemName = itemName;
    badge.href = `${TAR_TO_SEARCH_URL}${encodeURIComponent(itemName)}`;
    badge.target = '_blank';
    badge.rel = 'noopener noreferrer';
    badge.classList.remove('ec-tarto-ko-name--found', 'ec-tarto-ko-name--missing');

    if (result?.ok && result.koreanName) {
      badge.textContent = result.koreanName;
      badge.href = result.itemUrl || badge.href;
      badge.classList.add('ec-tarto-ko-name--found');
      badge.title = `${itemName} → ${result.koreanName}`;
    } else {
      badge.textContent = '타르토 검색';
      badge.classList.add('ec-tarto-ko-name--missing');
      badge.title = result?.error
        ? `한글명을 자동으로 찾지 못했습니다. (${result.error}) 클릭하면 tar.to 검색 페이지가 열립니다.`
        : `타르토에서 "${itemName}" 검색`;
    }
  }


  function getOrCreateMirapriItemHost(anchor) {
    if (!anchor || !(anchor instanceof Element)) return null;
    const existing = anchor.closest?.('.ec-tarto-mirapri-item-host');
    if (existing) return existing;

    const host = document.createElement('span');
    host.className = 'ec-tarto-mirapri-item-host';
    anchor.parentNode.insertBefore(host, anchor);
    host.appendChild(anchor);
    return host;
  }

  function getOrCreateBadge(insertAfterElement, itemName, container, options = {}) {
    const existingBadge = findExistingBadgeForItem(container, itemName);
    if (existingBadge) return existingBadge;

    let wrap = null;
    let badge = null;

    if (options.mirapriInlineAfterAnchor) {
      const host = getOrCreateMirapriItemHost(insertAfterElement);
      if (host) {
        wrap = findExistingBadgeWrapForItem(host, itemName);
        if (!wrap) {
          const created = createBadgeWrap(itemName);
          wrap = created.wrap;
          wrap.classList.add('ec-tarto-ko-wrap--mirapri');
          badge = created.badge;
          host.appendChild(wrap);
        }
      }
    }

    if (!wrap && options.inlineInsideName) {
      const host = getOrCreateInlineHost(insertAfterElement, itemName);
      if (host) {
        wrap = findExistingBadgeWrapForItem(host, itemName);
        if (!wrap) {
          const created = createBadgeWrap(itemName);
          wrap = created.wrap;
          badge = created.badge;
          host.appendChild(wrap);
        }
      }
    }

    if (!wrap && options.inlineInsideName) {
      wrap = findExistingBadgeWrapForItem(insertAfterElement, itemName);
      if (!wrap) {
        const created = createBadgeWrap(itemName);
        wrap = created.wrap;
        badge = created.badge;
        insertAfterElement.append(document.createTextNode(' '), wrap);
      }
    }

    if (!wrap) {
      const next = insertAfterElement.nextElementSibling;
      if (next?.classList?.contains(BADGE_WRAP_CLASS) && next.dataset.ecTartoItemName === itemName) {
        wrap = next;
      } else {
        const created = createBadgeWrap(itemName);
        wrap = created.wrap;
        badge = created.badge;
        insertAfterElement.insertAdjacentElement('afterend', wrap);
      }
    }

    if (!badge) {
      badge = wrap.querySelector(`.${MARKER_CLASS}`);
    }

    applyBadgeResult(badge, itemName, null);
    return badge;
  }

  function updateAllBadgesForItem(itemName, result) {
    document.querySelectorAll(`.${MARKER_CLASS}`).forEach((badge) => {
      if (badge.dataset.ecTartoItemName === itemName) {
        applyBadgeResult(badge, itemName, result);
      }
    });
  }

  function getDyeQueryName(dyeName) {
    if (!dyeName || dyeName === 'Undyed') return '';
    if (MIRAPRI_STATIC_DYE_LABELS.has(dyeName)) return '';
    // MIRAPRI labels are Japanese. tar.to can search the Japanese Lodestone name
    // directly, so do not append "Dye" to those labels.
    if (/[\u3040-\u30ff]/.test(dyeName)) return dyeName;
    // Eorzea Collection shows dye labels without the word "Dye",
    // while tar.to searches the actual dye item name.
    return `${dyeName} Dye`;
  }

  function getStaticDyeTranslation(dyeName) {
    return STATIC_DYE_TRANSLATIONS.get(dyeName.toLowerCase()) || null;
  }

  function cleanDyeKoreanName(name) {
    return normalize(name)
      .replace(/\s*[\(（]\s*거래\s*불가\s*[\)）]\s*/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function applyDyeBadgeResult(badge, dyeName, result) {
    const queryName = getDyeQueryName(dyeName) || dyeName;
    const staticResult = getStaticDyeTranslation(dyeName);

    badge.dataset.ecTartoDyeName = dyeName;
    badge.href = `${TAR_TO_SEARCH_URL}${encodeURIComponent(queryName)}`;
    badge.target = '_blank';
    badge.rel = 'noopener noreferrer';
    badge.classList.remove('ec-tarto-dye-ko-name--found', 'ec-tarto-dye-ko-name--missing');

    if (result?.ok && result.koreanName) {
      const koreanName = cleanDyeKoreanName(result.koreanName);
      badge.textContent = koreanName;
      badge.href = result.itemUrl || badge.href;
      badge.classList.add('ec-tarto-dye-ko-name--found');
      badge.title = `${dyeName} → ${koreanName}`;
      return;
    }

    if (staticResult?.koreanName) {
      const koreanName = cleanDyeKoreanName(staticResult.koreanName);
      badge.textContent = koreanName;
      if (staticResult.itemUrl) badge.href = staticResult.itemUrl;
      badge.classList.add('ec-tarto-dye-ko-name--found');
      badge.title = `${dyeName} → ${koreanName}`;
      return;
    }

    badge.textContent = '염료 검색';
    badge.classList.add('ec-tarto-dye-ko-name--missing');
    badge.title = `타르토에서 "${queryName}" 검색`;
  }

  function findPieceContainerForDye(element) {
    let node = element;
    for (let depth = 0; node && depth < 12; depth += 1, node = node.parentElement) {
      const text = normalize(node.textContent || '');
      if (text.length > 1800) continue;
      if (hasExcludedSectionText(text)) continue;

      // The item badge is created before dye scanning. The closest ancestor containing
      // that badge is the equipment card this dye belongs to.
      if (node.querySelector?.(`.${BADGE_WRAP_CLASS}, .${MARKER_CLASS}`)) {
        return node;
      }
    }

    return findPieceContainer(element, '');
  }

  function getPrimaryBadgeWrap(pieceContainer) {
    if (!pieceContainer) return null;
    return pieceContainer.querySelector?.(`.${BADGE_WRAP_CLASS}`) ||
      pieceContainer.querySelector?.(`.${MARKER_CLASS}`)?.closest?.(`.${BADGE_WRAP_CLASS}`) ||
      null;
  }

  function findDyeSourceRow(labelElement, pieceContainer) {
    if (!labelElement || !pieceContainer) return null;

    let node = labelElement.parentElement;
    for (let depth = 0; node && node !== pieceContainer && depth < 7; depth += 1, node = node.parentElement) {
      if (!(node instanceof Element)) continue;
      if (node.closest?.(`.${MARKER_CLASS}, .${BADGE_WRAP_CLASS}, .${DYE_ROW_CLASS}`)) continue;

      const text = normalize(node.textContent || '');
      if (!text || text.length > 320) continue;

      const dyeCount = [...node.querySelectorAll('span, small, button, div, p, li')]
        .filter((child) => child !== node)
        .map(getDyeNameFromLabelElement)
        .filter(Boolean).length;

      // Prefer the compact row that contains the original dye chips.
      if (dyeCount >= 1 || getDyeNameFromLabelElement(node)) {
        return node;
      }
    }

    return labelElement.parentElement && pieceContainer.contains(labelElement.parentElement)
      ? labelElement.parentElement
      : null;
  }

  function findInlineBlockingLabels(pieceContainer, sourceRow) {
    if (!pieceContainer || !sourceRow) return [];
    const sourceRect = sourceRow.getBoundingClientRect();
    if (!sourceRect.width && !sourceRect.height) return [];

    return [...pieceContainer.querySelectorAll('span, small, b, strong, em, a, button, div')]
      .filter((el) => !el.closest?.(`.${MARKER_CLASS}, .${BADGE_WRAP_CLASS}, .${DYE_MARKER_CLASS}, .${DYE_ROW_CLASS}`))
      .filter(isVisible)
      .filter((el) => isNonEquipmentLabel(directTextOf(el) || el.textContent || ''))
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;
        const sameLine = rect.top < sourceRect.bottom + 4 && rect.bottom > sourceRect.top - 4;
        return sameLine;
      });
  }

  function clearPrimaryBadgeDyeColumnShift(wrap) {
    if (!wrap) return;
    wrap.classList.remove('ec-tarto-ko-wrap--dye-column', 'ec-tarto-ko-wrap--dye-column-flow');
    wrap.style.removeProperty('left');
    wrap.style.removeProperty('top');
    wrap.style.removeProperty('position');
    wrap.style.removeProperty('margin-left');
    wrap.style.removeProperty('transform');
  }

  function alignPrimaryBadgeToDyeColumn(pieceContainer, wrap, badge, targetLeft, baseBadgeLeft) {
    if (!pieceContainer || !wrap || !badge) return;

    // v32: keep the green item badge in its original DOM position to avoid the
    // duplicate/flicker from v30, but visually shift it with transform instead of
    // margin. Margin was absorbed/reset by some Eorzea flex rows, so the Procyon
    // badge went back beside the English item name. A transform is stable and does
    // not create a second badge or affect the dye row layout.
    wrap.classList.remove('ec-tarto-ko-wrap--dye-column');
    wrap.style.removeProperty('left');
    wrap.style.removeProperty('top');
    wrap.style.removeProperty('margin-left');

    const diff = Math.round(targetLeft - baseBadgeLeft);
    if (diff <= 18) {
      clearPrimaryBadgeDyeColumnShift(wrap);
      return;
    }

    wrap.classList.add('ec-tarto-ko-wrap--dye-column-flow');
    wrap.style.setProperty('position', 'relative', 'important');
    wrap.style.setProperty('transform', `translateX(${Math.min(420, diff)}px)`, 'important');
  }

  function alignDyeRowToOriginalDyeLine(pieceContainer, row, labelElement = null) {
    if (!pieceContainer || !row) return;

    const wrap = getPrimaryBadgeWrap(pieceContainer);
    const badge = wrap?.querySelector?.(`.${MARKER_CLASS}`) || pieceContainer.querySelector?.(`.${MARKER_CLASS}`);
    if (!badge) return;

    const sourceRow = findDyeSourceRow(labelElement, pieceContainer) || labelElement;
    if (!sourceRow) return;

    if (getComputedStyle(pieceContainer).position === 'static') {
      pieceContainer.style.position = 'relative';
    }

    const pieceRect = pieceContainer.getBoundingClientRect();

    // Measure the badge from its unshifted position, then re-apply the visual
    // shift after the target dye column is known. Otherwise repeated scans would
    // measure the already-shifted green badge and cancel the alignment.
    const previousTransform = wrap?.style?.getPropertyValue('transform') || '';
    const previousPosition = wrap?.style?.getPropertyValue('position') || '';
    if (wrap) {
      wrap.style.removeProperty('transform');
      wrap.style.removeProperty('position');
    }

    const badgeRect = badge.getBoundingClientRect();
    const sourceRect = sourceRow.getBoundingClientRect();
    if (!pieceRect.width || !badgeRect.width || !sourceRect.height) {
      if (wrap && previousTransform) wrap.style.setProperty('transform', previousTransform, 'important');
      if (wrap && previousPosition) wrap.style.setProperty('position', previousPosition, 'important');
      return;
    }

    const badgeLeft = Math.round(badgeRect.left - pieceRect.left);
    let sourceRight = Math.round(sourceRect.right - pieceRect.left + 6);

    // If the same dye line also contains tags such as Optional, put the dye
    // translation after those tags instead of on top of them.
    findInlineBlockingLabels(pieceContainer, sourceRow).forEach((label) => {
      const rect = label.getBoundingClientRect();
      sourceRight = Math.max(sourceRight, Math.round(rect.right - pieceRect.left + 6));
    });

    const left = Math.max(badgeLeft, sourceRight);
    const top = Math.round(sourceRect.top + sourceRect.height / 2 - pieceRect.top);

    if (left > 0 && left < pieceRect.width - 12) {
      row.style.left = `${left}px`;
    }
    if (top > 0 && top < pieceRect.height + 40) {
      row.style.top = `${top}px`;
    }

    // When the dye translations have to move right because the original dye/Optional
    // chips are wider than the item name, align the Korean item badge above that dye column.
    alignPrimaryBadgeToDyeColumn(pieceContainer, wrap, badge, left, badgeLeft);
  }

  function getOrCreateDyeRow(pieceContainer, labelElement = null) {
    if (!pieceContainer) return null;

    // v26: keep the horizontal position from v24 (aligned to the Korean item-name badge),
    // but move the dye translation badges down to the same vertical row as the original
    // dye chips. The row is positioned relative to the individual equipment card so it
    // does not stretch into the center column or overlap the icon/original dye labels.
    let row = pieceContainer.querySelector?.(`.${DYE_ROW_CLASS}`);
    if (!row) {
      row = document.createElement('span');
      row.className = `${DYE_ROW_CLASS} ${DYE_ROW_CLASS}--same-line`;
      pieceContainer.appendChild(row);
    }

    alignDyeRowToOriginalDyeLine(pieceContainer, row, labelElement);
    return row;
  }

  function findExistingDyeBadge(pieceContainer, dyeName) {
    const row = getOrCreateDyeRow(pieceContainer);
    if (!row) return null;
    return [...row.querySelectorAll(`.${DYE_MARKER_CLASS}`)]
      .find((badge) => badge.dataset.ecTartoDyeName === dyeName) || null;
  }

  function getOrCreateDyeBadge(pieceContainer, dyeName, labelElement = null) {
    const row = getOrCreateDyeRow(pieceContainer, labelElement);
    if (!row) return null;

    const existing = [...row.querySelectorAll(`.${DYE_MARKER_CLASS}`)]
      .find((badge) => badge.dataset.ecTartoDyeName === dyeName);
    if (existing) return existing;

    const badge = document.createElement('a');
    badge.className = DYE_MARKER_CLASS;
    applyDyeBadgeResult(badge, dyeName, null);
    row.appendChild(badge);
    return badge;
  }

  function updateAllDyeBadgesForName(dyeName, result) {
    document.querySelectorAll(`.${DYE_MARKER_CLASS}`).forEach((badge) => {
      if (badge.dataset.ecTartoDyeName === dyeName) {
        applyDyeBadgeResult(badge, dyeName, result);
        const row = badge.closest?.(`.${DYE_ROW_CLASS}`);
        const pieceContainer = row?.parentElement;
        if (pieceContainer && row) {
          // Keep the row and the possibly shifted item-name badge aligned after
          // async text replacement changes badge widths.
          requestAnimationFrame(() => alignDyeRowToOriginalDyeLine(pieceContainer, row));
        }
      }
    });
  }

  function lookupKoreanName(itemName, options = {}) {
    return new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve({ ok: false, error: 'timeout' });
        }
      }, LOOKUP_TIMEOUT_MS);

      try {
        chrome.runtime.sendMessage({ type: 'EC_TARTO_LOOKUP', itemName, preferDye: !!options.preferDye }, (response) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);

          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response || { ok: false, error: 'empty_response' });
          }
        });
      } catch (error) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve({ ok: false, error: error.message || String(error) });
        }
      }
    });
  }

  function startLookup(itemName) {
    const cached = lookupState.get(itemName);
    if (cached?.state === 'done') return cached.result;
    if (cached?.state === 'pending') return null;

    const promise = lookupKoreanName(itemName).then((result) => {
      lookupState.set(itemName, { state: 'done', result });
      updateAllBadgesForItem(itemName, result);

      // A few light delayed passes are enough for Eorzea Collection's initial re-render.
      // Avoid the previous frequent interval/attribute scans that caused scroll jank.
      [250, 1000, 2500].forEach((delay) => {
        setTimeout(() => {
          scheduleScan(0);
          updateAllBadgesForItem(itemName, result);
        }, delay);
      });

      return result;
    });

    lookupState.set(itemName, { state: 'pending', promise });
    return null;
  }

  function startDyeLookup(dyeName) {
    const staticResult = getStaticDyeTranslation(dyeName);
    const queryName = getDyeQueryName(dyeName);

    if (!queryName) {
      const result = staticResult
        ? { ok: true, koreanName: staticResult.koreanName, itemUrl: staticResult.itemUrl || '' }
        : { ok: false, error: 'not_a_dye_item' };
      dyeLookupState.set(dyeName, { state: 'done', result });
      updateAllDyeBadgesForName(dyeName, result);
      return result;
    }

    const cached = dyeLookupState.get(dyeName);
    if (cached?.state === 'done') return cached.result;
    if (cached?.state === 'pending') return null;

    const promise = lookupKoreanName(queryName, { preferDye: true }).then((result) => {
      const finalResult = result?.ok ? result : (staticResult
        ? { ok: true, koreanName: staticResult.koreanName, itemUrl: staticResult.itemUrl || '' }
        : result);

      dyeLookupState.set(dyeName, { state: 'done', result: finalResult });
      updateAllDyeBadgesForName(dyeName, finalResult);
      return finalResult;
    });

    dyeLookupState.set(dyeName, { state: 'pending', promise });
    return null;
  }

  function addKoreanName(insertAfterElement, itemName, container, options = {}) {
    if (!insertAfterElement || isBadItemText(itemName)) return;
    if (!isInEquipmentArea(insertAfterElement)) return;

    const pieceContainer = container || findPieceContainer(insertAfterElement, itemName);
    if (!pieceContainer) return;

    const badge = getOrCreateBadge(insertAfterElement, itemName, pieceContainer, options);
    pruneDuplicateItemBadges(pieceContainer, itemName, badge);
    const state = lookupState.get(itemName);

    if (state?.state === 'done') {
      applyBadgeResult(badge, itemName, state.result);
      return;
    }

    startLookup(itemName);
  }

  function addFromLodestoneAnchor(anchor) {
    const itemName = getItemNameFromLodestoneTextAnchor(anchor);
    if (isBadItemText(itemName)) return;
    const container = findPieceContainer(anchor, itemName);
    addKoreanName(anchor, itemName, container, isMirapriPage() ? { mirapriInlineAfterAnchor: true } : {});
  }

  function addFromImageOnlyItem(img) {
    const info = getImageAltItem(img);
    if (!info) return;

    const nameElement = findNameElement(info.container, info.itemName);
    if (nameElement) {
      addKoreanName(nameElement, info.itemName, info.container, { inlineInsideName: true });
    } else {
      addKoreanName(info.img.closest('a[href]') || info.img, info.itemName, info.container);
    }
  }


  function isMirapriDyeAnchor(element) {
    if (!isMirapriPage() || !element?.matches?.(LODESTONE_ITEM_SELECTOR)) return false;
    if (!isInEquipmentArea(element)) return false;
    return !isMirapriPrimaryItemAnchor(element);
  }

  function getMirapriDyeNameFromLabelElement(element) {
    if (!element || element.closest?.(`.${MARKER_CLASS}, .${DYE_MARKER_CLASS}, .${DYE_ROW_CLASS}`)) return '';
    if (!isInEquipmentArea(element)) return '';

    const direct = normalizeMirapriDyeLabel(directTextOf(element));
    const full = normalizeMirapriDyeLabel(element.textContent || '');
    const title = normalizeMirapriDyeLabel(element.getAttribute?.('title') || '');
    const aria = normalizeMirapriDyeLabel(element.getAttribute?.('aria-label') || '');

    if ([direct, full, title, aria].some(isNonEquipmentLabel)) return '';

    if (isMirapriDyeAnchor(element)) {
      return getMirapriDyeName(direct || full || title || aria);
    }

    // Only compact non-link labels such as デフォルト色 / 染色なし are accepted here.
    // Check direct text first so parent containers do not create duplicate badges.
    for (const value of [direct, title, aria]) {
      if (MIRAPRI_STATIC_DYE_LABELS.has(value)) return value;
    }

    return '';
  }

  function getOrCreateMirapriInlineDyeBadge(labelElement, dyeName) {
    if (!labelElement || !dyeName) return null;

    const existing = labelElement.nextElementSibling?.classList?.contains(DYE_MARKER_CLASS) &&
      labelElement.nextElementSibling.dataset.ecTartoDyeName === dyeName
      ? labelElement.nextElementSibling
      : null;
    if (existing) return existing;

    const badge = document.createElement('a');
    badge.className = `${DYE_MARKER_CLASS} ec-tarto-dye-ko-name--mirapri-inline`;
    applyDyeBadgeResult(badge, dyeName, null);
    labelElement.insertAdjacentElement('afterend', badge);
    return badge;
  }

  function getDyeNameFromLabelElement(element) {
    if (isMirapriPage()) return getMirapriDyeNameFromLabelElement(element);
    if (!element || element.closest?.(`.${MARKER_CLASS}, .${DYE_MARKER_CLASS}, .${DYE_ROW_CLASS}`)) return '';
    if (!isInEquipmentArea(element)) return '';

    const values = [
      directTextOf(element),
      normalize(element.textContent || ''),
      normalize(element.getAttribute?.('title') || ''),
      normalize(element.getAttribute?.('aria-label') || '')
    ];

    for (const value of values) {
      const dyeName = getCanonicalDyeName(value);
      if (dyeName) return dyeName;
    }

    return '';
  }

  function addFromDyeLabel(element) {
    const dyeName = getDyeNameFromLabelElement(element);
    if (!dyeName) return;

    if (isMirapriPage()) {
      // Avoid duplicate badges from parent nodes that contain the actual dye label child.
      const childHasSameDye = [...element.children || []].some((child) => getDyeNameFromLabelElement(child) === dyeName);
      if (childHasSameDye) return;

      const badge = getOrCreateMirapriInlineDyeBadge(element, dyeName);
      if (!badge) return;

      const state = dyeLookupState.get(dyeName);
      if (state?.state === 'done') {
        applyDyeBadgeResult(badge, dyeName, state.result);
        return;
      }

      startDyeLookup(dyeName);
      return;
    }

    // Avoid broad parent rows if a smaller child label carries the same dye text.
    const childHasSameDye = [...element.children || []].some((child) => getDyeNameFromLabelElement(child) === dyeName);
    if (childHasSameDye) return;

    const pieceContainer = findPieceContainerForDye(element);
    if (!pieceContainer) return;

    const badge = getOrCreateDyeBadge(pieceContainer, dyeName, element);
    if (!badge) return;

    const state = dyeLookupState.get(dyeName);
    if (state?.state === 'done') {
      applyDyeBadgeResult(badge, dyeName, state.result);
      return;
    }

    startDyeLookup(dyeName);
  }

  function scanNow() {
    scanQueued = false;
    currentBounds = null;

    const bounds = getEquipmentBounds();
    const root = bounds.root || getMainRoot();

    root.querySelectorAll(LODESTONE_ITEM_SELECTOR).forEach(addFromLodestoneAnchor);

    if (!isMirapriPage()) {
      // Fallback for pieces that do not expose a Lodestone URL, such as Cosmic Operator's Cap.
      // Limited to the Equipment block and skips cards that already have Lodestone item links.
      root.querySelectorAll('img[alt]').forEach(addFromImageOnlyItem);
    }

    // Translate dye/color labels shown next to each equipment piece.
    // MIRAPRI uses Lodestone links for dye names, so include anchors there as well.
    root.querySelectorAll(isMirapriPage() ? 'a, span, small, button, b, strong, em' : 'span, small, button, div, p, li').forEach(addFromDyeLabel);
  }

  function scheduleScan(delay = 120) {
    if (scanTimer) return;

    scanTimer = setTimeout(() => {
      scanTimer = null;
      if (scanQueued) return;
      scanQueued = true;
      requestAnimationFrame(scanNow);
    }, delay);
  }

  scheduleScan(0);
  ['DOMContentLoaded', 'load'].forEach((eventName) => {
    window.addEventListener(eventName, () => scheduleScan(0), { once: true });
  });

  // Observe only added/removed DOM nodes. Attribute changes on scroll/lazy-load caused
  // repeated full rescans and made scrolling feel laggy.
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.addedNodes.length || m.removedNodes.length)) {
      scheduleScan(180);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Explicit user interactions that may reveal a tab/section still trigger one debounced scan.
  ['click', 'keyup'].forEach((eventName) => {
    document.addEventListener(eventName, () => scheduleScan(160), true);
  });

  // Initial delayed passes only. No perpetual 500ms interval.
  [300, 900, 1800, 3500].forEach((delay) => setTimeout(() => scheduleScan(0), delay));
})();
