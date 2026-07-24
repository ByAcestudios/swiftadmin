'use client';

import { Button } from '@/components/ui/button';
import {
  ACTIONS,
  ROLE_ASSIGNABLE_MODULE_KEYS,
  MODULE_LABELS,
  emptyRolePermissions,
} from '@/lib/rbac';

export default function RolePermissionsEditor({ permissions, onChange, disabled = false }) {
  const setModuleActions = (moduleKey, nextActions) => {
    if (disabled) return;
    onChange({
      ...permissions,
      [moduleKey]: nextActions,
    });
  };

  const toggleAction = (moduleKey, action) => {
    const current = permissions[moduleKey] || [];

    if (current.includes(action)) {
      const next =
        action === 'view'
          ? []
          : current.filter((item) => item !== action);
      setModuleActions(moduleKey, next);
      return;
    }

    const next = new Set([...current, action]);
    if (action !== 'view') {
      next.add('view');
    }
    setModuleActions(moduleKey, [...next]);
  };

  const isRowFullyChecked = (moduleKey) =>
    ACTIONS.every((action) => (permissions[moduleKey] || []).includes(action));

  const isColumnFullyChecked = (action) =>
    ROLE_ASSIGNABLE_MODULE_KEYS.every((key) => (permissions[key] || []).includes(action));

  const isAllFullyChecked = () =>
    ROLE_ASSIGNABLE_MODULE_KEYS.every((key) => isRowFullyChecked(key));

  const toggleRow = (moduleKey) => {
    setModuleActions(moduleKey, isRowFullyChecked(moduleKey) ? [] : [...ACTIONS]);
  };

  const toggleColumn = (action) => {
    const allChecked = isColumnFullyChecked(action);
    const next = { ...permissions };
    for (const key of ROLE_ASSIGNABLE_MODULE_KEYS) {
      const current = [...(next[key] || [])];
      if (allChecked) {
        next[key] = action === 'view' ? [] : current.filter((a) => a !== action);
      } else {
        const set = new Set(current);
        set.add(action);
        if (action !== 'view') set.add('view');
        next[key] = [...set];
      }
    }
    onChange(next);
  };

  const toggleAll = () => {
    if (isAllFullyChecked()) {
      onChange(emptyRolePermissions());
      return;
    }
    const next = emptyRolePermissions();
    for (const key of ROLE_ASSIGNABLE_MODULE_KEYS) {
      next[key] = [...ACTIONS];
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={toggleAll} disabled={disabled}>
          {isAllFullyChecked() ? 'Clear all' : 'Check all modules'}
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1.4fr_0.5fr_repeat(5,0.6fr)] gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold uppercase text-gray-500 items-center">
          <span>Module</span>
          <span className="text-center">All</span>
          {ACTIONS.map((action) => (
            <div key={action} className="flex flex-col items-center gap-1">
              <span className="capitalize">{action}</span>
              <input
                type="checkbox"
                checked={isColumnFullyChecked(action)}
                onChange={() => toggleColumn(action)}
                disabled={disabled}
                title={`Toggle ${action} for all modules`}
                className="h-4 w-4 rounded border-gray-300 text-[#62275F] focus:ring-[#62275F]"
              />
            </div>
          ))}
        </div>
        <div className="divide-y max-h-[420px] overflow-y-auto">
          {ROLE_ASSIGNABLE_MODULE_KEYS.map((moduleKey) => {
            const moduleActions = permissions[moduleKey] || [];
            const hasView = moduleActions.includes('view');

            return (
              <div
                key={moduleKey}
                className="grid grid-cols-[1.4fr_0.5fr_repeat(5,0.6fr)] gap-2 px-4 py-3 items-center text-sm"
              >
                <span className="font-medium text-gray-800">{MODULE_LABELS[moduleKey]}</span>
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={isRowFullyChecked(moduleKey)}
                    onChange={() => toggleRow(moduleKey)}
                    disabled={disabled}
                    title={`Toggle all permissions for ${MODULE_LABELS[moduleKey]}`}
                    className="h-4 w-4 rounded border-gray-300 text-[#62275F] focus:ring-[#62275F]"
                  />
                </div>
                {ACTIONS.map((action) => (
                  <div key={action} className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={moduleActions.includes(action)}
                      onChange={() => toggleAction(moduleKey, action)}
                      disabled={disabled || (action !== 'view' && !hasView)}
                      className="h-4 w-4 rounded border-gray-300 text-[#62275F] focus:ring-[#62275F]"
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Team & Roles is super-admin only and cannot be assigned to sub-admin roles.
      </p>
    </div>
  );
}
