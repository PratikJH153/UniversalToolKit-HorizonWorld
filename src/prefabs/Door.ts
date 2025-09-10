import * as hz from 'horizon/core';
import { InputMapper, InteractionContext } from './InputMapper';

/**
 * ========================================
 * UNIVERSAL DOOR - EXAMPLE PREFAB
 * ========================================
 * 
 * WHAT IT DOES:
 * Demonstrates how to use the Universal InputMapper to create a door that works
 * seamlessly across VR, Mobile, and Desktop platforms with device-appropriate interactions.
 * 
 * WHY THIS IS USEFUL:
 * - Shows the correct pattern for integrating with InputMapper
 * - Provides a working example other creators can copy and modify
 * - Demonstrates cross-platform interaction handling
 * - Includes proper error handling and logging
 * 
 * HOW IT WORKS:
 * 1. Connects to your InputMapper component during startup
 * 2. Registers a 'door_interact' action with handlers for each device type
 * 3. Listens for player interactions through trigger events
 * 4. Routes interactions through InputMapper for automatic device detection
 * 5. Executes appropriate door behavior based on device type
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a door object (3D shape or imported model)
 * 2. Create a trigger zone as child of door for interaction detection
 * 3. Attach this script to the door object
 * 4. Set inputMapper property to reference your InputMapper object
 * 5. Set interactionTrigger property to reference your trigger zone
 * 6. Configure openAngle, openSpeed as desired
 * 
 * EXAMPLE SCENE HIERARCHY:
 * ```
 * MyDoor (3D Object - has UniversalDoor script)
 * ├── DoorTrigger (Trigger Zone - for interaction detection)
 * └── DoorHinge (Empty Object - optional, for rotation pivot)
 * 
 * InputMapper_System (Empty Object - has InputMapper script)
 * ```
 */

export class UniversalDoor extends hz.Component<typeof UniversalDoor> {
    
    // ========================================
    // CONFIGURATION PROPERTIES (Visible in Editor)
    // ========================================
    static propsDefinition = {
        inputMapper: { 
            type: hz.PropTypes.Entity, 
            description: "Drag the object with InputMapper script here - this connects the door to the universal input system" 
        },
        openAngle: { 
            type: hz.PropTypes.Number, 
            default: 90, 
            description: "How many degrees the door rotates when opening (90 = quarter turn)" 
        },
        openSpeed: { 
            type: hz.PropTypes.Number, 
            default: 1.0, 
            description: "Animation speed multiplier (1.0 = normal, 2.0 = twice as fast, 0.5 = half speed)" 
        },
        interactionTrigger: { 
            type: hz.PropTypes.Entity, 
            description: "Drag your trigger zone here - this detects when players get near the door" 
        },
        autoCloseDelay: {
            type: hz.PropTypes.Number,
            default: 5.0,
            description: "Seconds before door automatically closes (0 = never auto-close)"
        },
        requireKeycard: {
            type: hz.PropTypes.Boolean,
            default: false,
            description: "Whether door requires a keycard to open (example of additional functionality)"
        }
    };

    // ========================================
    // INTERNAL STATE VARIABLES
    // ========================================
    
    // Tracks whether door is currently open or closed
    private isOpen = false;
    
    // Tracks if door is currently animating (prevents multiple animations)
    private isAnimating = false;
    
    // Reference to the InputMapper component for device detection and routing
    private inputMapperComponent: InputMapper | null = null;
    
    // Stores the door's original rotation for animation calculations
    private originalRotation = new hz.Vec3(0, 0, 0);
    
    // Timer for auto-closing functionality
    private autoCloseTimer: number = 0;

    // ========================================
    // INITIALIZATION METHODS
    // ========================================
    
    /**
     * preStart() - Called before the component starts
     * This is where we set up connections and register our interactions
     */
    preStart() {
        console.log('🚪 Universal Door initializing...');
        
        // STEP 1: Get reference to InputMapper component
        this.connectToInputMapper();
        
        // STEP 2: Register our door interaction with device-specific handlers
        this.registerDoorInteraction();
        
        // STEP 3: Set up trigger zone for player detection
        this.setupTriggerEvents();
        
        // STEP 4: Store original rotation for animation reference
        this.storeOriginalRotation();
        
        console.log('🚪 Universal Door setup complete');
    }

