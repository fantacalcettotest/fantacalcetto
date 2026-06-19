"use server";

import { redirect } from "next/navigation";

import {
  buildLoginPath,
  ensureAppUserForAuthUser,
  getSafeNextPath
} from "@/lib/auth/app-user";
import { createSupabaseServerClient } from "@/lib/supabase/server.ts";

function redirectToLogin(
  options?: { error?: string; next?: string; notice?: string }
): never {
  redirect(buildLoginPath(options));
}

export async function loginAction(formData: FormData) {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawNext = formData.get("next");
  const nextPath = getSafeNextPath(
    typeof rawNext === "string" ? rawNext : undefined,
    "/me"
  );

  if (typeof rawEmail !== "string" || rawEmail.trim().length === 0) {
    redirectToLogin({ error: "Email obbligatoria.", next: nextPath });
  }

  if (typeof rawPassword !== "string" || rawPassword.length === 0) {
    redirectToLogin({ error: "Password obbligatoria.", next: nextPath });
  }

  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirectToLogin({ error: "Credenziali non valide.", next: nextPath });
  }

  const {
    data: { user },
    error: getUserError
  } = await supabase.auth.getUser();

  if (getUserError || !user) {
    await supabase.auth.signOut();
    redirectToLogin({
      error: "Sessione non disponibile dopo il login.",
      next: nextPath
    });
  }

  try {
    await ensureAppUserForAuthUser(user);
  } catch (caughtError) {
    await supabase.auth.signOut();
    redirectToLogin({
      error:
        caughtError instanceof Error
          ? caughtError.message
          : "Impossibile collegare l'utente applicativo.",
      next: nextPath
    });
  }

  redirect(nextPath);
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirectToLogin({ notice: "Logout completato." });
}
