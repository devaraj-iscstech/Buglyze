# 🚀 BUGLYZE - Enterprise-Grade Autonomous AI Testing Platform

**Let AI test your website before your users do.**

Buglyze is a comprehensive, AI-powered autonomous website testing and quality assurance platform that combines cutting-edge AI vision models, browser automation, and intelligent analysis engines to deliver enterprise-grade testing capabilities.

![Buglyze Platform](./docs/images/buglyze-banner.png)

## 🌟 Key Features

### Core Features (MVP)
- ✅ **URL-Based Test Initiation** - Single-click test execution with zero configuration
- ✅ **Intelligent Page Exploration** - AI-driven navigation powered by Playwright
- ✅ **Visual Testing** - Full-page screenshots and element-level capture
- ✅ **Performance Profiling** - Core Web Vitals (LCP, FID, CLS, INP, TTFB)
- ✅ **Error Detection** - JavaScript errors, network failures, broken links
- ✅ **AI-Powered Analysis** - Gemini 2.5 Flash for intelligent issue detection
- ✅ **Accessibility Compliance** - WCAG 2.1 A/AA/AAA testing with axe-core
- ✅ **SEO Analysis** - Comprehensive SEO optimization with structured data
- ✅ **Security Assessment** - OWASP-aligned security scanning
- ✅ **Test Dashboard** - Historical test runs and trend analysis

### Q1-Q4 Features (Completed)
- ✅ **Visual Regression Testing** - Pixel-perfect baseline comparison with diff detection
- ✅ **Multi-Browser Testing** - Chrome, Firefox, Safari (WebKit), Edge support
- ✅ **Scheduled Monitoring** - Cron-based automated testing with alerts
- ✅ **Advanced Reporting** - Professional PDF and HTML reports
- ✅ **Slack/Teams Integration** - Real-time notifications and alerts
- ✅ **Enterprise Authentication** - NextAuth.js with SSO (Google, GitHub, Azure AD)
- ✅ **RBAC System** - Role-based access control with 13 permissions
- ✅ **API Rate Limiting** - Tier-based rate limiting (Free to Enterprise)
- ✅ **Mobile App Testing** - Device emulation and PWA testing
- ✅ **API Endpoint Testing** - REST API testing with assertions
- ✅ **Load/Stress Testing** - Performance testing with RPS measurement
- ✅ **Predictive Analytics** - ML-based trend analysis and issue prediction

### Coming Soon
- 🔗 CI/CD Integration (GitHub Actions, GitLab CI)
- 🎯 Custom Test Scripts (Playwright Codegen)
- 📱 Mobile Native App Testing (iOS/Android)
- 🎨 Advanced Visual Regression (ML-based)
- 💰 Performance Budgeting

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
- **Browser Automation**: Playwright (Multi-browser support)
- **AI Analysis**: Google Gemini 2.5 Flash API
- **Accessibility**: axe-core (WCAG 2.1)
- **Performance**: Lighthouse / Web Vitals
- **SEO**: Cheerio + Custom analyzers
- **Security**: Custom OWASP-aligned scanners
- **Visual Regression**: pngjs + Sharp
- **Load Testing**: Custom load testing engine

### Database & Storage
- **Primary DB**: PostgreSQL (Prisma ORM)
- **Documents**: MongoDB
- **Cache**: Redis
- **Storage**: AWS S3 / Local Storage

## 📦 Installation

### Prerequisites
- Node.js 18.17.0 or higher
- PostgreSQL 15+
- Redis 7+ (for rate limiting and caching)
- Google Gemini API key (for AI analysis)

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

# Gemini API (for AI analysis) - PRIMARY
GEMINI_API_KEY="your-gemini-api-key-here"

# OAuth Providers (for SSO)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Redis (for rate limiting)
REDIS_URL="redis://localhost:6379"

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

### Q1 2025 ✅ COMPLETED
- [x] MVP Launch
- [x] Visual Regression Testing
- [x] Accessibility Compliance (WCAG 2.1 A/AA/AAA)
- [x] SEO Analysis
- [x] Security Assessment
- [x] Gemini AI Integration

### Q2 2025 ✅ COMPLETED
- [x] Multi-Browser Testing (Chrome, Firefox, Safari, Edge)
- [x] Scheduled Monitoring (Cron-based)
- [x] Advanced Reporting (PDF/HTML)
- [x] Slack/Teams Integration

### Q3 2025 ✅ COMPLETED
- [x] Enterprise Authentication (NextAuth.js with SSO)
- [x] RBAC (Role-Based Access Control)
- [x] API Rate Limiting Tiers (5 tiers: Free to Enterprise)

### Q4 2025 ✅ COMPLETED
- [x] Mobile App Testing (Device Emulation & PWA)
- [x] API Endpoint Testing (REST with Assertions)
- [x] Load/Stress Testing (Performance testing)
- [x] Predictive Analytics (ML-based trend analysis)

### Future Roadmap
- [ ] CI/CD Integration (GitHub Actions, GitLab CI, Jenkins)
- [ ] Custom Test Scripts (Playwright Codegen)
- [ ] Mobile Native App Testing (iOS/Android with Appium)
- [ ] Advanced Visual Regression (ML-based comparison)
- [ ] Performance Budgeting
- [ ] On-Premise Deployment Options
- [ ] GraphQL API Testing
- [ ] Contract Testing
- [ ] Synthetic Monitoring

## 📜 Credits

Built with ❤️ by the Buglyze Team

### Key Technologies
- [Next.js](https://nextjs.org/) - React framework
- [Playwright](https://playwright.dev/) - Browser automation
- [Google Gemini](https://ai.google.dev/) - AI-powered analysis
- [Prisma](https://www.prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [axe-core](https://github.com/dequelabs/axe-core) - Accessibility testing
- [Sharp](https://sharp.pixelplumbing.com/) - Image processing
- [Redis](https://redis.io/) - Caching and rate limiting

---

**Buglyze** - Ship faster. Break less. 🚀

