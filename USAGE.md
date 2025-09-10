# Universal InputMapper - Complete Usage Guide

This guide covers advanced features, API reference, and best practices for Universal InputMapper in Meta Horizon Worlds. For installation and basic usage, see README.md.

## 📋 **Table of Contents**

1. [Installation & Setup](#installation--setup)
2. [Basic Usage](#basic-usage)
3. [Advanced Features](#advanced-features)
4. [Example Prefabs](#example-prefabs)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)
7. [API Reference](#api-reference)

## 🚀 **Installation & Setup**

### Prerequisites
- Meta Horizon Worlds Desktop Editor installed
- Basic familiarity with TypeScript (helpful but not required)
- A world project where you want to add cross-platform interactions

### Step-by-Step Installation

#### 1. Import the Scripts
1. Download `InputMapper.ts` from the asset library
2. In Desktop Editor: **Assets** → **Import Script** → Select `InputMapper.ts`
3. Repeat for any example scripts (like `UniversalDoor.ts`)

#### 2. Create InputMapper Object
1. In your world, create an **Empty Object**
2. **Name it**: "InputMapper_System" (or any descriptive name)
3. **Position**: Can be anywhere, typically at (0,0,0)
4. **Attach Script**: Right-click → **Add Component** → **InputMapper**

#### 3. Configure Properties
In the InputMapper properties panel:
debugMode: ✅ true (recommended for setup)
enableDeviceOverride: ❌ false (unless testing)
fallbackToDesktop: ✅ true (recommended)

text

#### 4. Verify Installation
1. **Build your world** (Ctrl+B)
2. **Enter Play Mode**
3. **Check console** - you should see:
✅ Universal InputMapper ready - supports VR, Mobile, and Desktop interactions

text

## 🎯 **Basic Usage**

### Understanding the Core Concept

Universal InputMapper works with **Actions** and **Handlers**:

- **Action**: A named interaction (like "door_open", "button_press")
- **Handler**: What happens for each device type (VR, Mobile, Desktop)

### Your First Universal Interaction

Let's create a simple button that works on all platforms:

#### 1. Create the Button Object
World Hierarchy:
MyButton (3D Object - Cube or custom model)
├── ButtonTrigger (Trigger Zone)
└── ButtonScript (Empty Object with your script)

text

#### 2. Write the Button Script
import * as hz from 'horizon/core';
import { InputMapper, InteractionContext } from './InputMapper';

export class UniversalButton extends hz.Component<typeof UniversalButton> {
static propsDefinition = {
inputMapper: { type: hz.PropTypes.Entity, description: "Drag InputMapper_System here" },
triggerZone: { type: hz.PropTypes.Entity, description: "Drag ButtonTrigger here" }
};

text
private inputMapperComponent: InputMapper | null = null;

preStart() {
    // Connect to InputMapper
    if (this.props.inputMapper) {
        const components = this.props.inputMapper.getComponents();
        for (const component of components) {
            if (component instanceof InputMapper) {
                this.inputMapperComponent = component;
                break;
            }
        }
    }

    // Register button action
    if (this.inputMapperComponent) {
        this.inputMapperComponent.registerAction('button_press', {
            vr: (ctx) => this.handleVRPress(ctx),
            mobile: (ctx) => this.handleMobilePress(ctx),
            desktop: (ctx) => this.handleDesktopPress(ctx)
        });
    }

    // Connect trigger events
    if (this.props.triggerZone) {
        this.connectCodeBlockEvent(
            this.props.triggerZone,
            hz.CodeBlockEvents.OnGrabStart,
            (isRightHand: boolean, player: hz.Player) => this.triggerPress(player)
        );
    }
}

private triggerPress(player: hz.Player) {
    if (!this.inputMapperComponent) return;
    
    const context: InteractionContext = { player, entity: this.entity };
    this.inputMapperComponent.trigger('button_press', context);
}

private handleVRPress(context: InteractionContext) {
    console.log(`VR user ${context.player.name.get()} grabbed the button`);
    this.pressButton();
}

private handleMobilePress(context: InteractionContext) {
    console.log(`Mobile user ${context.player.name.get()} tapped the button`);
    this.pressButton();
}

private handleDesktopPress(context: InteractionContext) {
    console.log(`Desktop user ${context.player.name.get()} clicked the button`);
    this.pressButton();
}

private pressButton() {
    // Your button logic here
    console.log('Button pressed!');
}
}

hz.Component.register(UniversalButton);

text

#### 3. Configure the Button
1. **Attach script** to MyButton object
2. **Set properties**:
   - inputMapper: Drag your InputMapper_System object here
   - triggerZone: Drag your ButtonTrigger object here

#### 4. Test Your Button
1. **Build** (Ctrl+B) and **Enter Play Mode**
2. **Approach the button** and interact
3. **Check console** - you should see device-specific messages

## 🔧 **Advanced Features**

### Device Override for Testing

When developing, you can test different device behaviors without switching devices:

// In your script, after getting inputMapperComponent
if (this.inputMapperComponent) {
// First, enable device override in InputMapper properties
// Then use this method to test different device types
this.inputMapperComponent.setDeviceOverride(somePlayer, 'mobile');
}

text

### Player Statistics

Get real-time data about what devices your players are using:

const stats = this.inputMapperComponent.getPlayerStats();
console.log(Players: ${stats.total}, VR: ${stats.vr}, Mobile: ${stats.mobile}, Desktop: ${stats.desktop});

text

### Dynamic Action Registration

You can register actions dynamically based on game state:

// Register different actions based on game mode
if (gameMode === 'combat') {
this.inputMapperComponent.registerAction('weapon_fire', {
vr: (ctx) => this.fireWithControllers(ctx),
mobile: (ctx) => this.fireWithTouch(ctx),
desktop: (ctx) => this.fireWithMouse(ctx)
});
} else if (gameMode === 'building') {
this.inputMapperComponent.registerAction('place_block', {
vr: (ctx) => this.placeWithHands(ctx),
mobile: (ctx) => this.placeWithTouch(ctx),
desktop: (ctx) => this.placeWithClick(ctx)
});
}

text

## 📦 **Example Prefabs**

### Universal Door (Included)

A complete door system that works on all platforms:

**Features:**
- Automatic rotation animation
- Device-appropriate interaction hints
- Auto-close functionality
- Configurable open angle and speed

    
    // 2. Register your action
    this.registerYourAction();
---
**For installation and setup, see README.md.**

private registerYourAction() {
    if (this.inputMapperComponent) {
        this.inputMapperComponent.registerAction('your_action', {
            vr: (ctx) => this.handleVR(ctx),
            mobile: (ctx) => this.handleMobile(ctx),
            desktop: (ctx) => this.handleDesktop(ctx)
        });
    }
}

---
**For basic usage and first interaction, see README.md.**
🎮 Player JohnVR joined (vr) - Total players: 1
🔍 Detected JohnVR as: vr
📝 Registered action 'door_interact' for: vr, mobile, desktop
✅ Executed 'door_interact' for vr user: JohnVR

text

### Performance Monitoring

Check system performance:
// Get current stats
const stats = this.inputMapperComponent.getPlayerStats();
console.log(Managing ${stats.total} players across ${this.inputMapperComponent.getRegisteredActions().length} actions);

text

## 📚 **API Reference**

### InputMapper Class

#### Methods

**`detectDevice(player: hz.Player): DeviceType`**
- Detects what device a player is using
- Returns: 'vr', 'mobile', or 'desktop'
- Caches results for performance

**`registerAction(actionName: string, handlers: ActionHandlers): void`**
- Registers an action with device-specific handlers
- actionName: Unique identifier for the action
- handlers: Object with vr, mobile, and/or desktop functions

**`trigger(actionName: string, context: InteractionContext): void`**
- Triggers an action, automatically using the correct handler
- actionName: The action to trigger
- context: Information about the interaction

**`setDeviceOverride(player: hz.Player, deviceType: DeviceType): void`**
- Manually override device type for testing
- Requires enableDeviceOverride = true

**`getPlayerStats(): PlayerStats`**
- Returns object with player counts by device type
- Format: `{ total: number, vr: number, mobile: number, desktop: number }`

**`getRegisteredActions(): string[]`**
- Returns array of all registered action names

**`clearAllActions(): void`**
- Removes all registered actions

#### Properties

**`debugMode: boolean`**
- Enable detailed console logging
- Default: false

**`enableDeviceOverride: boolean`**
- Allow manual device type override for testing
- Default: false

**`fallbackToDesktop: boolean`**
- Use desktop handler if device-specific handler not found
- Default: true

### Type Definitions

type DeviceType = 'vr' | 'mobile' | 'desktop';

interface InteractionContext {
player: hz.Player; // The player who triggered the interaction
entity?: hz.Entity; // Optional: the object being interacted with
data?: any; // Optional: custom data
}

type ActionHandler = (context: InteractionContext) => void;

type ActionHandlers = {
vr?: ActionHandler; // Handler for VR users
mobile?: ActionHandler; // Handler for mobile users
desktop?: ActionHandler; // Handler for desktop users
};

text

## 🎯 **Next Steps**

1. **Start Simple**: Begin with the basic button example
2. **Experiment**: Try different interaction types and device behaviors
3. **Build Prefabs**: Create reusable interaction patterns
4. **Share**: Contribute your prefabs back to the community
5. **Optimize**: Use performance monitoring to keep your world running smoothly

## 🤝 **Community & Support**

- **Questions?** Join our Discord community
- **Found a bug?** Report it on GitHub Issues
- **Want to contribute?** Check out our Contributing Guide
- **Need custom development?** Contact our professional services team

---

**Happy Creating!** 🎉

*Remember: Great cross-platform experiences start with understanding that VR, Mobile, and Desktop users each have unique needs and capabilities. Universal InputMapper helps you honor those differences while maintaining consistent functionality.*
