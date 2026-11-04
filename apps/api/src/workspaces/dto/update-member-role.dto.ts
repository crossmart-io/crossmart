import { RoleAssignmentDto } from './role-assignment.dto.js';

/** A workspace always keeps an owner. */
export class UpdateMemberRoleDto extends RoleAssignmentDto {}
