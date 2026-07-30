"use client";

import { createContext, useContext } from "react";

// isInstAdmin implicitly satisfies every permission string - it predates the
// granular system and must never regress while permissions roll out one at a
// time. `permissions` is a Set built once in CampusWorkspace (merging
// system/rolePermissionDefaults[roleKey] with the fetched roleAssignment's
// permissionOverrides - see lib/institutions.js's fetchRolePermissionDefaults/
// fetchMyRoleAssignment) from the SAME reads already done for phase
// determination - no second fetch per component.
export const CampusPermissionsContext = createContext({ role: null, permissions: new Set(), isInstAdmin: false });

// Client-side only - this is a UI gate (hide a control the caller can't use
// anyway), never the real security boundary. The actual enforcement is
// firestore.rules' hasPermission(), which every mutating write this could
// gate is independently checked against server-side.
export function useHasPermission(permissionKey) {
  const { isInstAdmin, permissions } = useContext(CampusPermissionsContext);
  if (!permissionKey) return true;
  return isInstAdmin || permissions.has(permissionKey);
}

export function useCampusRole() {
  return useContext(CampusPermissionsContext).role;
}
