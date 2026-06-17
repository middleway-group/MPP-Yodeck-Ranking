// -----------------------------------------------------------------------------
// fetch-standings.mjs
// Recupere le classement d'un challenge Mon Petit Prono.
//
// Auth : MPP delegue a Ligue 1 Connect (Auth0). On NE rejoue PAS le code OAuth
// (usage unique). On utilise le refresh_token (scope offline_access) pour obtenir
// un access_token frais a chaque run, sans navigateur.
//
// Endpoint classement confirme :
//   GET https://api.mpp.football/challenge-standings/users-standings
//       ?challengeId=...&offset=0&limit=20   (Authorization: Bearer <access_token>)
//
// >>> RESTE A CONFIRMER : les noms de champs du JSON de reponse. <<<
// normalizeEntry() essaie deja les variantes courantes ; ajuste si besoin une
// fois que tu m'as colle un extrait du JOSN (noms anonymises).
// -----------------------------------------------------------------------------
import { writeFile } from "node:fs/promises";

// --- config (surchargée par variables d'environnement / secrets) ---------------
const TOKEN_URL = process.env.MPP_TOKEN_URL || "https://connect.ligue1.fr/oauth/token";
const CLIENT_ID = process.env.MPP_CLIENT_ID || "grX5jWGWWQ4Uq91oe7KPNDZ96FS3jr0X"; // client public SPA (pas secret)
const REFRESH_TOKEN = process.env.MPP_REFRESH_TOKEN;                                 // SECRET

const API_BASE = process.env.MPP_API_BASE || "https://api.mpp.football";
const CHALLENGE_ID = process.env.MPP_CHALLENGE_ID;                                   // ex: mpp_challenge_UD61EVJZ
const PAGE_LIMIT = Number(process.env.MPP_PAGE_LIMIT || 100);

const LEAGUE_NAME = process.env.MPP_LEAGUE_NAME || "Mon Petit Prono";
// Si la rotation des refresh tokens est active, on ecrit le nouveau token ici
// (chemin hors dist/) pour que le workflow le repousse dans le secret GitHub.
const REFRESH_OUT = process.env.MPP_REFRESH_OUT || "";

const USE_MOCK = process.env.MPP_MOCK === "1" || !REFRESH_TOKEN;

// --- helpers de parsing tolerants ----------------------------------------------
function pick(obj, keys) {
  for (const k of keys) if (obj && obj[k] != null) return obj[k];
  return undefined;
}

function extractEntriesArray(data) {
  if (Array.isArray(data)) return data;
  for (const k of [
    "usersStandings", "userStandings", "standings", "ranking", "rankings",
    "users", "players", "results", "rows", "data", "entries", "items",
  ]) {
    const v = data?.[k];
    if (Array.isArray(v)) return v;
    if (Array.isArray(v?.standings)) return v.standings;
    if (Array.isArray(v?.users)) return v.users;
  }
  return [];
}

function normalizeEntry(raw, index) {
  const user = raw?.user || raw?.profile || {};
  const ranking = raw?.ranking || {};

  const name =
    user.firstName ||
    user.username ||
    pick(user, ["nickname", "name", "pseudo", "displayName"]) ||
    pick(raw, ["nickname", "name", "username", "pseudo", "displayName", "userName", "login"]) ||
    `Joueur ${index + 1}`;

  const points = Number(
    ranking.points ??
    pick(raw, ["points", "score", "total", "totalPoints", "pts", "totalScore", "value"]) ??
    0
  );
  const rank = Number(
    ranking.rank ??
    pick(raw, ["rank", "position", "place", "standing"]) ??
    index + 1
  );

  const goodForecasts = Number(ranking.goodForecasts ?? 0);
  const exactForecasts = Number(ranking.exactForecasts ?? 0);
  const calculatedForecasts = Number(ranking.calculatedForecasts ?? 0);

  // tendance : champ direct, ou calcul depuis le rang precedent si fourni
  let trend = 0;
  const trendRaw = pick(raw, ["trend", "evolution", "variation", "move", "delta", "progression"]);
  const prev = pick(raw, ["previousRank", "previousPosition", "prevRank", "lastRank"]);
  if (typeof trendRaw === "number") trend = trendRaw;
  else if (prev != null) trend = Number(prev) - rank;

  return { rank, name: String(name), points, trend, goodForecasts, exactForecasts, calculatedForecasts };
}

