"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  buildForgotPasswordPath,
  buildLoginPath,
  buildResetPasswordPath,
  buildSignupPath,
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

function redirectToSignup(
  options?: { error?: string; next?: string; notice?: string }
): never {
  redirect(buildSignupPath(options));
}

function redirectToForgotPassword(
  options?: { error?: string; next?: string; notice?: string }
): never {
  redirect(buildForgotPasswordPath(options));
}

function redirectToResetPassword(
  options?: { error?: string; next?: string; notice?: string }
): never {
  redirect(buildResetPasswordPath(options));
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePasswordOrRedirect(
  password: string,
  confirmPassword: string,
  redirectWithError: (message: string) => never
) {
  if (password.length < 8) {
    redirectWithError("La password deve contenere almeno 8 caratteri.");
  }

  if (password !== confirmPassword) {
    redirectWithError("Le password non coincidono.");
  }
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");

  if (!host) {
    throw new Error("Host della richiesta non disponibile.");
  }

  return `${protocol}://${host}`;
}

async function buildAbsoluteUrl(pathname: string) {
  return new URL(pathname, await getRequestOrigin()).toString();
}

export async function signupAction(formData: FormData) {
  const rawDisplayName = formData.get("displayName");
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawConfirmPassword = formData.get("confirmPassword");
  const rawNext = formData.get("next");
  const nextPath = getSafeNextPath(
    typeof rawNext === "string" ? rawNext : undefined,
    "/me"
  );

  const displayName =
    typeof rawDisplayName === "string" ? rawDisplayName.trim() : "";
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const confirmPassword =
    typeof rawConfirmPassword === "string" ? rawConfirmPassword : "";

  if (email.length === 0) {
    redirectToSignup({ error: "Email obbligatoria.", next: nextPath });
  }

  if (!isValidEmail(email)) {
    redirectToSignup({ error: "Inserisci un'email valida.", next: nextPath });
  }

  validatePasswordOrRedirect(password, confirmPassword, (message) =>
    redirectToSignup({ error: message, next: nextPath })
  );

  const supabase = await createSupabaseServerClient();
  const emailRedirectTo = await buildAbsoluteUrl(
    `/auth/confirm?next=${encodeURIComponent(nextPath)}`
  );
  const metadata =
    displayName.length > 0
      ? {
          display_name: displayName,
          name: displayName
        }
      : undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo
    }
  });

  if (error) {
    redirectToSignup({
      error: "Impossibile completare la registrazione.",
      next: nextPath
    });
  }

  if (!data.session) {
    redirectToSignup({
      notice: "Controlla la tua email per completare la registrazione.",
      next: nextPath
    });
  }

  const {
    data: { user },
    error: getUserError
  } = await supabase.auth.getUser();

  if (getUserError || !user) {
    await supabase.auth.signOut();
    redirectToSignup({
      error: "Sessione non disponibile dopo la registrazione.",
      next: nextPath
    });
  }

  try {
    await ensureAppUserForAuthUser(user);
  } catch (caughtError) {
    await supabase.auth.signOut();
    redirectToSignup({
      error:
        caughtError instanceof Error
          ? caughtError.message
          : "Impossibile collegare l'utente applicativo.",
      next: nextPath
    });
  }

  redirect(nextPath);
}

export async function forgotPasswordAction(formData: FormData) {
  const rawEmail = formData.get("email");
  const rawNext = formData.get("next");
  const nextPath = getSafeNextPath(
    typeof rawNext === "string" ? rawNext : undefined,
    "/me"
  );
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";

  if (email.length === 0) {
    redirectToForgotPassword({ error: "Email obbligatoria.", next: nextPath });
  }

  if (!isValidEmail(email)) {
    redirectToForgotPassword({
      error: "Inserisci un'email valida.",
      next: nextPath
    });
  }

  const supabase = await createSupabaseServerClient();
  const resetNextPath = buildResetPasswordPath({ next: nextPath });
  const redirectTo = await buildAbsoluteUrl(
    `/auth/confirm?next=${encodeURIComponent(resetNextPath)}`
  );

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });

  redirectToForgotPassword({
    notice: "Se l'email esiste, riceverai le istruzioni.",
    next: nextPath
  });
}

export async function updatePasswordAction(formData: FormData) {
  const rawPassword = formData.get("password");
  const rawConfirmPassword = formData.get("confirmPassword");
  const rawNext = formData.get("next");
  const nextPath = getSafeNextPath(
    typeof rawNext === "string" ? rawNext : undefined,
    "/me"
  );
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const confirmPassword =
    typeof rawConfirmPassword === "string" ? rawConfirmPassword : "";

  validatePasswordOrRedirect(password, confirmPassword, (message) =>
    redirectToResetPassword({ error: message, next: nextPath })
  );

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: getUserError
  } = await supabase.auth.getUser();

  if (getUserError || !user) {
    redirectToResetPassword({
      error: "Sessione di recupero non valida o scaduta.",
      next: nextPath
    });
  }

  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    redirectToResetPassword({
      error: "Impossibile aggiornare la password.",
      next: nextPath
    });
  }

  await supabase.auth.signOut();
  redirectToLogin({
    notice: "Password aggiornata. Ora puoi accedere.",
    next: nextPath
  });
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirectToLogin({ notice: "Logout completato." });
}
