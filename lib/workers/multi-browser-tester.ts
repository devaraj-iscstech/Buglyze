/**
 * Multi-Browser Testing
 * Test across Chrome, Firefox, Safari (WebKit), and Edge
 */

import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright'
import type { TestConfig, TestResults } from '@/types'
import { EnhancedTestRunner } from './enhanced-test-runner'

export type BrowserType = 'chromium' | 'firefox' | 'webkit' | 'edge'

export interface MultiBrowserConfig extends TestConfig {
  browsers?: BrowserType[]
  parallel?: boolean
}

export class MultiBrowserTester {
  /**
   * Run tests across multiple browsers
   */
  async runMultiBrowserTests(config: MultiBrowserConfig): Promise<Map<BrowserType, TestResults>> {
    const browsers = config.browsers || ['chromium', 'firefox', 'webkit']
    const results = new Map<BrowserType, TestResults>()

    if (config.parallel) {
      // Run tests in parallel for faster execution
      const promises = browsers.map(async (browserType) => {
        const result = await this.runInBrowser(browserType, config)
        return { browserType, result }
      })

      const settled = await Promise.allSettled(promises)

      settled.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.set(result.value.browserType, result.value.result)
        } else {
          console.error(`Browser test failed:`, result.reason)
        }
      })
    } else {
      // Run tests sequentially
      for (const browserType of browsers) {
        try {
          const result = await this.runInBrowser(browserType, config)
          results.set(browserType, result)
        } catch (error: any) {
          console.error(`${browserType} test failed:`, error)
        }
      }
    }

    return results
  }

  /**
   * Run test in specific browser
   */
  private async runInBrowser(
    browserType: BrowserType,
    config: TestConfig
  ): Promise<TestResults> {
    console.log(`Starting test in ${browserType}...`)

    // Create custom test runner for this browser
    const runner = new BrowserSpecificRunner(browserType, config)
    const results = await runner.run()

    console.log(`${browserType} test completed`)

    return results
  }

  /**
   * Get browser compatibility report
   */
  async getCompatibilityReport(
    results: Map<BrowserType, TestResults>
  ): Promise<{
    overallCompatibility: number
    browserScores: Map<BrowserType, number>
    crossBrowserIssues: Array<{
      issue: string
      affectedBrowsers: BrowserType[]
      severity: 'critical' | 'high' | 'medium' | 'low'
    }>
  }> {
    const browserScores = new Map<BrowserType, number>()
    const issuesByBrowser = new Map<BrowserType, Set<string>>()

    // Calculate scores for each browser
    results.forEach((result, browser) => {
      browserScores.set(browser, result.summary.overallScore)

      // Collect issues
      const issues = new Set<string>()
      result.errors?.javascript?.forEach((err) => issues.add(err.message))
      result.errors?.network?.forEach((err) => issues.add(err.url))
      issuesByBrowser.set(browser, issues)
    })

    // Find cross-browser issues (issues appearing in multiple browsers)
    const crossBrowserIssues: Array<{
      issue: string
      affectedBrowsers: BrowserType[]
      severity: 'critical' | 'high' | 'medium' | 'low'
    }> = []

    const allIssues = new Set<string>()
    issuesByBrowser.forEach((issues) => {
      issues.forEach((issue) => allIssues.add(issue))
    })

    allIssues.forEach((issue) => {
      const affectedBrowsers: BrowserType[] = []
      issuesByBrowser.forEach((issues, browser) => {
        if (issues.has(issue)) {
          affectedBrowsers.push(browser)
        }
      })

      if (affectedBrowsers.length > 1) {
        crossBrowserIssues.push({
          issue,
          affectedBrowsers,
          severity: affectedBrowsers.length === results.size ? 'critical' : 'high',
        })
      }
    })

    // Calculate overall compatibility (average of all browser scores)
    const scores = Array.from(browserScores.values())
    const overallCompatibility = scores.reduce((a, b) => a + b, 0) / scores.length

    return {
      overallCompatibility,
      browserScores,
      crossBrowserIssues,
    }
  }

  /**
   * Test browser-specific features
   */
  async testBrowserFeatures(browserType: BrowserType): Promise<{
    css: {
      gridSupport: boolean
      flexboxSupport: boolean
      customPropertiesSupport: boolean
    }
    javascript: {
      es6Support: boolean
      es2020Support: boolean
      asyncAwaitSupport: boolean
    }
    apis: {
      webGLSupport: boolean
      webRTCSupport: boolean
      serviceWorkerSupport: boolean
      webAssemblySupport: boolean
    }
  }> {
    let browser: Browser | null = null

    try {
      // Launch browser
      switch (browserType) {
        case 'chromium':
          browser = await chromium.launch({ headless: true })
          break
        case 'firefox':
          browser = await firefox.launch({ headless: true })
          break
        case 'webkit':
          browser = await webkit.launch({ headless: true })
          break
        default:
          browser = await chromium.launch({ headless: true })
      }

      const page = await browser.newPage()

      // Test CSS features
      const cssFeatures = await page.evaluate(() => {
        return {
          gridSupport: CSS.supports('display', 'grid'),
          flexboxSupport: CSS.supports('display', 'flex'),
          customPropertiesSupport: CSS.supports('--custom', 'value'),
        }
      })

      // Test JavaScript features
      const jsFeatures = await page.evaluate(() => {
        const tests = {
          es6Support: false,
          es2020Support: false,
          asyncAwaitSupport: false,
        }

        try {
          // Test ES6 (arrow functions, let/const)
          eval('const test = () => {}; tests.es6Support = true;')
        } catch {}

        try {
          // Test ES2020 (optional chaining, nullish coalescing)
          eval('const obj = {}; const test = obj?.prop ?? "default"; tests.es2020Support = true;')
        } catch {}

        try {
          // Test async/await
          eval('async function test() { await Promise.resolve(); }; tests.asyncAwaitSupport = true;')
        } catch {}

        return tests
      })

      // Test Web APIs
      const apiFeatures = await page.evaluate(() => {
        return {
          webGLSupport: !!window.WebGLRenderingContext,
          webRTCSupport: !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection),
          serviceWorkerSupport: 'serviceWorker' in navigator,
          webAssemblySupport: typeof WebAssembly !== 'undefined',
        }
      })

      await browser.close()

      return {
        css: cssFeatures,
        javascript: jsFeatures,
        apis: apiFeatures,
      }
    } catch (error) {
      if (browser) await browser.close()
      throw error
    }
  }
}

