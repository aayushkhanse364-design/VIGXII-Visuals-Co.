import Project from '../models/Project.js';
import Category from '../models/Category.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

function normalizeTechStack(techStack) {
  if (Array.isArray(techStack)) {
    return techStack.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof techStack === 'string') {
    return techStack
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export const createProject = asyncHandler(async (req, res) => {
  const { title, description, imageUrl, videoUrl, techStack, githubLink, categoryId } = req.body;

  if (!title || !description) {
    throw new ApiError(400, 'Title and description are required');
  }

  if (categoryId) {
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      throw new ApiError(400, 'Selected category does not exist');
    }
  }

  const project = await Project.create({
    title,
    description,
    imageUrl: imageUrl || '',
    videoUrl: videoUrl || '',
    techStack: normalizeTechStack(techStack),
    githubLink: githubLink || '',
    categoryId: categoryId || undefined,
  });

  res.status(201).json({ success: true, data: project });
});

export const getProjects = asyncHandler(async (_req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });
  res.json({ success: true, count: projects.length, data: projects });
});

export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingProject = await Project.findById(id);
  if (!existingProject) {
    throw new ApiError(404, 'Project not found');
  }

  const payload = {
    ...req.body,
    techStack: req.body.techStack ? normalizeTechStack(req.body.techStack) : existingProject.techStack,
  };

  if (payload.categoryId) {
    const categoryExists = await Category.findById(payload.categoryId);
    if (!categoryExists) {
      throw new ApiError(400, 'Selected category does not exist');
    }
  }

  const project = await Project.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  res.json({ success: true, data: project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await Project.findByIdAndDelete(id);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  res.json({ success: true, message: 'Project deleted' });
});