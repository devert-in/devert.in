"use client";

import { createContext, useContext } from "react";

// isInstAdmin implicitly satisfies every permission string - it predates the
// granular system and must never regress while permissions roll out one at a
// time. `permissions` is a Set built once in CampusWorkspace (merging
// system/rolePermissionDefaults[roleKey] with the fetched roleAssignment's
// permissionOverrides - see lib/institutions.js's fetchRolePermissionDefaults/
// fetchMyRoleAssignment) from the SAME reads already done for phase
// determination - no second fetch per component.
// department/classroomId mirror the same fields on CampusWorkspace's own
// staffScope, carried here so a component nested arbitrarily deep can both
// gate on a role AND stamp that role's scope onto what it writes, without
// threading a staffScope prop down through every intermediate layer. Both are
// null for an Institution Admin and for a student - the two identities whose
// authority isn't scope-shaped at all.
export const CampusPermissionsContext = createContext({
  role: null, permissions: new Set(), isInstAdmin: false, department: null, classroomId: null,
});

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

// The caller's own authority scope, for the two things a scoped staff role
// needs beyond a yes/no permission check: deciding which surfaces to show at
// all, and stamping the scope field firestore.rules will match the write
// against (e.g. dailyLearning's scopeDepartment - an HOD's create/update is
// only allowed when that field equals their OWN department, so a scoped
// publisher that omits it is denied outright).
export function useCampusScope() {
  const { role, isInstAdmin, department, classroomId } = useContext(CampusPermissionsContext);
  return { role, isInstAdmin, department, classroomId };
}