/**
 * Browser-specific test runner
 */
class BrowserSpecificRunner extends EnhancedTestRunner {
  private browserType: BrowserType

  constructor(browserType: BrowserType, config: TestConfig) {
    super(config)
    this.browserType = browserType
  }

  /**
   * Override initialize to use specific browser
   */
  protected async initialize(): Promise<void> {
    let browser: Browser

    switch (this.browserType) {
      case 'chromium':
        browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
        break
      case 'firefox':
        browser = await firefox.launch({ headless: true })
        break
      case 'webkit':
        browser = await webkit.launch({ headless: true })
        break
      case 'edge':
        // Edge uses Chromium engine
        browser = await chromium.launch({
          headless: true,
          channel: 'msedge',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
        break
      default:
        browser = await chromium.launch({ headless: true })
    }

    // Store browser reference (need to modify parent class to allow this)
    ;(this as any).browser = browser

    // Continue with standard initialization
    const contextOptions: any = {
      viewport: (this as any).config.viewport,
      userAgent: this.getUserAgent(),
      ignoreHTTPSErrors: false,
    }

    const context = await browser.newContext(contextOptions)
    ;(this as any).context = context

    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    })

    const page = await context.newPage()
    ;(this as any).page = page

    // Set up listeners
    ;(this as any).setupErrorListeners()
    ;(this as any).setupResourceTracking()
  }

  /**
   * Get browser-specific user agent
   */
  private getUserAgent(): string {
    const userAgents = {
      chromium:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      firefox:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      webkit:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    }

    return userAgents[this.browserType] || userAgents.chromium
  }
}

export const multiBrowserTester = new MultiBrowserTester()
