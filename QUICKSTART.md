# 🚀 Buglyze Quick Start Guide

Get up and running with Buglyze in less than 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Git installed
- OpenAI API key (for AI analysis features)

## Installation Steps

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/buglyze.git
cd buglyze

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```env
OPENAI_API_KEY="sk-your-key-here"
```

### 3. Set Up Database (Optional for MVP)

For MVP testing, you can skip database setup. For full features:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## Your First Test

### Via Dashboard

1. Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
2. Enter a URL (e.g., `https://example.com`)
3. Click "Run Test"
4. Watch the results appear!

### Via API

```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "device": "desktop"
  }'
```

## Docker Quick Start

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Common Issues

### Playwright Installation Fails

```bash
# Install system dependencies (Linux)
npx playwright install-deps chromium
```

### Port 3000 Already in Use

```bash
# Use a different port
PORT=3001 npm run dev
```

### OpenAI API Key Not Working

- Ensure your key starts with `sk-`
- Check you have API credits available
- Verify the key is set in `.env`

## Next Steps

- Read the [README.md](README.md) for detailed documentation
- Explore the [API Documentation](docs/API.md)
- Join our [Discord Community](https://discord.gg/buglyze)
- Check out [Advanced Features](docs/ADVANCED.md)

## Need Help?

- 📧 Email: support@buglyze.com
- 💬 Discord: [Join our community](https://discord.gg/buglyze)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/buglyze/issues)

Happy Testing! 🎉
