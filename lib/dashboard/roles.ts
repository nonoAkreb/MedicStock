export const ROLES = {
  admin: 'admin',
  pharmacist: 'pharmacist',
  nurse: 'nurse',
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];
export const roleLabel: Record<Role, string> = {
  admin: 'Administrateur',
  pharmacist: 'Pharmacien',
  nurse: 'Infirmier(ère)',
};