    /**
     * start() - Called when the component is ready
     * Announces that the door is ready for use
     */
    start() {
        console.log('✅ Universal Door ready - works on VR, Mobile, and Desktop!');
        
        // Verify setup is correct
        if (!this.inputMapperComponent) {
            console.warn('⚠️ Universal Door: No InputMapper connected! Door may not work properly.');
        }
        
        if (!this.props.interactionTrigger) {
            console.warn('⚠️ Universal Door: No interaction trigger set! Players won\'t be able to interact.');
        }
    }

    // ========================================
    // SETUP HELPER METHODS
    // ========================================
    
    /**
     * Connects to the InputMapper component for universal input handling
     * This is the crucial step that enables cross-platform functionality
     */
    private connectToInputMapper() {
        if (!this.props.inputMapper) {
            console.error('❌ Universal Door: inputMapper property not set! Please drag InputMapper object to this property.');
            return;
        }

        // Search through all components on the InputMapper object to find the InputMapper script
        const components = this.props.inputMapper.getComponents();
        for (const component of components) {
            if (component instanceof InputMapper) {
                this.inputMapperComponent = component;
                console.log('✅ Universal Door: Connected to InputMapper successfully');
                break;
            }
        }

        if (!this.inputMapperComponent) {
            console.error('❌ Universal Door: Could not find InputMapper script on the specified object!');
        }
    }

    /**
     * Registers the door interaction with device-specific handlers
     * This tells the InputMapper what to do when players interact on different devices
     */
    private registerDoorInteraction() {
        if (!this.inputMapperComponent) return;

        // Register 'door_interact' action with handlers for each device type
        this.inputMapperComponent.registerAction('door_interact', {
            // VR users will "grab" the door handle
            vr: (ctx) => this.handleVRInteraction(ctx),
            
            // Mobile users will "tap" on the door
            mobile: (ctx) => this.handleMobileInteraction(ctx),
            
            // Desktop users will "click" on the door
            desktop: (ctx) => this.handleDesktopInteraction(ctx)
        });

        console.log('📝 Universal Door: Registered door_interact action for all device types');
    }

    /**
     * Sets up trigger zone events for player detection
     * This detects when players get near the door and want to interact
     */
    private setupTriggerEvents() {
        if (!this.props.interactionTrigger) return;

        // Listen for when players grab the trigger (VR interaction)
        this.connectCodeBlockEvent(
            this.props.interactionTrigger,
            hz.CodeBlockEvents.OnGrabStart,
            (isRightHand: boolean, player: hz.Player) => this.triggerInteraction(player)
        );

        // Listen for when players enter the trigger area (proximity detection)
        this.connectCodeBlockEvent(
            this.props.interactionTrigger,
            hz.CodeBlockEvents.OnPlayerEnterTrigger,
            (player: hz.Player) => this.onPlayerNearDoor(player)
        );

        // Listen for when players leave the trigger area
        this.connectCodeBlockEvent(
            this.props.interactionTrigger,
            hz.CodeBlockEvents.OnPlayerExitTrigger,
            (player: hz.Player) => this.onPlayerLeaveDoor(player)
        );

        console.log('🎯 Universal Door: Trigger events connected');
    }

    /**
     * Stores the door's original rotation for animation calculations
     * We need this to know where to animate back to when closing
     */
    private storeOriginalRotation() {
        const currentRotation = this.entity.rotation.get();
        this.originalRotation = new hz.Vec3(
            currentRotation.x,
            currentRotation.y,
            currentRotation.z
        );
        
        console.log(`📐 Universal Door: Stored original rotation (${this.originalRotation.x}, ${this.originalRotation.y}, ${this.originalRotation.z})`);
    }

    // ========================================
    // INTERACTION EVENT HANDLERS
    // ========================================
    
