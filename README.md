# ClipSync

PC とスマホ間でクリップボード内容をリアルタイムに双方向同期する Web アプリ。

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

### 3. 開発サーバー起動

```bash
npm run dev
```

### 4. ビルド

```bash
npm run build
```

## Supabase セットアップ

Supabase ダッシュボードの SQL Editor で以下を実行してください:

```sql
CREATE TABLE clips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  device_name TEXT DEFAULT 'Unknown',
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'url')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clips_user_created ON clips (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION cleanup_old_clips()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM clips
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM clips
    WHERE user_id = NEW.user_id
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

ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clips" ON clips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clips" ON clips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own clips" ON clips FOR DELETE USING (auth.uid() = user_id);
```

その後、**Database → Replication** で `clips` テーブルの Realtime を ON にしてください。

## デプロイ (Vercel)

Vercel ダッシュボードで以下の環境変数を設定してください:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
