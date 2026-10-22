"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";

type Pending = "github" | "google" | "email" | null;

const glassButton =
  "w-full rounded-xl border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black/40 text-blue-100 hover:border-blue-400/30 hover:bg-blue-900/30";
const glassInput =
  "rounded-xl border-blue-400/20 bg-black/30 text-card-foreground placeholder:text-muted-foreground focus-visible:ring-blue-400";

function Spinner({ size = 20 }: { size?: number }) {
  return <Image src="/spinner.svg" alt="" width={size} height={size} className="mr-2 animate-spin" />;
}

function GoogleLogo() {
  return (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/** Turn Supabase auth errors into messages a person can act on. */
function friendlyError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Invalid email or password. Please try again.";
  if (message.includes("already registered")) return "This email is already registered. Please sign in instead.";
  return message;
}

/** Email/password sign-in and sign-up, plus GitHub and Google OAuth. */
export default function SignInPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [loading, user, router]);

  if (loading || user) return null;

  async function withProvider(provider: "github" | "google") {
    setPending(provider);
    setMessage(null);
    // Supabase redirects to the provider and back to the site's configured URL.
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) setMessage(error.message);
    setPending(null);
  }

  async function withEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!email || !password) {
      setMessage("Please fill in all fields");
      return;
    }
    setPending("email");
    setMessage(null);
    if (creating) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(friendlyError(error.message));
        if (error.message.includes("already registered")) setCreating(false);
      } else if (data.user && !data.session) {
        setMessage("Please check your email to confirm your account.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(friendlyError(error.message));
    }
    setPending(null);
  }

  return (
    <main className="dark flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md rounded-2xl border-blue-400/20 bg-gradient-to-br from-blue-900/20 to-black shadow-2xl shadow-blue-950/50 backdrop-blur-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">{creating ? "Create an account" : "Welcome back"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your email below to {creating ? "create your account" : "sign in to your account"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className={glassButton} disabled={pending !== null} onClick={() => withProvider("github")}>
              {pending === "github" ? <Spinner /> : <Image src="/github.svg" alt="" width={20} height={20} className="mr-2" />}
              GitHub
            </Button>
            <Button variant="outline" className={glassButton} disabled={pending !== null} onClick={() => withProvider("google")}>
              {pending === "google" ? <Spinner /> : <GoogleLogo />}
              Google
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <span className="h-px flex-1 bg-blue-400/20" />
            or continue with
            <span className="h-px flex-1 bg-blue-400/20" />
          </div>

          <form onSubmit={withEmail} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-card-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending !== null}
                className={glassInput}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-card-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete={creating ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={pending !== null}
                className={glassInput}
              />
            </div>
            <Button
              type="submit"
              disabled={pending !== null}
              className="w-full rounded-xl bg-gradient-to-r from-blue-400 to-emerald-400 text-white shadow-lg shadow-blue-900/30 hover:opacity-90"
            >
              {pending === "email" && <Spinner size={16} />}
              {creating ? "Create account" : "Sign in"}
            </Button>
          </form>

          {message && (
            <p role="alert" className="text-center text-sm text-red-400">
              {message}
            </p>
          )}

          <Button
            variant="link"
            onClick={() => setCreating(!creating)}
            className="w-full text-sm text-muted-foreground hover:text-card-foreground"
          >
            {creating ? "Already analyzing? Sign in." : "New to Analytica? Start for free forever."}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
