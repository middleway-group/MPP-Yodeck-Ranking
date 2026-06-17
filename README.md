# Classement Mon Petit Prono → Yodeck

Job horaire (GitHub Actions) qui récupère le classement de ton challenge MPP via
l'API, génère une page brandée MiddleWay, et la publie sur GitHub Pages. Le player
Yodeck affiche simplement cette URL — **aucune authentification côté Yodeck**.

```
API MPP (Bearer) → build.mjs (toutes les heures) → GitHub Pages (URL publique) → widget Web Page Yodeck
```

## Authentification (Auth0 / Ligue 1 Connect)

MPP délègue son login à Ligue 1 Connect (Auth0). Le job **ne rejoue pas** le code
OAuth (usage unique) : il utilise le **refresh token** (scope `offline_access`)
pour obtenir un access token frais à chaque run, via :

```
POST https://connect.ligue1.fr/oauth/token
{ "grant_type":"refresh_token", "client_id":"<public SPA>", "refresh_token":"<secret>" }
```

L'access token sert ensuite de `Bearer` sur `api.mpp.football`.

> **Rotation.** Si Auth0 renouvelle le refresh token à chaque usage, le job écrit
> le nouveau dans `new_refresh_token.txt` et l'étape « Persister le refresh token »
> le repousse dans le secret (nécessite un PAT `GH_PAT`). Sans rotation, on stocke
> le refresh token une fois et l'étape est inutile. Pour savoir : fais deux refresh
> d'affilée avec le même token ; si le 2ᵉ échoue, la rotation est active.

---

## Étape 1 — Identifiants à récupérer (DevTools)

Déjà fait dans nos échanges. Tu as besoin de :
- **refresh_token** : réponse de `connect.ligue1.fr/oauth/token` (champ `refresh_token`).
- **challengeId** : dans l'URL du classement
  (`…/users-standings?challengeId=mpp_challenge_XXXX`).

> ⚠️ Le refresh token est une crédential longue durée : il ne va **que** dans un
> secret GitHub, jamais dans le code, un commit ou un message.

## Étape 2 — Pousser le dépôt

```bash
git init && git add . && git commit -m "init classement MPP"
git branch -M main
git remote add origin git@github.com:dgrospelier/mpp-yodeck.git
git push -u origin main
```

## Étape 3 — Secrets & variables

Repo → **Settings → Secrets and variables → Actions**.

**Secrets :**
| Nom | Valeur |
|-----|--------|
| `MPP_REFRESH_TOKEN` | le refresh token |
| `GH_PAT` | *(optionnel, si rotation)* PAT fine-grained, droit Secrets read/write sur ce repo |

**Variables :**
| Nom | Exemple |
|-----|---------|
| `MPP_CHALLENGE_ID` | `mpp_challenge_UD61EVJZ` |
| `MPP_LEAGUE_NAME` | `Ligue MiddleWay` |
| `MPP_ROWS_PER_PAGE` | `12` |
| `MPP_CLIENT_ID` / `MPP_API_BASE` / `MPP_TOKEN_URL` | *(surcharges, défauts déjà dans le code)* |

## Étape 4 — Activer GitHub Pages

Repo → **Settings → Pages → Source : GitHub Actions**.

## Étape 5 — Lancer et récupérer l'URL

**Actions → « Classement MPP → Pages » → Run workflow**. À la fin du job `deploy`,
l'URL publique s'affiche : `https://dgrospelier.github.io/mpp-yodeck/`.

## Étape 6 — Configurer Yodeck

1. **Media → Add Media → Web Page** : colle l'URL Pages.
2. Écran en **paysage**, durée d'affichage au choix.
3. Active le rafraîchissement de la Web Page (la page recharge aussi seule via
   `meta refresh`, 15 min par défaut, réglable via `MPP_META_REFRESH_S`).
4. Ajoute la Web Page à un **Layout/Playlist**, assigne à l'écran, **Push to Screens**.

---

## Résilience

Si l'API est injoignable ou renvoie un JSON inattendu, `build` échoue
volontairement → `deploy` (qui en dépend) est sauté → **la dernière page valide
reste en ligne**. L'écran ne devient jamais blanc.

## Tester en local

```bash
npm run build:mock          # page de démo, sans identifiants
# live :
MPP_REFRESH_TOKEN=… MPP_CHALLENGE_ID=mpp_challenge_UD61EVJZ npm run build
```

## Personnalisation

- Couleurs / typo : `<style>` de `src/render.mjs` (charte MiddleWay).
- Lignes par page / défilement : `MPP_ROWS_PER_PAGE`, `MPP_PAGE_CYCLE_MS`.
- Tendance ▲/▼ : affichée si l'API renvoie un rang précédent ou une évolution.
