# HooFoot Viewer

A TV remote-compatible football match viewer that works with Vercel serverless functions to bypass CORS restrictions.

## Features

- 🏈 View football matches without CORS issues
- 📺 TV remote compatible navigation
- 🎥 Video streaming support
- 🚀 Serverless deployment on Vercel
- ⚡ Fast performance without heavy dependencies

## Deployment

### Option 1: Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```

3. **Follow the prompts** to connect your GitHub account and deploy

### Option 2: Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start local development:**
   ```bash
   npm start
   ```

3. **Open** `http://localhost:3000` in your browser

## How It Works

- **Frontend**: HTML/CSS/JavaScript with TV remote navigation
- **Backend**: Vercel serverless function (`/api/proxy`) that handles:
  - HTML page fetching with enhanced headers
  - M3U8 playlist rewriting
  - Video segment streaming
  - CORS bypass using proper HTTP headers

## Key Benefits Over Puppeteer

- ✅ **No heavy dependencies** - No browser automation
- ✅ **Faster startup** - Instant serverless execution
- ✅ **Better scalability** - Auto-scaling with Vercel
- ✅ **Cost effective** - Pay only for what you use
- ✅ **Easier maintenance** - No browser version management

## Navigation

- **Arrow Keys**: Navigate between match cards
- **Enter/Space**: Select a match to view
- **Escape/Backspace**: Close video modal
- **Tab**: Navigate between interactive elements

## Environment Variables

The app automatically detects the deployment environment:
- **Local**: Uses `http://localhost:3000`
- **Vercel**: Uses `process.env.VERCEL_URL`

## Troubleshooting

If you encounter CORS issues:
1. The serverless function automatically retries with different headers
2. Check that your Vercel deployment is working correctly
3. Verify the target website is accessible

## License

MIT License 