// backend/src/modules/router/adapters/RouterAdapterFactory.js
import { MikrotikAdapter } from "./MikrotikAdapter.js";
import { AppError } from "../../../shared/middleware/error.handler.js";

export class RouterAdapterFactory {
  /**
   * Returns the appropriate router adapter instance based on the router type.
   * @param {string} routerType - The type of router (e.g., 'MIKROTIK').
   * @returns {Object} The router adapter instance.
   */
  static getAdapter(routerType) {
    switch (routerType) {
      case "MIKROTIK":
        return new MikrotikAdapter();
      case "OPENWRT":
        throw new AppError(
          "OpenWrt adapter is not yet implemented.",
          501,
          "ROUTER_ADAPTER_002",
        );
      default:
        throw new AppError(
          `Unsupported router type: ${routerType}`,
          400,
          "ROUTER_ADAPTER_001",
        );
    }
  }
}
