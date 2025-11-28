import { DashboardBackground } from '@/app/components/auth/dashboard-background';

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen">
      {/* Dashboard background */}
      <DashboardBackground />

      {/* Auth content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Glass morphism card */}
          <div className="relative">
            {/* Card glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-20 animate-pulse" />

            {/* Main card */}
            <div className="relative bg-white/85 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-200/50 p-8 sm:p-10">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
