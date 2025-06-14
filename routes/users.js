/* ────────────────────────────────────────────────────────────────
   USERS ROUTES  (CRUD + favorite / hide)  – Axees
   Mount path: /api/users      (see main.js)
   ───────────────────────────────────────────────────────────── */
   const { Router } = require('express');
   /** @type {import('express').Router} */
   const router = Router();
   
   const usersController = require('../controllers/usersController');
   const { manualAuth } = require('../controllers/authController'); // JWT guard
   
   /* ───────── Swagger Tag ───────────────────────────────────────── */
    /**
     * @swagger
     * tags:
     *   name: Users
     *   description: User accounts, creators & marketers
     */
   
   /* ─── GET list (cursor) ───────────────────────────────────────── */
    /**
     * @swagger
     * /users:
     *   get:
     *     summary: Get active creators (cursor-based)
     *     tags: [Users]
     *     parameters:
     *       - in: query
     *         name: cursor
     *         schema: { type: string, description: "Mongo _id to start after" }
     *       - in: query
     *         name: tags
     *         schema: { type: string, description: "Comma-separated categories" }
     *       - in: query
     *         name: limit
     *         schema: { type: integer, default: 12, minimum: 1, maximum: 50 }
     *     responses:
     *       200:
     *         description: Items array + nextCursor
     */
   router.get('/', usersController.getAllUsers);
   
   /* ─── POST create (admin / signup) ───────────────────────────── */
    /**
     * @swagger
     * /users:
     *   post:
     *     summary: Create a new user
     *     tags: [Users]
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: { $ref: '#/components/schemas/User' }
     *     responses:
     *       201: { description: User created }
     */
   router.post('/', manualAuth, usersController.createUser);
   
   /* ─── GET single ─────────────────────────────────────────────── */
    /**
     * @swagger
     * /users/{userId}:
     *   get:
     *     summary: Get a user by ID
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200: { description: User object }
     *       404: { description: Not found }
     */
   //router.get('/:userId', usersController.getUserById);
   router.get('/:userId', usersController.getUserByIdOrTemp);
   
   /* ─── PUT replace ────────────────────────────────────────────── */
    /**
     * @swagger
     * /users/{userId}:
     *   put:
     *     summary: Replace entire user doc
     *     tags: [Users]
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema: { type: string }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: { $ref: '#/components/schemas/User' }
     *     responses:
     *       200: { description: Updated }
     */
   router.put('/:userId', manualAuth, usersController.replaceUser);
   
   /* ─── PATCH update ───────────────────────────────────────────── */
    /**
     * @swagger
     * /users/{userId}:
     *   patch:
     *     summary: Update selected fields
     *     tags: [Users]
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema: { type: string }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             description: Partial user data
     *     responses:
     *       200: { description: Patched }
     */
   router.patch('/:userId', manualAuth, usersController.updateUser);
   
   /* ─── DELETE soft remove ─────────────────────────────────────── */
    /**
     * @swagger
     * /users/{userId}:
     *   delete:
     *     summary: Soft-delete a user
     *     tags: [Users]
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200: { description: Deleted }
     */
   router.delete('/:userId', manualAuth, usersController.deleteUser);
   
   /* ─── Favorites toggle ───────────────────────────────────────── */
    /**
     * @swagger
     * /users/{userId}/favorites:
     *   patch:
     *     summary: Toggle creator in viewer’s favorites
     *     tags: [Users]
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: viewerId
     *         required: true
     *         schema: { type: string }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [ creatorId ]
     *             properties:
     *               creatorId: { type: string }
     *     responses:
     *       200: { description: Toggled }
     */
   router.patch('/:userId/favorites', manualAuth, usersController.toggleFavorite);
   
   /* ─── Hide creator ───────────────────────────────────────────── */
    /**
     * @swagger
     * /users/{viewerId}/hide:
     *   patch:
     *     summary: Hide creator from viewer’s results
     *     tags: [Users]
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: viewerId
     *         required: true
     *         schema: { type: string }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [ creatorId ]
     *             properties:
     *               creatorId: { type: string }
     *     responses:
     *       200: { description: Hidden }
     */
   router.patch('/:viewerId/hide', manualAuth, usersController.hideCreator);
   
   module.exports = router;
   