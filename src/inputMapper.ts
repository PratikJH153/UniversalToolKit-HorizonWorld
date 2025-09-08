import { Player, PlayerDeviceType, World } from 'horizon/core';

export type DeviceType = 'vr' | 'mobile' | 'desktop';

// Action handlers for different device types
type HandlerFn = (context?: any) => void;
type ActionHandlers = { vr?: HandlerFn, mobile?: HandlerFn, desktop?: HandlerFn };

export class InputMapper {
  private actions: Map<string, ActionHandlers> = new Map();
  private deviceCache: DeviceType | null = null;
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  // Exact API call for device detection
  detectDevice(): DeviceType {
    if (this.deviceCache) {
      return this.deviceCache;
    }

    const player = this.world.getLocalPlayer();
    const device = player.deviceType.get();

    if (device === PlayerDeviceType.VR) {
      this.deviceCache = 'vr';
    } else if (device === PlayerDeviceType.Mobile) {
      this.deviceCache = 'mobile';
    } else {
      this.deviceCache = 'desktop';
    }

    return this.deviceCache;
  }

  registerAction(actionName: string, handlers: ActionHandlers) {
    this.actions.set(actionName, handlers);
  }

  // Called by prefabs when an interaction occurs - maps to correct handler
  trigger(actionName: string, context?: any) {
    const handlers = this.actions.get(actionName);
    if (!handlers) {
      return;
    }
    const device = this.detectDevice();
    const fn = handlers[device] || handlers.desktop || handlers.mobile || handlers.vr;
    if (fn) {
      try {
        fn(context);
      } catch (e) {
        console.error('Action handler error', e);
      }
    }
  }

  // Optional: allow dynamic override if the world needs to switch mapping
  setDeviceForTesting(device: DeviceType) {
    this.deviceCache = device;
  }
}
