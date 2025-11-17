/**
 * Scheduled Monitoring Service
 * Cron-based test execution for continuous monitoring
 */

import { CronJob } from 'cron'
import type { TestConfig } from '@/types'
import { executeEnhancedTest } from '@/lib/workers/enhanced-test-runner'
import { geminiAnalysisService } from '@/lib/services/gemini-analysis'

export interface MonitorConfig {
  id: string
  name: string
  url: string
  schedule: string // Cron expression
  testConfig: TestConfig
  enabled: boolean
  notifications?: {
    email?: string[]
    slack?: string
    teams?: string
  }
  thresholds?: {
    performanceScore?: number
    accessibilityScore?: number
    seoScore?: number
    securityScore?: number
  }
}

export class SchedulerService {
  private jobs: Map<string, CronJob> = new Map()
  private monitors: Map<string, MonitorConfig> = new Map()

  /**
   * Schedule a new monitor
   */
  async scheduleMonitor(config: MonitorConfig): Promise<void> {
    // Validate cron expression
    if (!this.isValidCron(config.schedule)) {
      throw new Error(`Invalid cron expression: ${config.schedule}`)
    }

    // Create cron job
    const job = new CronJob(
      config.schedule,
      async () => {
        await this.executeMonitor(config)
      },
      null,
      config.enabled,
      'America/New_York' // Default timezone
    )

    // Store job and config
    this.jobs.set(config.id, job)
    this.monitors.set(config.id, config)

    if (config.enabled) {
      job.start()
      console.log(`Monitor "${config.name}" scheduled with cron: ${config.schedule}`)
    }
  }

  /**
   * Execute a monitor
   */
  private async executeMonitor(config: MonitorConfig): Promise<void> {
    console.log(`Executing scheduled monitor: ${config.name}`)

    try {
      // Run test
      const results = await executeEnhancedTest(config.testConfig)

      // Run AI analysis
      const screenshotPaths = results.visual?.screenshots?.map((s) => s.path) || []
      const analysis = await geminiAnalysisService.generateComprehensiveReport(
        results,
        screenshotPaths
      )

      // Check thresholds
      const alerts = this.checkThresholds(config, results, analysis)

      // Send notifications if needed
      if (alerts.length > 0) {
        await this.sendNotifications(config, results, analysis, alerts)
      }

      // Log results
      console.log(`Monitor "${config.name}" completed:`)
      console.log(`- Overall Score: ${results.summary.overallScore}`)
      console.log(`- Issues: ${results.summary.totalIssues}`)
      console.log(`- Alerts: ${alerts.length}`)

      // Save to database (in production)
      // await saveMonitorResults(config.id, results, analysis)
    } catch (error: any) {
      console.error(`Monitor "${config.name}" failed:`, error)

      // Send failure notification
      await this.sendFailureNotification(config, error)
    }
  }

  /**
   * Check if results meet thresholds
   */
  private checkThresholds(
    config: MonitorConfig,
    results: any,
    analysis: any
  ): Array<{ type: string; message: string; severity: 'critical' | 'high' | 'medium' }> {
    const alerts: Array<{
      type: string
      message: string
      severity: 'critical' | 'high' | 'medium'
    }> = []

    if (!config.thresholds) return alerts

    // Check performance score
    if (
      config.thresholds.performanceScore &&
      results.summary.overallScore < config.thresholds.performanceScore
    ) {
      alerts.push({
        type: 'performance',
        message: `Performance score (${results.summary.overallScore}) is below threshold (${config.thresholds.performanceScore})`,
        severity: 'high',
      })
    }

    // Check accessibility score
    if (
      config.thresholds.accessibilityScore &&
      results.accessibility?.violations &&
      results.accessibility.violations.length > 0
    ) {
      const criticalViolations = results.accessibility.violations.filter(
        (v: any) => v.impact === 'critical'
      )
      if (criticalViolations.length > 0) {
        alerts.push({
          type: 'accessibility',
          message: `Found ${criticalViolations.length} critical accessibility violations`,
          severity: 'critical',
        })
      }
    }

    // Check SEO score
    if (config.thresholds.seoScore && results.seo?.score < config.thresholds.seoScore) {
      alerts.push({
        type: 'seo',
        message: `SEO score (${results.seo.score}) is below threshold (${config.thresholds.seoScore})`,
        severity: 'medium',
      })
    }

    // Check security score
    if (
      config.thresholds.securityScore &&
      results.security?.score < config.thresholds.securityScore
    ) {
      alerts.push({
        type: 'security',
        message: `Security score (${results.security.score}) is below threshold (${config.thresholds.securityScore})`,
        severity: 'critical',
      })
    }

    // Check for critical issues
    if (results.summary.criticalIssues > 0) {
      alerts.push({
        type: 'critical_issues',
        message: `Found ${results.summary.criticalIssues} critical issues`,
        severity: 'critical',
      })
    }

    return alerts
  }

