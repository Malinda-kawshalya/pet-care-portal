const { z } = require("zod");
const ShopProduct = require("../models/ShopProduct");
const { USER_ROLES } = require("../constants/roles");

const createProductSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().default(""),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0).optional().default(0),
  category: z.string().trim().max(80).optional().default("General"),
  imageUrl: z.string().trim().url().or(z.literal("")).optional().default(""),
});

const updateProductSchema = createProductSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

function toPublicProduct(product) {
  return {
    id: product._id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    category: product.category,
    imageUrl: product.imageUrl,
    isActive: product.isActive,
    approvalStatus: product.approvalStatus,
    approvedAt: product.approvedAt,
    approvedBy: product.approvedBy
      ? {
          id: product.approvedBy._id || product.approvedBy,
          fullName: product.approvedBy.fullName,
          role: product.approvedBy.role,
        }
      : null,
    owner: product.owner
      ? {
          id: product.owner._id || product.owner,
          fullName: product.owner.fullName,
          role: product.owner.role,
        }
      : null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function listProducts(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

  const query = { isActive: true, approvalStatus: "approved" };
  if (category) {
    query.category = category;
  }

  const [totalCount, products] = await Promise.all([
    ShopProduct.countDocuments(query),
    ShopProduct.find(query)
      .populate({ path: "owner", select: "fullName role" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      products: products.map(toPublicProduct),
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
  });
}

async function listMyProducts(req, res) {
  const includeInactive = req.query.includeInactive === "true";
  const query = { owner: req.authUser._id };

  if (!includeInactive) {
    query.isActive = true;
  }

  const products = await ShopProduct.find(query)
    .populate({ path: "owner", select: "fullName role" })
    .populate({ path: "approvedBy", select: "fullName role" })
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: {
      products: products.map(toPublicProduct),
    },
  });
}

async function createProduct(req, res) {
  const parsed = createProductSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const isSuperAdmin = req.authUser.role === USER_ROLES.SUPER_ADMIN;

  const product = await ShopProduct.create({
    ...parsed.data,
    owner: req.authUser._id,
    approvalStatus: isSuperAdmin ? "approved" : "pending_approval",
    approvedBy: isSuperAdmin ? req.authUser._id : null,
    approvedAt: isSuperAdmin ? new Date() : null,
  });

  const hydrated = await ShopProduct.findById(product._id).populate({
    path: "owner",
    select: "fullName role",
  }).populate({ path: "approvedBy", select: "fullName role" });

  return res.status(201).json({
    success: true,
    message: isSuperAdmin
      ? "Product created and approved successfully"
      : "Product submitted successfully. It will be visible after super admin approval.",
    data: {
      product: toPublicProduct(hydrated),
    },
  });
}

async function updateProduct(req, res) {
  const parsed = updateProductSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: parsed.error.issues[0].message,
      code: 400,
    });
  }

  const product = await ShopProduct.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
      code: 404,
    });
  }

  const isOwner = product.owner.toString() === req.authUser._id.toString();
  const isSuperAdmin = req.authUser.role === USER_ROLES.SUPER_ADMIN;

  if (!isOwner && !isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
      code: 403,
    });
  }

  Object.assign(product, parsed.data);
  if (!isSuperAdmin) {
    product.approvalStatus = "pending_approval";
    product.approvedBy = null;
    product.approvedAt = null;
  }
  await product.save();

  const hydrated = await ShopProduct.findById(product._id).populate({
    path: "owner",
    select: "fullName role",
  }).populate({ path: "approvedBy", select: "fullName role" });

  return res.status(200).json({
    success: true,
    message: isSuperAdmin
      ? "Product updated successfully"
      : "Product updated and resubmitted for approval",
    data: {
      product: toPublicProduct(hydrated),
    },
  });
}

async function deleteProduct(req, res) {
  const product = await ShopProduct.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
      code: 404,
    });
  }

  const isOwner = product.owner.toString() === req.authUser._id.toString();
  const isSuperAdmin = req.authUser.role === USER_ROLES.SUPER_ADMIN;

  if (!isOwner && !isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
      code: 403,
    });
  }

  product.isActive = false;
  await product.save();

  return res.status(200).json({
    success: true,
    message: "Product removed successfully",
  });
}

async function listPendingProducts(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const query = {
    isActive: true,
    approvalStatus: "pending_approval",
  };

  const [totalCount, products] = await Promise.all([
    ShopProduct.countDocuments(query),
    ShopProduct.find(query)
      .populate({ path: "owner", select: "fullName role" })
      .populate({ path: "approvedBy", select: "fullName role" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      products: products.map(toPublicProduct),
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
  });
}

async function approveProduct(req, res) {
  const product = await ShopProduct.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
      code: 404,
    });
  }

  product.approvalStatus = "approved";
  product.approvedBy = req.authUser._id;
  product.approvedAt = new Date();
  await product.save();

  const hydrated = await ShopProduct.findById(product._id)
    .populate({ path: "owner", select: "fullName role" })
    .populate({ path: "approvedBy", select: "fullName role" });

  return res.status(200).json({
    success: true,
    message: "Product approved successfully",
    data: {
      product: toPublicProduct(hydrated),
    },
  });
}

async function rejectProduct(req, res) {
  const product = await ShopProduct.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
      code: 404,
    });
  }

  product.approvalStatus = "rejected";
  product.approvedBy = req.authUser._id;
  product.approvedAt = new Date();
  await product.save();

  const hydrated = await ShopProduct.findById(product._id)
    .populate({ path: "owner", select: "fullName role" })
    .populate({ path: "approvedBy", select: "fullName role" });

  return res.status(200).json({
    success: true,
    message: "Product rejected successfully",
    data: {
      product: toPublicProduct(hydrated),
    },
  });
}

module.exports = {
  listProducts,
  listMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listPendingProducts,
  approveProduct,
  rejectProduct,
};
