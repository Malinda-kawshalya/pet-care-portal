"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getAuthState } from "@/lib/auth-storage";
import {
  createShopProduct,
  deleteShopProduct,
  fetchMyShopProducts,
  fetchShopProducts,
  updateShopProduct,
} from "@/lib/shop";
import type { ShopProduct, ShopProductInput } from "@/types/shop";

const emptyForm: ShopProductInput = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  category: "General",
  imageUrl: "",
};

const lkrFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

export default function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [myProducts, setMyProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<ShopProductInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const canManageProducts = role === "veterinarian" || role === "super_admin";

  useEffect(() => {
    const authState = getAuthState();
    setRole(authState?.user.role || null);

    let active = true;

    async function loadPage() {
      setLoading(true);
      setError("");

      try {
        const [shopData, ownerProducts] = await Promise.all([
          fetchShopProducts(),
          canManageProducts ? fetchMyShopProducts(true) : Promise.resolve([]),
        ]);

        if (!active) {
          return;
        }

        setProducts(shopData.products || []);
        setMyProducts(ownerProducts);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load shop products");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      active = false;
    };
  }, [canManageProducts]);

  const featuredProducts = useMemo(() => products.slice(0, 12), [products]);

  function updateField<K extends keyof ShopProductInput>(field: K, value: ShopProductInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(product: ShopProduct) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      imageUrl: product.imageUrl,
    });
    setMessage("");
    setError("");
  }

  function clearForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId) {
        await updateShopProduct(editingId, form);
        setMessage("Product updated successfully.");
      } else {
        await createShopProduct(form);
        setMessage("Product created successfully.");
      }

      clearForm();
      const [shopData, ownerProducts] = await Promise.all([
        fetchShopProducts(),
        fetchMyShopProducts(true),
      ]);
      setProducts(shopData.products || []);
      setMyProducts(ownerProducts);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(productId: string) {
    if (!window.confirm("Remove this product from the shop?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteShopProduct(productId);
      setMessage("Product removed successfully.");
      const [shopData, ownerProducts] = await Promise.all([
        fetchShopProducts(),
        fetchMyShopProducts(true),
      ]);
      setProducts(shopData.products || []);
      setMyProducts(ownerProducts);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to remove product");
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8ff]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-[#dbe4f4] bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2f66ff]">PetAI Shop</p>
          <h1 className="mt-2 text-4xl font-extrabold text-[#0f172a]">Pet Essentials Marketplace</h1>
          <p className="mt-3 max-w-2xl text-sm text-[#475569]">
            Browse trusted products for nutrition, safety, enrichment, and recovery. Veterinarians and
            super admins can publish and manage products directly from this page.
          </p>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-6 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
            {message}
          </div>
        ) : null}

        {canManageProducts ? (
          <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <form
              onSubmit={handleSubmit}
              className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-[#0f172a]">
                {editingId ? "Edit Product" : "Add Product"}
              </h2>
              <div className="mt-5 grid gap-4">
                <label className="block text-sm font-semibold text-[#0f172a]">
                  Product Name
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
                  />
                </label>

                <label className="block text-sm font-semibold text-[#0f172a]">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-[#0f172a]">
                    Price
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(event) => updateField("price", Number(event.target.value) || 0)}
                      required
                      className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
                    />
                  </label>

                  <label className="block text-sm font-semibold text-[#0f172a]">
                    Stock
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={(event) => updateField("stock", Number(event.target.value) || 0)}
                      required
                      className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-[#0f172a]">
                    Category
                    <input
                      value={form.category}
                      onChange={(event) => updateField("category", event.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
                    />
                  </label>

                  <label className="block text-sm font-semibold text-[#0f172a]">
                    Image URL
                    <input
                      value={form.imageUrl}
                      onChange={(event) => updateField("imageUrl", event.target.value)}
                      placeholder="https://..."
                      className="mt-1 w-full rounded-xl border border-[#d5dfef] px-4 py-3 outline-none focus:border-[#2f66ff]"
                    />
                  </label>
                </div>

                <div className="mt-2 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-[#2f66ff] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? "Saving..." : editingId ? "Update Product" : "Add Product"}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={clearForm}
                      className="rounded-full border border-[#d1d9ea] px-5 py-2 text-sm font-semibold text-[#0f172a]"
                    >
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
              </div>
            </form>

            <div className="rounded-[2rem] border border-[#dbe4f4] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[#0f172a]">Your Products</h2>
              <div className="mt-5 space-y-3">
                {myProducts.map((product) => (
                  <article
                    key={product.id}
                    className="rounded-2xl border border-[#e6edf8] bg-[#fafcff] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-[#0f172a]">{product.name}</h3>
                        <p className="mt-1 text-sm text-[#64748b]">{product.category}</p>
                      </div>
                      <p className="text-sm font-bold text-[#1d4ed8]">{lkrFormatter.format(product.price)}</p>
                    </div>
                    <p className="mt-2 text-sm text-[#334155]">Stock: {product.stock}</p>
                    <p className="mt-1 text-xs font-semibold text-[#475569]">
                      Approval: {product.approvalStatus.replace(/_/g, " ")}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="rounded-full border border-[#d1d9ea] px-4 py-1.5 text-xs font-semibold text-[#0f172a]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(product.id)}
                        className="rounded-full bg-[#ef4444] px-4 py-1.5 text-xs font-semibold text-white"
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
                {!myProducts.length ? (
                  <p className="rounded-2xl border border-dashed border-[#cbd5e1] p-4 text-sm text-[#64748b]">
                    You have not added any products yet.
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-[#0f172a]">Available Products</h2>
          {loading ? (
            <p className="mt-4 text-sm text-[#64748b]">Loading products...</p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-3xl border border-[#dbe4f4] bg-white shadow-sm"
                >
                  <div className="h-44 w-full bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-[#f8fafc]">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#2f66ff]">
                      {product.category}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-[#0f172a]">{product.name}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-[#475569]">{product.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xl font-extrabold text-[#1d4ed8]">{lkrFormatter.format(product.price)}</p>
                      <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#3730a3]">
                        Stock {product.stock}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
              {!featuredProducts.length ? (
                <p className="rounded-2xl border border-dashed border-[#cbd5e1] p-4 text-sm text-[#64748b]">
                  No products available yet.
                </p>
              ) : null}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
