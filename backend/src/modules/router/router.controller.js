import { RouterService } from './router.service.js';
import { asyncHandler } from '../../shared/utils/async.handler.js';
import { logger } from '../../shared/utils/logger.js';
import net from 'net';

export const RouterController = {
  getAll: asyncHandler(async (req, res) => {
    const result = await RouterService.getRouters(req.query);
    res.status(200).json({
      success: true,
      message: 'Routers retrieved successfully.',
      data: result.data,
      pagination: result.pagination,
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const router = await RouterService.getRouterById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Router retrieved successfully.',
      data: router,
    });
  }),

  create: asyncHandler(async (req, res) => {
    const router = await RouterService.createRouter(req.body);
    res.status(201).json({
      success: true,
      message: 'Router created successfully.',
      data: router,
    });
  }),

  update: asyncHandler(async (req, res) => {
    const router = await RouterService.updateRouter(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Router updated successfully.',
      data: router,
    });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const router = await RouterService.updateStatus(req.params.id, req.body.status);
    res.status(200).json({
      success: true,
      message: 'Router status updated successfully.',
      data: router,
    });
  }),

  delete: asyncHandler(async (req, res) => {
    await RouterService.deleteRouter(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Router archived successfully.',
    });
  }),

  restore: asyncHandler(async (req, res) => {
    const router = await RouterService.restoreRouter(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Router restored successfully.',
      data: router,
    });
  }),

  permanentDelete: asyncHandler(async (req, res) => {
    await RouterService.permanentDeleteRouter(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Router permanently deleted successfully.',
    });
  }),

  testConnection: asyncHandler(async (req, res) => {
    const router = await RouterService.getRouterById(req.params.id);
    logger.info(`Testing connection to router: ${router.name} (${router.ipAddress}:${router.apiPort})`);

    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.connect(router.apiPort, router.ipAddress, () => {
      socket.destroy();
      logger.info(`✅ Successfully connected to API at ${router.ipAddress}:${router.apiPort}`);

      res.status(200).json({
        success: true,
        message: `Successfully connected to ${router.name} API on port ${router.apiPort}.`,
        data: { routerId: router.id, status: 'REACHABLE' }
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      res.status(408).json({ success: false, message: 'Connection timed out. Check IP and firewall.' });
    });

    socket.on('error', (err) => {
      res.status(500).json({ success: false, message: `Connection failed: ${err.message}` });
    });
  }),
};