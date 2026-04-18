import { describe, it, expect } from 'vitest';
import adminReducer, {
  openSidebar,
  setPeriod,
  setRevenueChartGroupBy,
  toggleExpandedGroup,
  toggleSidebar,
  setNotificationCount,
} from './adminSlice';
import { getAdminNavigation, flattenAdminNavigation } from '@/features/admin/config/navigation';

describe('adminSlice', () => {
  it('returns initial state', () => {
      const state = adminReducer(undefined, { type: 'unknown' });
      expect(state.period).toBe('month');
      expect(state.revenueChartGroupBy).toBe('day');
      expect(state.sidebarCollapsed).toBe(true);
      expect(state.notificationCount).toBe(0);
      expect(state.expandedGroups).toContain('commerce');
    });

  describe('setPeriod', () => {
    it('changes period', () => {
      const state = adminReducer(undefined, setPeriod('week'));
      expect(state.period).toBe('week');
    });

    it('supports all period values', () => {
      const periods = ['today', 'week', 'month', 'year'] as const;
      periods.forEach(period => {
        const state = adminReducer(undefined, setPeriod(period));
        expect(state.period).toBe(period);
      });
    });
  });

  describe('setRevenueChartGroupBy', () => {
    it('changes group by', () => {
      const state = adminReducer(undefined, setRevenueChartGroupBy('month'));
      expect(state.revenueChartGroupBy).toBe('month');
    });
  });

  describe('toggleSidebar', () => {
    it('toggles from collapsed to expanded', () => {
      let state = adminReducer(undefined, toggleSidebar());
      expect(state.sidebarCollapsed).toBe(false);
      state = adminReducer(state, toggleSidebar());
      expect(state.sidebarCollapsed).toBe(true);
    });

    it('opens sidebar explicitly', () => {
      const state = adminReducer(undefined, openSidebar());
      expect(state.sidebarCollapsed).toBe(false);
    });
  });

  describe('setNotificationCount', () => {
    it('sets count', () => {
      const state = adminReducer(undefined, setNotificationCount(5));
      expect(state.notificationCount).toBe(5);
    });

    it('can set to zero', () => {
      let state = adminReducer(undefined, setNotificationCount(5));
      state = adminReducer(state, setNotificationCount(0));
      expect(state.notificationCount).toBe(0);
    });
  });

  describe('admin navigation', () => {
    it('shows business nav to admin but hides License & System items', () => {
      const items = flattenAdminNavigation(getAdminNavigation('admin'));
      expect(items.some((item) => item.label === 'Module Licenses')).toBe(false);
      expect(items.some((item) => item.label === 'Admin Users')).toBe(false);
      expect(items.some((item) => item.label === 'Sales Reports')).toBe(true);
      expect(items.some((item) => item.label === 'Media Library')).toBe(true);
    });

    it('shows License & System to IT User but hides business nav', () => {
      const items = flattenAdminNavigation(getAdminNavigation('super_admin'));
      expect(items.some((item) => item.label === 'Admin User Access')).toBe(true);
      expect(items.some((item) => item.label === 'Module Licenses')).toBe(true);
      expect(items.some((item) => item.label === 'Sales Reports')).toBe(false);
      expect(items.some((item) => item.label === 'Products')).toBe(false);
    });

    it('assigns IT-controlled module codes to gated admin sections', () => {
      const items = flattenAdminNavigation(getAdminNavigation('admin'));
      expect(items.find((item) => item.path === '/admin/pages')?.requiredModule).toBe('cms_management');
      expect(items.find((item) => item.path === '/admin/alerts')?.requiredModule).toBe('marketing_management');
      expect(items.find((item) => item.path === '/admin/customers')?.requiredModule).toBe('customer_management');
      expect(items.find((item) => item.path === '/admin/reports')?.requiredModule).toBe('sales_reports');
    });
  });

  describe('toggleExpandedGroup', () => {
    it('removes an open group when toggled', () => {
      const state = adminReducer(undefined, toggleExpandedGroup('commerce'));
      expect(state.expandedGroups).not.toContain('commerce');
    });

    it('adds a closed group when toggled', () => {
      const state = adminReducer(undefined, toggleExpandedGroup('reports'));
      expect(state.expandedGroups).toContain('reports');
    });
  });
});
