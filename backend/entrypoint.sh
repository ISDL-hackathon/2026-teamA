#!/bin/bash
set -e

# データベース準備完了を待機
until PGPASSWORD=$DATABASE_PASSWORD psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c '\q'; do
  echo 'Waiting for postgres...'
  sleep 1
done

echo 'PostgreSQL started'
echo 'Checking and installing gems...'
bundle install

if [ ! -d /app/node_modules/.bin ]; then
  echo 'Installing node packages...'
  npm ci
fi

echo 'Building CSS...'
npm run build:css

# マイグレーション実行
bundle exec rails db:create --quiet 2>/dev/null || true
bundle exec rails db:migrate --quiet

# サーバーの競合を防ぐため過去の pid ファイルが残っていたら削除する処理
if [ -f /app/tmp/pids/server.pid ]; then
  rm -f /app/tmp/pids/server.pid
fi

echo 'Starting Rails server...'
exec bundle exec rails s -b '0.0.0.0'
