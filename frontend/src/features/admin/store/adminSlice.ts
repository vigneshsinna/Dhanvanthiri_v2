import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Period = 'today' | 'week' | 'month' | 'year';
type GroupBy = 'day' | 'week' | 'month';

interface AdminState {
  period: Period;
  revenueChartGroupBy: GroupBy;
  sidebarCollapsed: boolean;
  notificationCount: number;
  expandedGroups: string[];
}

const initialState: AdminState = {
  period: 'month',
  revenueChartGroupBy: 'day',
  sidebarCollapsed: true,
  notificationCount: 0,
  expandedGroups: ['commerce', 'oms', 'catalog', 'cms', 'license-system'],
};

const slice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setPeriod: (state, action: PayloadAction<Period>) => {
      state.period = action.payload;
    },
    setRevenueChartGroupBy: (state, action: PayloadAction<GroupBy>) => {
      state.revenueChartGroupBy = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    closeSidebar: (state) => {
      state.sidebarCollapsed = true;
    },
    openSidebar: (state) => {
      state.sidebarCollapsed = false;
    },
    setNotificationCount: (state, action: PayloadAction<number>) => {
      state.notificationCount = action.payload;
    },
    toggleExpandedGroup: (state, action: PayloadAction<string>) => {
      if (state.expandedGroups.includes(action.payload)) {
        state.expandedGroups = state.expandedGroups.filter((group) => group !== action.payload);
        return;
      }

      state.expandedGroups = [...state.expandedGroups, action.payload];
    },
  },
});

export const {
  setPeriod,
  setRevenueChartGroupBy,
  toggleSidebar,
  closeSidebar,
  openSidebar,
  setNotificationCount,
  toggleExpandedGroup,
} = slice.actions;
export default slice.reducer;
