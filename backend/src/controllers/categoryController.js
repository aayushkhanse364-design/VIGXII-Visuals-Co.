import Category from '../models/Category.js';
import Project from '../models/Project.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

function normalizeCategoryValues(body) {
  return {
    title: String(body.title || '').trim(),
    year: String(body.year || '').trim(),
    coverUrl: String(body.coverUrl || '').trim(),
    order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
  };
}

export const createCategory = asyncHandler(async (req, res) => {
  const payload = normalizeCategoryValues(req.body);

  if (!payload.title || !payload.year || !payload.coverUrl) {
    throw new ApiError(400, 'Title, year, and cover URL are required');
  }

  const category = await Category.create(payload);
  res.status(201).json({ success: true, data: category });
});

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ order: 1, createdAt: -1, title: 1 });
  res.json({ success: true, count: categories.length, data: categories });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingCategory = await Category.findById(id);
  if (!existingCategory) {
    throw new ApiError(404, 'Category not found');
  }

  const payload = normalizeCategoryValues({
    title: req.body.title ?? existingCategory.title,
    year: req.body.year ?? existingCategory.year,
    coverUrl: req.body.coverUrl ?? existingCategory.coverUrl,
    order: req.body.order ?? existingCategory.order,
  });

  if (!payload.title || !payload.year || !payload.coverUrl) {
    throw new ApiError(400, 'Title, year, and cover URL are required');
  }

  const category = await Category.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attachedProjects = await Project.countDocuments({ categoryId: id });
  if (attachedProjects > 0) {
    throw new ApiError(400, 'Move or reassign projects before deleting this category');
  }

  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  res.json({ success: true, message: 'Category deleted' });
});