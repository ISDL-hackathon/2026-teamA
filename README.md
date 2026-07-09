# TeamA

# 開発環境セットアップ

## 前提条件

- Docker Desktop をインストール済み
- Git をインストール済み

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/ISDL-hackathon/2026-teamA.git
cd 2026-teamA
```

### 2. 環境変数ファイルをコピー

```bash
cp .env.example .env
cp local-client/.env.example local-client/.env

```

`.env` を編集して、各変数を設定：

```bash
# macOS / Linux
vim .env

# Windows (PowerShell)
notepad .env

# または任意のエディタで開く
code .env
```

### 3.entrypoint.shファイルの右下の`CRLF`を`LF`に変更されているか確認

<img width="137" height="56" alt="Image" src="https://github.com/user-attachments/assets/840b786c-af36-48aa-bff5-2f6ca670b513" />

### 4. Docker で起動

```bash
docker-compose up --build
```

### 5. ブラウザでアクセス

```
http://localhost:3000
```

## よく使うコマンド

```bash
# コンテナ起動
docker-compose up -d

# コンテナ停止
docker-compose down

# ログ確認
docker-compose logs -f web

# Rails コンソール
docker-compose exec web bundle exec rails console

# マイグレーション実行
docker-compose exec web bundle exec rails db:migrate
```
# github 使用方法

## Issues 作成

## ブランチ切る

```bash
git branch
```

##  今自分がどのブランチにいるか
```bash
git branch
```
## ファイル変更完了後コミット

## プッシュ
```bash
git push
```

## プルリク出す
※mergeはレビューしてもらってするので，自分ではしない







## トラブルシューティング

**ポート 3000 が既に使用されている場合:**

```bash
docker-compose down
lsof -ti:3000 | xargs kill -9
docker-compose up
```

**データベースエラーが発生した場合:**

```bash
docker-compose down -v
docker-compose up --build
```
