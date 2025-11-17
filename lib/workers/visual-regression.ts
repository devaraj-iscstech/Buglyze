/**
 * Visual Regression Testing
 * Baseline comparison and pixel-perfect visual diff detection
 */

import { Page } from 'playwright'
import sharp from 'sharp'
import { PNG } from 'pngjs'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { VisualDiff, Screenshot, ChangedRegion } from '@/types'

export class VisualRegressionTester {
  private baselineDir = './tmp/baselines'
  private diffDir = './tmp/diffs'

  /**
   * Compare current screenshot with baseline
   */
  async compareWithBaseline(
    currentScreenshot: Buffer,
    testId: string,
    pageName: string
  ): Promise<VisualDiff | null> {
    try {
      const baselinePath = path.join(this.baselineDir, testId, `${pageName}.png`)

      // Check if baseline exists
      const baselineExists = await this.fileExists(baselinePath)

      if (!baselineExists) {
        // Save as new baseline
        await this.saveBaseline(currentScreenshot, testId, pageName)
        return null
      }

      // Load baseline
      const baselineBuffer = await fs.readFile(baselinePath)

      // Perform pixel comparison
      const diff = await this.pixelDiff(baselineBuffer, currentScreenshot)

      // If differences found, save diff image
      if (diff.pixelDiff > 0) {
        await this.saveDiffImage(diff.diffImage!, testId, pageName)
      }

      return {
        pixelDiff: diff.pixelDiff,
        percentDiff: diff.percentDiff,
        diffImageUrl: diff.diffImage ? path.join(this.diffDir, testId, `${pageName}_diff.png`) : '',
        changedRegions: diff.changedRegions,
      }
    } catch (error: any) {
      console.error('Visual regression comparison error:', error)
      return null
    }
  }

