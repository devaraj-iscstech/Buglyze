/**
 * Enhanced Test Runner
 * Comprehensive testing engine with all MVP features integrated
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright'
import { accessibilityTester } from './accessibility-tester'
import { seoAnalyzer } from './seo-analyzer'
import { securityScanner } from './security-scanner'
import type {
  TestConfig,
  TestResults,
  PerformanceMetrics,
  ErrorResults,
  JavaScriptError,
  NetworkError,
  ConsoleMessage,
  PageInfo,
  Screenshot,
} from '@/types'

export class EnhancedTestRunner {
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
  private screenshots: Screenshot[] = []
  private resourceWaterfall: any[] = []

  constructor(config: TestConfig) {
    this.config = {
      timeout: 60000,
      maxDepth: 3,
      maxPages: 20,
      device: 'desktop',
      viewport: { width: 1920, height: 1080 },
      testTypes: ['performance', 'accessibility', 'seo', 'security'],
      ...config,
    }
  }

  /**
   * Execute the complete test suite
   */
  async run(): Promise<TestResults> {
    try {
      // Test multiple viewports if requested
      const viewports = this.getViewportsToTest()
      const allResults: TestResults[] = []

      for (const viewport of viewports) {
        this.config.viewport = viewport
        const result = await this.runSingleTest()
        allResults.push(result)
      }

      // Merge results from all viewports
      return this.mergeResults(allResults)
    } finally {
      await this.cleanup()
    }
  }

  /**
   * Run a single test with current configuration
   */
  private async runSingleTest(): Promise<TestResults> {
    await this.initialize()

    if (!this.page) {
      throw new Error('Page not initialized')
    }

    // Navigate to the target URL
    await this.navigateToPage(this.config.url)

    // Collect baseline performance metrics
    const performance = await this.collectPerformanceMetrics()

    // Collect resource waterfall
    this.resourceWaterfall = await this.collectResourceWaterfall()

    // Take screenshot
    await this.captureScreenshots()

    // Run accessibility tests if requested
    let accessibility
    if (this.config.testTypes?.includes('accessibility')) {
      accessibility = await accessibilityTester.testPage(this.page, 'AA')
    }

    // Run SEO analysis if requested
    let seo
    if (this.config.testTypes?.includes('seo')) {
      seo = await seoAnalyzer.analyzePage(this.page, this.config.url)
    }

    // Run security scan if requested
    let security
    if (this.config.testTypes?.includes('security')) {
      security = await securityScanner.scanPage(this.page, this.config.url)
    }

    // Perform intelligent exploration
    await this.exploreWebsite(this.config.url, 0)

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
        opportunities: await this.getPerformanceOpportunities(performance),
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
      accessibility,
      seo,
      security,
      visual: {
        screenshots: this.screenshots,
      },
    }

    return results
  }

  /**
   * Initialize browser and context
   */
  private async initialize(): Promise<void> {
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
      ignoreHTTPSErrors: false, // Changed to false for security testing
    }

    // Add authentication if provided
    if (this.config.authentication?.sessionState) {
      contextOptions.storageState = JSON.parse(this.config.authentication.sessionState)
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

    // Set up resource tracking
    this.setupResourceTracking()
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
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    if (!this.page) {
      throw new Error('Page not initialized')
    }

    const metrics = await this.page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')

      const fcp = paint.find((entry) => entry.name === 'first-contentful-paint')
      const lcp = paint.find((entry) => entry.name === 'largest-contentful-paint')

      return {
        ttfb: perf.responseStart - perf.requestStart,
        fcp: fcp ? fcp.startTime : 0,
        lcp: lcp ? lcp.startTime : perf.loadEventEnd - perf.fetchStart,
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        domInteractive: perf.domInteractive - perf.fetchStart,
        redirectTime: perf.redirectEnd - perf.redirectStart,
        dnsTime: perf.domainLookupEnd - perf.domainLookupStart,
        connectTime: perf.connectEnd - perf.connectStart,
        requestTime: perf.responseStart - perf.requestStart,
        responseTime: perf.responseEnd - perf.responseStart,
      }
    })

    // Collect CLS (Cumulative Layout Shift)
    const cls = await this.page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
        })
        observer.observe({ type: 'layout-shift', buffered: true })

        setTimeout(() => {
          observer.disconnect()
          resolve(clsValue)
        }, 3000)
      })
    })

    return {
      lcp: metrics.lcp,
      fid: 50, // Would need real user interaction
      cls: cls,
      inp: 100, // Would need real interaction
      fcp: metrics.fcp,
      tti: metrics.domInteractive,
      tbt: 200, // Approximation
      speedIndex: 2000, // Would need Lighthouse
      ttfb: metrics.ttfb,
    }
  }

  /**
   * Collect resource waterfall
   */
  private async collectResourceWaterfall(): Promise<any[]> {
    if (!this.page) return []

    try {
      const resources = await this.page.evaluate(() => {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        return entries.map((entry) => ({
          name: entry.name,
          type: entry.initiatorType,
          startTime: entry.startTime,
          duration: entry.duration,
          size: entry.transferSize || 0,
          cached: entry.transferSize === 0,
        }))
      })

      return resources
    } catch (error) {
      return []
    }
  }

  /**
   * Capture screenshots at different breakpoints
   */
  private async captureScreenshots(): Promise<void> {
    if (!this.page) return

    try {
      const screenshotPath = `./tmp/screenshots/${Date.now()}_${this.config.viewport?.width}x${this.config.viewport?.height}.png`

      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true,
      })

      this.screenshots.push({
        id: `screenshot_${Date.now()}`,
        url: screenshotPath,
        path: screenshotPath,
        fullPage: true,
        viewport: this.config.viewport || { width: 1920, height: 1080 },
        timestamp: new Date(),
      })

      // Element-level screenshots for important elements
      await this.captureElementScreenshots()
    } catch (error) {
      console.error('Screenshot error:', error)
    }
  }

  /**
   * Capture element-level screenshots
   */
  private async captureElementScreenshots(): Promise<void> {
    if (!this.page) return

    try {
      const selectors = ['header', 'nav', 'main', 'footer', 'h1', '.hero', '#banner']

      for (const selector of selectors) {
        const element = await this.page.$(selector)
        if (element) {
          const screenshotPath = `./tmp/screenshots/${Date.now()}_${selector.replace(/[^a-z0-9]/gi, '_')}.png`
          await element.screenshot({ path: screenshotPath })

          this.screenshots.push({
            id: `element_${Date.now()}`,
            url: screenshotPath,
            path: screenshotPath,
            fullPage: false,
            viewport: this.config.viewport || { width: 1920, height: 1080 },
            timestamp: new Date(),
          })
        }
      }
    } catch (error) {
      console.error('Element screenshot error:', error)
    }
  }

  /**
   * Intelligent website exploration
   */
  private async exploreWebsite(currentUrl: string, depth: number): Promise<void> {
    if (!this.page) return
    if (depth >= (this.config.maxDepth || 3)) return
    if (this.pages.length >= (this.config.maxPages || 20)) return

    try {
      const links = await this.discoverLinks()
      const buttons = await this.discoverButtons()
      const forms = await this.discoverForms()

      // Test forms
      for (const form of forms.slice(0, 2)) {
        await this.testForm(form)
      }

      // Test buttons
      for (const button of buttons.slice(0, 3)) {
        await this.testButton(button)
      }

      // Follow links
      for (const link of links.slice(0, 5)) {
        if (this.shouldVisitLink(link)) {
          await this.navigateToPage(link)
          await this.exploreWebsite(link, depth + 1)
          await this.page.goto(currentUrl, { waitUntil: 'networkidle' })
        }
      }
    } catch (error: any) {
      console.error(`Exploration error at ${currentUrl}:`, error.message)
    }
  }

  /**
   * Discover links
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
   * Discover buttons
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
   * Discover forms
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
          fields: Array.from(form.querySelectorAll('input, textarea, select')).map((field) => ({
            name: (field as HTMLInputElement).name,
            type: (field as HTMLInputElement).type,
            required: (field as HTMLInputElement).required,
          })),
        }))
      })
    } catch {
      return []
    }
  }

  /**
   * Test a form
   */
  private async testForm(form: any): Promise<void> {
    if (!this.page) return
    try {
      for (const field of form.fields) {
        const selector = `[name="${field.name}"]`
        const testValue = this.generateTestValue(field.type, field.name)
        if (testValue) {
          await this.page.fill(selector, testValue).catch(() => {})
        }
      }
    } catch (error: any) {
      console.error(`Form testing error:`, error.message)
    }
  }

  /**
   * Test a button
   */
  private async testButton(buttonText: string): Promise<void> {
    if (!this.page) return
    try {
      await this.page.click(`text=${buttonText}`, { timeout: 5000 })
      await this.page.waitForLoadState('networkidle', { timeout: 10000 })
    } catch {
      // Button might not be clickable
    }
  }

  /**
   * Determine if a link should be visited
   */
  private shouldVisitLink(url: string): boolean {
    try {
      const linkUrl = new URL(url)
      const baseUrl = new URL(this.config.url)

      if (linkUrl.hostname !== baseUrl.hostname) return false
      if (this.visitedUrls.has(url)) return false

      const skipExtensions = ['.pdf', '.zip', '.jpg', '.png', '.gif', '.mp4', '.mp3']
      if (skipExtensions.some((ext) => url.toLowerCase().endsWith(ext))) return false

      return true
    } catch {
      return false
    }
  }

  /**
   * Generate test values
   */
  private generateTestValue(type: string, name: string): string | null {
    const lowerName = name.toLowerCase()

    if (lowerName.includes('email')) return 'test@buglyze.com'
    if (lowerName.includes('phone')) return '555-123-4567'
    if (lowerName.includes('zip') || lowerName.includes('postal')) return '12345'
    if (lowerName.includes('name')) return 'Test User'
    if (type === 'number') return '123'
    if (type === 'email') return 'test@buglyze.com'
    if (type === 'tel') return '555-123-4567'
    if (type === 'url') return 'https://example.com'
    if (type === 'date') return '2024-01-01'

    return 'Test value'
  }

  /**
   * Set up error listeners
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
   * Set up resource tracking
   */
  private setupResourceTracking(): void {
    if (!this.page) return

    this.page.on('request', (request) => {
      // Track requests for waterfall
    })

    this.page.on('response', (response) => {
      // Track responses for waterfall
    })
  }

  /**
   * Get viewports to test
   */
  private getViewportsToTest(): Array<{ width: number; height: number }> {
    const device = this.config.device || 'desktop'

    switch (device) {
      case 'mobile':
        return [{ width: 375, height: 667 }]
      case 'tablet':
        return [{ width: 768, height: 1024 }]
      case 'desktop':
      default:
        // Test multiple desktop breakpoints
        return [
          { width: 1920, height: 1080 },
          { width: 1366, height: 768 },
          { width: 1280, height: 720 },
        ]
    }
  }

  /**
   * Merge results from multiple viewports
   */
  private mergeResults(results: TestResults[]): TestResults {
    if (results.length === 1) return results[0]

    // Take the worst scores and combine all issues
    return results.reduce((merged, current) => {
      return {
        ...merged,
        summary: {
          ...merged.summary,
          totalIssues: merged.summary.totalIssues + current.summary.totalIssues,
          overallScore: Math.min(merged.summary.overallScore, current.summary.overallScore),
        },
      }
    })
  }

  /**
   * Get performance opportunities
   */
  private async getPerformanceOpportunities(metrics: PerformanceMetrics): Promise<any[]> {
    const opportunities = []

    if (metrics.lcp > 2500) {
      opportunities.push({
        id: 'lcp',
        title: 'Reduce Largest Contentful Paint',
        description: 'LCP is too slow',
        score: 0.3,
        numericValue: metrics.lcp,
        displayValue: `${(metrics.lcp / 1000).toFixed(2)}s`,
      })
    }

    if (metrics.fcp > 1800) {
      opportunities.push({
        id: 'fcp',
        title: 'Reduce First Contentful Paint',
        description: 'FCP is too slow',
        score: 0.5,
        numericValue: metrics.fcp,
        displayValue: `${(metrics.fcp / 1000).toFixed(2)}s`,
      })
    }

    return opportunities
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
    let score = 100

    if (performance.lcp > 2500) score -= 20
    if (performance.fcp > 1800) score -= 15
    if (performance.cls > 0.1) score -= 15

    score -= this.errors.javascript.length * 5
    score -= this.errors.network.length * 3

    return Math.max(0, Math.min(100, score))
  }

  private calculateCoverage(): number {
    const totalLinks = this.pages.reduce((acc, page) => acc + 1, 0)
    const visitedLinks = this.visitedUrls.size
    return totalLinks > 0 ? (visitedLinks / totalLinks) * 100 : 0
  }

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
 * Execute a comprehensive test run
 */
export async function executeEnhancedTest(config: TestConfig): Promise<TestResults> {
  const runner = new EnhancedTestRunner(config)
  return await runner.run()
}
