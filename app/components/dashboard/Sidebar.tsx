'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  CheckSquare,
  FileText,
  UserCog,
  Settings,
  Activity,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { cn } from '@/app/lib/utils/cn';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  const mainNavItems: NavItem[] = [
    {
      name: t.dashboard?.nav?.dashboard || 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: t.dashboard?.nav?.clients || 'Clients',
      href: '/dashboard/clients',
      icon: Users,
    },
    {
      name: t.dashboard?.nav?.cases || 'Cases',
      href: '/dashboard/cases',
      icon: FolderOpen,
    },
    {
      name: t.dashboard?.nav?.tasks || 'Tasks',
      href: '/dashboard/tasks',
      icon: CheckSquare,
    },
    {
      name: t.dashboard?.nav?.documents || 'Documents',
      href: '/dashboard/documents',
      icon: FileText,
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      name: t.dashboard?.nav?.users || 'Users',
      href: '/dashboard/admin/users',
      icon: UserCog,
    },
    {
      name: t.dashboard?.nav?.settings || 'Settings',
      href: '/dashboard/admin/settings',
      icon: Settings,
    },
    {
      name: t.dashboard?.nav?.activity || 'Activity',
      href: '/dashboard/admin/activity',
      icon: Activity,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
        isActive(item.href)
          ? 'bg-amber-500 text-slate-900 font-medium'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}
      onClick={() => setMobileOpen(false)}
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span>{item.name}</span>}
    </Link>
  );

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-slate-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          {!collapsed ? (
            <h1 className="text-lg font-bold text-slate-900">
              Horeca<span className="text-amber-500">Vergunning</span>
            </h1>
          ) : (
            <span className="text-xl font-bold text-amber-500">HV</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 mt-4 border-t border-slate-200">
              {!collapsed && (
                <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t.dashboard?.nav?.admin || 'Admin'}
                </p>
              )}
              {adminNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Collapse button - desktop only */}
      <div className="hidden lg:block p-4 border-t border-slate-200">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 px-3 py-2 w-full text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft
            className={cn(
              'w-5 h-5 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
          {!collapsed && (
            <span className="text-sm">
              {t.dashboard?.nav?.collapse || 'Collapse'}
            </span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md border border-slate-200"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-slate-900/50 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[280px] bg-white border-r border-slate-200 z-50 flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[280px]'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
