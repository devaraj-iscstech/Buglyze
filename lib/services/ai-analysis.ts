/**
 * AI Analysis Service
 * Uses GPT-4 Vision to analyze screenshots and test results
 */

import OpenAI from 'openai'
import type { TestResults, Issue, IssueSeverity } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class AIAnalysisService {
  /**
   * Analyze a screenshot using GPT-4 Vision
   */
  async analyzeScreenshot(imageUrl: string, context?: string): Promise<{
    issues: Issue[]
    summary: string
    score: number
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `You are an expert UI/UX analyst and quality assurance specialist. Analyze the provided screenshot and identify any issues related to:
- Visual design problems (alignment, spacing, overlap)
- Broken layouts or rendering issues
- Missing or broken images
- Text readability issues
- Color contrast problems
- Accessibility concerns
- Mobile responsiveness issues
- Professional appearance and polish

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
  "summary": "Overall assessment",
  "score": 0-100
}`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: context
                  ? `Context: ${context}\n\nAnalyze this screenshot for any UI/UX issues.`
                  : 'Analyze this screenshot for any UI/UX issues.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
      })

      const content = response.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response from AI')
      }

      // Parse the JSON response
      const analysis = JSON.parse(content)

      // Convert to Issue objects
      const issues: Issue[] = analysis.issues.map((issue: any) => ({
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
        summary: analysis.summary,
        score: analysis.score || 80,
      }
    } catch (error: any) {
      console.error('AI analysis error:', error)
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
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content:
              'You are a QA analyst creating executive summaries. Summarize test results in clear, actionable language for stakeholders.',
          },
          {
            role: 'user',
            content: `Summarize these test results:\n\n${JSON.stringify(
              results.summary,
              null,
              2
            )}\n\nProvide a 2-3 sentence executive summary highlighting the most important findings.`,
          },
        ],
      })

      return (
        response.choices[0]?.message?.content ||
        'Test completed successfully with mixed results.'
      )
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
        )}s, which is above the recommended 2.5s threshold.`,
        recommendation:
          'Optimize server response times, eliminate render-blocking resources, and optimize images.',
        createdAt: new Date(),
      })
      recommendations.push('Optimize images and lazy load content below the fold')
      recommendations.push('Use a CDN to serve static assets faster')
    }

    // Analyze FCP (First Contentful Paint)
    if (metrics.fcp > 1800) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'performance',
        severity: 'medium',
        title: 'Slow First Contentful Paint',
        description: `FCP is ${(metrics.fcp / 1000).toFixed(
          2
        )}s. Users are waiting too long to see content.`,
        recommendation:
          'Minimize render-blocking resources, inline critical CSS, and defer non-critical JavaScript.',
        createdAt: new Date(),
      })
      recommendations.push('Inline critical CSS and defer non-critical styles')
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
        )} indicates unexpected layout shifts.`,
        recommendation:
          'Set explicit dimensions for images and embeds, avoid inserting content above existing content.',
        createdAt: new Date(),
      })
      recommendations.push('Add width and height attributes to all images')
      recommendations.push('Reserve space for ads and embeds')
    }

    // Analyze TTFB (Time to First Byte)
    if (metrics.ttfb > 600) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'performance',
        severity: 'medium',
        title: 'Slow Server Response',
        description: `TTFB is ${metrics.ttfb}ms. Server is taking too long to respond.`,
        recommendation:
          'Optimize server-side code, use caching, upgrade server resources, or use a CDN.',
        createdAt: new Date(),
      })
      recommendations.push('Implement server-side caching')
      recommendations.push('Optimize database queries')
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
        description: violation.description || 'No description available',
        recommendation: violation.helpUrl
          ? `Learn more: ${violation.helpUrl}`
          : 'Review WCAG guidelines',
        location: violation.nodes?.[0]?.target?.join(' > '),
        createdAt: new Date(),
      })
    }

    return issues
  }

  /**
   * Analyze SEO issues
   */
  async analyzeSEO(seoData: any): Promise<Issue[]> {
    const issues: Issue[] = []

    // Check title
    if (!seoData.title || seoData.title.length === 0) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'high',
        title: 'Missing Page Title',
        description: 'The page does not have a title tag.',
        recommendation:
          'Add a descriptive title tag between 50-60 characters that includes your primary keyword.',
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
        recommendation: 'Keep title under 60 characters for optimal display.',
        createdAt: new Date(),
      })
    }

    // Check meta description
    if (!seoData.description) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'medium',
        title: 'Missing Meta Description',
        description: 'The page does not have a meta description.',
        recommendation:
          'Add a compelling meta description between 150-160 characters that summarizes the page content.',
        createdAt: new Date(),
      })
    }

    // Check canonical URL
    if (!seoData.canonical) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'seo',
        severity: 'low',
        title: 'Missing Canonical URL',
        description: 'The page does not have a canonical URL specified.',
        recommendation:
          'Add a canonical link tag to prevent duplicate content issues.',
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

    // Check SSL
    if (!securityData.ssl?.valid) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'critical',
        title: 'Invalid SSL Certificate',
        description: 'The site does not have a valid SSL certificate.',
        recommendation:
          'Install a valid SSL certificate to encrypt traffic and build trust.',
        createdAt: new Date(),
      })
    }

    // Check security headers
    const headers = securityData.headers || {}

    if (!headers.strictTransportSecurity) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'high',
        title: 'Missing HSTS Header',
        description: 'Strict-Transport-Security header is not set.',
        recommendation:
          'Add HSTS header to force HTTPS connections: Strict-Transport-Security: max-age=31536000; includeSubDomains',
        createdAt: new Date(),
      })
    }

    if (!headers.contentSecurityPolicy) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'medium',
        title: 'Missing CSP Header',
        description: 'Content-Security-Policy header is not set.',
        recommendation:
          'Implement CSP to prevent XSS attacks by controlling which resources can be loaded.',
        createdAt: new Date(),
      })
    }

    if (!headers.xFrameOptions) {
      issues.push({
        id: this.generateId(),
        testRunId: '',
        type: 'security',
        severity: 'medium',
        title: 'Missing X-Frame-Options',
        description: 'X-Frame-Options header is not set, making the site vulnerable to clickjacking.',
        recommendation:
          'Add X-Frame-Options: DENY or SAMEORIGIN to prevent clickjacking attacks.',
        createdAt: new Date(),
      })
    }

    return issues
  }

  /**
   * Generate a comprehensive analysis report
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
      const perfAnalysis = await this.analyzePerformance(
        testResults.performance.metrics
      )
      allIssues.push(...perfAnalysis.issues)
      allRecommendations.push(...perfAnalysis.recommendations)
    }

    // Analyze accessibility
    if (testResults.accessibility?.violations) {
      const a11yIssues = await this.analyzeAccessibility(
        testResults.accessibility.violations
      )
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

    // Analyze screenshots with AI
    for (const screenshot of screenshots.slice(0, 3)) {
      // Limit to first 3
      const visualAnalysis = await this.analyzeScreenshot(screenshot)
      allIssues.push(...visualAnalysis.issues)
    }

    // Generate overall summary
    const summary = await this.generateTestSummary(testResults)

    // Calculate overall score
    const score = this.calculateOverallScore(allIssues, testResults)

    return {
      summary,
      allIssues,
      recommendations: allRecommendations,
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
      }
    }

    // Factor in test scores
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
export const aiAnalysisService = new AIAnalysisService()
