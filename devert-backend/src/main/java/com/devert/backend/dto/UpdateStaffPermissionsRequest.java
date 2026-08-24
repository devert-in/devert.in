package com.devert.backend.dto;

import java.util.Map;

public class UpdateStaffPermissionsRequest {
    private String institutionId;
    private String uid;
    // Sparse override map - key is a lib/permissions.js permission string,
    // value true/false. A key absent here (vs explicitly present) means
    // "inherit the role default" - see AdminAccountService for how this
    // replaces (not merges with) the account's existing overrides, since the
    // Manage Admins UI always sends the complete intended override set.
    private Map<String, Boolean> permissionOverrides;

    public String getInstitutionId() { return institutionId; }
    public void setInstitutionId(String institutionId) { this.institutionId = institutionId; }
    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }
    public Map<String, Boolean> getPermissionOverrides() { return permissionOverrides; }
    public void setPermissionOverrides(Map<String, Boolean> permissionOverrides) { this.permissionOverrides = permissionOverrides; }
}
