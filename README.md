# Ticketless Entry System

チケットレス入場管理システム - QRコードベースの入場管理とリアルタイムダッシュボード

## Features

- 🎫 QRコード自動生成・メール配信
- 📱 スマホカメラでのQRスキャン
- 📊 リアルタイムダッシュボード
- ✅ 重複入場防止
- 🔐 SHA-256トークンハッシュ化

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **Deployment**: Vercel

## Setup

### 1. GAS Backend Setup

1. Create a Google Sheet
2. Copy `gas/Code.gs` to Apps Script
3. Deploy as Web App
4. Copy the deployment URL

### 2. Frontend Configuration

```bash
# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_GAS_URL=YOUR_GAS_URL" > .env.local

# Run development server
npm run dev
```

### 3. Deploy to Vercel

```bash
vercel
```

## Environment Variables

- `NEXT_PUBLIC_GAS_URL`: Google Apps Script Web App URL

## License

MIT
