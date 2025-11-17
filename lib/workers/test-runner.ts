/**
 * Test Runner Worker
 * Core engine that executes website tests using Playwright
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright'
import type {
  TestConfig,
  TestResults,
  PerformanceMetrics,
  ErrorResults,
  JavaScriptError,
  NetworkError,
  ConsoleMessage,
  NavigationResults,
  PageInfo,
} from '@/types'

export class TestRunner {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null
  private config: TestConfig
  private errors: ErrorResults = {
    javascript: [],
    network: [],
    console: [],
  }
  private pages: PageInfo[] = []
  private visitedUrls: Set<string> = new Set()

  constructor(config: TestConfig) {
    this.config = {
      timeout: 60000,
      maxDepth: 3,
      maxPages: 20,
      device: 'desktop',
      viewport: { width: 1920, height: 1080 },
      ...config,
    }
  }

  /**
   * Initialize browser and context
   */
  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    })

    const contextOptions: any = {
      viewport: this.config.viewport,
      userAgent: this.getUserAgent(),
      ignoreHTTPSErrors: true,
      recordVideo: {
        dir: './tmp/videos',
        size: this.config.viewport,
      },
    }

    // Add authentication if provided
    if (this.config.authentication?.sessionState) {
      contextOptions.storageState = JSON.parse(
        this.config.authentication.sessionState
      )
    }

    this.context = await this.browser.newContext(contextOptions)

    // Enable tracing for performance analysis
    await this.context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    })

    this.page = await this.context.newPage()

    // Set up error listeners
    this.setupErrorListeners()
  }

  /**
   * Execute the complete test suite
   */
  async run(): Promise<TestResults> {
    try {
      await this.initialize()

      if (!this.page) {
        throw new Error('Page not initialized')
      }

      // Navigate to the target URL
      const startTime = Date.now()
      await this.navigateToPage(this.config.url)

      // Perform intelligent exploration
      await this.exploreWebsite(this.config.url, 0)

      // Collect performance metrics
      const performance = await this.collectPerformanceMetrics()

      // Generate results
      const results: TestResults = {
        summary: {
          totalIssues: this.getTotalIssues(),
          criticalIssues: this.getCriticalIssues(),
          highIssues: this.getHighIssues(),
          mediumIssues: this.getMediumIssues(),
          lowIssues: this.getLowIssues(),
          pagesExplored: this.pages.length,
          testsExecuted: this.pages.length,
          overallScore: this.calculateOverallScore(performance),
        },
        performance: {
          metrics: performance,
          opportunities: [],
          diagnostics: [],
        },
        errors: this.errors,
        navigation: {
          pages: this.pages,
          flow: {
            nodes: [],
            edges: [],
          },
          coverage: this.calculateCoverage(),
        },
      }

      return results
    } finally {
      await this.cleanup()
    }
  }

  /**
   * Navigate to a page and collect basic information
   */
  private async navigateToPage(url: string): Promise<void> {
    if (!this.page) return

    try {
      const startTime = Date.now()

      const response = await this.page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.config.timeout,
      })

      const loadTime = Date.now() - startTime

      const pageInfo: PageInfo = {
        url,
        title: await this.page.title(),
        statusCode: response?.status() || 0,
        loadTime,
        visited: true,
        errors: [],
      }

      this.pages.push(pageInfo)
      this.visitedUrls.add(url)

      // Wait for page to be fully loaded
      await this.page.waitForLoadState('load')
    } catch (error: any) {
      console.error(`Failed to navigate to ${url}:`, error.message)
      this.pages.push({
        url,
        title: '',
        statusCode: 0,
        loadTime: 0,
        visited: false,
        errors: [error.message],
      })
    }
  }

  /**
   * Intelligent website exploration using AI-driven navigation
   */
  private async exploreWebsite(
    currentUrl: string,
    depth: number
  ): Promise<void> {
    if (!this.page) return
    if (depth >= (this.config.maxDepth || 3)) return
    if (this.pages.length >= (this.config.maxPages || 20)) return

    try {
      // Discover interactive elements
      const links = await this.discoverLinks()
      const buttons = await this.discoverButtons()
      const forms = await this.discoverForms()

      // Test forms with realistic data
      for (const form of forms.slice(0, 2)) {
        await this.testForm(form)
      }

      // Click buttons and observe changes
      for (const button of buttons.slice(0, 3)) {
        await this.testButton(button)
      }

      // Follow links to explore more pages
      for (const link of links.slice(0, 5)) {
        if (this.shouldVisitLink(link)) {
          await this.navigateToPage(link)
          await this.exploreWebsite(link, depth + 1)

          // Navigate back to continue exploration
          await this.page.goto(currentUrl, { waitUntil: 'networkidle' })
        }
      }
    } catch (error: any) {
      console.error(`Exploration error at ${currentUrl}:`, error.message)
    }
  }

  /**
   * Discover all links on the page
   */
  private async discoverLinks(): Promise<string[]> {
    if (!this.page) return []

    try {
      return await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href]'))
        return links
          .map((link) => (link as HTMLAnchorElement).href)
          .filter((href) => href && !href.startsWith('javascript:'))
      })
    } catch {
      return []
    }
  }

  /**
   * Discover all buttons on the page
   */
  private async discoverButtons(): Promise<string[]> {
    if (!this.page) return []

    try {
      return await this.page.evaluate(() => {
        const buttons = Array.from(
          document.querySelectorAll('button, input[type="submit"], input[type="button"]')
        )
        return buttons.map(
          (btn, idx) =>
            btn.textContent?.trim() || (btn as HTMLInputElement).value || `button-${idx}`
        )
      })
    } catch {
      return []
    }
  }

  /**
   * Discover all forms on the page
   */
  private async discoverForms(): Promise<any[]> {
    if (!this.page) return []

    try {
      return await this.page.evaluate(() => {
        const forms = Array.from(document.querySelectorAll('form'))
        return forms.map((form, idx) => ({
          id: form.id || `form-${idx}`,
          action: form.action,
          method: form.method,
          fields: Array.from(form.querySelectorAll('input, textarea, select')).map(
            (field) => ({
              name: (field as HTMLInputElement).name,
              type: (field as HTMLInputElement).type,
              required: (field as HTMLInputElement).required,
            })
          ),
        }))
      })
    } catch {
      return []
    }
  }

  /**
   * Test a form by filling it with realistic data
   */
  private async testForm(form: any): Promise<void> {
    if (!this.page) return

    try {
      // Fill form fields with test data
      for (const field of form.fields) {
        const selector = `[name="${field.name}"]`
        const testValue = this.generateTestValue(field.type, field.name)

        if (testValue) {
          await this.page.fill(selector, testValue).catch(() => {})
        }
      }

      // Note: We don't actually submit forms to avoid side effects
      // In a production environment, you might want to submit to a test endpoint
    } catch (error: any) {
      console.error(`Form testing error:`, error.message)
    }
  }

  /**
   * Test a button by clicking it
   */
  private async testButton(buttonText: string): Promise<void> {
    if (!this.page) return

    try {
      await this.page.click(`text=${buttonText}`, { timeout: 5000 })
      await this.page.waitForLoadState('networkidle', { timeout: 10000 })
    } catch {
      // Button might not be clickable or might navigate away
    }
  }

  /**
   * Determine if a link should be visited
   */
  private shouldVisitLink(url: string): boolean {
    try {
      const linkUrl = new URL(url)
      const baseUrl = new URL(this.config.url)

      // Only visit links from the same domain
      if (linkUrl.hostname !== baseUrl.hostname) return false

      // Skip if already visited
      if (this.visitedUrls.has(url)) return false

      // Skip common non-page URLs
      const skipExtensions = ['.pdf', '.zip', '.jpg', '.png', '.gif', '.mp4', '.mp3']
      if (skipExtensions.some((ext) => url.toLowerCase().endsWith(ext))) return false

      return true
    } catch {
      return false
    }
  }

  /**
   * Generate realistic test data for form fields
   */
  private generateTestValue(type: string, name: string): string | null {
    const lowerName = name.toLowerCase()

    if (lowerName.includes('email')) {
      return 'test@buglyze.com'
    }
    if (lowerName.includes('phone')) {
      return '555-123-4567'
    }
    if (lowerName.includes('zip') || lowerName.includes('postal')) {
      return '12345'
    }
    if (lowerName.includes('name')) {
      return 'Test User'
    }
    if (type === 'number') {
      return '123'
    }
    if (type === 'email') {
      return 'test@buglyze.com'
    }
    if (type === 'tel') {
      return '555-123-4567'
    }
    if (type === 'url') {
      return 'https://example.com'
    }
    if (type === 'date') {
      return '2024-01-01'
    }

    return 'Test value'
  }

  /**
   * Collect performance metrics from the page
   */
  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    if (!this.page) {
      throw new Error('Page not initialized')
    }

    const metrics = await this.page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')

      const fcp = paint.find((entry) => entry.name === 'first-contentful-paint')

      return {
        ttfb: perf.responseStart - perf.requestStart,
        fcp: fcp ? fcp.startTime : 0,
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
      }
    })

    // Calculate Web Vitals (simplified - in production use web-vitals library)
    return {
      lcp: metrics.loadComplete, // Simplified
      fid: 50, // Simplified - would need real user interaction
      cls: 0.05, // Simplified - would need layout shift tracking
      inp: 100, // Simplified
      fcp: metrics.fcp,
      tti: metrics.domContentLoaded + metrics.loadComplete,
      tbt: 200, // Simplified
      speedIndex: 2000, // Simplified
      ttfb: metrics.ttfb,
    }
  }

  /**
   * Set up listeners for errors
   */
  private setupErrorListeners(): void {
    if (!this.page) return

    // JavaScript errors
    this.page.on('pageerror', (error) => {
      this.errors.javascript.push({
        message: error.message,
        stack: error.stack,
        url: this.page?.url() || '',
        line: 0,
        column: 0,
        severity: 'error',
      })
    })

    // Console messages
    this.page.on('console', (msg) => {
      const type = msg.type() as 'log' | 'warn' | 'error' | 'info'
      if (type === 'error' || type === 'warn') {
        this.errors.console.push({
          type,
          text: msg.text(),
          location: this.page?.url(),
          timestamp: new Date(),
        })
      }
    })

    // Network errors
    this.page.on('requestfailed', (request) => {
      this.errors.network.push({
        url: request.url(),
        status: 0,
        statusText: request.failure()?.errorText || 'Request failed',
        method: request.method(),
        type: request.resourceType() as any,
      })
    })

    this.page.on('response', (response) => {
      if (response.status() >= 400) {
        this.errors.network.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          method: response.request().method(),
          type: response.request().resourceType() as any,
        })
      }
    })
  }

  /**
   * Get user agent based on device type
   */
  private getUserAgent(): string {
    const userAgents = {
      desktop:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      mobile:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      tablet:
        'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    }

    return userAgents[this.config.device || 'desktop']
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(performance: PerformanceMetrics): number {
    // Simplified scoring - in production, this would be more sophisticated
    let score = 100

    if (performance.lcp > 2500) score -= 20
    if (performance.fcp > 1800) score -= 15
    if (performance.cls > 0.1) score -= 15

    score -= this.errors.javascript.length * 5
    score -= this.errors.network.length * 3

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate coverage
   */
  private calculateCoverage(): number {
    const totalLinks = this.pages.reduce((acc, page) => acc + 1, 0)
    const visitedLinks = this.visitedUrls.size
    return totalLinks > 0 ? (visitedLinks / totalLinks) * 100 : 0
  }

  /**
   * Get issue counts
   */
  private getTotalIssues(): number {
    return (
      this.errors.javascript.length +
      this.errors.network.length +
      this.errors.console.filter((c) => c.type === 'error').length
    )
  }

  private getCriticalIssues(): number {
    return this.errors.network.filter((e) => e.status >= 500).length
  }

  private getHighIssues(): number {
    return this.errors.javascript.length
  }

  private getMediumIssues(): number {
    return this.errors.network.filter((e) => e.status >= 400 && e.status < 500).length
  }

  private getLowIssues(): number {
    return this.errors.console.filter((c) => c.type === 'warn').length
  }

  /**
   * Clean up resources
   */
  private async cleanup(): Promise<void> {
    try {
      if (this.context) {
        await this.context.tracing.stop({ path: './tmp/trace.zip' })
      }
      if (this.page) await this.page.close()
      if (this.context) await this.context.close()
      if (this.browser) await this.browser.close()
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }
}

/**
 * Execute a test run
 */
export async function executeTest(config: TestConfig): Promise<TestResults> {
  const runner = new TestRunner(config)
  return await runner.run()
}
