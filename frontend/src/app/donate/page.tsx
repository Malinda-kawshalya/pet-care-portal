"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CreditCard, HeartHandshake, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  submitDonationSandbox,
  type DonationFrequency,
  type DonationSandboxResult,
} from "@/lib/donations";

const presetAmounts = [10, 25, 50, 100];

export default function DonatePage() {
  const [frequency, setFrequency] = useState<DonationFrequency>("one_time");
  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(10);
  const [customAmount, setCustomAmount] = useState("");

  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiryMonth, setExpiryMonth] = useState("12");
  const [expiryYear, setExpiryYear] = useState("2030");
  const [cvc, setCvc] = useState("123");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<DonationSandboxResult | null>(null);

  const resolvedAmount = useMemo(() => {
    if (selectedAmount === "custom") {
      const parsed = Number(customAmount);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return selectedAmount;
  }, [selectedAmount, customAmount]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setReceipt(null);

    if (!resolvedAmount || resolvedAmount <= 0) {
      setError("Please choose or enter a valid amount.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await submitDonationSandbox({
        amount: resolvedAmount,
        frequency,
        donorName,
        donorEmail,
        cardNumber,
        cardholderName,
        expiryMonth,
        expiryYear,
        cvc,
      });

      setReceipt(result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to process donation");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#eff4f3]">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[#0d615b] px-4 py-16 sm:px-6 lg:px-8">
          <div className="absolute inset-0 opacity-25">
            <div className="absolute -left-20 -top-16 h-72 w-72 rounded-full bg-[#40d7bc] blur-3xl" />
            <div className="absolute right-0 top-14 h-72 w-72 rounded-full bg-[#126f68] blur-3xl" />
          </div>

          <div className="relative mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="text-white">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider">
                <HeartHandshake size={14} /> Every cent counts
              </p>
              <h1 className="mt-6 max-w-xl text-5xl font-extrabold leading-tight sm:text-6xl">
                Transform a Life
                <span className="block text-[#62f2d8]">Today.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-[#c5f2ea]">
                Your generosity supports rescues, food, shelter, and lifesaving medical care.
                This page uses a secure sandbox processor for safe testing.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-[#a8ece0]">
                <span className="inline-flex items-center gap-2"><ShieldCheck size={15} /> 100% Secure Sandbox</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} /> Tax-deductible</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/50 bg-white p-5 shadow-2xl shadow-black/20 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#f1f5f9] p-1">
                  <button
                    type="button"
                    onClick={() => setFrequency("one_time")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      frequency === "one_time" ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]"
                    }`}
                  >
                    One Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency("monthly")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      frequency === "monthly" ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]"
                    }`}
                  >
                    Monthly
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setSelectedAmount(amount)}
                      className={`rounded-xl border px-4 py-3 text-base font-bold transition ${
                        selectedAmount === amount
                          ? "border-[#0ea5a4] bg-[#ecfeff] text-[#0f172a]"
                          : "border-[#dbe4ea] text-[#334155]"
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAmount("custom")}
                  className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold ${
                    selectedAmount === "custom"
                      ? "border-[#0ea5a4] bg-[#ecfeff] text-[#0f172a]"
                      : "border-[#dbe4ea] text-[#334155]"
                  }`}
                >
                  Custom Amount
                </button>

                {selectedAmount === "custom" ? (
                  <label className="block text-sm font-semibold text-[#334155]">
                    Enter amount
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={customAmount}
                      onChange={(event) => setCustomAmount(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#dbe4ea] px-3 py-2 outline-none focus:border-[#0ea5a4]"
                      placeholder="50"
                    />
                  </label>
                ) : null}

                <div className="rounded-xl border border-[#f7e5b0] bg-[#fff9e7] px-4 py-3 text-xs font-semibold text-[#855f00]">
                  Every dollar makes a direct impact on an animal&apos;s life.
                </div>

                <div className="rounded-xl border border-[#dbe4ea] bg-[#f8fafc] p-4">
                  <p className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-[#0f172a]">
                    <CreditCard size={15} /> Donation Sandbox Checkout
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-[#334155] sm:col-span-2">
                      Full name
                      <input
                        required
                        value={donorName}
                        onChange={(event) => setDonorName(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#dbe4ea] px-3 py-2"
                        placeholder="John Doe"
                      />
                    </label>

                    <label className="text-xs font-semibold text-[#334155] sm:col-span-2">
                      Email
                      <input
                        required
                        type="email"
                        value={donorEmail}
                        onChange={(event) => setDonorEmail(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#dbe4ea] px-3 py-2"
                        placeholder="john@example.com"
                      />
                    </label>

                    <label className="text-xs font-semibold text-[#334155] sm:col-span-2">
                      Cardholder name
                      <input
                        required
                        value={cardholderName}
                        onChange={(event) => setCardholderName(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#dbe4ea] px-3 py-2"
                        placeholder="John Doe"
                      />
                    </label>

                    <label className="text-xs font-semibold text-[#334155] sm:col-span-2">
                      Card number
                      <input
                        required
                        value={cardNumber}
                        onChange={(event) => setCardNumber(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#dbe4ea] px-3 py-2"
                        placeholder="4242 4242 4242 4242"
                      />
                    </label>

                    <label className="text-xs font-semibold text-[#334155]">
                      Exp. month
                      <input
                        required
                        value={expiryMonth}
                        onChange={(event) => setExpiryMonth(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#dbe4ea] px-3 py-2"
                        placeholder="12"
                      />
                    </label>

                    <label className="text-xs font-semibold text-[#334155]">
                      Exp. year
                      <input
                        required
                        value={expiryYear}
                        onChange={(event) => setExpiryYear(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#dbe4ea] px-3 py-2"
                        placeholder="2030"
                      />
                    </label>

                    <label className="text-xs font-semibold text-[#334155] sm:col-span-2">
                      CVC
                      <input
                        required
                        value={cvc}
                        onChange={(event) => setCvc(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#dbe4ea] px-3 py-2"
                        placeholder="123"
                      />
                    </label>
                  </div>
                </div>

                {error ? <p className="text-sm font-semibold text-[#b91c1c]">{error}</p> : null}

                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full rounded-xl bg-[#79cdc4] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#62bdb3] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Processing..." : "Next Step"}
                </button>

                <p className="text-center text-xs text-[#64748b]">
                  Sandbox tip: card ending in 0000 or CVC 000 triggers a declined response.
                </p>
              </form>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-[#0f172a]">Where Your Money Goes</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[#64748b]">
              We are committed to transparency. Every dollar supports practical, measurable welfare outcomes.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <AllocationCard value="75%" label="Direct Animal Care" detail="Food, shelter, medical procedures, vaccinations, and rehabilitation programs." color="bg-[#dbeafe] text-[#1d4ed8]" />
            <AllocationCard value="15%" label="Facility Operations" detail="Maintaining clean, safe spaces and transport for rescues and visitors." color="bg-[#dcfce7] text-[#166534]" />
            <AllocationCard value="10%" label="Community Outreach" detail="Spay/neuter awareness, education campaigns, and adoption event operations." color="bg-[#f3e8ff] text-[#7e22ce]" />
          </div>

          {receipt ? (
            <div className="mt-10 rounded-2xl border border-[#cce8e4] bg-white p-6 shadow-sm">
              <h3 className="text-xl font-extrabold text-[#0f172a]">Sandbox Receipt</h3>
              <p className="mt-2 text-sm text-[#475569]">{receipt.message}</p>
              <div className="mt-4 grid gap-2 text-sm text-[#334155] sm:grid-cols-2">
                <p><span className="font-semibold">Transaction:</span> {receipt.transactionId}</p>
                <p><span className="font-semibold">Status:</span> {receipt.status.toUpperCase()}</p>
                <p><span className="font-semibold">Amount:</span> ${receipt.amount.toFixed(2)}</p>
                <p><span className="font-semibold">Frequency:</span> {receipt.frequency === "monthly" ? "Monthly" : "One Time"}</p>
                <p><span className="font-semibold">Card:</span> **** **** **** {receipt.cardLast4}</p>
                <p><span className="font-semibold">Processed:</span> {new Date(receipt.processedAt).toLocaleString()}</p>
              </div>
            </div>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function AllocationCard({
  value,
  label,
  detail,
  color,
}: {
  value: string;
  label: string;
  detail: string;
  color: string;
}) {
  return (
    <article className="rounded-2xl border border-[#e2e8f0] bg-white p-6 text-center shadow-sm">
      <p className={`mx-auto mb-4 inline-flex rounded-xl px-3 py-1 text-xl font-extrabold ${color}`}>{value}</p>
      <h3 className="text-xl font-bold text-[#0f172a]">{label}</h3>
      <p className="mt-2 text-sm text-[#64748b]">{detail}</p>
    </article>
  );
}
