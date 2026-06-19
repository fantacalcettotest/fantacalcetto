"use server";

import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma.ts";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";

function redirectToLogin(
  options?: { error?: string; notice?: string }
): never {
  const searchParams = new URLSearchParams();

  if (options?.error) {
    searchParams.set("error", options.error);
  }

  if (options?.notice) {
    searchParams.set("notice", options.notice);
  }

  const search = searchParams.toString();
  redirect(search.length > 0 ? `/login?${search}` : "/login");
}

export async function loginAction(formData: FormData) {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  if (typeof rawEmail !== "string" || rawEmail.trim().length === 0) {
    redirectToLogin({ error: "Email obbligatoria." });
  }

  if (typeof rawPassword !== "string" || rawPassword.length === 0) {
    redirectToLogin({ error: "Password obbligatoria." });
  }

  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirectToLogin({ error: "Credenziali non valide." });
  }

  const {
    data: { user },
    error: getUserError
  } = await supabase.auth.getUser();

  if (getUserError || !user) {
    await supabase.auth.signOut();
    redirectToLogin({ error: "Sessione non disponibile dopo il login." });
  }

  const currentUser = user;

  const appUser = await prisma.user.findUnique({
    where: {
      authUserId: currentUser.id
    },
    select: {
      role: true
    }
  });

  if (!appUser || appUser.role !== UserRole.ADMIN) {
    await supabase.auth.signOut();
    redirectToLogin({ error: "Accesso non autorizzato" });
  }

  redirect("/admin");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirectToLogin({ notice: "Logout completato." });
}
