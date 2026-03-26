# ClipSync

PC とスマホ間でクリップボード内容をリアルタイムに双方向同期する Web アプリ。

## 機能

- **リアルタイム同期** — Supabase Realtime で複数端末間を即時同期
- **E2E 暗号化** — PBKDF2 + AES-GCM によるクライアントサイド暗号化（サーバーには暗号文のみ保存）
- **ピン留め** — 重要なクリップを上部に固定表示
- **検索** — クリップ内容をリアルタイムフィルタリング
- **URL 判定** — URL を自動検出しリンクとして表示
- **ブラウザ通知** — 他端末からクリップが届いたときに通知
- **PWA 対応** — スマホのホーム画面に追加してネイティブアプリ風に利用可能

## 技術スタック

- **フロントエンド**: Vue 3 (Composition API) + TypeScript
- **UI**: Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL + Realtime + Auth)
- **ホスティング**: Vercel
- **PWA**: vite-plugin-pwa

## セットアップ

### 1. 依存関係インストール

```bash
npm install
```

### 2. 環境変数設定

`.env` ファイルをプロジェクトルートに作成:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`.env` は `.gitignore` に追加してください。

### 3. 開発サーバー起動

```bash
npm run dev
```

### 4. ビルド

```bash
npm run build
```

## Supabase セットアップ

### スキーマ作成

Supabase ダッシュボードの **SQL Editor** で以下を実行してください:

```sql
-- clips テーブル
CREATE TABLE clips (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content      TEXT        NOT NULL,
  device_name  TEXT        DEFAULT 'Unknown',
  content_type TEXT        DEFAULT 'text' CHECK (content_type IN ('text', 'url')),
  pinned       BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- インデックス: ピン留め優先・日時降順
CREATE INDEX idx_clips_user_created ON clips (user_id, pinned DESC, created_at DESC);

-- 古いクリップを自動削除（ピン留め以外の直近 50 件を保持）
CREATE OR REPLACE FUNCTION cleanup_old_clips()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM clips
  WHERE user_id = NEW.user_id
    AND pinned = false
    AND id NOT IN (
      SELECT id FROM clips
      WHERE user_id = NEW.user_id
        AND pinned = false
      ORDER BY created_at DESC
      LIMIT 50
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_old_clips
  AFTER INSERT ON clips
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_clips();

-- Row Level Security
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clips"
  ON clips FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clips"
  ON clips FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clips"
  ON clips FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clips"
  ON clips FOR DELETE USING (auth.uid() = user_id);
```

### Realtime 有効化

**Database → Replication** で `clips` テーブルの Realtime を ON にしてください。

### 認証設定

**Authentication → Providers** で以下を有効化してください:

- **Email (Magic Link)**

## E2E 暗号化について

暗号化を有効にするとパスフレーズから鍵を導出し、クリップ内容を端末上で暗号化してから Supabase に送信します。Supabase には暗号文（`enc:...` 形式）しか保存されません。

- 鍵はパスフレーズから **PBKDF2 (SHA-256, 100,000 iterations)** で導出
- 暗号化は **AES-GCM 256-bit**
- 鍵はセッションストレージに保持され、タブを閉じると消去されます
- 別端末でも同じパスフレーズを入力すると復号できます

## デプロイ (Vercel)

```bash
npm run build
vercel
```

Vercel ダッシュボードで以下の環境変数を設定してください:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
