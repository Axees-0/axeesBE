const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  getCalendarEvents,
  getUpcomingEvents,
  getEventsByDate
} = require('../controllers/calendarController');

/**
 * @swagger
 * tags:
 *   name: Calendar
 *   description: Calendar events from deals and offers
 */

/**
 * @swagger
 * /api/calendar/events:
 *   get:
 *     summary: Get calendar events for the authenticated user
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering events (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering events (ISO 8601)
 *       - in: query
 *         name: eventTypes
 *         schema:
 *           type: string
 *         description: Comma-separated list of event types to filter (milestone,review,post,campaign,trial,auto_release)
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Calendar view type for summary calculations
 *     responses:
 *       200:
 *         description: Calendar events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Unique event identifier
 *                           title:
 *                             type: string
 *                             description: Event title
 *                           type:
 *                             type: string
 *                             enum: [milestone, review, post, campaign, trial, auto_release]
 *                             description: Type of calendar event
 *                           subType:
 *                             type: string
 *                             description: More specific event subtype
 *                           date:
 *                             type: string
 *                             format: date-time
 *                             description: Event date and time
 *                           status:
 *                             type: string
 *                             description: Current status of the event
 *                           dealId:
 *                             type: string
 *                             description: Associated deal ID (if applicable)
 *                           offerId:
 *                             type: string
 *                             description: Associated offer ID (if applicable)
 *                           milestoneId:
 *                             type: string
 *                             description: Associated milestone ID (if applicable)
 *                           amount:
 *                             type: number
 *                             description: Associated payment amount (if applicable)
 *                           description:
 *                             type: string
 *                             description: Detailed event description
 *                           participants:
 *                             type: object
 *                             properties:
 *                               marketer:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                   name:
 *                                     type: string
 *                                   userName:
 *                                     type: string
 *                               creator:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                   name:
 *                                     type: string
 *                                   userName:
 *                                     type: string
 *                               otherParty:
 *                                 type: object
 *                                 description: The other party in the deal/offer
 *                           userRole:
 *                             type: string
 *                             enum: [marketer, creator]
 *                             description: Current user's role in this event
 *                           priority:
 *                             type: string
 *                             enum: [high, medium, low]
 *                             description: Event priority level
 *                           color:
 *                             type: string
 *                             description: Hex color code for calendar display
 *                           icon:
 *                             type: string
 *                             description: Emoji or icon for calendar display
 *                           metadata:
 *                             type: object
 *                             description: Additional event-specific data
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalEvents:
 *                           type: number
 *                         upcomingEvents:
 *                           type: number
 *                         overdue:
 *                           type: number
 *                         thisWeek:
 *                           type: number
 *                         thisMonth:
 *                           type: number
 *                         byType:
 *                           type: object
 *                           description: Event count by type
 *                         byPriority:
 *                           type: object
 *                           properties:
 *                             high:
 *                               type: number
 *                             medium:
 *                               type: number
 *                             low:
 *                               type: number
 *                     totalEvents:
 *                       type: number
 *                       description: Total number of events returned
 *                     dateRange:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                     eventTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           count:
 *                             type: number
 *                           label:
 *                             type: string
 *                     userRole:
 *                       type: string
 *                       description: User's primary role (marketer/creator)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/events', authenticate, getCalendarEvents);

/**
 * @swagger
 * /api/calendar/upcoming:
 *   get:
 *     summary: Get upcoming events for the next 7 days
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of upcoming events to return
 *     responses:
 *       200:
 *         description: Upcoming events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CalendarEvent'
 *                       description: List of upcoming events
 *                     totalUpcoming:
 *                       type: number
 *                       description: Number of events returned
 *                     nextWeekTotal:
 *                       type: number 
 *                       description: Total events in the next 7 days
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/upcoming', authenticate, getUpcomingEvents);

/**
 * @swagger
 * /api/calendar/events/{date}:
 *   get:
 *     summary: Get events for a specific date
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to get events for (YYYY-MM-DD)
 *         example: "2024-01-15"
 *     responses:
 *       200:
 *         description: Events for the specified date retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                       description: The requested date
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CalendarEvent'
 *                       description: List of events for the date
 *                     totalEventsForDate:
 *                       type: number
 *                       description: Number of events on this date
 *       400:
 *         description: Invalid date format
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/events/:date', authenticate, getEventsByDate);

module.exports = router;