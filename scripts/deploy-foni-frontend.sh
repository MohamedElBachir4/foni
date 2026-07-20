#!/usr/bin/env bash
# نشر آمن للواجهة — بناء أولاً ثم إعادة تشغيل PM2 + فحص صحة
set -euo pipefail

APP_DIR="${FONI_FRONTEND_DIR:-/root/foni}"
PM2_APP="${FONI_PM2_NAME:-foni-frontend}"
BRANCH="${FONI_GIT_BRANCH:-main}"
REMOTE="${FONI_GIT_REMOTE:-origin}"
HEALTH_URL="${FONI_HEALTH_URL:-http://127.0.0.1:3000/}"
MAX_WAIT="${FONI_HEALTH_WAIT_SEC:-45}"

echo "[deploy-frontend] dir: $APP_DIR"
cd "$APP_DIR"

if [ -f ".env.local" ]; then
  echo "[deploy-frontend] .env.local present (NEXT_SERVER_ACTIONS_ENCRYPTION_KEY recommended)"
elif [ -f ".env" ]; then
  echo "[deploy-frontend] .env present"
else
  echo "[deploy-frontend] WARN: no .env.local — add NEXT_SERVER_ACTIONS_ENCRYPTION_KEY for stable Server Actions"
fi

echo "[deploy-frontend] git pull $REMOTE/$BRANCH"
git fetch "$REMOTE"
git reset --hard "$REMOTE/$BRANCH"

echo "[deploy-frontend] npm install"
npm install

echo "[deploy-frontend] npm run build"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
npm run build

echo "[deploy-frontend] pm2 reload $PM2_APP (graceful)"
if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  pm2 reload "$PM2_APP" --update-env
else
  pm2 start npm --name "$PM2_APP" -- start
fi
pm2 save

echo "[deploy-frontend] health check: $HEALTH_URL"
deadline=$((SECONDS + MAX_WAIT))
while [ "$SECONDS" -lt "$deadline" ]; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" || true)"
  if [ "$code" = "200" ]; then
    echo "[deploy-frontend] OK HTTP $code"
    pm2 ls
    exit 0
  fi
  echo "[deploy-frontend] waiting... HTTP $code"
  sleep 2
done

echo "[deploy-frontend] ERROR: health check failed after ${MAX_WAIT}s"
pm2 logs "$PM2_APP" --lines 40 --nostream || true
exit 1
