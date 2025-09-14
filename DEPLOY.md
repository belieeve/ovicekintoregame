# デプロイガイド 🚀

## GitHub Pages でのデプロイ

### 1. GitHubリポジトリ作成・アップロード

```bash
# リポジトリを初期化
git init
git add .
git commit -m "Initial commit: 音楽ゲーム"

# GitHubリポジトリにプッシュ
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. GitHub Pages設定

1. GitHubリポジトリ → **Settings** → **Pages**
2. Source: **GitHub Actions** を選択
3. 自動でデプロイが開始されます

### 3. 音楽ファイル追加方法

#### **方法A: 直接アップロード**
```bash
# assets/audioフォルダに音楽ファイルを追加
git add assets/audio/your_music.mp3
git commit -m "Add music file"
git push
```

#### **方法B: Base64埋め込み**
```bash
# 音楽ファイルをBase64エンコード
base64 -i your_music.mp3 > music_base64.txt

# musicData.jsを編集して埋め込み
# this.musicTracks.track1.data = 'ここにBase64データを貼り付け';
```

### 4. アクセス
`https://YOUR_USERNAME.github.io/YOUR_REPO/`

---

## Vercel でのデプロイ

### 1. Vercelにインポート
1. [Vercel](https://vercel.com) にログイン
2. **New Project** → GitHubリポジトリを選択
3. **Deploy** をクリック

### 2. 自動デプロイ
- `main`ブランチへのプッシュで自動デプロイ
- `vercel.json`で音楽ファイルのCORS設定済み

---

## ローカル開発

### HTTPSサーバー起動（音楽再生に必要）
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

---

## 音楽ファイル制限事項

### **GitHub**
- ファイルサイズ上限: **25MB**
- リポジトリ全体: **1GB**
- 音楽ファイルには適さない場合がある

### **推奨方法**
1. **Base64埋め込み** (小さな音楽ファイル)
2. **外部CDN** (Dropbox、Google Drive等)
3. **専用音楽ホスティング** (SoundCloud API等)

---

## トラブルシューティング

### 音楽が再生されない
1. HTTPSでアクセスしているか確認
2. ブラウザのコンソールでエラーチェック
3. 音楽ファイルのパスが正しいか確認

### CORS エラー
- `vercel.json`のヘッダー設定を確認
- GitHub Pagesの場合は外部音楽ファイルのCORS設定が必要

### ファイルサイズが大きすぎる
- 音楽ファイルを圧縮
- Base64埋め込みではなく外部URLを使用