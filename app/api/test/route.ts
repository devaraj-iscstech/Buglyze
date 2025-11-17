/**
 * Test API Route
 * POST /api/test - Create and execute a new test run
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { executeTest } from '@/lib/workers/test-runner'
import { aiAnalysisService } from '@/lib/services/ai-analysis'
import type { TestConfig } from '@/types'

// Validation schema
const testRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  projectId: z.string().uuid().optional(),
  device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  viewport: z
    .object({
      width: z.number().min(320).max(3840),
      height: z.number().min(240).max(2160),
    })
    .optional(),
  testTypes: z
    .array(
      z.enum([
        'performance',
        'accessibility',
        'seo',
        'security',
        'visual',
        'functional',
      ])
    )
    .optional(),
  authentication: z
    .object({
      type: z.enum(['cookie', 'header', 'form']),
      credentials: z.record(z.string()).optional(),
      sessionState: z.string().optional(),
    })
    .optional(),
  timeout: z.number().min(10000).max(300000).optional(),
  maxDepth: z.number().min(1).max(10).optional(),
  maxPages: z.number().min(1).max(100).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = testRequestSchema.parse(body)

    // Create test configuration
    const config: TestConfig = {
      url: validatedData.url,
      projectId: validatedData.projectId,
      device: validatedData.device || 'desktop',
      viewport: validatedData.viewport || { width: 1920, height: 1080 },
      testTypes: validatedData.testTypes || [
        'performance',
        'accessibility',
        'seo',
        'security',
      ],
      authentication: validatedData.authentication,
      timeout: validatedData.timeout || 60000,
      maxDepth: validatedData.maxDepth || 3,
      maxPages: validatedData.maxPages || 20,
    }

    // Generate test run ID
    const testRunId = generateTestRunId()

    // Start test execution (in production, this would be queued)
    console.log(`Starting test run ${testRunId} for ${config.url}`)

    // Execute test asynchronously
    executeTestAsync(testRunId, config)

    // Return immediate response
    return NextResponse.json(
      {
        success: true,
        data: {
          testRunId,
          status: 'queued',
          message: 'Test has been queued and will start shortly',
          estimatedDuration: 120, // seconds
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Test creation error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create test',
          details: error.message,
        },
      },
      { status: 500 }
    )
  }
}

/**
 * Execute test asynchronously
 */
async function executeTestAsync(testRunId: string, config: TestConfig) {
  try {
    console.log(`Executing test ${testRunId}...`)

    // Update status to running (in production, update database)
    console.log(`Test ${testRunId} status: running`)

    // Execute the test
    const results = await executeTest(config)

    console.log(`Test ${testRunId} completed successfully`)
    console.log(`Issues found: ${results.summary.totalIssues}`)
    console.log(`Overall score: ${results.summary.overallScore}`)

    // Run AI analysis on results
    const analysis = await aiAnalysisService.generateComprehensiveReport(
      results,
      [] // Screenshots would be passed here
    )

    console.log(`AI analysis completed for test ${testRunId}`)
    console.log(`AI Summary: ${analysis.summary}`)
    console.log(`Total issues identified: ${analysis.allIssues.length}`)

    // In production, save results to database and notify user
    // await saveTestResults(testRunId, results, analysis)
    // await notifyUser(testRunId, 'completed')

    console.log(`Test ${testRunId} fully processed`)
  } catch (error: any) {
    console.error(`Test ${testRunId} failed:`, error)

    // In production, update database and notify user of failure
    // await updateTestStatus(testRunId, 'failed', error.message)
    // await notifyUser(testRunId, 'failed')
  }
}

/**
 * Generate unique test run ID
 */
function generateTestRunId(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * GET endpoint to list tests or get test details
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const testId = searchParams.get('id')

  if (testId) {
    // Return specific test details
    // In production, fetch from database
    return NextResponse.json({
      success: true,
      data: {
        id: testId,
        status: 'completed',
        message: 'This is a mock response. Connect to database for real data.',
      },
    })
  }

  // Return list of tests
  // In production, fetch from database with pagination
  return NextResponse.json({
    success: true,
    data: {
      tests: [],
      total: 0,
      page: 1,
      pageSize: 20,
    },
  })
}
