"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import JobDiscovery from "./JobDiscovery";
import AgentDirectory from "@/components/AgentDirectory";
import AgentActivity from "@/components/AgentActivity";
import TryAgent from "./TryAgent";
import { trialAccess } from "@/lib/trial";
import { useAg } from "@/app/providers";
import { AGLAR, type AgAnahtar } from "@/lib/aglar";
import {
  JOBS,
  compareEvaluations,
  reviewState,
  type Evaluation,
  type Job,
} from "@/lib/evaluation";

type Saved = {
  report: Evaluation;
  history: Evaluation[];
  reviewedFingerprint?: string;
  trialNotes?: string;
  recheckFailed?: boolean;
};
const STORAGE = "nomen-workbench-v1";
const keyOf = (r: Evaluation) =>
  JSON.stringify([r.chain, r.agentId, r.job, r.request ?? ""]);
const titles = {
  shortlist_for_trial: "Worth a controlled trial",
  needs_review: "More evidence needed",
  hold: "Pause and review",
};

export default function Workbench() {
  const { ag: chain, sec: setChain } = useAg();
  const [id, setId] = useState(""),
    [job, setJob] = useState<Job>("custom");
  const [scope, setScope] = useState("");
  const [report, setReport] = useState<Evaluation | null>(null),
    [saved, setSaved] = useState<Saved[]>([]);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [changes, setChanges] = useState<string[]>([]),
    [now, setNow] = useState(0);
  const [checked, setChecked] = useState<string[]>([]),
    [notes, setNotes] = useState("");
  useEffect(() => {
    queueMicrotask(() => {
      setNow(Date.now());
      const p = new URLSearchParams(location.search);
      if (p.get("chain") && Object.hasOwn(AGLAR, p.get("chain")!))
        setChain(p.get("chain") as AgAnahtar);
      if (/^\d+$/.test(p.get("agentId") ?? "")) setId(p.get("agentId")!);
      try {
        const data: unknown = JSON.parse(localStorage.getItem(STORAGE) ?? "[]");
        if (Array.isArray(data))
          setSaved(
            data
              .filter(
                (s) =>
                  s?.report?.version === 1 &&
                  Object.hasOwn(JOBS, s.report.job) &&
                  Array.isArray(s.report.checks) &&
                  Array.isArray(s.report.services) &&
                  Array.isArray(s.history),
              )
              .slice(0, 20),
          );
      } catch {
        setError(
          "Saved work could not be loaded. Your browser may block local storage.",
        );
      }
    });
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, [setChain]);
  function persist(next: Saved[]) {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(next));
      setSaved(next);
      return true;
    } catch {
      setError("Could not save in this browser. Export the report instead.");
      return false;
    }
  }
  async function run(
    target: {
      chain: AgAnahtar;
      agentId: number;
      job: Job;
      request?: string;
    } = { chain, agentId: Number(id), job, request: scope || undefined },
  ) {
    if (busy) return;
    if (!Number.isSafeInteger(target.agentId) || target.agentId < 1) {
      setError("Enter a positive integer agent id.");
      return;
    }
    setBusy(true);
    setChain(target.chain);
    setId(String(target.agentId));
    setJob(target.job);
    setScope(target.request ?? "");
    setError("");
    setNotice("");
    setReport(null);
    setChecked([]);
    setNotes("");
    setChanges([]);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target),
        signal: AbortSignal.timeout(30_000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Evaluation failed");
      const next = data as Evaluation;
      setReport(next);
      setNow(Date.now());
      const prior = saved.find((s) => keyOf(s.report) === keyOf(next));
      if (prior) {
        setChanges(compareEvaluations(prior.report, next));
        persist(
          saved.map((s) =>
            s === prior
              ? {
                  report: next,
                  history: [prior.report, ...prior.history].slice(0, 8),
                  reviewedFingerprint:
                    prior.reviewedFingerprint === next.fingerprint
                      ? prior.reviewedFingerprint
                      : undefined,
                  trialNotes: prior.trialNotes,
                }
              : s,
          ),
        );
      }
    } catch (e) {
      persist(
        saved.map((s) =>
          s.report.chain === target.chain &&
          s.report.agentId === target.agentId &&
          s.report.job === target.job &&
          (s.report.request ?? "") === (target.request ?? "")
            ? { ...s, recheckFailed: true, reviewedFingerprint: undefined }
            : s,
        ),
      );
      setError(
        e instanceof Error
          ? e.message
          : "Live check failed. No approval issued.",
      );
    } finally {
      setBusy(false);
    }
  }
  function save() {
    if (!report) return;
    if (saved.some((s) => keyOf(s.report) === keyOf(report))) {
      setNotice("Already in your shortlist. Recheck to update its evidence.");
      return;
    }
    if (saved.length >= 20) {
      setError(
        "This browser shortlist holds 20 agents. Remove an entry first.",
      );
      return;
    }
    if (persist([{ report, history: [] }, ...saved]))
      setNotice(
        "Saved in this browser. Recheck before use; there is no background monitoring when this page is closed.",
      );
  }
  function exportReport() {
    if (!report) return;
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              report,
              comparison: changes,
              trialNotes: notes,
              trialChecks: checked,
              trialEvidence: "user reported; not independently verified",
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `nomen-${report.chain}-${report.agentId}-${report.job}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const failedRecheck =
    !!report &&
    saved.some((s) => keyOf(s.report) === keyOf(report) && s.recheckFailed);
  const expired =
    !!report &&
    (!Number.isFinite(Date.parse(report.expiresAt)) ||
      now >= Date.parse(report.expiresAt) ||
      failedRecheck);
  const requirements = report
    ? [
        ...JOBS[report.job].acceptance,
        "Price and billing agreed with provider",
        "Permissions and data handling reviewed",
      ]
    : [];
  const trialReady =
    !!report &&
    trialAccess(report, now) &&
    !expired &&
    requirements.every((r) => checked.includes(r)) &&
    notes.trim().length >= 20;
  function recordTrial() {
    if (!report || !trialReady) return;
    const entry = saved.find((s) => keyOf(s.report) === keyOf(report));
    const value = {
      report,
      history: entry?.history ?? [],
      reviewedFingerprint: report.fingerprint,
      trialNotes: notes,
    };
    if (
      persist(
        [
          value,
          ...saved.filter((s) => keyOf(s.report) !== keyOf(report)),
        ].slice(0, 20),
      )
    )
      setNotice(
        "Trial review recorded by you. Changes to the evidence invalidate this review; it is not a NOMEN certification.",
      );
  }
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-12">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--soluk)]">
          Find it. Try it. Decide.
        </p>
        <h1 className="baslik mt-3 text-4xl leading-tight sm:text-6xl">
          Find the right agent
          <br />
          for your work.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--soluk)]">
          Describe your job. Get a shortlist of agents, open their services,
          and test a small example before committing.
        </p>
      </div>
      <ol className="my-8 grid gap-3 text-sm sm:grid-cols-3">
        {[
          "01 · Describe your job",
          "02 · Choose a matching agent",
          "03 · Try it with a small sample",
        ].map((t) => (
          <li className="rounded-xl border border-[var(--cizgi)] p-4" key={t}>
            {t}
          </li>
        ))}
      </ol>
      <JobDiscovery
        disabled={busy}
        onSelect={(selectedChain, agentId, request) => {
          void run({ chain: selectedChain, agentId, job: "custom", request });
          document
            .getElementById("live-evidence")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
      <AgentDirectory />
      <div id="live-evidence" className="mb-5 scroll-mt-24">
        <h2 className="text-2xl">Try an agent with current evidence</h2>
        <p className="mt-2 text-sm text-[var(--soluk)]">
          Choose a recommendation above, or look up a known registry record
          below.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[310px_1fr]">
        <aside>
          <form
            className="kart-cizgili space-y-5 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              void run();
            }}
          >
            <h3 className="text-xl">Registry lookup</h3>
            <label className="block text-sm">
              Evidence checklist
              <select
                className="girdi mt-2 w-full"
                value={job}
                onChange={(e) => setJob(e.target.value as Job)}
              >
                {Object.entries(JOBS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            {scope && (
              <p className="break-words text-sm text-[var(--soluk)]">
                Task: {scope}
              </p>
            )}
            <label className="block text-sm">
              Network
              <select
                className="girdi mt-2 w-full"
                value={chain}
                onChange={(e) => setChain(e.target.value as AgAnahtar)}
              >
                {Object.entries(AGLAR).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.ad}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Agent id
              <input
                className="girdi mt-2 w-full"
                inputMode="numeric"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                pattern="[0-9]+"
              />
            </label>
            <button disabled={busy} className="dugme dugme-koyu w-full">
              {busy ? "Checking current evidence…" : "Check this agent"}
            </button>
            <p className="text-xs leading-relaxed text-[var(--soluk)]">
              Reads public registry data and up to three public service URLs.
              Sends no wallet secrets, private documents, payment or task
              instructions.
            </p>
            <Link href="#directory" className="block text-sm underline">
              Find an agent in the directory →
            </Link>
          </form>
          <p className="mt-4 text-xs leading-relaxed text-[var(--soluk)]">
            A successful HTTP response does not prove that the agent can
            complete your job. Trial results below are reviewed and recorded by
            you.
          </p>
        </aside>
        <section aria-live="polite" className="min-w-0">
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4"
            >
              {error}
            </p>
          )}
          {notice && (
            <p className="mb-4 rounded-xl border border-[var(--cizgi)] p-4">
              {notice}
            </p>
          )}
          {!report ? (
            <div className="kart-cizgili p-8">
              <h2 className="text-2xl">Evidence before commitment</h2>
              <p className="mt-4 leading-relaxed text-[var(--soluk)]">
                The report checks whether ownership and metadata still match the
                published scan, whether declared URLs respond, and whether the
                agent describes capabilities relevant to your job.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3>Observed now</h3>
                  <p className="mt-2 text-sm text-[var(--soluk)]">
                    Block, owner, document hash, service response and response
                    time.
                  </p>
                </div>
                <div>
                  <h3>Still yours to verify</h3>
                  <p className="mt-2 text-sm text-[var(--soluk)]">
                    Task quality, price, permissions and data handling. No
                    opaque trust score.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-[var(--lacivert)] p-6 text-white">
                <p className="text-xs uppercase tracking-widest">
                  {report.chain} · #{report.agentId} · {JOBS[report.job].name}
                </p>
                <h2 className="mt-3 text-3xl">
                  {expired
                    ? "Evidence expired — recheck"
                    : titles[report.decision]}
                </h2>
                <p className="mt-3 opacity-85">{report.nextAction}</p>
                <p className="mt-5 text-xs opacity-70">
                  {report.name} · checked{" "}
                  {new Date(report.checkedAt).toLocaleString()} · expires{" "}
                  {new Date(report.expiresAt).toLocaleTimeString()} · block{" "}
                  {report.block ?? "unconfirmed"}
                </p>
              </div>
              {changes.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                  <h3>Changed since your saved check</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {changes.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm">
                    Previous trial acceptance must be reviewed against the new
                    evidence.
                  </p>
                </div>
              )}
              <TryAgent key={keyOf(report) + report.fingerprint} report={report} now={now} expired={expired} />
              <AgentActivity chain={report.chain} agentId={report.agentId} />
              <div className="mt-5 divide-y divide-[var(--cizgi)] rounded-xl border border-[var(--cizgi)]">
                {report.checks.map((c) => (
                  <div key={c.key} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3>{c.title}</h3>
                      <span
                        className={`rozet ${c.status === "pass" ? "rozet-iyi" : c.status === "unknown" ? "" : "rozet-uyari"}`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--soluk)]">
                      {c.detail}
                    </p>
                  </div>
                ))}
              </div>
              {report.services.length > 0 && (
                <div className="mt-5 space-y-3">
                  <h3>Service observations</h3>
                  {report.services.map((s) => (
                    <div
                      className="rounded-xl bg-[var(--yuzey)] p-4 text-sm"
                      key={s.url}
                    >
                      <p className="break-all mono text-xs">{s.url}</p>
                      <p className="mt-2">
                        {s.status.replaceAll("_", " ")} · {s.protocol} ·{" "}
                        {s.latencyMs} ms{" "}
                        {s.httpStatus ? `· HTTP ${s.httpStatus}` : ""}
                      </p>
                      {s.skills.length > 0 && (
                        <p className="mt-2 text-[var(--soluk)]">
                          Declared skills: {s.skills.slice(0, 3).join("; ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="my-5 flex flex-wrap gap-3">
                <button onClick={save} className="dugme">
                  Save to shortlist
                </button>
                <button onClick={exportReport} className="dugme">
                  Export evidence JSON
                </button>
                <Link
                  href={`/agent/${report.chain}/${report.agentId}`}
                  className="dugme"
                >
                  Registry evidence →
                </Link>
              </div>
              <details className="kart-cizgili p-5" open>
                <summary className="cursor-pointer text-lg">
                  Record your trial result
                </summary>
                <p className="mt-4 text-sm leading-relaxed">
                  {JOBS[report.job].sample}
                </p>
                <p className="mt-3 text-xs text-[var(--soluk)]">
                  Complete this with the provider in your own environment. These
                  checkboxes are your review, not an automated test result. Do
                  not paste confidential output.
                </p>
                <div className="mt-4 space-y-3">
                  {requirements.map((item) => (
                    <label
                      className="flex items-start gap-3 text-sm"
                      key={item}
                    >
                      <input
                        type="checkbox"
                        checked={checked.includes(item)}
                        onChange={(e) =>
                          setChecked((v) =>
                            e.target.checked
                              ? [...v, item]
                              : v.filter((i) => i !== item),
                          )
                        }
                      />
                      {item}
                    </label>
                  ))}
                </div>
                <label className="mt-5 block text-sm">
                  Trial result and public evidence
                  <textarea
                    className="girdi mt-2 min-h-24 w-full"
                    maxLength={2000}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What did you ask, what came back, and how did you verify it?"
                  />
                </label>
                <button
                  disabled={!trialReady}
                  onClick={recordTrial}
                  className="dugme dugme-koyu mt-4"
                >
                  Record my trial review
                </button>
                <p className="mt-2 text-xs text-[var(--soluk)]">
                  Requires fresh evidence, a usable provider link, no failed or changed checks, all review boxes and a result note. This records your review only; it never authorizes execution.
                </p>
              </details>
              <details className="mt-5 text-sm text-[var(--soluk)]">
                <summary className="cursor-pointer">
                  What this report cannot establish
                </summary>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  {report.limitations.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </details>
            </>
          )}
        </section>
      </div>
      <section id="shortlist" className="mt-14 scroll-mt-24 border-t border-[var(--cizgi)] pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl">Your working shortlist</h2>
          <span className="text-sm text-[var(--soluk)]">
            Stored on this device · recheck before use
          </span>
        </div>
        {!saved.length ? (
          <p className="mt-4 text-[var(--soluk)]">
            Save an evaluation to compare ownership, metadata and service
            changes on your next check.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {saved.map((s) => (
              <article className="kart-cizgili p-5" key={keyOf(s.report)}>
                <div className="flex justify-between gap-3">
                  <h3 className="break-words">{s.report.name}</h3>
                  <span className="text-xs">
                    {s.report.chain} #{s.report.agentId}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  {JOBS[s.report.job].name} ·{" "}
                  {s.recheckFailed
                    ? "recheck failed · review required"
                    : reviewState(s.report, now)}
                </p>
                {s.report.request && (
                  <p className="mt-2 line-clamp-3 text-sm text-[var(--soluk)]">
                    {s.report.request}
                  </p>
                )}
                <p className="mt-2 text-xs text-[var(--soluk)]">
                  {s.reviewedFingerprint === s.report.fingerprint &&
                  now < Date.parse(s.report.expiresAt)
                    ? "Trial reviewed by you for this evidence version"
                    : "Trial requires review"}{" "}
                  · {s.history.length} previous checks
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    disabled={busy}
                    className="dugme"
                    onClick={() =>
                      void run({
                        chain: s.report.chain as AgAnahtar,
                        agentId: s.report.agentId,
                        job: s.report.job,
                        request: s.report.request,
                      })
                    }
                  >
                    Recheck changes
                  </button>
                  <button
                    disabled={busy}
                    className="dugme"
                    onClick={() => {
                      setReport(s.report);
                      setChain(s.report.chain as AgAnahtar);
                      setId(String(s.report.agentId));
                      setJob(s.report.job);
                      setScope(s.report.request ?? "");
                      setChanges([]);
                      setChecked([]);
                      setNotes(s.trialNotes ?? "");
                    }}
                  >
                    View
                  </button>
                  <button
                    disabled={busy}
                    className="text-xs underline"
                    onClick={() => persist(saved.filter((v) => v !== s))}
                  >
                    Remove
                  </button>
                </div>
                {s.history.length > 0 && (
                  <details className="mt-3 text-xs">
                    <summary>Observation history</summary>
                    {s.history.map((h, i) => (
                      <p className="mt-2" key={i}>
                        {new Date(h.checkedAt).toLocaleString()} ·{" "}
                        {h.decision.replaceAll("_", " ")} ·{" "}
                        {h.fingerprint.slice(0, 12)}
                      </p>
                    ))}
                  </details>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
