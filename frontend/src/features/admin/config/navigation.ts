import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Award,
  Bell,
  Boxes,
  ClipboardList,
  CreditCard,
  FileBarChart2,
  FileText,
  FolderKanban,
  Image,
  Inbox,
  LayoutDashboard,
  Lock,
  MessageSquareText,
  Mail,
  Package,
  Palette,
  Ruler,
  Server,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Tags,
  Truck,
  UserCog,
  Users,
  Megaphone,
  AppWindow,
  HelpCircle,
  RotateCcw,
  Eye,
} from 'lucide-react';
import type { UserRole } from '@/features/auth/store/authSlice';

export type AdminRole = Extract<UserRole, 'admin' | 'super_admin'>;

export interface AdminNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: AdminRole[];
  path?: string;
  description?: string;
  children?: AdminNavItem[];
  /** When set, this item requires a licensed module. Shows a lock icon when not licensed. */
  requiredModule?: string;
  /** When true, indicates this page has a working backend API. Pages without this flag will be hidden. */
  backedByApi?: boolean;
}

export const adminNavigation: AdminNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/store-admin',
    roles: ['admin', 'super_admin'],
    backedByApi: true,
  },

  {
    id: 'oms',
    label: 'OMS',
    icon: Truck,
    roles: ['admin', 'super_admin'],
    children: [
      {
        id: 'order-operations',
        label: 'Order Operations',
        icon: ClipboardList,
        path: '/store-admin/orders',
        roles: ['admin', 'super_admin'],
        backedByApi: true,
      },
      {
        id: 'shipments',
        label: 'Shipments',
        icon: Truck,
        path: '/store-admin/shipments',
        roles: ['admin', 'super_admin'],
        requiredModule: 'oms_shipments',
      },
      {
        id: 'returns',
        label: 'Returns',
        icon: RotateCcw,
        path: '/store-admin/returns',
        roles: ['admin', 'super_admin'],
        requiredModule: 'oms_returns',
      },
      {
        id: 'tracking',
        label: 'Tracking',
        icon: Eye,
        path: '/store-admin/tracking',
        roles: ['admin', 'super_admin'],
        requiredModule: 'oms_tracking',
      },
      {
        id: 'payments',
        label: 'Payments',
        icon: CreditCard,
        path: '/store-admin/payments',
        roles: ['admin', 'super_admin'],
        requiredModule: 'payment_gateways',
      },
      {
        id: 'payment-methods',
        label: 'Payment Methods',
        icon: CreditCard,
        path: '/store-admin/payment-methods',
        roles: ['super_admin'],
        backedByApi: true,
      },
    ],
  },
  {
    id: 'catalog',
    label: 'Catalog',
    icon: Boxes,
    roles: ['admin'],
    children: [
      {
        id: 'products',
        label: 'Products',
        icon: Package,
        path: '/store-admin/products',
        roles: ['admin'],
        backedByApi: true,
      },
      {
        id: 'categories',
        label: 'Categories',
        icon: Tags,
        path: '/store-admin/categories',
        roles: ['admin'],
        backedByApi: true,
      },
      {
        id: 'brands',
        label: 'Brands',
        icon: Award,
        path: '/store-admin/brands',
        roles: ['admin'],
      },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: FolderKanban,
        path: '/store-admin/inventory',
        roles: ['admin'],
      },
      {
        id: 'reviews',
        label: 'Reviews',
        icon: MessageSquareText,
        path: '/store-admin/reviews',
        roles: ['admin'],
      },
      {
        id: 'product-queries',
        label: 'Product Q&A',
        icon: HelpCircle,
        path: '/store-admin/product-queries',
        roles: ['admin'],
      },
      {
        id: 'attributes',
        label: 'Attributes',
        icon: SlidersHorizontal,
        path: '/store-admin/attributes',
        roles: ['admin'],
      },
      {
        id: 'colors',
        label: 'Colors',
        icon: Palette,
        path: '/store-admin/colors',
        roles: ['admin'],
      },
      {
        id: 'size-charts',
        label: 'Size Charts',
        icon: Ruler,
        path: '/store-admin/size-charts',
        roles: ['admin'],
      },
      {
        id: 'warranties',
        label: 'Warranties',
        icon: ShieldCheck,
        path: '/store-admin/warranties',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'cms',
    label: 'CMS',
    icon: FileText,
    roles: ['admin'],
    children: [
      {
        id: 'pages',
        label: 'Pages',
        icon: FileText,
        path: '/store-admin/pages',
        roles: ['admin'],
        requiredModule: 'cms_management',
        backedByApi: true,
      },
      {
        id: 'posts',
        label: 'Posts',
        icon: FileText,
        path: '/store-admin/posts',
        roles: ['admin'],
        requiredModule: 'cms_management',
        backedByApi: true,
      },
      {
        id: 'banners',
        label: 'Banners',
        icon: Image,
        path: '/store-admin/banners',
        roles: ['admin'],
        requiredModule: 'cms_management',
      },
      {
        id: 'faqs',
        label: 'FAQs',
        icon: MessageSquareText,
        path: '/store-admin/faqs',
        roles: ['admin'],
        requiredModule: 'cms_management',
        backedByApi: true,
      },
      {
        id: 'media',
        label: 'Media Library',
        icon: Image,
        path: '/store-admin/media',
        roles: ['admin'],
        requiredModule: 'cms_management',
      },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    roles: ['admin'],
    children: [
      {
        id: 'alerts',
        label: 'Global Alerts',
        icon: Megaphone,
        path: '/store-admin/alerts',
        roles: ['admin'],
        requiredModule: 'marketing_management',
      },
      {
        id: 'popups',
        label: 'Promotional Popups',
        icon: AppWindow,
        path: '/store-admin/popups',
        roles: ['admin'],
        requiredModule: 'marketing_management',
      },
      {
        id: 'subscribers',
        label: 'Subscribers',
        icon: Mail,
        path: '/store-admin/subscribers',
        roles: ['admin'],
        requiredModule: 'marketing_management',
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    roles: ['admin'],
    children: [
      {
        id: 'customers-list',
        label: 'Customers',
        icon: Users,
        path: '/store-admin/customers',
        roles: ['admin'],
        requiredModule: 'customer_management',
      },
      {
        id: 'contact-messages',
        label: 'Contact Inquiries',
        icon: Inbox,
        path: '/store-admin/contact-messages',
        roles: ['admin'],
        requiredModule: 'customer_management',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileBarChart2,
    roles: ['admin'],
    children: [
      {
        id: 'sales-reports',
        label: 'Sales Reports',
        icon: FileBarChart2,
        path: '/store-admin/reports',
        roles: ['admin'],
        requiredModule: 'sales_reports',
      },
    ],
  },
  {
    id: 'license-system',
    label: 'License & System',
    icon: ShieldCheck,
    roles: ['super_admin'],
    children: [
      {
        id: 'module-licenses',
        label: 'Module Licenses',
        icon: ShieldCheck,
        path: '/store-admin/modules',
        roles: ['super_admin'],
      },
      {
        id: 'system-notifications',
        label: 'System Notifications',
        icon: Bell,
        path: '/store-admin/notifications',
        roles: ['super_admin'],
      },
      {
        id: 'activity-logs',
        label: 'System Activity Logs',
        icon: Activity,
        path: '/store-admin/activity-logs',
        roles: ['super_admin'],
      },
      {
        id: 'system-admin',
        label: 'System Admin',
        icon: Server,
        path: '/store-admin/system',
        roles: ['super_admin'],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    roles: ['admin', 'super_admin'],
    children: [
      {
        id: 'store-settings',
        label: 'Store Settings',
        icon: Settings,
        path: '/store-admin/settings',
        roles: ['admin'],
      },
      {
        id: 'notification-templates',
        label: 'Email & SMS Templates',
        icon: FileText,
        path: '/store-admin/notification-templates',
        roles: ['admin'],
      },
      {
        id: 'admin-user-access',
        label: 'Admin User Access',
        icon: UserCog,
        path: '/store-admin/admins',
        roles: ['super_admin'],
      },
    ],
  },
];

export function getAdminNavigation(role: AdminRole): AdminNavItem[] {
  return adminNavigation
    .filter((item) => item.roles.includes(role))
    .map((item) => {
      // Filter children by both role and backedByApi
      const filteredChildren = item.children
        ?.filter((child) => child.roles.includes(role))
        .filter((child) => child.backedByApi);

      return {
        ...item,
        children: filteredChildren,
      };
    })
    // Only show parent items that are either backed themselves or have backed children
    .filter((item) => item.backedByApi || (item.children && item.children.length > 0));
}

export function flattenAdminNavigation(items: AdminNavItem[]): AdminNavItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenAdminNavigation(item.children) : [])]);
}

export function findAdminNavigationTrail(pathname: string, items: AdminNavItem[]): AdminNavItem[] {
  for (const item of items) {
    if (item.path && matchesPath(pathname, item.path)) {
      return [item];
    }

    if (item.children) {
      const childTrail = findAdminNavigationTrail(pathname, item.children);
      if (childTrail.length > 0) {
        return [item, ...childTrail];
      }
    }
  }

  return [];
}

function matchesPath(pathname: string, itemPath: string): boolean {
  if (itemPath === '/store-admin') {
    return pathname === '/store-admin';
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}
