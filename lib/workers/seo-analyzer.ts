/**
 * SEO Analyzer
 * Comprehensive SEO analysis including meta tags, structured data, and more
 */

import { Page } from 'playwright'
import * as cheerio from 'cheerio'
import type { SEOResults, MetaTags, StructuredData, SEOIssue } from '@/types'

export class SEOAnalyzer {
  /**
   * Perform comprehensive SEO analysis on a page
   */
  async analyzePage(page: Page, url: string): Promise<SEOResults> {
    try {
      const html = await page.content()
      const $ = cheerio.load(html)

      // Extract all SEO data
      const metaTags = this.extractMetaTags($)
      const structuredData = this.extractStructuredData($, html)
      const headings = this.analyzeHeadings($)
      const images = this.analyzeImages($)
      const links = this.analyzeLinks($, url)
      const mobileFriendly = await this.checkMobileFriendly(page)

      // Identify issues
      const issues: SEOIssue[] = []

      // Meta tags issues
      if (!metaTags.title) {
        issues.push({
          type: 'meta',
          severity: 'critical',
          description: 'Missing page title',
          recommendation: 'Add a descriptive title tag between 50-60 characters',
        })
      } else if (metaTags.title.length > 60) {
        issues.push({
          type: 'meta',
          severity: 'medium',
          description: `Title too long (${metaTags.title.length} characters)`,
          recommendation: 'Keep title under 60 characters',
        })
      } else if (metaTags.title.length < 30) {
        issues.push({
          type: 'meta',
          severity: 'low',
          description: `Title too short (${metaTags.title.length} characters)`,
          recommendation: 'Expand title to 50-60 characters for better SEO',
        })
      }

      if (!metaTags.description) {
        issues.push({
          type: 'meta',
          severity: 'high',
          description: 'Missing meta description',
          recommendation: 'Add a meta description between 150-160 characters',
        })
      } else if (metaTags.description.length > 160) {
        issues.push({
          type: 'meta',
          severity: 'medium',
          description: `Meta description too long (${metaTags.description.length} characters)`,
          recommendation: 'Keep description under 160 characters',
        })
      }

      // Heading structure issues
      if (headings.h1 === 0) {
        issues.push({
          type: 'heading',
          severity: 'high',
          description: 'Missing H1 tag',
          recommendation: 'Add exactly one H1 tag with your primary keyword',
        })
      } else if (headings.h1 > 1) {
        issues.push({
          type: 'heading',
          severity: 'medium',
          description: `Multiple H1 tags (${headings.h1})`,
          recommendation: 'Use only one H1 tag per page',
        })
      }

      // Image optimization issues
      if (images.missingAlt > 0) {
        issues.push({
          type: 'image',
          severity: 'high',
          description: `${images.missingAlt} images without alt text`,
          recommendation: 'Add descriptive alt text to all images for accessibility and SEO',
        })
      }

      // Link issues
      if (links.brokenLinks > 0) {
        issues.push({
          type: 'link',
          severity: 'high',
          description: `${links.brokenLinks} potentially broken links`,
          recommendation: 'Fix or remove broken links',
        })
      }

      if (!metaTags.canonical) {
        issues.push({
          type: 'meta',
          severity: 'low',
          description: 'Missing canonical URL',
          recommendation: 'Add a canonical link tag to prevent duplicate content',
        })
      }

      // Open Graph
      if (!metaTags.openGraph || Object.keys(metaTags.openGraph).length === 0) {
        issues.push({
          type: 'social',
          severity: 'low',
          description: 'Missing Open Graph tags',
          recommendation: 'Add Open Graph tags for better social media sharing',
        })
      }

      // Twitter Card
      if (!metaTags.twitter || Object.keys(metaTags.twitter).length === 0) {
        issues.push({
          type: 'social',
          severity: 'low',
          description: 'Missing Twitter Card tags',
          recommendation: 'Add Twitter Card tags for better Twitter sharing',
        })
      }

      // Structured data
      if (structuredData.length === 0) {
        issues.push({
          type: 'structured-data',
          severity: 'medium',
          description: 'No structured data found',
          recommendation: 'Add Schema.org structured data for rich snippets',
        })
      }

      // Mobile-friendliness
      if (!mobileFriendly) {
        issues.push({
          type: 'mobile',
          severity: 'high',
          description: 'Page is not mobile-friendly',
          recommendation: 'Implement responsive design with viewport meta tag',
        })
      }

      // Calculate SEO score
      const score = this.calculateSEOScore(metaTags, headings, images, links, structuredData, mobileFriendly)

      return {
        score,
        issues,
        metaTags,
        structuredData,
        mobileFriendly,
      }
    } catch (error: any) {
      console.error('SEO analysis error:', error)
      return {
        score: 0,
        issues: [],
        metaTags: {},
        structuredData: [],
        mobileFriendly: false,
      }
    }
  }