  /**
   * Send notifications
   */
  private async sendNotifications(
    config: MonitorConfig,
    results: any,
    analysis: any,
    alerts: any[]
  ): Promise<void> {
    if (!config.notifications) return

    const message = this.formatNotificationMessage(config, results, analysis, alerts)

    // Send to Slack
    if (config.notifications.slack) {
      await this.sendSlackNotification(config.notifications.slack, message)
    }

    // Send to Teams
    if (config.notifications.teams) {
      await this.sendTeamsNotification(config.notifications.teams, message)
    }

    // Send emails
    if (config.notifications.email && config.notifications.email.length > 0) {
      await this.sendEmailNotifications(config.notifications.email, message)
    }
  }

  /**
   * Format notification message
   */
  private formatNotificationMessage(
    config: MonitorConfig,
    results: any,
    analysis: any,
    alerts: any[]
  ): any {
    return {
      title: `⚠️ BUGLYZE Monitor Alert: ${config.name}`,
      url: config.url,
      timestamp: new Date().toISOString(),
      summary: {
        overallScore: results.summary.overallScore,
        totalIssues: results.summary.totalIssues,
        criticalIssues: results.summary.criticalIssues,
      },
      alerts: alerts.map((alert) => ({
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
      })),
      aiSummary: analysis.summary,
      reportUrl: `https://app.buglyze.com/reports/${results.id}`, // Would be actual URL
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(webhookUrl: string, message: any): Promise<void> {
    try {
      const slackMessage = {
        text: message.title,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: message.title,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*URL:*\n${message.url}`,
              },
              {
                type: 'mrkdwn',
                text: `*Overall Score:*\n${message.summary.overallScore}/100`,
              },
              {
                type: 'mrkdwn',
                text: `*Total Issues:*\n${message.summary.totalIssues}`,
              },
              {
                type: 'mrkdwn',
                text: `*Critical Issues:*\n${message.summary.criticalIssues}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Alerts:*\n${message.alerts.map((a: any) => `• ${a.severity.toUpperCase()}: ${a.message}`).join('\n')}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*AI Summary:*\n${message.aiSummary}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View Full Report',
                },
                url: message.reportUrl,
                style: 'primary',
              },
            ],
          },
        ],
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      })

      if (!response.ok) {
        throw new Error(`Slack notification failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Slack notification error:', error)
    }
  }

  /**
   * Send Teams notification
   */
  private async sendTeamsNotification(webhookUrl: string, message: any): Promise<void> {
    try {
      const teamsMessage = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        summary: message.title,
        themeColor: message.summary.criticalIssues > 0 ? 'FF0000' : 'FFA500',
        title: message.title,
        sections: [
          {
            activityTitle: `Test Results for ${message.url}`,
            facts: [
              {
                name: 'Overall Score',
                value: `${message.summary.overallScore}/100`,
              },
              {
                name: 'Total Issues',
                value: message.summary.totalIssues.toString(),
              },
              {
                name: 'Critical Issues',
                value: message.summary.criticalIssues.toString(),
              },
            ],
          },
          {
            title: 'Alerts',
            text: message.alerts.map((a: any) => `- **${a.severity.toUpperCase()}**: ${a.message}`).join('\n\n'),
          },
          {
            title: 'AI Summary',
            text: message.aiSummary,
          },
        ],
        potentialAction: [
          {
            '@type': 'OpenUri',
            name: 'View Full Report',
            targets: [
              {
                os: 'default',
                uri: message.reportUrl,
              },
            ],
          },
        ],
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsMessage),
      })

      if (!response.ok) {
        throw new Error(`Teams notification failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Teams notification error:', error)
    }
  }

  /**
   * Send email notifications
   */
  private async sendEmailNotifications(emails: string[], message: any): Promise<void> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`Would send email notifications to: ${emails.join(', ')}`)
    console.log('Email content:', message)
  }

  /**
   * Send failure notification
   */
  private async sendFailureNotification(config: MonitorConfig, error: Error): Promise<void> {
    const message = {
      title: `❌ BUGLYZE Monitor Failed: ${config.name}`,
      url: config.url,
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
    }

    if (config.notifications?.slack) {
      await this.sendSlackNotification(config.notifications.slack, message)
    }

    if (config.notifications?.teams) {
      await this.sendTeamsNotification(config.notifications.teams, message)
    }
  }

  /**
   * Pause a monitor
   */
  pauseMonitor(monitorId: string): void {
    const job = this.jobs.get(monitorId)
    if (job) {
      job.stop()
      console.log(`Monitor ${monitorId} paused`)
    }
  }

  /**
   * Resume a monitor
   */
  resumeMonitor(monitorId: string): void {
    const job = this.jobs.get(monitorId)
    if (job) {
      job.start()
      console.log(`Monitor ${monitorId} resumed`)
    }
  }

  /**
   * Delete a monitor
   */
  deleteMonitor(monitorId: string): void {
    const job = this.jobs.get(monitorId)
    if (job) {
      job.stop()
      this.jobs.delete(monitorId)
      this.monitors.delete(monitorId)
      console.log(`Monitor ${monitorId} deleted`)
    }
  }

  /**
   * Update monitor configuration
   */
  async updateMonitor(monitorId: string, updates: Partial<MonitorConfig>): Promise<void> {
    const config = this.monitors.get(monitorId)
    if (!config) {
      throw new Error(`Monitor ${monitorId} not found`)
    }

    // Delete old job
    this.deleteMonitor(monitorId)

    // Create new job with updated config
    const updatedConfig = { ...config, ...updates }
    await this.scheduleMonitor(updatedConfig)
  }

  /**
   * Get all monitors
   */
  getAllMonitors(): MonitorConfig[] {
    return Array.from(this.monitors.values())
  }

  /**
   * Get monitor by ID
   */
  getMonitor(monitorId: string): MonitorConfig | undefined {
    return this.monitors.get(monitorId)
  }

  /**
   * Validate cron expression
   */
  private isValidCron(expression: string): boolean {
    try {
      new CronJob(expression, () => {})
      return true
    } catch {
      return false
    }
  }

  /**
   * Get next execution time for a monitor
   */
  getNextExecution(monitorId: string): Date | null {
    const job = this.jobs.get(monitorId)
    if (job) {
      return job.nextDate().toJSDate()
    }
    return null
  }

  /**
   * Get common cron patterns
   */
  static getCommonPatterns(): Record<string, string> {
    return {
      'Every 5 minutes': '*/5 * * * *',
      'Every 15 minutes': '*/15 * * * *',
      'Every 30 minutes': '*/30 * * * *',
      'Every hour': '0 * * * *',
      'Every 6 hours': '0 */6 * * *',
      'Every 12 hours': '0 */12 * * *',
      'Daily at midnight': '0 0 * * *',
      'Daily at noon': '0 12 * * *',
      'Weekly on Monday': '0 0 * * 1',
      'Monthly on 1st': '0 0 1 * *',
    }
  }
}

export const schedulerService = new SchedulerService()
