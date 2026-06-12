import bcrypt from "bcryptjs";

export type UserRole = "admin" | "user";

export interface CredentialUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
}

const CREDENTIAL_USERS: CredentialUser[] = [
  {
    id: "admin-1",
    email: "admin@wewin.edu.vn",
    name: "WeWIN Admin",
    passwordHash:
      "$2b$10$etF3jBZxeJmm/MlLw3NfKuv8FmgNbigIrXAot7Ewavyjs.u7qiAUe",
    role: "admin",
  },
  {
    id: "user-1",
    email: "user@wewin.edu.vn",
    name: "Học viên Demo",
    passwordHash:
      "$2b$10$sS4HDjkri7fF5/0AOew0NeX8i8Yg0M75fF7V1TqOg7dySnJDO/KCS",
    role: "user",
  },
];

export async function verifyCredentialUser(
  email: string,
  password: string
): Promise<CredentialUser | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = CREDENTIAL_USERS.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}
