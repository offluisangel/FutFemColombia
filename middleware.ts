import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit } from "@/lib/rate-limit";
import { isAdminUser } from "@/lib/admin/role";

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function getRateLimitPolicy(pathname: string, method: string) {
  if (pathname.startsWith("/api/internal/scrapers/auto") && method === "POST") {
    return {
      key: "internal-scrapers-auto",
      limit: 6,
      windowMs: 10 * 60 * 1000,
    };
  }

  if (pathname.startsWith("/api/admin")) {
    return {
      key: "admin-api",
      limit: 120,
      windowMs: 60 * 1000,
    };
  }

  return null;
}

function redirectWithCookies(
  supabaseResponse: NextResponse,
  url: URL,
): NextResponse {
  const redirect = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const policy = getRateLimitPolicy(pathname, request.method);

  if (policy) {
    const rateLimit = checkRateLimit(
      `${policy.key}:${getClientIp(request)}`,
      policy.limit,
      policy.windowMs,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Demasiadas solicitudes. Intenta de nuevo en unos segundos.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "X-RateLimit-Limit": String(policy.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
          },
        },
      );
    }
  }

  const { supabaseResponse, user } = await updateSession(request);

  const isAdminRoute = pathname.startsWith("/admin");
  const isApiAdminRoute = pathname.startsWith("/api/admin");
  const isLoginPage = pathname === "/admin/login";
  const isLogoutRoute = pathname === "/admin/logout";

  if (isApiAdminRoute && !user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "No autorizado" } },
      { status: 401 },
    );
  }

  if (isApiAdminRoute && !isAdminUser(user)) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Sin permisos de administrador",
        },
      },
      { status: 403 },
    );
  }

  if (isAdminRoute && !isLoginPage && !isLogoutRoute && !isAdminUser(user)) {
    return redirectWithCookies(
      supabaseResponse,
      new URL("/admin/login", request.url),
    );
  }

  if (isLoginPage && isAdminUser(user)) {
    return redirectWithCookies(
      supabaseResponse,
      new URL("/admin", request.url),
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api/internal/|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
