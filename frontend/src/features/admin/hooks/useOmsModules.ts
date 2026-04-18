import { useAdminModulesQuery, type AdminFeatureModule } from '@/features/admin/api';
import { useMemo } from 'react';

/**
 * Hook to check which OMS modules are licensed/enabled.
 * Used by sidebar to show lock icons on unlicensed modules.
 */
export function useOmsModules() {
  const { data, isLoading } = useAdminModulesQuery(undefined, true);

  const modules: AdminFeatureModule[] = useMemo(() => {
    const raw = data?.data?.data ?? data?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const enabledModules = useMemo(() => {
    const set = new Set<string>();
    for (const mod of modules) {
      if (mod.is_enabled) {
        set.add(mod.module_code);
      }
    }
    return set;
  }, [modules]);

  return {
    isLoading,
    isModuleEnabled: (moduleCode: string) => enabledModules.has(moduleCode),
    enabledModules,
    allModules: modules,
  };
}
