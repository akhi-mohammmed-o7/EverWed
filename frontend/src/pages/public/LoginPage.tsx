import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Heart, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EverWedLogo } from "@/components/ui/EverWedLogo";
import { useAuth } from "@/context/AuthContext";
import { services } from "@/services";

export type AuthPortal = "founder" | "planner" | "couple";
const portalDetails = {
  founder: { title: "Founder portal", role: "admin", description: "Company overview and team access", icon: ShieldCheck, destination: "/planner" },
  planner: { title: "Planner portal", role: "planner", description: "Your assigned wedding workspaces", icon: UserRound, destination: "/planner" },
  couple: { title: "Couple portal", role: "couple", description: "Your wedding planning journey", icon: Heart, destination: "/couple/dashboard" },
} as const;

export const PortalSelectionPage: React.FC = () => (
  <main className="min-h-screen bg-ivory-50 px-4 py-12 sm:py-16">
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <Link to="/" className="inline-block"><EverWedLogo variant="stacked" size="xl" showTagline /></Link>
        <h1 className="mt-8 font-serif text-3xl font-bold text-forest-900 sm:text-4xl">Choose your portal</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your access is determined by your account. Portal selection never changes your role.</p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {(Object.entries(portalDetails) as [AuthPortal, (typeof portalDetails)[AuthPortal]][]).map(([key, portal]) => {
          const Icon = portal.icon;
          return <Card key={key} className="flex flex-col p-6"><Icon className="h-7 w-7 text-gold-700" /><h2 className="mt-4 font-serif text-xl font-semibold text-forest-900">{portal.title}</h2><p className="mt-1 flex-1 text-sm text-muted-foreground">{portal.description}</p><Link to={`/login/${key}`} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-900">Continue<ArrowRight className="h-4 w-4" /></Link>{key === "couple" && <Link to="/register/couple" className="mt-3 text-center text-sm font-semibold text-forest-800 hover:underline">Create a couple account</Link>}</Card>;
        })}
      </div>
      {!services.isDemo && <p className="mt-6 text-center text-xs text-muted-foreground">The first Founder account is securely created from the Founder portal when this database has no accounts.</p>}
      {services.isDemo && <p role="status" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-3 text-center text-xs text-amber-950">Demo preview only. Accounts and records are simulated and are not saved to SQLite.</p>}
    </div>
  </main>
);

export const LoginPage: React.FC<{ portal: AuthPortal }> = ({ portal }) => {
  const navigate = useNavigate();
  const { login, setupFounder, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [founderName, setFounderName] = useState("");
  const [setupAvailable, setSetupAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const details = portalDetails[portal];
  const Icon = details.icon;

  useEffect(() => {
    if (portal !== "founder" || services.isDemo) return;
    void services.auth.founderSetupAvailable().then(setSetupAvailable).catch(() => setSetupAvailable(false));
  }, [portal]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      if (portal === "founder" && setupAvailable) {
        await setupFounder({ name: founderName.trim(), email: email.trim(), password });
        navigate("/planner", { replace: true });
        return;
      }
      const account = await login({ username: email.trim(), password });
      if (account.role !== details.role) {
        await logout();
        const correctPortal = account.role === "admin" ? "Founder" : account.role === "planner" ? "Planner" : account.role === "couple" ? "Couple" : "authorised";
        setError(`This account uses the ${correctPortal} portal. Sign in there to continue.`);
        return;
      }
      navigate(account.role === "couple" ? account.wedding_id ? "/couple/dashboard" : "/couple/builder" : details.destination, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in. Check your details and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory-50 px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-forest-800 hover:underline"><ArrowLeft className="h-4 w-4" />All portals</Link>
        <header className="text-center"><Link to="/"><EverWedLogo variant="stacked" size="xl" showTagline /></Link><div className="mt-6 inline-flex rounded-full bg-gold/15 p-3 text-gold-800"><Icon className="h-6 w-6" /></div><h1 className="mt-3 font-serif text-3xl font-bold text-forest-900">{setupAvailable ? "Set up Founder access" : details.title}</h1><p className="mt-1 text-sm text-muted-foreground">{setupAvailable ? "Create the first Founder account for this local workspace." : details.description}</p></header>
        <Card className="p-6 sm:p-8">
          {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            {setupAvailable && <label className="block text-sm font-medium text-forest-900">Founder name<input required maxLength={120} autoComplete="name" value={founderName} onChange={(event) => setFounderName(event.target.value)} className="input-base mt-1" /></label>}
            <label className="block text-sm font-medium text-forest-900">Email<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="input-base mt-1" /></label>
            <label className="block text-sm font-medium text-forest-900"><span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4" />Password</span><input required minLength={setupAvailable ? 12 : undefined} type="password" autoComplete={setupAvailable ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="input-base mt-1" /></label>
            <Button type="submit" variant="gold" className="w-full" isLoading={isLoading}>{setupAvailable ? "Create Founder account" : `Sign in to ${portal} portal`}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </form>
          {portal === "couple" && <p className="mt-5 text-center text-sm text-muted-foreground">New to EverWed? <Link to="/register/couple" className="font-semibold text-forest-800 hover:underline">Create an account</Link></p>}
          {portal === "planner" && <p className="mt-5 text-center text-sm text-muted-foreground">New planner? <Link to="/register/planner" className="font-semibold text-forest-800 hover:underline">Apply for access</Link></p>}
          {services.isDemo && <p role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">Preview mode is non-persistent. This portal still checks the selected demo account's simulated role.</p>}
        </Card>
      </div>
    </main>
  );
};
