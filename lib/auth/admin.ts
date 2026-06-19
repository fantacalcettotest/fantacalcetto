import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma.ts";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";

function buildLoginPath(message: string) {
  const searchParams = new URLSearchParams({ error: message });
  return `/login?${searchParams.toString()}`;
}

export async function findAppUserByAuthUserId(authUserId: string) {
  return prisma.user.findUnique({
    where: {
      authUserId
    },
    select: {
      authUserId: true,
      displayName: true,
      email: true,
      id: true,
      role: true
    }
  });
}

export async function requireAdminAccess() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const appUser = await findAppUserByAuthUserId(user.id);
  if (!appUser || appUser.role !== UserRole.ADMIN) {
    redirect(buildLoginPath("Accesso non autorizzato"));
  }

  return {
    appUser,
    authUser: user
  };
}

export async function getAuthenticatedAdminContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const appUser = await findAppUserByAuthUserId(user.id);
  if (!appUser || appUser.role !== UserRole.ADMIN) {
    return {
      appUser,
      authUser: user
    };
  }

  return {
    appUser,
    authUser: user
  };
}
