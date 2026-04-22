"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  approveShopProduct,
  fetchPendingShopProducts,
  rejectShopProduct,
} from "@/lib/shop";
import type { ShopProduct } from "@/types/shop";

export default function ShopApprovalsPage() {
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
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shop Product Approvals</h1>
            <p className="mt-2 text-sm text-gray-600">
              Review products submitted by vets and approve or reject visibility.
            </p>
          </div>
          <Link href="/admin" className="text-sm font-semibold text-blue-600 hover:underline">
            Back to Admin Dashboard
          </Link>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Loading pending products...
          </div>
        ) : products.length ? (
          <div className="space-y-4">
            {products.map((product) => (
              <article key={product.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
                    <p className="mt-1 text-sm text-gray-600">{product.description || "No description"}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      Submitted by {product.owner?.fullName || "Unknown"} ({product.owner?.role || "n/a"})
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Category: {product.category} | Stock: {product.stock} | Price: LKR {product.price}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(product.id)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(product.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
            No pending products right now.
          </div>
        )}
      </div>
    </main>
  );
}
