import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import {
  buildLoginPath,
  getAuthenticatedAppUserContext,
  requireAuthenticatedAppUser
} from "./app-user";

export async function requireAdminAccess() {
  const authContext = await requireAuthenticatedAppUser("/admin");

  if (authContext.appUser.role !== UserRole.ADMIN) {
    redirect(buildLoginPath({ error: "Accesso non autorizzato" }));
  }

  return authContext;
}

export async function getAuthenticatedAdminContext() {
  const authContext = await getAuthenticatedAppUserContext();

  if (!authContext) {
    return null;
  }

  return authContext;
}
