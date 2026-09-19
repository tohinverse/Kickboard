#!/usr/bin/env bash
# Kickboard Docker development helper.
#   ./scripts/dev.sh up        start the stack (first run builds it)
#   ./scripts/dev.sh down      stop it, keeping the database
#   ./scripts/dev.sh reset     destroy everything including the database
#   ./scripts/dev.sh logs      follow the app logs
#   ./scripts/dev.sh shell     open a shell in the app container
#   ./scripts/dev.sh psql      open psql against the dev database
#   ./scripts/dev.sh migrate   create a new migration (prompts for a name)
#   ./scripts/dev.sh seed      load demo tournaments
#   ./scripts/dev.sh test      run the test suite (WIPES the dev database)
#   ./scripts/dev.sh prod      run the production image locally (port 3001)
#   ./scripts/dev.sh prod-down stop the production stack
set -euo pipefail

cd "$(dirname "$0")/.."

if ! docker info >/dev/null 2>&1; then
  echo "Docker isn't running. Start Docker Desktop and try again." >&2
  exit 1
fi

[ -f .env ] || { cp .env.example .env; echo "Created .env from .env.example"; }

# shellcheck disable=SC1091
set -a; . ./.env; set +a
APP_PORT="${APP_PORT:-3000}"

dc() { docker compose "$@"; }

case "${1:-up}" in
  up)
    dc up -d --build
    echo
    echo "Kickboard is starting at http://localhost:${APP_PORT}"
    echo "Admin password: ${ADMIN_PASSWORD:-local-dev-password}"
    echo
    echo "Follow the logs with:  ./scripts/dev.sh logs"
    ;;
  down)
    dc down
    echo "Stopped. The database volume was kept — use 'reset' to wipe it."
    ;;
  reset)
    read -r -p "This deletes the dev database and all its data. Continue? [y/N] " reply
    case "$reply" in
      [yY]*) dc down -v; echo "Removed containers and volumes." ;;
      *) echo "Cancelled." ;;
    esac
    ;;
  logs)    dc logs -f "${2:-app}" ;;
  shell)   dc exec app sh ;;
  psql)    dc exec db psql -U "${POSTGRES_USER:-kickboard}" -d "${POSTGRES_DB:-kickboard}" ;;
  migrate)
    read -r -p "Migration name (e.g. add_match_venue): " name
    [ -n "$name" ] || { echo "A name is required." >&2; exit 1; }
    dc exec app npx prisma migrate dev --name "$name"
    ;;
  seed)    dc exec app node scripts/seed-demo.mjs ;;
  test)
    dc exec app npm run test:formats
    echo
    echo "The engine suite wipes the dev database. Re-seed afterwards with:"
    echo "  ./scripts/dev.sh seed"
    echo
    dc exec -e ALLOW_DESTRUCTIVE_TEST=1 app npm run test:engine
    ;;
  prod)
    docker compose -f compose.prod.yaml up -d --build
    echo "Production build running at http://localhost:${PROD_APP_PORT:-3001}"
    echo "(separate stack and database from dev — stop it with: ./scripts/dev.sh prod-down)"
    ;;
  prod-down)
    docker compose -f compose.prod.yaml down
    ;;
  *)
    sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
