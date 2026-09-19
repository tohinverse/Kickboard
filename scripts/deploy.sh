#!/usr/bin/env bash
# Deploy Kickboard to Vercel. Run after `vercel login`.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v vercel >/dev/null 2>&1; then
  echo "The Vercel CLI is not installed. Run:  npm i -g vercel" >&2
  exit 1
fi

if ! vercel whoami >/dev/null 2>&1; then
  echo "Not signed in to Vercel. Run:  vercel login" >&2
  exit 1
fi

echo "==> Linking the Vercel project (name it 'kickboard' when prompted)"
vercel link --yes --project kickboard

echo
echo "==> Pulling production environment variables"
vercel env pull .env.production.local --environment=production || true

if ! grep -q "DATABASE_URL\|POSTGRES_URL" .env.production.local 2>/dev/null; then
  cat >&2 <<'MSG'

No Postgres connection string found.

Create a database first: Vercel dashboard -> your project -> Storage -> Create
Database -> Postgres (or Neon). Connect it to this project, then re-run.

MSG
  exit 1
fi

set_secret() {
  local key="$1" prompt="$2"
  if vercel env ls production 2>/dev/null | grep -q "^ *$key "; then
    echo "==> $key is already set in production; leaving it unchanged."
    return
  fi
  echo
  read -r -s -p "$prompt: " value
  echo
  printf '%s' "$value" | vercel env add "$key" production
}

set_secret ADMIN_PASSWORD "Choose the shared admin password"

if ! vercel env ls production 2>/dev/null | grep -q "^ *ADMIN_SESSION_SECRET "; then
  echo "==> Generating ADMIN_SESSION_SECRET"
  node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))" \
    | vercel env add ADMIN_SESSION_SECRET production
fi

echo
echo "==> Applying database migrations"
# Migrations need the direct (non-pooled) URL.
set -a; . ./.env.production.local; set +a
DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-${POSTGRES_URL_NON_POOLING:-${DATABASE_URL:-}}}" \
  npx prisma migrate deploy

echo
echo "==> Deploying to production"
vercel deploy --prod

echo
echo "Done. Sign in at /admin with the password you set."
