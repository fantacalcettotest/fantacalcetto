import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import {
  buildForgotPasswordPath,
  buildLoginPath,
  getSafeNextPath
} from "@/lib/auth/app-user";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler.ts";

const SUPPORTED_CONFIRMATION_TYPES = new Set<EmailOtpType>([
  "recovery",
  "signup"
]);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const defaultNextPath = type === "recovery" ? "/reset-password" : "/me";
  const nextPath = getSafeNextPath(
    requestUrl.searchParams.get("next"),
    defaultNextPath
  );

  if (!tokenHash || !type || !SUPPORTED_CONFIRMATION_TYPES.has(type as EmailOtpType)) {
    return NextResponse.redirect(
      new URL(buildLoginPath({ error: "Link non valido o scaduto." }), request.url)
    );
  }

  const { getResponse, supabase } = createSupabaseRouteHandlerClient(request);
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType
  });

  const destinationPath = error
    ? type === "recovery"
      ? buildForgotPasswordPath({
          error: "Link di recupero non valido o scaduto."
        })
      : buildLoginPath({ error: "Link di conferma non valido o scaduto." })
    : nextPath;

  const redirectResponse = NextResponse.redirect(
    new URL(destinationPath, request.url)
  );

  for (const cookie of getResponse().cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }

  return redirectResponse;
}
