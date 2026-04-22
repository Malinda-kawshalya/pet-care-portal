"use client";

import { useEffect, useState } from "react";
import {
  approveShopProduct,
  fetchPendingShopProducts,
  rejectShopProduct,
} from "@/lib/shop";
import type { ShopProduct } from "@/types/shop";

export function AdminProductsPanel() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPendingProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetchPendingShopProducts();
      setProducts(response.products || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load pending products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPendingProducts();
  }, []);

  async function handleApprove(productId: string) {
    setError("");
    setMessage("");

    try {
      await approveShopProduct(productId);
      setMessage("Product approved successfully.");
      await loadPendingProducts();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Failed to approve product");
    }
  }

  async function handleReject(productId: string) {
    setError("");
    setMessage("");

    try {
      await rejectShopProduct(productId);
      setMessage("Product rejected successfully.");
      await loadPendingProducts();
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : "Failed to reject product");
    }
  }

  return (
    <section className="space-y-5">
      {error ? (
        <div className="rounded-3xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-3xl border border-[#86efac] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-[#d8deee] bg-white p-6 text-sm text-[#64748b]">
          Loading pending products...
        </div>
      ) : products.length ? (
        <div className="space-y-4 max-h-[700px] overflow-y-auto">
          {products.map((product) => (
            <article
              key={product.id}
              className="rounded-3xl border border-[#d8deee] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#0f172a]">{product.name}</h2>
                  <p className="mt-1 text-sm text-[#64748b]">{product.description || "No description"}</p>
                  {product.price && (
                    <p className="mt-2 text-sm font-semibold text-[#2f66ff]">
                      ${Number(product.price).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {product.photos && product.photos.length > 0 && (
                <div className="mt-4 grid gap-2 grid-cols-4">
                  {product.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`Product ${idx}`}
                      className="aspect-square rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleApprove(product.id)}
                  className="rounded-full bg-[#16a34a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#15803d]"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void handleReject(product.id)}
                  className="rounded-full bg-[#ef4444] px-5 py-2 text-sm font-semibold text-white hover:bg-[#dc2626]"
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[#cbd5e1] bg-white p-8 text-sm text-[#64748b]">
          No pending products to review.
        </div>
      )}
    </section>
  );
}