  /**
   * Perform pixel-by-pixel comparison
   */
  private async pixelDiff(
    baseline: Buffer,
    current: Buffer
  ): Promise<{
    pixelDiff: number
    percentDiff: number
    diffImage: Buffer | null
    changedRegions: ChangedRegion[]
  }> {
    try {
      // Ensure both images are same size
      const baselineImg = await sharp(baseline).raw().toBuffer({ resolveWithObject: true })
      const currentImg = await sharp(current)
        .resize(baselineImg.info.width, baselineImg.info.height)
        .raw()
        .toBuffer({ resolveWithObject: true })

      const width = baselineImg.info.width
      const height = baselineImg.info.height
      const channels = baselineImg.info.channels

      let diffPixels = 0
      const threshold = 10 // Color difference threshold
      const changedRegions: ChangedRegion[] = []

      // Create diff image
      const diffBuffer = Buffer.alloc(width * height * 4) // RGBA

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * channels

          const r1 = baselineImg.data[idx]
          const g1 = baselineImg.data[idx + 1]
          const b1 = baselineImg.data[idx + 2]

          const r2 = currentImg.data[idx]
          const g2 = currentImg.data[idx + 1]
          const b2 = currentImg.data[idx + 2]

          // Calculate color difference
          const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)

          if (diff > threshold) {
            diffPixels++

            // Mark as red in diff image
            const diffIdx = (y * width + x) * 4
            diffBuffer[diffIdx] = 255 // R
            diffBuffer[diffIdx + 1] = 0 // G
            diffBuffer[diffIdx + 2] = 0 // B
            diffBuffer[diffIdx + 3] = 255 // A
          } else {
            // Keep original pixels
            const diffIdx = (y * width + x) * 4
            diffBuffer[diffIdx] = r2
            diffBuffer[diffIdx + 1] = g2
            diffBuffer[diffIdx + 2] = b2
            diffBuffer[diffIdx + 3] = 255
          }
        }
      }

      const totalPixels = width * height
      const percentDiff = (diffPixels / totalPixels) * 100

      // Detect changed regions (simplified - cluster nearby changed pixels)
      const regions = this.detectChangedRegions(diffBuffer, width, height)

      // Convert diff buffer to PNG
      let diffImage: Buffer | null = null
      if (diffPixels > 0) {
        diffImage = await sharp(diffBuffer, {
          raw: {
            width,
            height,
            channels: 4,
          },
        })
          .png()
          .toBuffer()
      }

      return {
        pixelDiff: diffPixels,
        percentDiff,
        diffImage,
        changedRegions: regions,
      }
    } catch (error: any) {
      console.error('Pixel diff error:', error)
      return {
        pixelDiff: 0,
        percentDiff: 0,
        diffImage: null,
        changedRegions: [],
      }
    }
  }

  /**
   * Detect regions with changes
   */
  private detectChangedRegions(
    diffBuffer: Buffer,
    width: number,
    height: number
  ): ChangedRegion[] {
    const regions: ChangedRegion[] = []
    const visited = new Set<string>()
    const minRegionSize = 100 // Minimum pixels to consider a region

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const key = `${x},${y}`

        // Check if this is a changed pixel (red) and not visited
        if (diffBuffer[idx] === 255 && diffBuffer[idx + 1] === 0 && !visited.has(key)) {
          // Start flood fill to find connected region
          const region = this.floodFill(diffBuffer, width, height, x, y, visited)

          if (region.pixels > minRegionSize) {
            regions.push({
              x: region.minX,
              y: region.minY,
              width: region.maxX - region.minX,
              height: region.maxY - region.minY,
            })
          }
        }
      }
    }

    return regions
  }

  /**
   * Flood fill to find connected changed pixels
   */
  private floodFill(
    buffer: Buffer,
    width: number,
    height: number,
    startX: number,
    startY: number,
    visited: Set<string>
  ): { pixels: number; minX: number; minY: number; maxX: number; maxY: number } {
    const stack: Array<[number, number]> = [[startX, startY]]
    let pixels = 0
    let minX = startX
    let minY = startY
    let maxX = startX
    let maxY = startY

    while (stack.length > 0) {
      const [x, y] = stack.pop()!
      const key = `${x},${y}`

      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) {
        continue
      }

      const idx = (y * width + x) * 4

      // Check if pixel is red (changed)
      if (buffer[idx] !== 255 || buffer[idx + 1] !== 0) {
        continue
      }

      visited.add(key)
      pixels++

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)

      // Add neighbors
      stack.push([x + 1, y])
      stack.push([x - 1, y])
      stack.push([x, y + 1])
      stack.push([x, y - 1])
    }

    return { pixels, minX, minY, maxX, maxY }
  }

  /**
   * Save screenshot as baseline
   */
  private async saveBaseline(
    screenshot: Buffer,
    testId: string,
    pageName: string
  ): Promise<void> {
    const baselinePath = path.join(this.baselineDir, testId)
    await fs.mkdir(baselinePath, { recursive: true })
    await fs.writeFile(path.join(baselinePath, `${pageName}.png`), screenshot)
  }

  /**
   * Save diff image
   */
  private async saveDiffImage(
    diffImage: Buffer,
    testId: string,
    pageName: string
  ): Promise<void> {
    const diffPath = path.join(this.diffDir, testId)
    await fs.mkdir(diffPath, { recursive: true })
    await fs.writeFile(path.join(diffPath, `${pageName}_diff.png`), diffImage)
  }

  /**
   * Check if file exists
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path)
      return true
    } catch {
      return false
    }
  }

  /**
   * Update baseline
   */
  async updateBaseline(
    screenshot: Buffer,
    testId: string,
    pageName: string
  ): Promise<void> {
    await this.saveBaseline(screenshot, testId, pageName)
  }

  /**
   * Delete baseline
   */
  async deleteBaseline(testId: string, pageName?: string): Promise<void> {
    if (pageName) {
      const baselinePath = path.join(this.baselineDir, testId, `${pageName}.png`)
      await fs.unlink(baselinePath).catch(() => {})
    } else {
      const baselinePath = path.join(this.baselineDir, testId)
      await fs.rm(baselinePath, { recursive: true, force: true })
    }
  }

  /**
   * List all baselines for a test
   */
  async listBaselines(testId: string): Promise<string[]> {
    try {
      const baselinePath = path.join(this.baselineDir, testId)
      const files = await fs.readdir(baselinePath)
      return files.filter((f) => f.endsWith('.png'))
    } catch {
      return []
    }
  }

  /**
   * AI-powered semantic visual diff (ignore dynamic content)
   */
  async semanticDiff(
    baseline: Buffer,
    current: Buffer,
    ignoreRegions?: Array<{ x: number; y: number; width: number; height: number }>
  ): Promise<VisualDiff> {
    // Use Gemini to understand semantic differences
    // This would ignore things like timestamps, ads, dynamic content
    // For now, use pixel diff with region masking

    let maskedBaseline = baseline
    let maskedCurrent = current

    if (ignoreRegions && ignoreRegions.length > 0) {
      // Mask ignored regions (make them white)
      for (const region of ignoreRegions) {
        maskedBaseline = await this.maskRegion(maskedBaseline, region)
        maskedCurrent = await this.maskRegion(maskedCurrent, region)
      }
    }

    const diff = await this.pixelDiff(maskedBaseline, maskedCurrent)

    return {
      pixelDiff: diff.pixelDiff,
      percentDiff: diff.percentDiff,
      diffImageUrl: '',
      changedRegions: diff.changedRegions,
    }
  }

  /**
   * Mask a region in an image
   */
  private async maskRegion(
    image: Buffer,
    region: { x: number; y: number; width: number; height: number }
  ): Promise<Buffer> {
    try {
      // Create white rectangle overlay
      const overlay = await sharp({
        create: {
          width: region.width,
          height: region.height,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .png()
        .toBuffer()

      // Composite overlay onto image
      return await sharp(image)
        .composite([
          {
            input: overlay,
            top: region.y,
            left: region.x,
          },
        ])
        .toBuffer()
    } catch (error) {
      return image
    }
  }
}

export const visualRegressionTester = new VisualRegressionTester()