    /**
     * Called when player enters the door's trigger area
     * Shows device-appropriate interaction hints
     */
    private onPlayerNearDoor(player: hz.Player) {
        if (!this.inputMapperComponent) return;

        // Detect what device this player is using
        const deviceType = this.inputMapperComponent.detectDevice(player);
        
        // Show appropriate hint based on device
        let hintMessage = '';
        switch (deviceType) {
            case 'vr':
                hintMessage = `${player.name.get()}: Grab the door handle to ${this.isOpen ? 'close' : 'open'}`;
                break;
            case 'mobile':
                hintMessage = `${player.name.get()}: Tap the door to ${this.isOpen ? 'close' : 'open'}`;
                break;
            case 'desktop':
                hintMessage = `${player.name.get()}: Click the door to ${this.isOpen ? 'close' : 'open'}`;
                break;
        }
        
        console.log(`💡 ${hintMessage}`);
        // In a real implementation, you might show a UI hint here
    }

    /**
     * Called when player leaves the door's trigger area
     * Cleans up any UI hints or interaction states
     */
    private onPlayerLeaveDoor(player: hz.Player) {
        console.log(`👋 ${player.name.get()} moved away from door`);
        // In a real implementation, you might hide UI hints here
    }

    /**
     * Main interaction trigger - routes the interaction through InputMapper
     * This is where the magic happens - device detection and routing!
     */
    private triggerInteraction(player: hz.Player) {
        if (!this.inputMapperComponent) {
            console.warn('⚠️ Universal Door: Cannot interact - no InputMapper connected');
            return;
        }
        
        // Create interaction context with player and door information
        const context: InteractionContext = { 
            player: player, 
            entity: this.entity,      // The door object
            data: { 
                doorName: this.entity.name.get(),
                isCurrentlyOpen: this.isOpen,
                playerDevice: this.inputMapperComponent.detectDevice(player)
            }
        };
        
        // Route through InputMapper - this automatically calls the right handler!
        this.inputMapperComponent.trigger('door_interact', context);
    }

    // ========================================
    // DEVICE-SPECIFIC INTERACTION HANDLERS
    // ========================================
    
    /**
     * Handles VR user interactions (grabbing)
     * VR users expect tactile, physical interactions
     */
    private handleVRInteraction(context: InteractionContext) {
        console.log(`🥽 VR user ${context.player.name.get()} grabbed the door handle`);
        
        // Check if keycard is required (example of conditional logic)
        if (this.props.requireKeycard && !this.isOpen) {
            console.log(`🔒 Door requires keycard - ${context.player.name.get()} needs to find a keycard first`);
            // In a real implementation, you might check player's inventory here
            return;
        }
        
        // Provide VR-specific feedback
        this.showVRFeedback(context.player);
        
        // Execute the door toggle
        this.toggleDoor();
    }

    /**
     * Handles mobile user interactions (tapping)
     * Mobile users expect simple, clear tap interactions
     */
    private handleMobileInteraction(context: InteractionContext) {
        console.log(`📱 Mobile user ${context.player.name.get()} tapped the door`);
        
        // Mobile users might need different keycard logic (simpler UI)
        if (this.props.requireKeycard && !this.isOpen) {
            console.log(`🔒 Door requires keycard - showing mobile keycard interface`);
            // In a real implementation, you might show a mobile-friendly keycard UI
            return;
        }
        
        // Provide mobile-specific feedback
        this.showMobileFeedback(context.player);
        
        // Execute the door toggle
        this.toggleDoor();
    }

    /**
     * Handles desktop user interactions (clicking)
     * Desktop users expect precise click interactions
     */
    private handleDesktopInteraction(context: InteractionContext) {
        console.log(`🖥️ Desktop user ${context.player.name.get()} clicked the door`);
        
        // Desktop users might have access to advanced keycard systems
        if (this.props.requireKeycard && !this.isOpen) {
            console.log(`🔒 Door requires keycard - opening desktop keycard panel`);
            // In a real implementation, you might show a detailed keycard interface
            return;
        }
        
        // Provide desktop-specific feedback
        this.showDesktopFeedback(context.player);
        
        // Execute the door toggle
        this.toggleDoor();
    }

