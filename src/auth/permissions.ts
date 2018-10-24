import { notNull } from '../util/common';
import { IWError } from '../util/IWError';
import { DEV_MODE } from '../util/config';

// No permissions message.
const NO_PERMISSIONS = 'You has NOT enough permissions to complete the request!';

// Available permissions.
const Permissions = new function() {
    this.R = 1;  // Read
    this.W = 2;  // Create
    this.E = 4;  // Edit
    this.D = 8;  // Delete
    this.M = this.R | this.E | this.D;  // Moderation
    this.X = this.M | this.W  // Full access
}

// Available sections. 
export const _Profile = 1;
export const _Posts = 2;
export const _News = 3;
export const _Comments = 4;
export const _Chats = 5;
export const _Pools = 6;
export const _Contracts = 7;
export const _Special = 8;

// Roles permissions schema
const Schema = {
    'Guest': {
        'Registration': Permissions.R | Permissions.W,
        'Profile': Permissions.R,
        'Posts': Permissions.R,
        'News': Permissions.R,
        'Comments': Permissions.R,
        'Pools': Permissions.R,
        'Contracts': Permissions.R
    },
    'User': {
        'Registration': Permissions.R | Permissions.E,
        'Profile': Permissions.R | Permissions.E,
        'Posts': Permissions.R | Permissions.W | Permissions.E,
        'News': Permissions.R,
        'Comments': Permissions.R | Permissions.W | Permissions.E,
        'Chats': Permissions.R | Permissions.W,
        'Pools': Permissions.R | Permissions.W,
        'Contracts': Permissions.R | Permissions.W,
    },
    'Admin': {
        'Registration': Permissions.X,
        'Profile': Permissions.X,
        'Posts': Permissions.M,
        'News': Permissions.X,
        'Comments': Permissions.M,
        'Chats': Permissions.R | Permissions.W,
        'Pools': Permissions.M,
        'Contracts': Permissions.X,
        'Special': Permissions.X
    }
}

// Available roles.
const _array = Object.keys(Schema);
export const Roles = {
    Guest: _array[0],
    User: _array[1],
    Admin: _array[2]
}

export const GuestUser = {
    role: Roles.Guest
}

function hasRole(role) {
    return 'undefined' !== typeof(Schema[role]);
}

/**
 * Get permission by given 'role'.
 * @param role 
 * @param view 
 */
export function getPermission(role: string): number {
    notNull(role, 'Role');
    if (hasRole(role)) {
        const perm = Schema[role];
        return perm;
    } else
        throw new IWError(500, `Invalid \'role\' argument value: ${role}`);
}

/**
 * Check if a given 'role' has a given permission 'value' for a given 'section'.
 * @param action
 * @param section 
 * @param role 
 */
function hasPermission(action: number, section: number, role: string): boolean {
    notNull(section, 'Section name');
    if(DEV_MODE) {
        // No checks.
        return true;
    }
    const rolePerms = getPermission(role);
    const keys = Object.keys(rolePerms);
    if(section >= keys.length)
        return false;
    const pname = keys[section];
    const perm = rolePerms[pname];
    return (perm & action) == action ? true : false;
}

/**
 * Check if a given 'role' has read permission.
 * @param section 
 * @param role 
 */
export function hasReadPermission(section: number, role: string): boolean {
    return hasPermission(Permissions.R, section, role);
}

/**
 * Check if a given 'role' has create permission.
 * @param section 
 * @param role 
 */
export function hasCreatePermission(section: number, role: string): boolean {
    return hasPermission(Permissions.W, section, role);
}

/**
 * Check if a given 'role' has edit permission.
 * @param section 
 * @param role 
 */
export function hasEditPermission(section: number, role: string): boolean {
    return hasPermission(Permissions.E, section, role);
}

/**
 * Check if a given 'role' has delete permission.
 * @param section 
 * @param role 
 */
export function hasDeletePermission(section: number, role: string): boolean {
    return hasPermission(Permissions.D, section, role);
}

/**
 * Check if a given 'role' has moderation permission.
 * @param section 
 * @param role 
 */
export function hasModeratePermission(section: number, role: string): boolean {
    return hasPermission(Permissions.M, section, role);
}

/**
 * Check if a given 'role' has read permission.
 * @param section 
 * @param role 
 */
export function checkReadPermission(section: number, role: string): void {
    if(!hasReadPermission(section, role))
        throw new IWError(405, NO_PERMISSIONS);
}

/**
 * Check if a given 'role' has create permission.
 * @param section 
 * @param role 
 */
export function checkCreatePermission(section: number, role: string): void {
    if(!hasCreatePermission(section, role))
        throw new IWError(405, NO_PERMISSIONS);
}

/**
 * Check if a given 'role' has edit permission.
 * @param section 
 * @param role 
 */
export function checkEditPermission(section: number, role: string): void {
    if(!hasEditPermission(section, role))
        throw new IWError(405, NO_PERMISSIONS);
}

/**
 * Check if a given 'role' has delete permission.
 * @param section 
 * @param role 
 */
export function checkDeletePermission(section: number, role: string, sameIds: boolean = true): void {
    const hasPerm = (sameIds)
         ? hasDeletePermission(section, role)
         : hasModeratePermission(section, role);
    if(!hasPerm)     
        throw new IWError(405, NO_PERMISSIONS);
}

/**
 * Check if a given 'role' has moderate permission.
 * @param section 
 * @param role 
 */
export function checkModeratePermission(section: number, role: string): void {
    if(!hasModeratePermission(section, role))
        throw new IWError(405, NO_PERMISSIONS);
}