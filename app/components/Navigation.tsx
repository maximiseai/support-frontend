'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { useState } from 'react';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await axios.post('/api/auth/logout');
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  const navItems = [
    { href: '/teams', label: 'Teams' },
    { href: '/advanced-search', label: 'Advanced Search' },
    { href: '/credits', label: 'Credits' },
    { href: '/credit-logs', label: 'Credit Logs' },
    { href: '/rate-limits', label: 'API Management' },
    { href: '/users', label: 'Users' },
    { href: '/apis', label: 'APIs' },
    { href: '/sales-nav-accounts', label: 'Sales Nav' },
    { href: '/api-logs', label: 'API Logs' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8 flex-1">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <Image
              src="/logo_no_text.svg"
              alt="Enrich"
              width={32}
              height={32}
              priority
            />
            <span className="text-lg font-semibold tracking-tight text-neutral-900">
              Support
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-neutral-900 ${
                  pathname === item.href
                    ? 'text-neutral-900'
                    : 'text-neutral-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </div>
    </header>
  );
}
