import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { services } from "@/services";
import type { User, UserCreate, UserRole, Wedding } from "@/types";

const teamRoles: Exclude<UserRole, "admin">[] = ["planner", "team", "finance", "couple"];

export const TeamManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "admin">>("planner");
  const [weddingId, setWeddingId] = useState("");
  const [partnerOneName, setPartnerOneName] = useState("");
  const [partnerTwoName, setPartnerTwoName] = useState("");
  const [couplePhone, setCouplePhone] = useState("");
  const [assignmentWeddingId, setAssignmentWeddingId] = useState("");
  const [plannerEmail, setPlannerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [nextUsers, nextWeddings] = await Promise.all([services.auth.listUsers(), services.weddings.list()]);
    setUsers(nextUsers);
    setWeddings(nextWeddings);
  };

  useEffect(() => {
    if (user?.role === "admin") {
      void refresh().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load team data."));
    }
  }, [user?.role]);

  if (user?.role !== "admin") {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">Founder access is required to manage accounts and planner assignments.</div>;
  }

  const submitUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload: UserCreate = { name: name.trim(), email: email.trim(), password, role };
      if (role === "couple") {
        if (weddingId) payload.wedding_id = weddingId;
        else Object.assign(payload, { partner_one_name: partnerOneName.trim(), partner_two_name: partnerTwoName.trim(), phone: couplePhone.trim() });
      }
      await services.auth.createUser(payload);
      setName("");
      setEmail("");
      setPassword("");
      setWeddingId("");
      setPartnerOneName("");
      setPartnerTwoName("");
      setCouplePhone("");
      await refresh();
      setMessage("Account created. Share the password through a secure channel; password reset is not available yet.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create the account.");
    } finally {
      setBusy(false);
    }
  };

  const submitAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignmentWeddingId || !plannerEmail) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await services.weddings.assignPlanner(assignmentWeddingId, plannerEmail);
      await refresh();
      setMessage("Planner assignment saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to assign this planner.");
    } finally {
      setBusy(false);
    }
  };

  const toggleAccount = async (account: User) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await services.auth.setUserActive(account.uid, account.active === false);
      setUsers((current) => current.map((item) => item.uid === updated.uid ? updated : item));
      setMessage(`${updated.name}'s account is ${updated.active ? "active" : "inactive"}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update this account.");
    } finally {
      setBusy(false);
    }
  };

  const reviewApplication = async (account: User, status: "approved" | "rejected") => {
    setBusy(true); setError(""); setMessage("");
    try { await services.auth.setPlannerApproval(account.uid, status); await refresh(); setMessage(`${account.name}'s application ${status}.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to review this application."); }
    finally { setBusy(false); }
  };

  const planners = users.filter((item) => item.role === "planner" && item.active !== false && item.approval_status !== "pending" && item.approval_status !== "rejected");
  const selectedWedding = weddings.find((item) => item.id === assignmentWeddingId);

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-gold-700">Founder administration</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-forest-900">Team & access</h1>
        <p className="mt-1 text-sm text-muted-foreground">Provision accounts and connect planner accounts to their wedding workspaces.</p>
      </header>

      {(message || error) && <div role={error ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{error || message}</div>}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-forest-900">Create an account</h2>
          <form className="mt-4 space-y-3" onSubmit={submitUser}>
            <label className="block text-sm font-medium">Full name<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2" /></label>
            <label className="block text-sm font-medium">Email<input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2" /></label>
            <label className="block text-sm font-medium">Account password<input required minLength={12} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2" /><span className="mt-1 block text-xs text-muted-foreground">At least 12 characters. Deliver it privately. Password reset is not available yet.</span></label>
            <label className="block text-sm font-medium">Role<select value={role} onChange={(event) => setRole(event.target.value as Exclude<UserRole, "admin">)} className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2">{teamRoles.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></label>
            {role === "couple" && <><label className="block text-sm font-medium">Partner one name<input required={!weddingId} value={partnerOneName} onChange={(event) => setPartnerOneName(event.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2" /></label><label className="block text-sm font-medium">Partner two name<input required={!weddingId} value={partnerTwoName} onChange={(event) => setPartnerTwoName(event.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2" /></label><label className="block text-sm font-medium">Phone<input required={!weddingId} type="tel" value={couplePhone} onChange={(event) => setCouplePhone(event.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2" /></label><label className="block text-sm font-medium">Wedding (optional)<select value={weddingId} onChange={(event) => setWeddingId(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2"><option value="">Create wedding later</option>{weddings.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></>}
            <button disabled={busy} className="rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Create account"}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-forest-900">Assign a planner</h2>
          <form className="mt-4 space-y-3" onSubmit={submitAssignment}>
            <label className="block text-sm font-medium">Wedding<select required value={assignmentWeddingId} onChange={(event) => setAssignmentWeddingId(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2"><option value="">Choose a wedding</option>{weddings.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
            <label className="block text-sm font-medium">Planner<select required value={plannerEmail} onChange={(event) => setPlannerEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2"><option value="">Choose an active planner</option>{planners.map((item) => <option key={item.uid} value={item.email}>{item.name} · {item.email}</option>)}</select></label>
            {selectedWedding && <p className="text-xs text-muted-foreground">Current assignment: {selectedWedding.assigned_planner_email || "Unassigned"}</p>}
            <button disabled={busy || !weddings.length || !planners.length} className="rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save assignment"}</button>
            {planners.length === 0 && <p className="text-xs text-amber-800">Create a planner account before assigning a wedding.</p>}
          </form>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4"><h2 className="font-serif text-xl font-semibold text-forest-900">Accounts</h2></div>
        <div className="divide-y divide-border">
          {users.map((item) => <div key={item.uid} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-forest-900">{item.name}</p><p className="text-sm text-muted-foreground">{item.email}</p></div><div className="flex flex-wrap items-center gap-3"><span className="w-fit rounded-full bg-ivory-100 px-3 py-1 text-xs font-semibold capitalize text-forest-800">{item.role}</span><span className={`text-xs font-medium ${item.active === false ? "text-rose-700" : "text-emerald-700"}`}>{item.approval_status === "pending" ? "Approval pending" : item.approval_status === "rejected" ? "Rejected" : item.active === false ? "Inactive" : "Active"}</span>{item.role === "planner" && item.approval_status === "pending" ? <><button type="button" disabled={busy} onClick={() => void reviewApplication(item, "approved")} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Approve</button><button type="button" disabled={busy} onClick={() => void reviewApplication(item, "rejected")} className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-800 disabled:opacity-50">Reject</button></> : item.uid !== user.uid && <button type="button" disabled={busy} onClick={() => void toggleAccount(item)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-forest-800 disabled:opacity-50">{item.active === false ? "Reactivate" : "Deactivate"}</button>}</div></div>)}
          {users.length === 0 && <p className="px-5 py-4 text-sm text-muted-foreground">No accounts found.</p>}
        </div>
      </section>
    </main>
  );
};
