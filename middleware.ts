import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Only allow same-site relative redirect targets into the two portals. */
function safeRedirectPath(pathname: string): string {
  if (/^\/(dashboard|client)(\/|$)/.test(pathname)) {
    return pathname;
  }
  return '/';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPortalPath =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/client' ||
    pathname.startsWith('/client/');

  // Skip static files. API routes handle their own auth (webhooks/leads must
  // stay reachable without a session).
  //
  // The `includes('.')` shortcut is for static assets, but it used to apply to
  // portal paths too — so any /dashboard/... or /client/... URL containing a
  // dot skipped the ONLY server-side auth and admin gate. Portal paths are now
  // always gated regardless of their shape.
  if (
    !isPortalPath &&
    (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.'))
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session - this is important for keeping the session alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Segment-aware so /client-register (an auth page) is NOT treated as the
  // /client portal.
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isClientPortal = pathname === '/client' || pathname.startsWith('/client/');

  if (!isDashboard && !isClientPortal) {
    return response;
  }

  const redirectWithCookies = (to: string, search = '') => {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = to;
    redirectUrl.search = search;
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  };

  // Both portals require authentication.
  if (!user) {
    const target = safeRedirectPath(pathname);
    return redirectWithCookies(
      '/login',
      target === '/' ? '' : `?redirect=${encodeURIComponent(target)}`
    );
  }

  // /dashboard/* requires an ACTIVE staff profile.
  if (isDashboard) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle();

    const isActiveStaff =
      !error &&
      !!profile &&
      (profile.role === 'employee' || profile.role === 'admin') &&
      profile.is_active !== false;

    if (!isActiveStaff) {
      // Client users get sent to their own portal; others to the homepage.
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return redirectWithCookies(client ? '/client' : '/');
    }

    // /dashboard/admin/* additionally requires the admin role.
    if (pathname.startsWith('/dashboard/admin') && profile!.role !== 'admin') {
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'unauthorized_admin_access',
        entity_type: 'system_settings',
        entity_id: null,
        details: {
          path: pathname,
          ip: request.headers.get('x-forwarded-for') ?? null,
          user_agent: request.headers.get('user-agent'),
        },
      });
      return redirectWithCookies('/dashboard');
    }
  }

  // /client/* requires a linked client record.
  if (isClientPortal) {
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!client) {
      // Staff members visiting /client go to the dashboard; others home.
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      return redirectWithCookies(profile ? '/dashboard' : '/');
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
