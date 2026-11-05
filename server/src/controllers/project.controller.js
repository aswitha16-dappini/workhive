import Project from '../models/Project.js';

/**
 * @desc    Get all projects (with filtering, category, search)
 * @route   GET /api/projects
 * @access  Public
 */
export const getProjects = async (req, res) => {
  try {
    const { category, search, minBudget, maxBudget, skill, status } = req.query;
    const filter = {};

    // Status filter: defaults to Open unless explicitly passed (or 'All')
    if (status && status !== 'All') {
      filter.status = status;
    } else if (!status) {
      filter.status = 'Open';
    }

    // Category filter with alias compatibility
    if (category && category !== 'All') {
      if (category === 'Mobile App Development' || category === 'Mobile Apps') {
        filter.category = { $in: ['Mobile App Development', 'Mobile Apps'] };
      } else if (
        category === 'Artificial Intelligence & Machine Learning' ||
        category === 'AI & Machine Learning'
      ) {
        filter.category = {
          $in: ['Artificial Intelligence & Machine Learning', 'AI & Machine Learning'],
        };
      } else if (category === 'Content Writing' || category === 'Writing & Translation') {
        filter.category = { $in: ['Content Writing', 'Writing & Translation'] };
      } else if (category === 'UI/UX Design' || category === 'Design & Creative') {
        filter.category = { $in: ['UI/UX Design', 'Design & Creative'] };
      } else {
        filter.category = category;
      }
    }

    // Keyword search over title, description, and skills
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { skillsRequired: { $in: [new RegExp(escaped, 'i')] } },
      ];
    }

    // Skill filter
    if (skill && skill !== 'All') {
      filter.skillsRequired = { $in: [new RegExp(skill.trim(), 'i')] };
    }

    // Budget range filter
    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = Number(minBudget);
      if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }

    const projects = await Project.find(filter)
      .populate('client', 'name email profileImage')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching projects',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single project by ID
 * @route   GET /api/projects/:id
 * @access  Public
 */
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email profileImage')
      .populate('hiredFreelancer', 'name email profileImage')
      .populate({
        path: 'acceptedProposal',
        select: 'bidAmount deliveryDays coverLetter status createdAt freelancerProfile',
        populate: {
          path: 'freelancerProfile',
          select: 'professionalTitle hourlyRate skills experienceLevel rating',
        },
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching project',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all projects posted by the logged in Client
 * @route   GET /api/projects/my/client
 * @access  Private (Client)
 */
export const getMyClientProjects = async (req, res) => {
  try {
    const projects = await Project.find({ client: req.user._id })
      .populate('hiredFreelancer', 'name email profileImage')
      .populate('acceptedProposal', 'bidAmount deliveryDays status')
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching client projects',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new project posting
 * @route   POST /api/projects
 * @access  Private (Client)
 */
export const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      budget,
      minBudget,
      maxBudget,
      skillsRequired,
      deadlineDays,
      isDemo,
    } = req.body;

    if (!title || !description || !category || !budget || !skillsRequired) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide all required fields: title, description, category, budget, and skillsRequired',
      });
    }

    const formattedSkills = Array.isArray(skillsRequired)
      ? skillsRequired
      : skillsRequired
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

    const projectBudget = Number(budget);

    const project = await Project.create({
      client: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category,
      budget: projectBudget,
      minBudget: minBudget ? Number(minBudget) : projectBudget,
      maxBudget: maxBudget ? Number(maxBudget) : projectBudget,
      skillsRequired: formattedSkills,
      deadlineDays: Number(deadlineDays) || 14,
      isDemo: Boolean(isDemo),
      status: 'Open',
    });

    const populatedProject = await Project.findById(project._id).populate(
      'client',
      'name email profileImage'
    );

    return res.status(201).json({
      success: true,
      message: 'Project posted successfully',
      data: populatedProject,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating project',
    });
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private (Client owner only)
 */
export const updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Verify ownership
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not the client who posted this project',
      });
    }

    if (req.body.skillsRequired && typeof req.body.skillsRequired === 'string') {
      req.body.skillsRequired = req.body.skillsRequired
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (req.body.budget) {
      const b = Number(req.body.budget);
      req.body.budget = b;
      if (!req.body.minBudget) req.body.minBudget = b;
      if (!req.body.maxBudget) req.body.maxBudget = b;
    }

    if (req.body.deadlineDays) {
      req.body.deadlineDays = Number(req.body.deadlineDays);
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('client', 'name email profileImage')
      .populate('hiredFreelancer', 'name email profileImage');

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating project',
    });
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (Client owner only)
 */
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Verify ownership
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not the client who posted this project',
      });
    }

    await project.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting project',
    });
  }
};

