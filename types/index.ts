// Core Types for Buglyze Platform

export interface TestConfig {
  url: string
  projectId?: string
  device?: 'desktop' | 'mobile' | 'tablet'
  viewport?: {
    width: number
    height: number
  }
  authentication?: {
    type: 'cookie' | 'header' | 'form'
    credentials?: Record<string, string>
    sessionState?: string
  }
  testTypes?: TestTypeOption[]
  timeout?: number
  maxDepth?: number
  maxPages?: number
}

export type TestTypeOption =
  | 'performance'
  | 'accessibility'
  | 'seo'
  | 'security'
  | 'visual'
  | 'functional'

export interface TestRun {
  id: string
  projectId: string
  url: string
  status: TestStatus
  testType: TestType
  startedAt?: Date
  completedAt?: Date
  duration?: number
  config?: TestConfig
  results?: TestResults
  issuesCount: number
  performanceScore?: number
  accessibilityScore?: number
  seoScore?: number
  securityScore?: number
  createdAt: Date
}

export type TestStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
export type TestType = 'manual' | 'scheduled' | 'ci_cd' | 'webhook'

export interface TestResults {
  summary: TestSummary
  performance?: PerformanceResults
  accessibility?: AccessibilityResults
  seo?: SEOResults
  security?: SecurityResults
  visual?: VisualResults
  navigation?: NavigationResults
  errors?: ErrorResults
}

export interface TestSummary {
  totalIssues: number
  criticalIssues: number
  highIssues: number
  mediumIssues: number
  lowIssues: number
  pagesExplored: number
  testsExecuted: number
  overallScore: number
}

export interface PerformanceResults {
  metrics: PerformanceMetrics
  opportunities: PerformanceOpportunity[]
  diagnostics: PerformanceDiagnostic[]
}

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  inp: number // Interaction to Next Paint

  // Additional Metrics
  fcp: number // First Contentful Paint
  tti: number // Time to Interactive
  tbt: number // Total Blocking Time
  speedIndex: number
  ttfb: number // Time to First Byte
}

export interface PerformanceOpportunity {
  id: string
  title: string
  description: string
  score: number
  numericValue: number
  displayValue: string
  details?: Record<string, any>
}

export interface PerformanceDiagnostic {
  id: string
  title: string
  description: string
  score: number
  details?: Record<string, any>
}

export interface AccessibilityResults {
  wcagLevel: 'A' | 'AA' | 'AAA'
  violations: AccessibilityViolation[]
  passes: number
  incomplete: number
}

export interface AccessibilityViolation {
  id: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor'
  description: string
  help: string
  helpUrl: string
  nodes: AccessibilityNode[]
}

export interface AccessibilityNode {
  html: string
  target: string[]
  failureSummary: string
}

export interface SEOResults {
  score: number
  issues: SEOIssue[]
  metaTags: MetaTags
  structuredData: StructuredData[]
  mobileFriendly: boolean
}

export interface SEOIssue {
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  recommendation: string
}

export interface MetaTags {
  title?: string
  description?: string
  canonical?: string
  robots?: string
  openGraph?: Record<string, string>
  twitter?: Record<string, string>
}

export interface StructuredData {
  type: string
  valid: boolean
  data: Record<string, any>
}

export interface SecurityResults {
  score: number
  vulnerabilities: SecurityVulnerability[]
  headers: SecurityHeaders
  ssl: SSLInfo
}

export interface SecurityVulnerability {
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  recommendation: string
  cwe?: string
  cvss?: number
}

export interface SecurityHeaders {
  contentSecurityPolicy?: string
  strictTransportSecurity?: string
  xFrameOptions?: string
  xContentTypeOptions?: string
  referrerPolicy?: string
  permissionsPolicy?: string
}

export interface SSLInfo {
  valid: boolean
  issuer?: string
  validFrom?: Date
  validTo?: Date
  protocol?: string
  cipher?: string
}

export interface VisualResults {
  screenshots: Screenshot[]
  baseline?: Screenshot
  diff?: VisualDiff
}

export interface Screenshot {
  id: string
  url: string
  path: string
  fullPage: boolean
  viewport: { width: number; height: number }
  timestamp: Date
}

