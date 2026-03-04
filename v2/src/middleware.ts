export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/api/user/:path*", "/api/context/:path*", "/api/billing/:path*"],
};
