import * as hz from 'horizon/core';

/**
 * ========================================
 * UNIVERSAL INPUT MAPPER FOR META HORIZON WORLDS
 * ========================================
 * 
 * WHAT IT DOES:
 * Automatically detects whether players are using VR, Mobile, or Desktop
 * and routes interactions to the appropriate handlers for each device type.
 * 
 * WHY USE IT:
 * - Write interactions once, works on all platforms
 * - No more separate VR/Mobile/Desktop scripts
 * - Automatic device detection - zero setup required
 * - Makes your worlds truly cross-platform
 * 
 * HOW TO USE:
 * 1. Attach this script to an Empty Object in your world
 * 2. In your interactive objects (doors, buttons, etc), reference this object
 * 3. Register actions with device-specific handlers using registerAction()
 * 4. Trigger actions using trigger() - automatically uses correct handler
 * 
 * EXAMPLE USAGE:
 * ```
 * // Register a door interaction
 * inputMapper.registerAction('door_interact', {
 *   vr: (ctx) => console.log('VR user grabbed door'),
 *   mobile: (ctx) => console.log('Mobile user tapped door'),
 *   desktop: (ctx) => console.log('Desktop user clicked door')
 * });
 * 
 * // Later, trigger the interaction (device type detected automatically)
 * inputMapper.trigger('door_interact', { player: somePlayer });
 * ```
 */

// Type definitions for better code understanding
export type DeviceType = 'vr' | 'mobile' | 'desktop';

export interface InteractionContext {
    player: hz.Player;      // The player who triggered the interaction
    entity?: hz.Entity;     // Optional: the object being interacted with
    data?: any;            // Optional: any custom data you want to pass
}

// Function signature for action handlers
type ActionHandler = (context: InteractionContext) => void;

// Object containing handlers for different device types
type ActionHandlers = {
    vr?: ActionHandler;      // Handler for VR users (grabbing)
    mobile?: ActionHandler;  // Handler for mobile users (tapping)
    desktop?: ActionHandler; // Handler for desktop users (clicking)
};

export class InputMapper extends hz.Component<typeof InputMapper> {
    
    // ========================================
    // CONFIGURATION PROPERTIES (Visible in Editor)
    // ========================================
    static propsDefinition = {
        debugMode: { 
            type: hz.PropTypes.Boolean, 
            default: false,
            description: "Enable detailed console logging for debugging - turn on to see what's happening"
        },
        enableDeviceOverride: { 
            type: hz.PropTypes.Boolean, 
            default: false,
            description: "Allow manual device type override for testing - useful for development"
        },
        fallbackToDesktop: { 
            type: hz.PropTypes.Boolean, 
            default: true,
            description: "Use desktop handler as fallback if specific device handler not found"
        }
    };

    // ========================================
    // INTERNAL DATA STORAGE
    // ========================================
    
    // Stores all registered actions and their handlers
    private actions = new Map<string, ActionHandlers>();
    
    // Caches detected device types to avoid repeated detection
    private deviceCache = new Map<string, DeviceType>();
    
    // Keeps track of how many players are in the world
    private playerCount = 0;

    // ========================================
    // INITIALIZATION METHODS
    // ========================================
    
    /**
     * preStart() - Called before the component starts
     * Sets up event listeners for player join/leave events
     */
    preStart() {
        // Listen for when players enter the world
        this.connectCodeBlockEvent(
            this.entity,
            hz.CodeBlockEvents.OnPlayerEnterWorld,
            this.onPlayerJoin.bind(this)
        );

        // Listen for when players leave the world
        this.connectCodeBlockEvent(
            this.entity,
            hz.CodeBlockEvents.OnPlayerExitWorld,
            this.onPlayerLeave.bind(this)
        );

        // Log initialization if debug mode is enabled
        if (this.props.debugMode) {
            console.log('🎮 Universal InputMapper initialized');
        }
    }

    /**
     * start() - Called when the component is ready
     * Announces that the InputMapper is ready to use
     */
    start() {
        console.log('✅ Universal InputMapper ready - supports VR, Mobile, and Desktop interactions');
    }

    // ========================================
    // PLAYER EVENT HANDLERS
    // ========================================
    