    // ========================================
    // DEVICE-SPECIFIC FEEDBACK METHODS
    // ========================================
    
    /**
     * Shows VR-appropriate feedback (haptic, spatial audio, etc.)
     */
    private showVRFeedback(player: hz.Player) {
        console.log(`🎮 Showing VR feedback for ${player.name.get()}`);
        // In a real implementation, you might:
        // - Trigger haptic feedback on controllers
        // - Play spatial audio at door location
        // - Show 3D particle effects
    }

    /**
     * Shows mobile-appropriate feedback (screen effects, simple audio)
     */
    private showMobileFeedback(player: hz.Player) {
        console.log(`📳 Showing mobile feedback for ${player.name.get()}`);
        // In a real implementation, you might:
        // - Show screen flash or highlight
        // - Play simple tap sound
        // - Display mobile-friendly UI confirmation
    }

    /**
     * Shows desktop-appropriate feedback (cursor effects, UI notifications)
     */
    private showDesktopFeedback(player: hz.Player) {
        console.log(`💻 Showing desktop feedback for ${player.name.get()}`);
        // In a real implementation, you might:
        // - Change cursor appearance briefly
        // - Show desktop notification
        // - Highlight the door temporarily
    }

    // ========================================
    // DOOR ANIMATION AND LOGIC
    // ========================================
    
    /**
     * Main door toggle method - handles opening/closing animation and logic
     * This is where the actual door behavior happens
     */
    private toggleDoor() {
        // Prevent multiple animations from running at once
        if (this.isAnimating) {
            console.log('🚪 Door is already animating - ignoring interaction');
            return;
        }

        // Toggle the door state
        this.isOpen = !this.isOpen;
        this.isAnimating = true;

        // Clear existing auto-close timer
        if (this.autoCloseTimer) {
            this.async.clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = 0;
        }

        console.log(`🚪 ${this.isOpen ? 'Opening' : 'Closing'} door...`);

        // Calculate target rotation
        const targetRotationY = this.isOpen 
            ? this.originalRotation.y + this.props.openAngle    // Open position
            : this.originalRotation.y;                          // Closed position

        const targetRotation = new hz.Quaternion(
            this.originalRotation.x,
            targetRotationY,
            this.originalRotation.z,
            1
        );

        // Animate the door rotation
        this.animateDoorRotation(targetRotation, this.props.openSpeed).then(() => {
            this.isAnimating = false;
            console.log(`✅ Door ${this.isOpen ? 'opened' : 'closed'} successfully`);

            // Set up auto-close timer if door is open
            if (this.isOpen && this.props.autoCloseDelay > 0) {
                console.log(`⏱️ Door will auto-close in ${this.props.autoCloseDelay} seconds`);
                this.autoCloseTimer = this.async.setTimeout(() => {
                    if (this.isOpen && !this.isAnimating) {
                        console.log('🕐 Auto-closing door...');
                        this.toggleDoor();
                    }
                }, this.props.autoCloseDelay * 1000);
            }
        }).catch((error) => {
            this.isAnimating = false;
            console.error('❌ Door animation failed:', error);
        });
    }

