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
import { dashboardRoutes } from '@/app/lib/routes/dashboard';
import type { translations } from '@/app/lib/translations';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

type Translations = typeof translations['en'];

interface NavLinkProps {
  item: NavItem;
  collapsed: boolean;
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}

function NavLink({ item, collapsed, isActive, onNavigate }: NavLinkProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
        isActive(item.href)
          ? 'bg-amber-500 text-slate-900 font-medium'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}
      onClick={onNavigate}
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span>{item.name}</span>}
    </Link>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  isAdmin: boolean;
  mainNavItems: NavItem[];
  adminNavItems: NavItem[];
  isActive: (href: string) => boolean;
  onToggleCollapse: () => void;
  onNavigate: () => void;
  t: Translations;
}

function SidebarContent({
  collapsed,
  isAdmin,
  mainNavItems,
  adminNavItems,
  isActive,
  onToggleCollapse,
  onNavigate,
  t,
}: SidebarContentProps) {
  return (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-slate-200">
        <Link href={dashboardRoutes.employee.base} className="flex items-center gap-2">
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
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            isActive={isActive}
            onNavigate={onNavigate}
          />
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
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  isActive={isActive}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Collapse button - desktop only */}
      <div className="hidden lg:block p-4 border-t border-slate-200">
        <button
          onClick={onToggleCollapse}
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
      href: dashboardRoutes.employee.base,
      icon: LayoutDashboard,
    },
    {
      name: t.dashboard?.nav?.clients || 'Clients',
      href: dashboardRoutes.employee.clients,
      icon: Users,
    },
    {
      name: t.dashboard?.nav?.cases || 'Cases',
      href: dashboardRoutes.employee.cases,
      icon: FolderOpen,
    },
    {
      name: t.dashboard?.nav?.tasks || 'Tasks',
      href: dashboardRoutes.employee.tasks,
      icon: CheckSquare,
    },
    {
      name: t.dashboard?.nav?.documents || 'Documents',
      href: dashboardRoutes.employee.documents,
      icon: FileText,
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      name: t.dashboard?.nav?.users || 'Users',
      href: dashboardRoutes.employee.admin.users,
      icon: UserCog,
    },
    {
      name: t.dashboard?.nav?.settings || 'Settings',
      href: dashboardRoutes.employee.admin.settings,
      icon: Settings,
    },
    {
      name: t.dashboard?.nav?.activity || 'Activity',
      href: dashboardRoutes.employee.admin.activity,
      icon: Activity,
    },
  ];

  const isActive = (href: string) => {
    if (href === dashboardRoutes.employee.base) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };
  const handleToggleCollapse = () => setCollapsed((prev) => !prev);
  const handleNavigate = () => setMobileOpen(false);

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
              <SidebarContent
                collapsed={collapsed}
                isAdmin={isAdmin}
                mainNavItems={mainNavItems}
                adminNavItems={adminNavItems}
                isActive={isActive}
                onToggleCollapse={handleToggleCollapse}
                onNavigate={handleNavigate}
                t={t}
              />
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
        <SidebarContent
          collapsed={collapsed}
          isAdmin={isAdmin}
          mainNavItems={mainNavItems}
          adminNavItems={adminNavItems}
          isActive={isActive}
          onToggleCollapse={handleToggleCollapse}
          onNavigate={handleNavigate}
          t={t}
        />
      </aside>
    </>
  );
}
