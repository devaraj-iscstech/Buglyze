/**
 * Gemini AI Analysis Service
 * Uses Google's Gemini 2.5 Flash for AI-powered analysis
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { TestResults, Issue, IssueSeverity } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export class GeminiAnalysisService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  /**
   * Analyze a screenshot using Gemini Vision
   */
  async analyzeScreenshot(
    imageData: string | Buffer,
    context?: string
  ): Promise<{
    issues: Issue[]
    summary: string
    score: number
  }> {
    try {
      const prompt = `You are an expert UI/UX analyst and quality assurance specialist. Analyze the provided screenshot and identify any issues related to:
- Visual design problems (alignment, spacing, overlap)
- Broken layouts or rendering issues
- Missing or broken images
- Text readability issues
- Color contrast problems
- Accessibility concerns
- Mobile responsiveness issues
- Professional appearance and polish

${context ? `Context: ${context}\n\n` : ''}

Provide your analysis in JSON format with the following structure:
{
  "issues": [
    {
      "type": "ui",
      "severity": "critical" | "high" | "medium" | "low",
      "title": "Brief issue title",
      "description": "Detailed description",
      "recommendation": "How to fix this"
    }
  ],
  "summary": "Overall assessment in 2-3 sentences",
  "score": 0-100
}

Respond ONLY with valid JSON, no additional text.`

      const imagePart = {
        inlineData: {
          data: typeof imageData === 'string' ? imageData : imageData.toString('base64'),
          mimeType: 'image/png',
        },
      }

      const result = await this.model.generateContent([prompt, imagePart])
      const response = await result.response
      const text = response.text()

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text

      const analysis = JSON.parse(jsonStr)

      // Convert to Issue objects
      const issues: Issue[] = (analysis.issues || []).map((issue: any) => ({
        id: this.generateId(),
        testRunId: '', // Will be set by caller
        type: issue.type || 'ui',
        severity: issue.severity || 'medium',
        title: issue.title,
        description: issue.description,
        recommendation: issue.recommendation,
        createdAt: new Date(),
      }))

      return {
        issues,
        summary: analysis.summary || 'Analysis completed',
        score: analysis.score || 80,
      }
    } catch (error: any) {
      console.error('Gemini analysis error:', error)
      return {
        issues: [],
        summary: 'AI analysis unavailable',
        score: 0,
      }
    }
  }

  /**
   * Generate natural language summary of test results
   */
  async generateTestSummary(results: TestResults): Promise<string> {
    try {
      const prompt = `You are a QA analyst creating executive summaries. Summarize these test results in clear, actionable language for stakeholders:

${JSON.stringify(results.summary, null, 2)}

Provide a 2-3 sentence executive summary highlighting the most important findings. Focus on actionable insights.`

      const result = await this.model.generateContent(prompt)
      const response = await result.response

      return response.text() || 'Test completed successfully with mixed results.'
    } catch (error) {
      console.error('Summary generation error:', error)
      return 'Test completed. Review detailed results for more information.'
    }
  }

  /**
   * Analyze performance metrics and provide recommendations
   */
  async analyzePerformance(metrics: any): Promise<{
    issues: Issue[]
    recommendations: string[]
  }> {
    const issues: Issue[] = []
    const recommendations: string[] = []

    // Analyze LCP (Largest Contentful Paint)
    if (metrics.lcp > 2500) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'performance',
        severity: metrics.lcp > 4000 ? 'critical' : 'high',
        title: 'Slow Largest Contentful Paint',
        description: `LCP is ${(metrics.lcp / 1000).toFixed(
          2
        )}s, which is above the recommended 2.5s threshold. This means users wait too long to see the main content.`,
        recommendation:
          'Optimize server response times, eliminate render-blocking resources, optimize and compress images, use lazy loading for below-the-fold content, and implement a CDN.',
        createdAt: new Date(),
      })
      recommendations.push('Optimize images and use modern formats (WebP, AVIF)')
      recommendations.push('Implement lazy loading for images below the fold')
      recommendations.push('Use a CDN to serve static assets faster')
      recommendations.push('Preload critical resources')
    }

    // Analyze FCP (First Contentful Paint)
    if (metrics.fcp > 1800) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'performance',
        severity: metrics.fcp > 3000 ? 'high' : 'medium',
        title: 'Slow First Contentful Paint',
        description: `FCP is ${(metrics.fcp / 1000).toFixed(
          2
        )}s. Users are waiting too long to see any content on the page.`,
        recommendation:
          'Minimize render-blocking resources, inline critical CSS, defer non-critical JavaScript, eliminate unused CSS, and optimize web fonts.',
        createdAt: new Date(),
      })
      recommendations.push('Inline critical CSS in the HTML head')
      recommendations.push('Defer non-critical JavaScript with async/defer')
      recommendations.push('Eliminate unused CSS and JavaScript')
    }

    // Analyze CLS (Cumulative Layout Shift)
    if (metrics.cls > 0.1) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'performance',
        severity: metrics.cls > 0.25 ? 'high' : 'medium',
        title: 'Layout Shift Issues',
        description: `CLS score of ${metrics.cls.toFixed(
          3
        )} indicates unexpected layout shifts that create poor user experience.`,
        recommendation:
          'Set explicit dimensions for images and embeds, avoid inserting content above existing content, reserve space for dynamic content, and use CSS transforms for animations.',
        createdAt: new Date(),
      })
      recommendations.push('Add width and height attributes to all images and video elements')
      recommendations.push('Reserve space for ads, embeds, and dynamic content')
      recommendations.push('Use CSS aspect-ratio for responsive media')
      recommendations.push('Avoid inserting content above existing content')
    }

    // Analyze FID/INP (Interactivity)
    if (metrics.inp > 200) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'performance',
        severity: metrics.inp > 500 ? 'high' : 'medium',
        title: 'Slow Interaction Response',
        description: `INP of ${metrics.inp}ms means the page is slow to respond to user interactions.`,
        recommendation:
          'Break up long tasks, optimize JavaScript execution, use web workers for heavy computations, implement code splitting, and defer third-party scripts.',
        createdAt: new Date(),
      })
      recommendations.push('Break up long-running JavaScript tasks')
      recommendations.push('Use requestIdleCallback for non-critical work')
      recommendations.push('Implement code splitting and lazy loading')
    }

    // Analyze TTFB (Time to First Byte)
    if (metrics.ttfb > 600) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'performance',
        severity: metrics.ttfb > 1000 ? 'high' : 'medium',
        title: 'Slow Server Response',
        description: `TTFB is ${metrics.ttfb}ms. Server is taking too long to respond to requests.`,
        recommendation:
          'Optimize server-side code, implement caching strategies, upgrade server resources, use edge caching with a CDN, optimize database queries, and consider server-side rendering alternatives.',
        createdAt: new Date(),
      })
      recommendations.push('Implement server-side caching (Redis, Memcached)')
      recommendations.push('Optimize database queries and add indexes')
      recommendations.push('Use a CDN with edge caching')
      recommendations.push('Consider upgrading server resources')
    }

    // Analyze TBT (Total Blocking Time)
    if (metrics.tbt > 300) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'performance',
        severity: metrics.tbt > 600 ? 'high' : 'medium',
        title: 'High Total Blocking Time',
        description: `TBT of ${metrics.tbt}ms indicates main thread is blocked, preventing user interactions.`,
        recommendation:
          'Reduce JavaScript execution time, split long tasks, remove unused code, optimize third-party scripts, and use web workers.',
        createdAt: new Date(),
      })
      recommendations.push('Audit and remove unused JavaScript')
      recommendations.push('Split long tasks into smaller chunks')
      recommendations.push('Defer or lazy load third-party scripts')
    }

    return { issues, recommendations }
  }

  /**
   * Analyze accessibility issues and provide guidance
   */
  async analyzeAccessibility(violations: any[]): Promise<Issue[]> {
    const issues: Issue[] = []

    for (const violation of violations) {
      const severity: IssueSeverity =
        violation.impact === 'critical'
          ? 'critical'
          : violation.impact === 'serious'
          ? 'high'
          : violation.impact === 'moderate'
          ? 'medium'
          : 'low'

      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'accessibility',
        severity,
        title: violation.help || 'Accessibility Issue',
        description:
          violation.description ||
          `${violation.nodes?.length || 0} element(s) have accessibility issues`,
        recommendation: violation.helpUrl
          ? `Learn more and fix: ${violation.helpUrl}`
          : 'Review WCAG 2.1 guidelines for proper implementation',
        location: violation.nodes?.[0]?.target?.join(' > '),
        createdAt: new Date(),
      })
    }

    return issues
  }

  /**
   * Analyze SEO issues comprehensively
   */
  async analyzeSEO(seoData: any): Promise<Issue[]> {
    const issues: Issue[] = []

    // Title tag analysis
    if (!seoData.title || seoData.title.length === 0) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'high',
        title: 'Missing Page Title',
        description: 'The page does not have a title tag, which is critical for SEO.',
        recommendation:
          'Add a descriptive, keyword-rich title tag between 50-60 characters: <title>Your Page Title</title>',
        createdAt: new Date(),
      })
    } else if (seoData.title.length < 30) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'low',
        title: 'Title Too Short',
        description: `Title is only ${seoData.title.length} characters, which may not be descriptive enough.`,
        recommendation: 'Expand title to 50-60 characters for better SEO impact.',
        createdAt: new Date(),
      })
    } else if (seoData.title.length > 60) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'low',
        title: 'Title Too Long',
        description: `Title is ${seoData.title.length} characters, which may be truncated in search results.`,
        recommendation: 'Keep title under 60 characters for optimal display in search results.',
        createdAt: new Date(),
      })
    }

    // Meta description
    if (!seoData.description) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'medium',
        title: 'Missing Meta Description',
        description:
          'The page does not have a meta description, which is important for click-through rates.',
        recommendation:
          'Add a compelling meta description between 150-160 characters: <meta name="description" content="Your description">',
        createdAt: new Date(),
      })
    } else if (seoData.description.length < 120) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'low',
        title: 'Meta Description Too Short',
        description: `Meta description is only ${seoData.description.length} characters.`,
        recommendation: 'Expand description to 150-160 characters for better CTR.',
        createdAt: new Date(),
      })
    } else if (seoData.description.length > 160) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'low',
        title: 'Meta Description Too Long',
        description: `Meta description is ${seoData.description.length} characters and may be truncated.`,
        recommendation: 'Keep description under 160 characters.',
        createdAt: new Date(),
      })
    }

    // Canonical URL
    if (!seoData.canonical) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'low',
        title: 'Missing Canonical URL',
        description: 'The page does not have a canonical URL specified.',
        recommendation:
          'Add a canonical link tag to prevent duplicate content issues: <link rel="canonical" href="https://example.com/page">',
        createdAt: new Date(),
      })
    }

    // H1 tag
    if (!seoData.h1 || seoData.h1.length === 0) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'medium',
        title: 'Missing H1 Heading',
        description: 'The page does not have an H1 heading tag.',
        recommendation:
          'Add a single, descriptive H1 tag that includes your primary keyword.',
        createdAt: new Date(),
      })
    } else if (seoData.h1.length > 1) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'low',
        title: 'Multiple H1 Tags',
        description: `Page has ${seoData.h1.length} H1 tags. Best practice is to have exactly one.`,
        recommendation: 'Use only one H1 tag per page for better SEO.',
        createdAt: new Date(),
      })
    }

    // Open Graph
    if (!seoData.openGraph || Object.keys(seoData.openGraph).length === 0) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'low',
        title: 'Missing Open Graph Tags',
        description: 'No Open Graph meta tags found for social media sharing.',
        recommendation:
          'Add Open Graph tags (og:title, og:description, og:image) for better social media appearance.',
        createdAt: new Date(),
      })
    }

    // Twitter Card
    if (!seoData.twitter || Object.keys(seoData.twitter).length === 0) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'low',
        title: 'Missing Twitter Card Tags',
        description: 'No Twitter Card meta tags found.',
        recommendation:
          'Add Twitter Card tags (twitter:card, twitter:title, twitter:description) for better Twitter sharing.',
        createdAt: new Date(),
      })
    }

    // Structured data
    if (!seoData.structuredData || seoData.structuredData.length === 0) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'low',
        title: 'No Structured Data',
        description: 'Page does not have Schema.org structured data.',
        recommendation:
          'Add JSON-LD structured data for rich snippets in search results.',
        createdAt: new Date(),
      })
    }

    return issues
  }

  /**
   * Analyze security vulnerabilities
   */
  async analyzeSecurity(securityData: any): Promise<Issue[]> {
    const issues: Issue[] = []

    // SSL Certificate
    if (!securityData.ssl?.valid) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'critical',
        title: 'Invalid SSL Certificate',
        description: 'The site does not have a valid SSL certificate or is not using HTTPS.',
        recommendation:
          'Install a valid SSL certificate (Let\'s Encrypt is free) and redirect all HTTP traffic to HTTPS.',
        createdAt: new Date(),
      })
    } else if (securityData.ssl?.expiryDays < 30) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'high',
        title: 'SSL Certificate Expiring Soon',
        description: `SSL certificate expires in ${securityData.ssl.expiryDays} days.`,
        recommendation: 'Renew your SSL certificate before expiration to avoid downtime.',
        createdAt: new Date(),
      })
    }

    const headers = securityData.headers || {}

    // Strict-Transport-Security (HSTS)
    if (!headers.strictTransportSecurity) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'high',
        title: 'Missing HSTS Header',
        description: 'Strict-Transport-Security header is not set.',
        recommendation:
          'Add HSTS header to force HTTPS connections: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        createdAt: new Date(),
      })
    }

    // Content-Security-Policy
    if (!headers.contentSecurityPolicy) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'medium',
        title: 'Missing Content Security Policy',
        description: 'Content-Security-Policy header is not set.',
        recommendation:
          'Implement CSP header to prevent XSS attacks by controlling which resources can be loaded. Start with a restrictive policy and adjust as needed.',
        createdAt: new Date(),
      })
    }

    // X-Frame-Options
    if (!headers.xFrameOptions) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'medium',
        title: 'Missing X-Frame-Options',
        description:
          'X-Frame-Options header is not set, making the site vulnerable to clickjacking attacks.',
        recommendation:
          'Add X-Frame-Options: DENY or X-Frame-Options: SAMEORIGIN to prevent clickjacking.',
        createdAt: new Date(),
      })
    }

    // X-Content-Type-Options
    if (!headers.xContentTypeOptions) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'low',
        title: 'Missing X-Content-Type-Options',
        description: 'X-Content-Type-Options header is not set.',
        recommendation:
          'Add X-Content-Type-Options: nosniff to prevent MIME type sniffing.',
        createdAt: new Date(),
      })
    }

    // Referrer-Policy
    if (!headers.referrerPolicy) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'low',
        title: 'Missing Referrer-Policy',
        description: 'Referrer-Policy header is not set.',
        recommendation:
          'Add Referrer-Policy header to control referrer information: Referrer-Policy: strict-origin-when-cross-origin',
        createdAt: new Date(),
      })
    }

    // Permissions-Policy
    if (!headers.permissionsPolicy) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'low',
        title: 'Missing Permissions-Policy',
        description: 'Permissions-Policy header is not set.',
        recommendation:
          'Add Permissions-Policy to control browser features: Permissions-Policy: geolocation=(), microphone=(), camera=()',
        createdAt: new Date(),
      })
    }

    // Mixed Content
    if (securityData.mixedContent && securityData.mixedContent.length > 0) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'high',
        title: 'Mixed Content Detected',
        description: `Found ${securityData.mixedContent.length} resources loaded over HTTP on an HTTPS page.`,
        recommendation:
          'Update all resource URLs to use HTTPS to prevent mixed content warnings and security vulnerabilities.',
        createdAt: new Date(),
      })
    }

    // Insecure Cookies
    if (securityData.insecureCookies && securityData.insecureCookies.length > 0) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'medium',
        title: 'Insecure Cookies',
        description: `Found ${securityData.insecureCookies.length} cookies without Secure or HttpOnly flags.`,
        recommendation:
          'Set Secure and HttpOnly flags on all cookies. For session cookies, also use SameSite=Strict or SameSite=Lax.',
        createdAt: new Date(),
      })
    }

    return issues
  }

  /**
   * Generate a comprehensive analysis report using Gemini
   */
  async generateComprehensiveReport(
    testResults: TestResults,
    screenshots: string[]
  ): Promise<{
    summary: string
    allIssues: Issue[]
    recommendations: string[]
    score: number
  }> {
    const allIssues: Issue[] = []
    const allRecommendations: string[] = []

    // Analyze performance
    if (testResults.performance) {
      const perfAnalysis = await this.analyzePerformance(testResults.performance.metrics)
      allIssues.push(...perfAnalysis.issues)
      allRecommendations.push(...perfAnalysis.recommendations)
    }

    // Analyze accessibility
    if (testResults.accessibility?.violations) {
      const a11yIssues = await this.analyzeAccessibility(testResults.accessibility.violations)
      allIssues.push(...a11yIssues)
    }

    // Analyze SEO
    if (testResults.seo) {
      const seoIssues = await this.analyzeSEO(testResults.seo)
      allIssues.push(...seoIssues)
    }

    // Analyze security
    if (testResults.security) {
      const securityIssues = await this.analyzeSecurity(testResults.security)
      allIssues.push(...securityIssues)
    }

    // Analyze screenshots with Gemini (limit to first 3)
    for (const screenshot of screenshots.slice(0, 3)) {
      try {
        const visualAnalysis = await this.analyzeScreenshot(screenshot)
        allIssues.push(...visualAnalysis.issues)
      } catch (error) {
        console.error('Screenshot analysis failed:', error)
      }
    }

    // Generate overall summary using Gemini
    const summary = await this.generateTestSummary(testResults)

    // Calculate overall score
    const score = this.calculateOverallScore(allIssues, testResults)

    return {
      summary,
      allIssues,
      recommendations: [...new Set(allRecommendations)], // Remove duplicates
      score,
    }
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(issues: Issue[], results: TestResults): number {
    let score = 100

    // Deduct points based on issue severity
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 15
          break
        case 'high':
          score -= 10
          break
        case 'medium':
          score -= 5
          break
        case 'low':
          score -= 2
          break
        case 'info':
          score -= 1
          break
      }
    }

    // Factor in test scores if available
    if (results.summary.overallScore) {
      score = (score + results.summary.overallScore) / 2
    }

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }
}

// Export singleton instance
export const geminiAnalysisService = new GeminiAnalysisService()
