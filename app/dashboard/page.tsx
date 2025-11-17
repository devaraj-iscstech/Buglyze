'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Plus, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function DashboardPage() {
  const [isRunningTest, setIsRunningTest] = useState(false)
  const [testUrl, setTestUrl] = useState('')
  const [testResult, setTestResult] = useState<any>(null)

  const handleRunTest = async () => {
    if (!testUrl) return

    setIsRunningTest(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testUrl,
          device: 'desktop',
          testTypes: ['performance', 'accessibility', 'seo', 'security'],
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({
          id: data.data.testRunId,
          status: data.data.status,
          message: data.data.message,
        })
      }
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setIsRunningTest(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-2xl font-bold">Buglyze</span>
            </div>

            <nav className="flex items-center space-x-6">
              <a href="/dashboard" className="text-primary font-medium">
                Dashboard
              </a>
              <a href="/projects" className="text-gray-600 hover:text-primary">
                Projects
              </a>
              <a href="/settings" className="text-gray-600 hover:text-primary">
                Settings
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Test Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Run a Quick Test</h2>
          <p className="text-gray-600 mb-6">
            Enter a URL to start an automated test. We'll analyze performance, accessibility,
            SEO, and security.
          </p>

          <div className="flex gap-4">
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isRunningTest}
            />
            <Button
              onClick={handleRunTest}
              disabled={isRunningTest || !testUrl}
              className="bg-gradient-to-r from-primary to-secondary px-8"
              size="lg"
            >
              {isRunningTest ? (
                <>
                  <Clock className="mr-2 h-5 w-5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Run Test
                </>
              )}
            </Button>
          </div>

          {testResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="font-medium text-green-900">{testResult.message}</p>
                  <p className="text-sm text-green-700">Test ID: {testResult.id}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tests This Month"
            value="0"
            icon={<TrendingUp className="h-6 w-6 text-blue-500" />}
            trend="+0%"
          />
          <StatCard
            title="Total Issues"
            value="0"
            icon={<AlertCircle className="h-6 w-6 text-yellow-500" />}
            trend="-0%"
          />
          <StatCard
            title="Avg Performance"
            value="0"
            icon={<CheckCircle className="h-6 w-6 text-green-500" />}
            trend="+0%"
          />
          <StatCard
            title="Active Monitors"
            value="0"
            icon={<Clock className="h-6 w-6 text-purple-500" />}
            trend="0"
          />
        </div>

        {/* Recent Tests */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Recent Tests</h2>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No tests yet</p>
            <p className="text-sm">Run your first test to get started</p>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string
  value: string
  icon: React.ReactNode
  trend: string
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-green-600">{trend}</div>
    </div>
  )
}
