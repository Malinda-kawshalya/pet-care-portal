"use client";

export function AdminQRPanel() {
  return (
    <section className="rounded-3xl border border-[#d8deee] bg-white p-8 shadow-sm">
      <div className="text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f6fd]">
          <span className="text-4xl">📱</span>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-[#0f172a]">QR Code Monitoring</h2>
        <p className="mt-2 text-[#64748b]">
          Track QR scans and monitor pet engagement in real-time.
        </p>
        <a
          href="/qr"
          className="mt-6 inline-flex rounded-full bg-[#2f66ff] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2553ca]"
        >
          Open QR Center →
        </a>
      </div>
    </section>
  );
}
