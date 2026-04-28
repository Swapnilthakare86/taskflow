// Purpose: Handles HTTP requests and maps them to service-layer actions.
'use strict';
const asyncHandler   = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const projectService = require('../services/projectService');

// Get all projects accessible to user (all for admins, only joined for others)
const getProjects = asyncHandler(async (req, res) => {
  const data = await projectService.getProjectsForUser(req.user);
  success(res, data, 'Projects retrieved');
});

// Get single project by ID with permission check
const getProject = asyncHandler(async (req, res) => {
  const data = await projectService.getProjectById(Number(req.params.id), req.user);
  success(res, data, 'Project retrieved');
});

// Create new project with initial team members
const createProject = asyncHandler(async (req, res) => {
  const data = await projectService.createProject(req.body, req.user.id);
  created(res, data, 'Project created');
});

// Update project details
const updateProject = asyncHandler(async (req, res) => {
  const data = await projectService.updateProject(Number(req.params.id), req.body, req.user);
  success(res, data, 'Project updated');
});

// Get all members in a project
const getMembers = asyncHandler(async (req, res) => {
  const data = await projectService.getMembers(Number(req.params.id), req.user);
  success(res, data, 'Members retrieved');
});

// Add existing user to project
const addMember = asyncHandler(async (req, res) => {
  const data = await projectService.addMember(Number(req.params.id), req.body.userId, req.user);
  success(res, data, 'Member added');
});

// Send invite link to external user
const sendInvite = asyncHandler(async (req, res) => {
  const data = await projectService.sendInvite(
    Number(req.params.id),
    req.user,
    req.body.email
  );
  success(res, data, `Invite sent to ${req.body.email}`);
});

// Accept project invite using token
const acceptInvite = asyncHandler(async (req, res) => {
  const data = await projectService.acceptInvite(req.body.token, req.user);
  success(res, data, 'Invite accepted. Project added to your workspace.');
});

module.exports = { getProjects, getProject, createProject, updateProject, getMembers, addMember, sendInvite, acceptInvite };


