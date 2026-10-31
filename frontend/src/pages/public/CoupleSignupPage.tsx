import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EverWedLogo } from "@/components/ui/EverWedLogo";
import { useAuth } from "@/context/AuthContext";
import { services } from "@/services";

export const CoupleSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerCouple } = useAuth();
  const [partnerOne, setPartnerOne] = useState("");
  const [partnerTwo, setPartnerTwo] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    if (!terms) {
      setError("Please accept the account and data storage terms to continue.");
      return;
    }
    setBusy(true);
    try {
      await registerCouple({
        partner_one_name: partnerOne.trim(),
        partner_two_name: partnerTwo.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        terms_accepted: true,
      });
      navigate("/couple/builder", { replace: true, state: { registered: true } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create the couple account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory-50 px-4 py-10">
      <div className="w-full max-w-xl space-y-5">
        <Link to="/login/couple" className="inline-flex items-center gap-2 text-sm font-medium text-forest-800 hover:underline"><ArrowLeft className="h-4 w-4" />Couple portal</Link>
        <header className="text-center"><Link to="/"><EverWedLogo variant="stacked" size="xl" showTagline /></Link><h1 className="mt-6 font-serif text-3xl font-bold text-forest-900">Create your couple account</h1><p className="mt-2 text-sm text-muted-foreground">Your account is private to you. You can set up your wedding workspace after registration.</p></header>
        <Card className="p-6 sm:p-8">
          {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-forest-900">Partner one name<input required maxLength={120} autoComplete="given-name" value={partnerOne} onChange={(event) => setPartnerOne(event.target.value)} className="input-base mt-1" /></label>
              <label className="block text-sm font-medium text-forest-900">Partner two name<input required maxLength={120} autoComplete="additional-name" value={partnerTwo} onChange={(event) => setPartnerTwo(event.target.value)} className="input-base mt-1" /></label>
            </div>
            <label className="block text-sm font-medium text-forest-900">Email<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input-base mt-1" /></label>
            <label className="block text-sm font-medium text-forest-900">Phone<input required type="tel" minLength={8} maxLength={30} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="input-base mt-1" /></label>
            <label className="block text-sm font-medium text-forest-900">Password<input required minLength={12} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="input-base mt-1" /><span className="mt-1 block text-xs text-muted-foreground">12+ characters with uppercase, lowercase, a number and a symbol.</span></label>
            <label className="block text-sm font-medium text-forest-900">Confirm password<input required minLength={12} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="input-base mt-1" /></label>
            <label className="flex items-start gap-3 rounded-xl border border-border bg-ivory-50 p-3 text-sm text-forest-900"><input required type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="mt-0.5 h-4 w-4 accent-forest-800" /><span>I accept the EverWed account terms and acknowledge that the information I submit will be stored in this wedding workspace.</span></label>
            <Button type="submit" variant="gold" className="w-full" isLoading={busy || services.isDemo}>{services.isDemo ? "Switch off demo preview to register" : "Create couple account"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </form>
        </Card>
      </div>
    </main>
  );
};
