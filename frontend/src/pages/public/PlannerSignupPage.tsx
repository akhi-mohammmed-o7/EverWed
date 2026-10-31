import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { services } from "@/services";

export const PlannerSignupPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await services.auth.registerPlanner({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
      setSubmitted(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to submit your application."); }
    finally { setBusy(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-ivory-50 px-4 py-10"><Card className="w-full max-w-lg p-6 sm:p-8">
    <Link to="/login/planner" className="text-sm font-semibold text-forest-800 hover:underline">Back to Planner sign in</Link>
    <h1 className="mt-5 font-serif text-3xl font-bold text-forest-900">Apply as a planner</h1>
    <p className="mt-2 text-sm text-muted-foreground">The Founder reviews every application. Planner access is enabled only after approval.</p>
    {submitted ? <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Application submitted. You can sign in after the Founder approves your account.</div> : <form onSubmit={submit} className="mt-6 space-y-4">
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
      <label className="block text-sm font-medium">Full name<input required maxLength={120} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="input-base mt-1" /></label>
      <label className="block text-sm font-medium">Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="input-base mt-1" /></label>
      <label className="block text-sm font-medium">Phone<input required type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input-base mt-1" /></label>
      <label className="block text-sm font-medium">Password<input required minLength={12} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="input-base mt-1" /><span className="mt-1 block text-xs text-muted-foreground">12+ characters, including uppercase, lowercase, number and symbol.</span></label>
      <Button type="submit" variant="gold" className="w-full" isLoading={busy || services.isDemo}>Submit application</Button>
    </form>}
  </Card></main>;
};