    /**
     * Animates door rotation smoothly over time
     * Custom animation system since Horizon Worlds doesn't have built-in tweening
     */
    private animateDoorRotation(targetRotation: hz.Quaternion, duration: number): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const startRotation = this.entity.rotation.get();
                const startTime = Date.now();
                const durationMs = duration * 1000;

                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / durationMs, 1);
                    
                    // Smooth easing function (ease-in-out)
                    const easedProgress = progress < 0.5 
                        ? 2 * progress * progress 
                        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                    
                    // Interpolate between start and target rotation
                    const lerpedRotation = new hz.Quaternion(
                        startRotation.x + (targetRotation.x - startRotation.x) * easedProgress,
                        startRotation.y + (targetRotation.y - startRotation.y) * easedProgress,
                        startRotation.z + (targetRotation.z - startRotation.z) * easedProgress,
                        startRotation.w + (targetRotation.w - startRotation.w) * easedProgress
                    );

                    // Apply the rotation
                    this.entity.rotation.set(lerpedRotation);

                    // Continue animation or finish
                    if (progress < 1) {
                        this.async.setTimeout(animate, 16); // ~60fps
                    } else {
                        resolve();
                    }
                };

                animate();
            } catch (error) {
                reject(error);
            }
        });
    }

    // ========================================
    // UTILITY METHODS
    // ========================================
    
    /**
     * Force opens the door (useful for other scripts or events)
     */
    public forceDoorOpen() {
        if (!this.isOpen && !this.isAnimating) {
            this.toggleDoor();
        }
    }

    /**
     * Force closes the door (useful for other scripts or events)
     */
    public forceDoorClose() {
        if (this.isOpen && !this.isAnimating) {
            this.toggleDoor();
        }
    }

    /**
     * Gets current door state
     */
    public getDoorState(): { isOpen: boolean, isAnimating: boolean } {
        return {
            isOpen: this.isOpen,
            isAnimating: this.isAnimating
        };
    }
}

hz.Component.register(UniversalDoor);

/*
========================================
COMPLETE SETUP GUIDE FOR OTHER CREATORS
========================================

STEP 1: SET UP INPUT MAPPER
1. Create an Empty Object in your world
2. Name it "InputMapper_System" 
3. Attach the InputMapper.ts script to it
4. Set debugMode = true for testing

STEP 2: CREATE YOUR DOOR
1. Add a 3D Object (Shape → Cube or import your door model)
2. Scale and position it as desired
3. Name it something like "MyDoor"

STEP 3: CREATE TRIGGER ZONE
1. Add a Trigger Zone (Gizmos → Trigger Zone)
2. Make it a child of your door object
3. Scale it to be slightly larger than the door
4. Make sure "Grabbable" is enabled for VR interactions

STEP 4: ATTACH AND CONFIGURE SCRIPTS
1. Attach UniversalDoor.ts script to your door object
2. In the script properties:
   - inputMapper: Drag your InputMapper_System object here
   - interactionTrigger: Drag your trigger zone here
   - openAngle: 90 (or desired rotation degrees)
   - openSpeed: 1.0 (or desired animation speed)
   - autoCloseDelay: 5.0 (seconds, or 0 for no auto-close)

STEP 5: TEST YOUR DOOR
1. Save and build your world (Ctrl+B)
2. Enter Play Mode
3. Walk up to the door
4. Try interacting (the console will show what's happening)
5. Test with different devices if possible

EXPECTED CONSOLE OUTPUT:
✅ Universal InputMapper ready - supports VR, Mobile, and Desktop interactions
🚪 Universal Door initializing...
✅ Universal Door: Connected to InputMapper successfully  
📝 Universal Door: Registered door_interact action for all device types
🎯 Universal Door: Trigger events connected
📐 Universal Door: Stored original rotation (0, 0, 0)
🚪 Universal Door setup complete
✅ Universal Door ready - works on VR, Mobile, and Desktop!

WHEN PLAYER INTERACTS:
🔍 Detected PlayerName as: vr
💡 PlayerName: Grab the door handle to open
🥽 VR user PlayerName grabbed the door handle
🎮 Showing VR feedback for PlayerName
🚪 Opening door...
✅ Door opened successfully
⏱️ Door will auto-close in 5 seconds

TROUBLESHOOTING:
- If door doesn't work: Check that inputMapper property is set
- If no interaction: Check that interactionTrigger property is set
- If no device detection: Make sure InputMapper script is attached
- If animation looks wrong: Adjust openAngle and openSpeed values
- Turn on debugMode in InputMapper for detailed logs

CUSTOMIZATION IDEAS:
- Add sound effects for different devices
- Create locked doors that require keys
- Add visual effects during animation
- Create sliding doors instead of rotating
- Add team-restricted access
- Create automatic doors that open on approach

This example shows the complete pattern for using InputMapper.
Copy this approach for buttons, pickups, and any other interactive objects!

========================================
*/