export interface VisualDiff {
  pixelDiff: number
  percentDiff: number
  diffImageUrl: string
  changedRegions: ChangedRegion[]
}

export interface ChangedRegion {
  x: number
  y: number
  width: number
  height: number
}

export interface NavigationResults {
  pages: PageInfo[]
  flow: NavigationFlow
  coverage: number
}

export interface PageInfo {
  url: string
  title: string
  statusCode: number
  loadTime: number
  visited: boolean
  errors: string[]
}

export interface NavigationFlow {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export interface FlowNode {
  id: string
  url: string
  label: string
  visits: number
}

export interface FlowEdge {
  from: string
  to: string
  count: number
}

export interface ErrorResults {
  javascript: JavaScriptError[]
  network: NetworkError[]
  console: ConsoleMessage[]
}

export interface JavaScriptError {
  message: string
  stack?: string
  url: string
  line: number
  column: number
  severity: 'error' | 'warning'
}

export interface NetworkError {
  url: string
  status: number
  statusText: string
  method: string
  type: 'fetch' | 'xhr' | 'image' | 'stylesheet' | 'script'
}

export interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info'
  text: string
  location?: string
  timestamp: Date
}

export interface Issue {
  id: string
  testRunId: string
  type: IssueType
  severity: IssueSeverity
  title: string
  description: string
  location?: string
  screenshotUrl?: string
  recommendation?: string
  createdAt: Date
}

export type IssueType =
  | 'ui'
  | 'performance'
  | 'security'
  | 'accessibility'
  | 'seo'
  | 'functionality'
  | 'network'
  | 'javascript'

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface Project {
  id: string
  organizationId: string
  name: string
  baseUrl?: string
  description?: string
  settings?: ProjectSettings
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProjectSettings {
  defaultViewport?: { width: number; height: number }
  defaultDevice?: 'desktop' | 'mobile' | 'tablet'
  testTypes?: TestTypeOption[]
  notifications?: {
    email?: boolean
    slack?: boolean
    webhook?: boolean
  }
  thresholds?: {
    performance?: number
    accessibility?: number
    seo?: number
    security?: number
  }
}

export interface Organization {
  id: string
  name: string
  slug: string
  plan: SubscriptionPlan
  billingEmail?: string
  testQuota: number
  testUsage: number
  createdAt: Date
  updatedAt: Date
  settings?: OrganizationSettings
}

export type SubscriptionPlan = 'free' | 'pro' | 'team' | 'business' | 'enterprise'

export interface OrganizationSettings {
  logo?: string
  domain?: string
  whiteLabel?: boolean
  dataRetention?: number // days
  ssoEnabled?: boolean
  ipWhitelist?: string[]
}

export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  role: UserRole
  isVerified: boolean
  createdAt: Date
  lastLoginAt?: Date
}

export type UserRole = 'user' | 'admin' | 'super_admin'

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: MemberRole
  joinedAt: Date
  user?: User
}

export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer'

// API Response Types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: APIError
}

export interface APIError {
  code: string
  message: string
  details?: Record<string, any>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Queue Job Types
export interface TestJob {
  id: string
  testRunId: string
  config: TestConfig
  priority: number
  createdAt: Date
}

export interface AnalysisJob {
  id: string
  testRunId: string
  artifacts: string[]
  analysisType: 'ai' | 'performance' | 'accessibility' | 'seo' | 'security'
  createdAt: Date
}

// WebSocket Events
export type WebSocketEvent =
  | TestStartedEvent
  | TestProgressEvent
  | TestCompletedEvent
  | TestFailedEvent

export interface TestStartedEvent {
  type: 'test.started'
  testRunId: string
  timestamp: Date
}

export interface TestProgressEvent {
  type: 'test.progress'
  testRunId: string
  progress: {
    current: number
    total: number
    message: string
  }
  timestamp: Date
}

export interface TestCompletedEvent {
  type: 'test.completed'
  testRunId: string
  results: TestResults
  timestamp: Date
}

export interface TestFailedEvent {
  type: 'test.failed'
  testRunId: string
  error: string
  timestamp: Date
}
