export type ShopOwner = {
  id: string;
  fullName?: string;
  role?: string;
};

export type ShopApprovalStatus = "pending_approval" | "approved" | "rejected";

export type ShopProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  isActive: boolean;
  approvalStatus: ShopApprovalStatus;
  approvedAt?: string;
  approvedBy: ShopOwner | null;
  owner: ShopOwner | null;
  createdAt: string;
  updatedAt: string;
};

export type ShopListResponse = {
  products: ShopProduct[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export type ShopProductInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
};
