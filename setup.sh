#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Mise en place du repo MPP-Yodeck-Ranking dans l'org middleway-group.
# A executer DEPUIS le dossier du projet (la ou se trouve package.json).
# Pre-requis : GitHub CLI installe et connecte  ->  gh auth login
# -----------------------------------------------------------------------------
set -euo pipefail

ORG="middleway-group"
REPO="MPP-Yodeck-Ranking"
SLUG="$ORG/$REPO"

# Visibilite du repo. Pages sur repo PRIVE = plan org payant. Si l'org est en
# plan gratuit, passe en --public (le code ne contient aucun secret).
VISIBILITY="--private"

# 0. Verifs
gh auth status >/dev/null 2>&1 || { echo "❌ Lance d'abord : gh auth login"; exit 1; }
[ -f package.json ] || { echo "❌ A lancer depuis le dossier du projet (package.json absent)."; exit 1; }

# 1. Git local + commit
if [ ! -d .git ]; then git init -q && git branch -M main; fi
git add -A
git commit -qm "Classement MPP pour Yodeck" || echo "ℹ️  rien a committer (deja a jour)"

# 2. Cree le repo dans l'org et pousse le code
gh repo create "$SLUG" $VISIBILITY --source=. --remote=origin --push

# 3. Secrets (une valeur est OBLIGATOIRE a la creation -> placeholder a remplacer)
gh secret set MPP_REFRESH_TOKEN --repo "$SLUG" --body "A_REMPLIR"
gh secret set GH_PAT            --repo "$SLUG" --body "A_REMPLIR"

# 4. Variables (pre-remplies avec ce qu'on connait ; modifiables ensuite)
gh variable set MPP_CHALLENGE_ID  --repo "$SLUG" --body "mpp_challenge_UD61EVJZ"
gh variable set MPP_LEAGUE_NAME   --repo "$SLUG" --body "Ligue MiddleWay"
gh variable set MPP_ROWS_PER_PAGE --repo "$SLUG" --body "12"

# 5. Active GitHub Pages avec la source "GitHub Actions"
gh api -X POST "repos/$SLUG/pages" -f build_type=workflow >/dev/null 2>&1 \
  || gh api -X PUT "repos/$SLUG/pages" -f build_type=workflow >/dev/null 2>&1 \
  || echo "ℹ️  Active Pages a la main : Settings → Pages → Source : GitHub Actions"

echo ""
echo "✅ Repo cree : https://github.com/$SLUG"
echo "👉 Il reste a remplir les 2 secrets (Settings → Secrets and variables → Actions) :"
echo "   - MPP_REFRESH_TOKEN : un refresh token FRAIS (pris dans le navigateur)"
echo "   - GH_PAT            : un PAT fine-grained, droit 'Secrets: read and write' sur ce repo"