  /**
   * Extract meta tags from HTML
   */
  private extractMetaTags($: cheerio.CheerioAPI): MetaTags {
    const metaTags: MetaTags = {}

    // Title
    metaTags.title = $('title').text().trim()

    // Meta description
    metaTags.description = $('meta[name="description"]').attr('content')?.trim()

    // Canonical URL
    metaTags.canonical = $('link[rel="canonical"]').attr('href')?.trim()

    // Robots
    metaTags.robots = $('meta[name="robots"]').attr('content')?.trim()

    // Open Graph
    const openGraph: Record<string, string> = {}
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr('property')
      const content = $(el).attr('content')
      if (property && content) {
        const key = property.replace('og:', '')
        openGraph[key] = content
      }
    })
    if (Object.keys(openGraph).length > 0) {
      metaTags.openGraph = openGraph
    }

    // Twitter Card
    const twitter: Record<string, string> = {}
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr('name')
      const content = $(el).attr('content')
      if (name && content) {
        const key = name.replace('twitter:', '')
        twitter[key] = content
      }
    })
    if (Object.keys(twitter).length > 0) {
      metaTags.twitter = twitter
    }

    return metaTags
  }

  /**
   * Extract structured data (JSON-LD)
   */
  private extractStructuredData($: cheerio.CheerioAPI, html: string): StructuredData[] {
    const structuredData: StructuredData[] = []

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const content = $(el).html()
        if (content) {
          const data = JSON.parse(content)
          structuredData.push({
            type: data['@type'] || 'Unknown',
            valid: true,
            data: data,
          })
        }
      } catch (error) {
        structuredData.push({
          type: 'Invalid',
          valid: false,
          data: {},
        })
      }
    })

    return structuredData
  }

  /**
   * Analyze heading structure
   */
  private analyzeHeadings($: cheerio.CheerioAPI): {
    h1: number
    h2: number
    h3: number
    h4: number
    h5: number
    h6: number
  } {
    return {
      h1: $('h1').length,
      h2: $('h2').length,
      h3: $('h3').length,
      h4: $('h4').length,
      h5: $('h5').length,
      h6: $('h6').length,
    }
  }

  /**
   * Analyze images
   */
  private analyzeImages($: cheerio.CheerioAPI): {
    total: number
    missingAlt: number
    optimized: number
  } {
    const images = $('img')
    let missingAlt = 0
    let optimized = 0

    images.each((_, el) => {
      const alt = $(el).attr('alt')
      const src = $(el).attr('src')

      if (!alt || alt.trim() === '') {
        missingAlt++
      }

      // Check if using modern formats
      if (src && (src.endsWith('.webp') || src.endsWith('.avif'))) {
        optimized++
      }
    })

    return {
      total: images.length,
      missingAlt,
      optimized,
    }
  }

  /**
   * Analyze links
   */
  private analyzeLinks($: cheerio.CheerioAPI, baseUrl: string): {
    total: number
    internal: number
    external: number
    brokenLinks: number
  } {
    const links = $('a[href]')
    let internal = 0
    let external = 0
    let brokenLinks = 0

    links.each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return

      // Skip anchors and javascript links
      if (href.startsWith('#') || href.startsWith('javascript:')) return

      try {
        const linkUrl = new URL(href, baseUrl)
        const baseUrlObj = new URL(baseUrl)

        if (linkUrl.hostname === baseUrlObj.hostname) {
          internal++
        } else {
          external++
        }

        // Check for obviously broken links
        if (href.includes('example.com') || href.includes('localhost')) {
          brokenLinks++
        }
      } catch (error) {
        brokenLinks++
      }
    })

    return {
      total: links.length,
      internal,
      external,
      brokenLinks,
    }
  }

  /**
   * Check if page is mobile-friendly
   */
  private async checkMobileFriendly(page: Page): Promise<boolean> {
    try {
      const viewport = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]')
        return meta ? meta.getAttribute('content') : null
      })

      // Basic check: has viewport meta tag
      if (!viewport) return false

      // Check if viewport is properly configured
      return (
        viewport.includes('width=device-width') ||
        viewport.includes('initial-scale=1')
      )
    } catch (error) {
      return false
    }
  }

  /**
   * Calculate SEO score
   */
  private calculateSEOScore(
    metaTags: MetaTags,
    headings: any,
    images: any,
    links: any,
    structuredData: StructuredData[],
    mobileFriendly: boolean
  ): number {
    let score = 100

    // Title (20 points)
    if (!metaTags.title) {
      score -= 20
    } else if (metaTags.title.length < 30 || metaTags.title.length > 60) {
      score -= 5
    }

    // Meta description (15 points)
    if (!metaTags.description) {
      score -= 15
    } else if (metaTags.description.length < 120 || metaTags.description.length > 160) {
      score -= 5
    }

    // H1 tag (15 points)
    if (headings.h1 === 0) {
      score -= 15
    } else if (headings.h1 > 1) {
      score -= 7
    }

    // Image alt tags (10 points)
    if (images.total > 0) {
      const altPercentage = ((images.total - images.missingAlt) / images.total) * 100
      score -= Math.round((100 - altPercentage) * 0.1)
    }

    // Canonical URL (5 points)
    if (!metaTags.canonical) {
      score -= 5
    }

    // Structured data (10 points)
    if (structuredData.length === 0) {
      score -= 10
    }

    // Open Graph (5 points)
    if (!metaTags.openGraph || Object.keys(metaTags.openGraph).length < 3) {
      score -= 5
    }

    // Mobile-friendly (10 points)
    if (!mobileFriendly) {
      score -= 10
    }

    // Broken links (10 points)
    if (links.brokenLinks > 0) {
      score -= Math.min(10, links.brokenLinks * 2)
    }

    return Math.max(0, Math.min(100, score))
  }
}

export const seoAnalyzer = new SEOAnalyzer()
