'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  HomeIcon,
  DocumentArrowUpIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Upload Data', href: '/upload', icon: DocumentArrowUpIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <div className="flex flex-shrink-0 items-center px-4">
          <h1 className="text-xl font-bold text-white">AR Recovery</h1>
        </div>
        <nav className="mt-5 flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 h-6 w-6 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-shrink-0 border-t border-gray-800 p-4">
        <div className="flex w-full items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{session?.user?.name || session?.user?.email}</p>
            <p className="text-xs text-gray-400">{session?.user?.orgName}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="ml-3 rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
            title="Sign out"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
