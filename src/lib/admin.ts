/** Primary admin with exclusive user-management rights (activate/deactivate, edit profile). */
export const PRIMARY_ADMIN_EMAIL = "admin@mmla.com";

export function isPrimaryAdmin(email: string | null | undefined): boolean {
  return email?.toLowerCase() === PRIMARY_ADMIN_EMAIL;
}
