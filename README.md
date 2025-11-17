# 🚀 BUGLYZE - Enterprise-Grade Autonomous AI Testing Platform

**Let AI test your website before your users do.**

Buglyze is a comprehensive, AI-powered autonomous website testing and quality assurance platform that combines cutting-edge AI vision models, browser automation, and intelligent analysis engines to deliver enterprise-grade testing capabilities.

![Buglyze Platform](./docs/images/buglyze-banner.png)

## 🌟 Key Features

### MVP Features (Phase 1)
- ✅ **URL-Based Test Initiation** - Single-click test execution with zero configuration
- ✅ **Intelligent Page Exploration** - AI-driven navigation powered by Playwright
- ✅ **Visual Testing** - Full-page screenshots and element-level capture
- ✅ **Performance Profiling** - Core Web Vitals (LCP, FID, CLS, INP, TTFB)
- ✅ **Error Detection** - JavaScript errors, network failures, broken links
- ✅ **AI-Powered Analysis** - GPT-4 Vision for intelligent issue detection
- ✅ **Test Dashboard** - Historical test runs and trend analysis

### Coming Soon (Phase 2+)
- 🔄 Visual Regression Testing
- ♿ Accessibility Compliance (WCAG 2.1)
- 🔍 SEO Optimization Analysis
- 🔒 Security Assessment
- 🌐 Multi-Device & Browser Testing
- ⏰ Scheduled Monitoring
- 🔗 CI/CD Integration
- 📊 Advanced Reporting

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  Web App (Next.js 14) │  API SDKs  │  CLI Tool                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                   APPLICATION SERVICES LAYER                     │
│  • Test Orchestration  • User Auth  • Analytics  • Billing      │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    WORKER POOL LAYER                            │
│  • Test Runner (Playwright)  • AI Analysis (GPT-4 Vision)       │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA & STORAGE LAYER                         │
│  PostgreSQL  │  MongoDB  │  Redis  │  S3/Object Storage        │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3+
- **UI**: React 18 + Tailwind CSS 3.4
- **State**: Zustand + React Query
- **Components**: shadcn/ui
- **Charts**: Recharts + D3.js

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes
- **Validation**: Zod
- **Authentication**: NextAuth.js

### Testing & Automation
- **Browser Automation**: Playwright
- **AI Analysis**: OpenAI GPT-4 Vision API
- **Performance**: Lighthouse / Web Vitals

### Database & Storage
- **Primary DB**: PostgreSQL (Prisma ORM)
- **Documents**: MongoDB
- **Cache**: Redis
- **Storage**: AWS S3 / Local Storage

## 📦 Installation

### Prerequisites
- Node.js 18.17.0 or higher
- PostgreSQL 15+
- Redis 7+ (optional, for production)
- OpenAI API key (for AI analysis)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/buglyze.git
cd buglyze
```

2. **Install dependencies**
```bash
npm install
```

3. **Install Playwright browsers**
```bash
npx playwright install chromium
```

4. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/buglyze"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OpenAI API (for AI analysis)
OPENAI_API_KEY="sk-your-openai-api-key"

# Optional: Stripe for billing
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

5. **Set up the database**
```bash
npx prisma generate
npx prisma db push
```

6. **Run the development server**
```bash
npm run dev
```

7. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Usage

### Running a Test via API

```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "device": "desktop",
    "testTypes": ["performance", "accessibility", "seo", "security"],
    "timeout": 60000,
    "maxDepth": 3,
    "maxPages": 20
  }'
```

### Running a Test via Dashboard

1. Navigate to the Dashboard
2. Enter a URL in the "Run a Quick Test" section
3. Click "Run Test"
4. View results in real-time

### Test Configuration Options

```typescript
{
  url: string                    // Required: URL to test
  projectId?: string             // Optional: Project ID
  device?: 'desktop' | 'mobile' | 'tablet'  // Default: 'desktop'
  viewport?: {
    width: number                // Default: 1920
    height: number               // Default: 1080
  }
  testTypes?: Array<             // Default: all types
    'performance' |
    'accessibility' |
    'seo' |
    'security' |
    'visual' |
    'functional'
  >
  timeout?: number               // Default: 60000 (60 seconds)
  maxDepth?: number              // Default: 3 (exploration depth)
  maxPages?: number              // Default: 20 (max pages to explore)
  authentication?: {
    type: 'cookie' | 'header' | 'form'
    credentials?: Record<string, string>
    sessionState?: string
  }
}
```

## 📊 Test Results

### Result Structure

```typescript
{
  summary: {
    totalIssues: number
    criticalIssues: number
    highIssues: number
    mediumIssues: number
    lowIssues: number
    pagesExplored: number
    testsExecuted: number
    overallScore: number  // 0-100
  },
  performance: {
    metrics: {
      lcp: number          // Largest Contentful Paint (ms)
      fid: number          // First Input Delay (ms)
      cls: number          // Cumulative Layout Shift
      inp: number          // Interaction to Next Paint (ms)
      fcp: number          // First Contentful Paint (ms)
      tti: number          // Time to Interactive (ms)
      tbt: number          // Total Blocking Time (ms)
      speedIndex: number
      ttfb: number         // Time to First Byte (ms)
    }
  },
  errors: {
    javascript: Array<JavaScriptError>
    network: Array<NetworkError>
    console: Array<ConsoleMessage>
  },
  navigation: {
    pages: Array<PageInfo>
    coverage: number  // Percentage
  }
}
```

## 🔒 Security

Buglyze takes security seriously:

- ✅ All data encrypted at rest and in transit
- ✅ Secure credential storage with bcrypt
- ✅ Rate limiting on all API endpoints
- ✅ Input validation with Zod schemas
- ✅ SQL injection prevention with Prisma
- ✅ XSS protection with Content Security Policy
- ✅ Regular security audits

## 📈 Performance

- **API Response Time**: p95 < 300ms
- **Test Execution**: 2-10 minutes (varies by site complexity)
- **Dashboard Load**: < 1 second
- **Real-time Updates**: < 100ms latency

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

- 📧 Email: support@buglyze.com
- 💬 Discord: [Join our community](https://discord.gg/buglyze)
- 📖 Documentation: [docs.buglyze.com](https://docs.buglyze.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/buglyze/issues)

## 🗺️ Roadmap

### Q1 2025
- [x] MVP Launch
- [ ] Visual Regression Testing
- [ ] Accessibility Compliance (WCAG 2.1)
- [ ] Basic CI/CD Integration

### Q2 2025
- [ ] Multi-Browser Testing
- [ ] Scheduled Monitoring
- [ ] Advanced Reporting (PDF/HTML)
- [ ] Slack/Teams Integration

### Q3 2025
- [ ] Enterprise Features (SSO, RBAC)
- [ ] On-Premise Deployment
- [ ] API Rate Limiting Tiers
- [ ] Custom Integrations

### Q4 2025
- [ ] Mobile App Testing
- [ ] API Testing Capabilities
- [ ] Load/Stress Testing
- [ ] Predictive Analytics

## 📜 Credits

Built with ❤️ by the Buglyze Team

### Key Technologies
- [Next.js](https://nextjs.org/)
- [Playwright](https://playwright.dev/)
- [OpenAI](https://openai.com/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Buglyze** - Ship faster. Break less. 🚀

