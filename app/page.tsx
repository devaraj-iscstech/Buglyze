import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check, Zap, Shield, Target, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Buglyze
            </span>
          </Link>

          <nav className="hidden md:flex space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-primary transition">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-primary transition">
              Pricing
            </Link>
            <Link href="#docs" className="text-gray-600 hover:text-primary transition">
              Docs
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-primary to-secondary">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="inline-block mb-4 px-4 py-2 bg-secondary/10 rounded-full text-secondary text-sm font-medium">
            🚀 Enterprise-Grade Autonomous AI Testing
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
            Let AI Test Your Website Before Your Users Do
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive testing, visual regression, accessibility, performance, and security analysis powered by AI. Zero configuration required.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary text-lg px-8 py-6 h-auto">
                Start Testing for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto">
                Watch Demo
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>10 free tests/month</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Setup in 60 seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              All-in-One Testing Platform
            </h2>
            <p className="text-xl text-gray-600">
              Replace 8+ tools with a single AI-powered solution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-yellow-500" />}
              title="Intelligent Exploration"
              description="AI-powered autonomous navigation discovers and tests every corner of your application automatically."
            />
            <FeatureCard
              icon={<Target className="h-8 w-8 text-blue-500" />}
              title="Visual Regression"
              description="Pixel-perfect comparisons with AI-powered semantic visual diff that ignores dynamic content."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-green-500" />}
              title="Security Scanning"
              description="Comprehensive security assessment including SSL, headers, XSS, and OWASP Top 10 checks."
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8 text-purple-500" />}
              title="Performance Metrics"
              description="Complete Core Web Vitals analysis with actionable recommendations to improve speed."
            />
            <FeatureCard
              icon={<Check className="h-8 w-8 text-emerald-500" />}
              title="Accessibility Audits"
              description="WCAG 2.1 Level A, AA, AAA validation with detailed guidance for compliance."
            />
            <FeatureCard
              icon={<ArrowRight className="h-8 w-8 text-pink-500" />}
              title="SEO Optimization"
              description="Meta tags, structured data, and mobile-friendliness analysis for better rankings."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard value="99.9%" label="Uptime SLA" />
            <StatCard value="<10min" label="Average Test Time" />
            <StatCard value="60%" label="Cost Reduction" />
            <StatCard value="10x" label="Coverage Increase" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Ship with Confidence?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of developers who trust Buglyze to ensure quality
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-gradient-to-r from-primary to-secondary text-lg px-8 py-6 h-auto">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">B</span>
                </div>
                <span className="text-xl font-bold">Buglyze</span>
              </div>
              <p className="text-gray-600 text-sm">
                Enterprise-grade autonomous AI testing platform
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#pricing">Pricing</Link></li>
                <li><Link href="#docs">Documentation</Link></li>
                <li><Link href="#api">API</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#about">About</Link></li>
                <li><Link href="#blog">Blog</Link></li>
                <li><Link href="#careers">Careers</Link></li>
                <li><Link href="#contact">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#privacy">Privacy</Link></li>
                <li><Link href="#terms">Terms</Link></li>
                <li><Link href="#security">Security</Link></li>
                <li><Link href="#compliance">Compliance</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Buglyze. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border bg-white hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-4xl md:text-5xl font-bold mb-2">{value}</div>
      <div className="text-blue-100">{label}</div>
    </div>
  )
}