function normalizeStandings(arr) {
  const entries = arr.map(normalizeEntry);
  const hasRanks = entries.every((e) => Number.isFinite(e.rank) && e.rank > 0);
  if (!hasRanks) {
    entries.sort((a, b) => b.points - a.points);
    entries.forEach((e, i) => (e.rank = i + 1));
  } else {
    entries.sort((a, b) => a.rank - b.rank);
  }
  return entries;
}

// --- auth : refresh_token grant -------------------------------------------------
async function persistRotatedRefreshToken(newToken) {
  console.warn("[auth] le refresh token a ete renouvele (rotation active).");
  if (REFRESH_OUT) {
    await writeFile(REFRESH_OUT, newToken, "utf8");
    console.warn(`[auth] nouveau refresh token ecrit dans ${REFRESH_OUT} (a repousser dans le secret).`);
  } else {
    console.warn("[auth] MPP_REFRESH_OUT non defini : le prochain run echouera si l'ancien token est invalide.");
  }
}

async function getAccessToken() {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: REFRESH_TOKEN,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Refresh token echoue (${res.status} ${res.statusText}). ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!data.access_token) throw new Error("access_token absent de la reponse de refresh.");
  if (data.refresh_token && data.refresh_token !== REFRESH_TOKEN) {
    await persistRotatedRefreshToken(data.refresh_token);
  }
  return data.access_token;
}

// --- classement (avec pagination) ----------------------------------------------
async function fetchAllStandings(accessToken) {
  if (!CHALLENGE_ID) throw new Error("MPP_CHALLENGE_ID manquant.");
  let offset = 0;
  let out = [];
  for (let guard = 0; guard < 50; guard++) {
    const url =
      `${API_BASE}/challenge-standings/users-standings` +
      `?challengeId=${encodeURIComponent(CHALLENGE_ID)}&offset=${offset}&limit=${PAGE_LIMIT}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Classement echoue (${res.status} ${res.statusText}). ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    const batch = extractEntriesArray(data);
    if (process.env.MPP_DEBUG && offset === 0) {
      console.log("[debug] cles de la reponse :", Object.keys(data));
      console.log("[debug] 1er joueur brut :\n" + JSON.stringify(batch[0], null, 2));
    }
    out = out.concat(batch);
    if (batch.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
  }
  return out;
}

// --- mock (preview / test sans identifiants) -----------------------------------
function mockStandings() {
  const noms = [
    "David G.", "Sandra L.", "Cedric M.", "Philippe P.", "Florent V.",
    "Equipe POP", "Marie D.", "Thomas B.", "Julie R.", "Nicolas F.",
    "Camille T.", "Lucas M.", "Emma P.", "Hugo S.", "Lea G.",
    "Antoine R.", "Chloe D.", "Maxime L.",
  ];
  let base = 1280;
  return noms.map((name, i) => {
    base -= Math.floor(20 + Math.random() * 55);
    return { rank: i + 1, name, points: base + (i === 0 ? 60 : 0), trend: i % 4 === 0 ? 1 : i % 4 === 1 ? -1 : 0 };
  });
}

// --- API ------------------------------------------------------------------------
export async function getStandings() {
  if (USE_MOCK) {
    return { leagueName: LEAGUE_NAME, updatedAt: new Date().toISOString(), mock: true, entries: mockStandings() };
  }
  const accessToken = await getAccessToken();
  const raw = await fetchAllStandings(accessToken);
  const entries = normalizeStandings(raw);
  if (entries.length === 0) {
    throw new Error("Classement vide apres normalisation. Ajuste extractEntriesArray()/normalizeEntry() avec le JSON reel.");
  }
  return { leagueName: LEAGUE_NAME, updatedAt: new Date().toISOString(), mock: false, entries };
}