    /**
     * Called automatically when a player joins the world
     * Detects their device type and updates player count
     */
    private onPlayerJoin(player: hz.Player) {
        this.playerCount++;
        
        // Detect what device this player is using
        const deviceType = this.detectDevice(player);
        
        // Log the join if debug mode is enabled
        if (this.props.debugMode) {
            console.log(`🎮 Player ${player.name.get()} joined (${deviceType}) - Total players: ${this.playerCount}`);
        }
    }

    /**
     * Called automatically when a player leaves the world
     * Removes their data from cache and updates player count
     */
    private onPlayerLeave(player: hz.Player) {
        // Decrease player count (but never go below 0)
        this.playerCount = Math.max(0, this.playerCount - 1);
        
        // Remove this player's cached device type
        const playerId = player.id.toString();
        this.deviceCache.delete(playerId);
        
        // Log the departure if debug mode is enabled
        if (this.props.debugMode) {
            console.log(`👋 Player ${player.name.get()} left - Total players: ${this.playerCount}`);
        }
    }

    // ========================================
    // CORE FUNCTIONALITY - DEVICE DETECTION
    // ========================================
    
    /**
     * MOST IMPORTANT METHOD: Detects what device a player is using
     * 
     * @param player - The player to check
     * @returns 'vr', 'mobile', or 'desktop'
     * 
     * HOW IT WORKS:
     * 1. First checks if we already know this player's device (cache)
     * 2. Makes sure this is a real player (not a server player)
     * 3. Uses Horizon Worlds API to check device type
     * 4. Converts to our simple format and caches the result
     */
    detectDevice(player: hz.Player): DeviceType {
        const playerId = player.id.toString();
        
        // If we already detected this player's device, return cached result
        if (this.deviceCache.has(playerId)) {
            return this.deviceCache.get(playerId)!;
        }

        try {
            // Skip server players (they don't have real devices)
            if (!this.isRealPlayer(player)) {
                if (this.props.debugMode) {
                    console.warn('⚠️ Cannot detect device type for server player');
                }
                return 'desktop'; // Safe fallback
            }

            // Get device type from Horizon Worlds API
            const deviceType = player.deviceType.get();
            let simpleType: DeviceType = 'desktop'; // Default assumption
            
            // Convert Horizon's device types to our simple types
            if (deviceType === hz.PlayerDeviceType.VR) {
                simpleType = 'vr';      // Quest headsets, etc.
            } else if (deviceType === hz.PlayerDeviceType.Mobile) {
                simpleType = 'mobile';  // Phones, tablets
            }
            // Desktop/web users stay as 'desktop'

            // Cache this result so we don't have to detect again
            this.deviceCache.set(playerId, simpleType);
            
            // Log the detection if debug mode is enabled
            if (this.props.debugMode) {
                console.log(`🔍 Detected ${player.name.get()} as: ${simpleType}`);
            }

            return simpleType;
            
        } catch (error) {
            // If anything goes wrong, fall back to desktop
            if (this.props.debugMode) {
                console.error('❌ Error detecting device type:', error);
            }
            return 'desktop';
        }
    }

    // ========================================
    // CORE FUNCTIONALITY - ACTION SYSTEM
    // ========================================
    
    /**
     * Register an action with handlers for different device types
     * This is how you tell the InputMapper what to do for each device
     * 
     * @param actionName - Unique name for this action (e.g. 'door_open', 'button_press')
     * @param handlers - Object with vr, mobile, and/or desktop functions
     * 
     * EXAMPLE:
     * inputMapper.registerAction('door_interact', {
     *   vr: (ctx) => openDoorWithGrabAnimation(ctx),
     *   mobile: (ctx) => openDoorWithTapAnimation(ctx),
     *   desktop: (ctx) => openDoorWithClickAnimation(ctx)
     * });
     */
    registerAction(actionName: string, handlers: ActionHandlers) {
        // Warn if we're overwriting an existing action
        if (this.actions.has(actionName)) {
            console.warn(`⚠️ Action '${actionName}' already registered - overwriting`);
        }

        // Store the action and its handlers
        this.actions.set(actionName, handlers);
        
        // Log registration if debug mode is enabled
        if (this.props.debugMode) {
            const deviceTypes = Object.keys(handlers).join(', ');
            console.log(`📝 Registered action '${actionName}' for: ${deviceTypes}`);
        }
    }

