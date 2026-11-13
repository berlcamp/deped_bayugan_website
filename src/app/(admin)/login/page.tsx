import { Suspense } from "react";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/admin/brand";
import { GoogleSignIn } from "@/components/admin/google-sign-in";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, { title: string; body: string }> = {
  not_invited: {
    title: "This account hasn't been invited",
    body: "Ask an admin to invite your Google email address, then sign in again.",
  },
  disabled: {
    title: "Your access has been turned off",
    body: "An admin has disabled your website account. Contact them if you think this is a mistake.",
  },
  auth_failed: {
    title: "Sign-in didn't finish",
    body: "Google sign-in was cancelled or expired. Please try again.",
  },
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_top_right,rgba(20,80,168,.14),transparent_55%)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandMark href="/" />
        </div>
        <div className="rounded-2xl border bg-card p-7 shadow-[0_12px_32px_rgba(17,19,24,.08)]">
          <h1 className="text-2xl font-bold">Admin sign in</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">For invited editors and admins of the DepEd Bayugan website.</p>
          <Suspense fallback={<GoogleSignIn next="/admin" />}>
            <LoginBody searchParams={searchParams} />
          </Suspense>
          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-px size-4 shrink-0 text-success" aria-hidden="true" />
            Access is invite-only. Use the Google account your admin invited.
          </p>
        </div>
      </div>
    </main>
  );
}

async function LoginBody({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;
  const nextParam = typeof sp.next === "string" && sp.next.startsWith("/admin") ? sp.next : "/admin";
  return (
    <>
      {error && (
        <div role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm">
          <p className="font-semibold text-destructive">{error.title}</p>
          <p className="mt-0.5 text-muted-foreground">{error.body}</p>
        </div>
      )}
      <GoogleSignIn next={nextParam} />
    </>
  );
}
