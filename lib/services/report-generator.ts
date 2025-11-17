/**
 * Advanced Report Generation (Q2)
 * PDF and HTML report generation with customizable templates
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import Handlebars from 'handlebars'
import htmlPdf from 'html-pdf-node'
import type { TestResults } from '@/types'

export class ReportGenerator {
  private templatesDir = './lib/templates'

  /**
   * Generate HTML report
   */
  async generateHTMLReport(
    testResults: TestResults,
    analysis: any,
    options?: {
      template?: 'default' | 'executive' | 'detailed'
      branding?: {
        logo?: string
        colors?: { primary: string; secondary: string }
      }
    }
  ): Promise<string> {
    const template = options?.template || 'default'
    const templatePath = path.join(this.templatesDir, `${template}.hbs`)

    try {
      const templateSource = await fs.readFile(templatePath, 'utf-8')
      const compiledTemplate = Handlebars.compile(templateSource)

      const data = {
        timestamp: new Date().toISOString(),
        results: testResults,
        analysis,
        branding: options?.branding,
        charts: this.generateChartData(testResults),
      }

      return compiledTemplate(data)
    } catch (error) {
      // Fallback to inline template
      return this.generateFallbackHTML(testResults, analysis)
    }
  }

  /**
   * Generate PDF report
   */
  async generatePDFReport(
    testResults: TestResults,
    analysis: any,
    outputPath: string
  ): Promise<string> {
    const htmlContent = await this.generateHTMLReport(testResults, analysis, {
      template: 'executive',
    })

    const options = {
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    }

    const file = { content: htmlContent }

    try {
      const pdfBuffer = await htmlPdf.generatePdf(file, options)
      await fs.writeFile(outputPath, pdfBuffer)
      return outputPath
    } catch (error) {
      console.error('PDF generation error:', error)
      throw error
    }
  }

  /**
   * Generate chart data for visualization
   */
  private generateChartData(results: TestResults): any {
    return {
      scores: {
        labels: ['Performance', 'Accessibility', 'SEO', 'Security'],
        data: [
          results.performance?.metrics.lcp || 0,
          results.accessibility?.passes || 0,
          results.seo?.score || 0,
          results.security?.score || 0,
        ],
      },
      issuesBySeverity: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        data: [
          results.summary.criticalIssues,
          results.summary.highIssues,
          results.summary.mediumIssues,
          results.summary.lowIssues,
        ],
      },
    }
  }

  /**
   * Fallback HTML template
   */
  private generateFallbackHTML(results: TestResults, analysis: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buglyze Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #0A2540; margin-bottom: 10px; }
    .score { font-size: 48px; font-weight: bold; color: #10B981; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .card { padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #0A2540; }
    .card h3 { font-size: 14px; color: #666; margin-bottom: 10px; }
    .card .value { font-size: 32px; font-weight: bold; color: #0A2540; }
    .issues { margin-top: 30px; }
    .issue { padding: 15px; margin: 10px 0; border-left: 4px solid #ef4444; background: #fef2f2; border-radius: 4px; }
    .issue.high { border-left-color: #f59e0b; background: #fffbeb; }
    .issue.medium { border-left-color: #3b82f6; background: #eff6ff; }
    .issue.low { border-left-color: #10b981; background: #f0fdf4; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Buglyze Test Report</h1>
    <p style="color: #666; margin-bottom: 30px;">Generated: ${new Date().toLocaleString()}</p>

    <div class="score">Overall Score: ${results.summary.overallScore}/100</div>

    <div class="summary">
      <div class="card">
        <h3>Total Issues</h3>
        <div class="value">${results.summary.totalIssues}</div>
      </div>
      <div class="card">
        <h3>Critical Issues</h3>
        <div class="value" style="color: #ef4444;">${results.summary.criticalIssues}</div>
      </div>
      <div class="card">
        <h3>Pages Tested</h3>
        <div class="value">${results.summary.pagesExplored}</div>
      </div>
      <div class="card">
        <h3>Tests Run</h3>
        <div class="value">${results.summary.testsExecuted}</div>
      </div>
    </div>

    <div class="issues">
      <h2 style="margin-bottom: 20px;">AI Analysis Summary</h2>
      <p style="line-height: 1.6; color: #444;">${analysis.summary}</p>
    </div>

    <div class="issues">
      <h2 style="margin-bottom: 20px;">Key Issues</h2>
      ${analysis.allIssues.slice(0, 10).map((issue: any) => `
        <div class="issue ${issue.severity}">
          <strong>${issue.title}</strong>
          <p style="margin: 10px 0; color: #666;">${issue.description}</p>
          <p style="font-size: 14px; color: #0A2540;"><strong>Recommendation:</strong> ${issue.recommendation}</p>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`
  }
}

export const reportGenerator = new ReportGenerator()