    /**
     * Trigger an action - automatically calls the right handler for the player's device
     * This is the magic method that makes everything work!
     * 
     * @param actionName - The name of the action to trigger
     * @param context - Information about the interaction (player, entity, data)
     * 
     * HOW IT WORKS:
     * 1. Looks up the handlers for this action name
     * 2. Detects what device the player is using
     * 3. Calls the appropriate handler (vr, mobile, or desktop)
     * 4. Falls back gracefully if no handler exists for that device
     */
    trigger(actionName: string, context: InteractionContext) {
        // First, find the handlers for this action
        const handlers = this.actions.get(actionName);
        if (!handlers) {
            console.warn(`❌ No handlers found for action: ${actionName}`);
            return;
        }

        // Detect what device this player is using
        const deviceType = this.detectDevice(context.player);
        
        // Try to get the handler for their specific device
        let handler = handlers[deviceType];
        
        // If no specific handler exists, try fallback to desktop
        if (!handler && this.props.fallbackToDesktop) {
            handler = handlers.desktop;
        }
        
        // If still no handler, use any available handler
        if (!handler) {
            handler = Object.values(handlers)[0];
        }
        
        // Execute the handler if we found one
        if (handler) {
            try {
                handler(context);
                
                // Log successful execution if debug mode is enabled
                if (this.props.debugMode) {
                    console.log(`✅ Executed '${actionName}' for ${deviceType} user: ${context.player.name.get()}`);
                }
            } catch (error) {
                console.error(`❌ Error executing '${actionName}':`, error);
            }
        } else {
            console.warn(`❌ No compatible handler found for '${actionName}' on ${deviceType}`);
        }
    }

    // ========================================
    // UTILITY METHODS
    // ========================================
    
    /**
     * Manually override a player's device type (for testing only)
     * Only works if enableDeviceOverride is set to true
     * 
     * @param player - The player to override
     * @param deviceType - The device type to force ('vr', 'mobile', or 'desktop')
     * 
     * USEFUL FOR:
     * - Testing your interactions during development
     * - Demonstrating different device behaviors
     */
    setDeviceOverride(player: hz.Player, deviceType: DeviceType) {
        // Check if override is enabled
        if (!this.props.enableDeviceOverride) {
            console.warn('⚠️ Device override disabled - enable enableDeviceOverride to use this feature');
            return;
        }

        // Force the device type for this player
        const playerId = player.id.toString();
        this.deviceCache.set(playerId, deviceType);
        
        // Log the override if debug mode is enabled
        if (this.props.debugMode) {
            console.log(`🔧 Override: Set ${player.name.get()} to ${deviceType} for testing`);
        }
    }

    /**
     * Get statistics about what devices players are using
     * Useful for analytics or debugging
     * 
     * @returns Object with counts of each device type
     * 
     * EXAMPLE OUTPUT:
     * { total: 5, vr: 2, mobile: 2, desktop: 1 }
     */
    getPlayerStats(): { total: number, vr: number, mobile: number, desktop: number } {
        const stats = { total: this.playerCount, vr: 0, mobile: 0, desktop: 0 };
        
        // Count how many players are using each device type
        this.deviceCache.forEach((device) => {
            if (device === 'vr') {
                stats.vr++;
            } else if (device === 'mobile') {
                stats.mobile++;
            } else if (device === 'desktop') {
                stats.desktop++;
            }
        });
        
        return stats;
    }

    /**
     * Get a list of all registered action names
     * Useful for debugging or displaying available actions
     * 
     * @returns Array of action names like ['door_interact', 'button_press', 'item_pickup']
     */
    getRegisteredActions(): string[] {
        return Array.from(this.actions.keys());
    }

    /**
     * Clear all registered actions
     * Useful for cleanup or resetting the InputMapper
     */
    clearAllActions() {
        this.actions.clear();
        if (this.props.debugMode) {
            console.log('🧹 Cleared all registered actions');
        }
    }

    // ========================================
    // HELPER METHODS (Private)
    // ========================================
    
    /**
     * Check if a player is a real human player (not a server player)
     * Server players don't have device types and would cause errors
     * 
     * @param player - The player to check
     * @returns true if this is a real human player, false if it's a server player
     */
    private isRealPlayer(player: hz.Player): boolean {
        try {
            const playerName = player.name.get();
            return playerName != null && playerName.length > 0 && playerName !== 'Server';
        } catch (error) {
            // If we can't get the player's name, assume it's not a real player
            return false;
        }
    }
}

// ========================================
// REGISTRATION (Required for Horizon Worlds)
// ========================================

// Register this component so Horizon Worlds can use it
hz.Component.register(InputMapper);

// ========================================
