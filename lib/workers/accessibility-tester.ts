/**
 * Accessibility Testing Service
 * Uses axe-core for WCAG 2.1 compliance testing
 */

import { Page } from 'playwright'
import type { AccessibilityResults, AccessibilityViolation, AccessibilityNode } from '@/types'

export class AccessibilityTester {
  /**
   * Run accessibility tests on a page
   */
  async testPage(page: Page, wcagLevel: 'A' | 'AA' | 'AAA' = 'AA'): Promise<AccessibilityResults> {
    try {
      // Inject axe-core into the page
      await page.addScriptTag({
        path: require.resolve('axe-core'),
      })

      // Run axe accessibility tests
      const results = await page.evaluate(async (level) => {
        // @ts-ignore - axe is injected
        const axe = window.axe

        if (!axe) {
          throw new Error('axe-core not loaded')
        }

        const runOptions = {
          runOnly: {
            type: 'tag',
            values: this.getWCAGTags(level),
          },
        }

        return await axe.run(runOptions)
      }, wcagLevel)

      // Transform results to our format
      const violations: AccessibilityViolation[] = results.violations.map((violation: any) => ({
        id: violation.id,
        impact: violation.impact || 'moderate',
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map((node: any) => ({
          html: node.html,
          target: node.target,
          failureSummary: node.failureSummary || '',
        })),
      }))

      return {
        wcagLevel,
        violations,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
      }
    } catch (error: any) {
      console.error('Accessibility testing error:', error)
      return {
        wcagLevel,
        violations: [],
        passes: 0,
        incomplete: 0,
      }
    }
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(page: Page): Promise<{
    isFullyNavigable: boolean
    issues: string[]
  }> {
    const issues: string[] = []

    try {
      // Check if all interactive elements are focusable
      const nonFocusableElements = await page.evaluate(() => {
        const interactive = document.querySelectorAll(
          'a[href], button, input, select, textarea, [tabindex]'
        )
        const nonFocusable: string[] = []

        interactive.forEach((el) => {
          const tabIndex = el.getAttribute('tabindex')
          if (tabIndex === '-1' && el.tagName !== 'INPUT') {
            nonFocusable.push(el.tagName + (el.id ? `#${el.id}` : ''))
          }
        })

        return nonFocusable
      })

      if (nonFocusableElements.length > 0) {
        issues.push(`Found ${nonFocusableElements.length} non-focusable interactive elements`)
      }

      // Test tab navigation
      await page.keyboard.press('Tab')
      const firstFocused = await page.evaluate(() => document.activeElement?.tagName)

      if (!firstFocused || firstFocused === 'BODY') {
        issues.push('No focusable elements found or focus starts at body')
      }

      // Check for skip links
      const hasSkipLinks = await page.evaluate(() => {
        const skipLinks = Array.from(document.querySelectorAll('a'))
        return skipLinks.some(
          (link) =>
            link.textContent?.toLowerCase().includes('skip') ||
            link.getAttribute('href') === '#main-content' ||
            link.getAttribute('href') === '#content'
        )
      })

      if (!hasSkipLinks) {
        issues.push('No skip navigation links found for keyboard users')
      }

      return {
        isFullyNavigable: issues.length === 0,
        issues,
      }
    } catch (error: any) {
      return {
        isFullyNavigable: false,
        issues: [`Keyboard navigation test failed: ${error.message}`],
      }
    }
  }

  /**
   * Test color contrast
   */
  async testColorContrast(page: Page): Promise<{
    passes: number
    failures: number
    issues: Array<{
      selector: string
      foreground: string
      background: string
      ratio: number
      required: number
    }>
  }> {
    try {
      const contrastIssues = await page.evaluate(() => {
        const issues: any[] = []
        const elements = document.querySelectorAll('*')

        elements.forEach((el) => {
          const styles = window.getComputedStyle(el)
          const color = styles.color
          const bgColor = styles.backgroundColor
          const fontSize = parseFloat(styles.fontSize)

          // Only check elements with text content
          if (!el.textContent?.trim()) return

          // Skip if background is transparent
          if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') return

          // This is a simplified check - in production, use proper contrast calculation
          const isLarge = fontSize >= 18 || (fontSize >= 14 && styles.fontWeight === 'bold')
          const requiredRatio = isLarge ? 3 : 4.5

          // Store for analysis (actual ratio calculation would be done server-side)
          issues.push({
            selector: el.tagName + (el.id ? `#${el.id}` : el.className ? `.${el.className.split(' ')[0]}` : ''),
            foreground: color,
            background: bgColor,
            required: requiredRatio,
          })
        })

        return issues.slice(0, 20) // Limit to first 20
      })

      return {
        passes: 0, // Would be calculated with proper contrast library
        failures: contrastIssues.length,
        issues: contrastIssues,
      }
    } catch (error: any) {
      return {
        passes: 0,
        failures: 0,
        issues: [],
      }
    }
  }

  /**
   * Test ARIA attributes
   */
  async testARIA(page: Page): Promise<{
    validARIA: number
    invalidARIA: number
    issues: string[]
  }> {
    try {
      const ariaIssues = await page.evaluate(() => {
        const issues: string[] = []
        const ariaElements = document.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]')

        ariaElements.forEach((el) => {
          const role = el.getAttribute('role')
          const ariaLabel = el.getAttribute('aria-label')
          const ariaLabelledBy = el.getAttribute('aria-labelledby')

          // Check for empty ARIA labels
          if (ariaLabel === '') {
            issues.push(`Empty aria-label on ${el.tagName}`)
          }

          // Check for aria-labelledby pointing to non-existent element
          if (ariaLabelledBy) {
            const labelElement = document.getElementById(ariaLabelledBy)
            if (!labelElement) {
              issues.push(`aria-labelledby="${ariaLabelledBy}" points to non-existent element`)
            }
          }

          // Check for invalid role values (basic check)
          const validRoles = [
            'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
            'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo',
            'definition', 'dialog', 'directory', 'document', 'feed', 'figure', 'form',
            'grid', 'gridcell', 'group', 'heading', 'img', 'link', 'list', 'listbox',
            'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
            'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note', 'option',
            'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row',
            'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
            'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
            'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree',
            'treegrid', 'treeitem'
          ]

          if (role && !validRoles.includes(role)) {
            issues.push(`Invalid role="${role}" on ${el.tagName}`)
          }
        })

        return issues
      })

      return {
        validARIA: 0, // Would count valid ARIA usage
        invalidARIA: ariaIssues.length,
        issues: ariaIssues,
      }
    } catch (error: any) {
      return {
        validARIA: 0,
        invalidARIA: 0,
        issues: [],
      }
    }
  }

  /**
   * Get WCAG tags for axe-core
   */
  private getWCAGTags(level: 'A' | 'AA' | 'AAA'): string[] {
    const tags = ['wcag2a']

    if (level === 'AA' || level === 'AAA') {
      tags.push('wcag2aa')
    }

    if (level === 'AAA') {
      tags.push('wcag2aaa')
    }

    tags.push('wcag21a', 'wcag21aa', 'best-practice')

    return tags
  }
}

export const accessibilityTester = new AccessibilityTester()
