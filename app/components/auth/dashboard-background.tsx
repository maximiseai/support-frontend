"use client";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Search,
  Users,
  CreditCard,
  FileText,
  Database,
  Settings,
  Sparkles,
  ArrowRight,
  Shield,
  Activity,
  Key,
  Building2
} from "lucide-react";

export function DashboardBackground() {
  const supportFeatures = [
    {
      title: "Team Management",
      description: "View and manage team accounts, credits, and permissions.",
      icon: Users,
      category: "Administration"
    },
    {
      title: "Credit Management",
      description: "Add, remove, or adjust credits for teams and users.",
      icon: CreditCard,
      category: "Administration"
    },
    {
      title: "API Management",
      description: "Manage rate limits and API access for teams.",
      icon: Key,
      category: "Configuration"
    },
    {
      title: "User Lookup",
      description: "Search and view user details across all teams.",
      icon: Search,
      category: "Support"
    },
    {
      title: "API Logs",
      description: "View detailed API request logs and usage patterns.",
      icon: FileText,
      category: "Monitoring"
    },
    {
      title: "Sales Nav Accounts",
      description: "Manage LinkedIn Sales Navigator account assignments.",
      icon: Building2,
      category: "Configuration"
    },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-neutral-200 flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-neutral-900 rounded flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-neutral-900">Enrich</div>
                <div className="text-xs text-neutral-500">Support Portal</div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 rounded-md text-sm placeholder:text-neutral-400"
                placeholder="Search..."
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3">
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 bg-neutral-100 rounded-md">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Teams</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-neutral-600 hover:bg-neutral-50 rounded-md">
                <Search className="h-4 w-4" />
                <span className="text-sm">Advanced Search</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-neutral-600 hover:bg-neutral-50 rounded-md">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">Credits</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-neutral-600 hover:bg-neutral-50 rounded-md">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Credit Logs</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-neutral-600 hover:bg-neutral-50 rounded-md">
                <Activity className="h-4 w-4" />
                <span className="text-sm">API Management</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-neutral-600 hover:bg-neutral-50 rounded-md">
                <Database className="h-4 w-4" />
                <span className="text-sm">API Logs</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-neutral-600 hover:bg-neutral-50 rounded-md">
                <Settings className="h-4 w-4" />
                <span className="text-sm">Sales Nav</span>
              </div>
            </div>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-neutral-50">
          {/* Header */}
          <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-neutral-900">Support Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Admin Access
              </Badge>
              <div className="h-8 w-8 bg-neutral-300 rounded-full"></div>
            </div>
          </header>

          {/* Page content */}
          <div className="p-6">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-2xl font-bold text-neutral-900">2,847</div>
                <div className="text-sm text-neutral-500">Total Teams</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-neutral-900">12.4M</div>
                <div className="text-sm text-neutral-500">Credits Issued</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-neutral-900">847K</div>
                <div className="text-sm text-neutral-500">API Calls Today</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-neutral-900">99.9%</div>
                <div className="text-sm text-neutral-500">Uptime</div>
              </Card>
            </div>

            {/* Features grid */}
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {supportFeatures.map((feature, i) => (
                <Card key={i} className="p-4 hover:shadow-sm hover:border-neutral-300 cursor-pointer transition-all">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-neutral-100 rounded-lg">
                        <feature.icon className="h-5 w-5 text-neutral-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-neutral-900">{feature.title}</h3>
                        <p className="text-xs text-neutral-500 mt-1">{feature.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                        {feature.category}
                      </Badge>
                      <ArrowRight className="h-3.5 w-3.5 text-neutral-300" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/30" />
    </div>
  );
}
