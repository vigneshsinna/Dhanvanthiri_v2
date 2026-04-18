import { Bell, ChevronDown, Lock, LogOut, Menu, Search, Settings, Shield, Store, User, X } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLogoutMutation } from '@/features/auth/api';
import { clearCredentials } from '@/features/auth/store/authSlice';
import { findAdminNavigationTrail, getAdminNavigation, type AdminNavItem } from '@/features/admin/config/navigation';
import { closeSidebar, openSidebar, setNotificationCount, toggleExpandedGroup } from '@/features/admin/store/adminSlice';
import { getRoleDisplayName, isItUserRole } from '@/features/auth/roleDisplay';
import { useAppDispatch, useAppSelector } from '@/lib/utils/hooks';
import { usePageScrollReveal } from '@/lib/utils/usePageScrollReveal';
import { useOmsModules } from '@/features/admin/hooks/useOmsModules';
import { useAdminNotificationsQuery } from '@/features/admin/api';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { sidebarCollapsed, expandedGroups, notificationCount } = useAppSelector((s) => s.admin);
  const isItUser = isItUserRole(user?.role);
  const pageContentRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const logoutMut = useLogoutMutation();

  usePageScrollReveal(pageContentRef, `${location.pathname}${location.search}`);

  const { isModuleEnabled } = useOmsModules();
  const { data: notificationsData } = useAdminNotificationsQuery();

  const navigation = useMemo(
    () => getAdminNavigation(isItUser ? 'super_admin' : 'admin'),
    [isItUser],
  );
  const trail = useMemo(
    () => findAdminNavigationTrail(location.pathname, navigation),
    [location.pathname, navigation],
  );
  const currentTitle = trail[trail.length - 1]?.label ?? 'Overview';
  const currentGroup = trail.length > 1 ? trail[0]?.label : 'Dashboard';

  useEffect(() => {
    dispatch(closeSidebar());
    setIsUserMenuOpen(false);
  }, [dispatch, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    dispatch(setNotificationCount(getUnreadNotificationCount(notificationsData)));
  }, [dispatch, notificationsData]);

  const handleLogout = async () => {
    try {
      await logoutMut.mutateAsync();
    } catch {
      // Clear local auth state even if the transport request fails.
    }

    dispatch(clearCredentials());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-slate-800/60 bg-slate-950 text-white transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
            }`}
        >
          <div className="flex flex-col h-full">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between gap-3">
                <Link to="/store-admin" className="group flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white shadow-lg shadow-brand-500/20">
                    A
                  </div>
                  <div>
                    <span className="text-xl font-bold tracking-tight text-white">ANIMAZON</span>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                      {isItUser ? 'Console' : 'Admin Panel'}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  className="rounded-full border border-slate-800 p-2 text-slate-400 transition hover:border-slate-700 hover:text-white lg:hidden"
                  onClick={() => dispatch(closeSidebar())}
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {navigation.map((item) => (
                <SidebarGroup
                  key={item.id}
                  item={item}
                  pathname={location.pathname}
                  expandedGroups={expandedGroups}
                  onToggle={() => dispatch(toggleExpandedGroup(item.id))}
                  onClose={() => dispatch(closeSidebar())}
                  isModuleEnabled={isModuleEnabled}
                  isItUser={isItUser}
                />
              ))}
            </nav>

            <div className="border-t border-slate-800 px-6 py-5">
              <div className="flex items-center justify-between gap-2">
                <Link to="/" className="inline-flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white">
                  <Store className="h-4 w-4" />
                  Storefront
                </Link>
                <div className="h-8 w-px bg-slate-800"></div>
                <button 
                  type="button" 
                  className="rounded-xl border border-transparent px-3 py-2 text-xs font-medium text-slate-400 transition hover:text-white"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </aside>

        {!sidebarCollapsed ? (
          <div
            className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
            onClick={() => dispatch(closeSidebar())}
            aria-label="Close navigation overlay"
          />
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl transition-all duration-300">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex flex-1 items-center gap-4">
                <button
                  type="button"
                  className="inline-flex rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
                  onClick={() => dispatch(openSidebar())}
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="hidden items-center gap-2.5 text-sm text-slate-500 md:flex">
                  <span className="text-slate-300">Admin</span>
                  <span className="text-slate-300">/</span>
                  {trail.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      <span className={`transition-colors ${index === trail.length - 1 ? 'font-semibold text-slate-900' : 'hover:text-slate-700'}`}>
                        {item.label}
                      </span>
                      {index < trail.length - 1 && <span className="text-slate-300">/</span>}
                    </div>
                  ))}
                  {trail.length === 0 && <span className="font-semibold text-slate-900">Overview</span>}
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-500 shadow-sm transition-colors focus-within:border-brand-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-brand-500 lg:w-64">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search anything..."
                    className="w-full border-none bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                  />
                  <div className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 lg:block">⌘K</div>
                </label>

                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                <button
                  type="button"
                  aria-label="View notifications"
                  className="relative inline-flex items-center justify-center p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 rounded-full"
                  onClick={() => navigate('/admin/notifications')}
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500"></span>
                    </span>
                  )}
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                <div ref={userMenuRef} className="relative">
                  <button
                    type="button"
                    aria-label="Open user menu"
                    aria-expanded={isUserMenuOpen}
                    className="flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1 pr-3 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    onClick={() => setIsUserMenuOpen((current) => !current)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 font-semibold text-white">
                      {(user?.name ?? 'A')[0].toUpperCase()}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-slate-900 leading-none">{user?.name ?? 'Admin User'}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-none">{getRoleDisplayName(user?.role)}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-400 hidden sm:block transition ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen ? (
                    <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                      <div className="border-b border-slate-100 px-3 py-2">
                        <p className="text-sm font-semibold text-slate-900">{user?.name ?? 'Admin User'}</p>
                        <p className="text-xs text-slate-500">{user?.email ?? 'admin@example.com'}</p>
                      </div>

                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <User className="h-4 w-4 text-slate-400" />
                          Profile
                        </Link>
                        <Link
                          to="/store-admin/settings"
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <Settings className="h-4 w-4 text-slate-400" />
                          Store Settings
                        </Link>
                        <Link
                          to="/profile/security"
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <Shield className="h-4 w-4 text-slate-400" />
                          Security Settings
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <main ref={pageContentRef} className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[1440px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

interface SidebarGroupProps {
  item: AdminNavItem;
  pathname: string;
  expandedGroups: string[];
  onToggle: () => void;
  onClose: () => void;
  isModuleEnabled: (code: string) => boolean;
  isItUser: boolean;
}

function SidebarGroup({ item, pathname, expandedGroups, onToggle, onClose, isModuleEnabled, isItUser }: SidebarGroupProps) {
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);
  const childIsActive = item.children?.some((child) => child.path && matchesPath(pathname, child.path)) ?? false;
  const isOpen = !hasChildren
    ? true
    : expandedGroups.includes(item.id) || childIsActive;
  const isActive = item.path ? matchesPath(pathname, item.path) : childIsActive;

  const isLocked = item.requiredModule ? !isModuleEnabled(item.requiredModule) : false;

  if (!hasChildren && item.path) {
    if (isLocked && !isItUser) {
      return (
        <div
          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600 opacity-60 cursor-not-allowed"
          title={`${item.label} requires activation`}
        >
          <span className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-600">
              <Icon className="h-4 w-4" />
            </span>
            <span className="font-medium">{item.label}</span>
          </span>
          <Lock className="h-3.5 w-3.5 text-amber-500/50" />
        </div>
      );
    }

    return (
      <Link
        to={item.path}
        onClick={onClose}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive
          ? 'bg-white text-slate-950 shadow-lg shadow-white/10'
          : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
      >
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-slate-950 text-white' : 'border border-slate-800 bg-slate-900 text-slate-500 group-hover:text-white'
          }`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1">{item.label}</span>
        {isLocked && isItUser && <span title="Locked for regular admins"><Lock className="h-3.5 w-3.5 text-amber-500" /></span>}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left font-medium transition-all ${childIsActive || isActive ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
      >
        <span className="flex items-center gap-3">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${childIsActive || isActive ? 'border-brand-500/30 bg-brand-500/10 text-brand-400' : 'border-slate-800 bg-slate-900 text-slate-500'
            }`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-sm">{item.label}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div className="ml-4 flex flex-col gap-1 border-l border-slate-800 pl-4">
          {item.children?.map((child) => (
            <SidebarChild
              key={child.id}
              item={child}
              pathname={pathname}
              onClose={onClose}
              isModuleEnabled={isModuleEnabled}
              isItUser={isItUser}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SidebarChild({ item, pathname, onClose, isModuleEnabled, isItUser }: {
  item: AdminNavItem;
  pathname: string;
  onClose: () => void;
  isModuleEnabled: (code: string) => boolean;
  isItUser: boolean;
}) {
  const Icon = item.icon;
  const isActive = item.path ? matchesPath(pathname, item.path) : false;
  const isLocked = item.requiredModule ? !isModuleEnabled(item.requiredModule) : false;

  if (!item.path) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
        <span>{item.label}</span>
      </div>
    );
  }

  if (isLocked && !isItUser) {
    return (
      <div
        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-600 opacity-50 cursor-not-allowed"
      >
        <span className="flex-1">{item.label}</span>
        <Lock className="h-3 w-3" />
      </div>
    );
  }

  return (
    <Link
      to={item.path}
      onClick={onClose}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isActive
        ? 'bg-slate-800 text-white'
        : 'text-slate-500 hover:text-white'
        }`}
    >
      <span className="flex-1">{item.label}</span>
      {isLocked && (
        <Lock className="h-3 w-3 text-amber-500" />
      )}
    </Link>
  );
}

function matchesPath(pathname: string, itemPath: string): boolean {
  if (itemPath === '/store-admin') {
    return pathname === '/store-admin';
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function getUnreadNotificationCount(payload: unknown): number {
  if (!payload || typeof payload !== 'object') {
    return 0;
  }

  const root = payload as {
    data?: {
      data?: Array<{ read?: boolean; read_at?: string | null }>;
      unread_count?: number;
    };
  };

  if (typeof root.data?.unread_count === 'number') {
    return root.data.unread_count;
  }

  const notifications = Array.isArray(root.data?.data) ? root.data.data : [];
  return notifications.filter((notification) => notification.read === false || notification.read_at == null).length;
}
