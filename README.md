# Universal InputMapper for Meta Horizon Worlds

![Platform Support](https://img.shields.io/badge/Platform-VR%20%7C%20Mobile%20%7C%20Desktop-blue)
![Meta Horizon Worlds](https://img.shields.io/badge/Meta-Horizon%20Worlds-orange)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)

## 🎯 **What is Universal InputMapper?**

Universal InputMapper is a cross-platform interaction system for Meta Horizon Worlds that automatically detects whether players are using **VR headsets**, **mobile devices**, or **desktop computers** and routes interactions to the appropriate handlers.

**Stop writing separate scripts for each platform.** Write once, works everywhere!

## ✨ **Key Features**

- 🎮 **Automatic Device Detection** - Instantly knows if player is using VR, Mobile, or Desktop
- 🔄 **Universal Interactions** - Same functionality across all platforms with device-appropriate input methods
- 🛠️ **Easy Integration** - Simple API that any creator can understand and use
- 🚀 **Zero Configuration** - Works out of the box, no complex setup required
- 🔧 **Highly Customizable** - Flexible system that adapts to any interaction type
- 📱 **Mobile-First Design** - Treats mobile users as first-class citizens, not an afterthought
- 🎯 **Production Ready** - Robust error handling, fallbacks, and debugging tools

## 🎬 **See It In Action**


```typescript
// Register a door that works on ALL platforms
inputMapper.registerAction('door_interact', {
   vr: (ctx) => console.log('VR user grabbed door'), // Hand controllers
   mobile: (ctx) => console.log('Mobile user tapped door'), // Touch screen
   desktop: (ctx) => console.log('Desktop user clicked door') // Mouse
});

// Trigger the interaction - automatically uses the right handler!
inputMapper.trigger('door_interact', { player: somePlayer });
```

**Result**: VR users grab with controllers, mobile users tap the screen, desktop users click with mouse — **same door, perfect experience for everyone!**

## 🚀 **Quick Start (60 Seconds)**

### Step 1: Install the Scripts
1. Download `InputMapper.ts` and `UniversalDoor.ts`
2. Import both scripts into your Meta Horizon Worlds project

### Step 2: Set Up InputMapper
1. Create an **Empty Object** in your world
2. Attach the **InputMapper.ts** script to it
3. Name it something like "InputMapper_System"

### Step 3: Create Your First Universal Door
1. Add a **3D Object** (your door)
2. Add a **Trigger Zone** as child of the door
3. Attach **UniversalDoor.ts** script to the door
4. In door properties:
   - **inputMapper**: Drag your InputMapper_System object here
   - **interactionTrigger**: Drag your trigger zone here

### Step 4: Test It!
1. **Build your world** (Ctrl+B)
2. **Enter Play Mode**
3. **Walk up to the door** and interact
4. **Check console** - you'll see device detection working!

🎉 **That's it!** Your door now works perfectly on VR, Mobile, and Desktop with appropriate interactions for each platform.

## 📱 **Supported Platforms & Interactions**

| Platform | Input Method | Experience |
|----------|--------------|------------|
| **VR Headsets** | Hand Controllers | Grab door handles, press buttons with hands |
| **Mobile Devices** | Touch Screen | Tap objects, swipe interfaces |
| **Desktop/Web** | Mouse & Keyboard | Click objects, keyboard shortcuts |

## 🏗️ **What's Included**

### Core System
- **`InputMapper.ts`** - The main universal input detection and routing system
- **Device Detection** - Automatically identifies VR, Mobile, or Desktop users
- **Action Registration** - Simple API for registering cross-platform interactions
- **Error Handling** - Robust fallbacks and debugging tools

### Example Prefabs
- **`UniversalDoor.ts`** - Complete working door example with animations
- **Setup Guides** - Step-by-step instructions for integration
- **Best Practices** - Patterns for creating your own universal interactions

### Documentation
- See [USAGE.md](USAGE.md) for API reference, integration examples, troubleshooting, and more.

## 🎯 **Perfect For**

World creators, game developers, businesses, educators — anyone building for all platforms.

## 🏆 **Why Choose Universal InputMapper?**
### Before InputMapper
```typescript
// Separate scripts for each platform
if (player.isVR) {
   door.openWithGrab();
} else if (player.isMobile) {
   door.openWithTap();
} else {
   door.openWithClick();
}
```

### After InputMapper
```typescript
// One simple registration, works everywhere
inputMapper.registerAction('door_interact', {
   vr: (ctx) => door.openWithGrab(),
   mobile: (ctx) => door.openWithTap(),
   desktop: (ctx) => door.openWithClick()
});
```

## 🛠️ **Technical Requirements**

- **Meta Horizon Worlds** Desktop Editor
- **TypeScript** enabled in your world
- **No external dependencies** - uses only built-in Horizon Worlds APIs

## 🎓 **Learning Resources**

- 📖 **[Complete Usage Guide](USAGE.md)** - Detailed setup and customization
- 🎥 **Video Tutorials** - Visual step-by-step guides
- 💬 **Community Discord** - Get help from other creators
- 🐛 **Issue Tracker** - Report bugs and request features

## 🤝 **Contributing**

We welcome contributions from the community! Whether it's:
- 🐛 **Bug Reports** - Help us improve reliability
- 💡 **Feature Requests** - Suggest new capabilities
- 📝 **Documentation** - Improve our guides and examples
- 🎯 **Example Prefabs** - Share your universal interaction patterns

## 🌟 **Star This Project**

If Universal InputMapper helped you create better cross-platform experiences, please give it a star! It helps other creators discover this tool.

## 📞 **Support**

- 📧 **Email**: pratik.jh2017@gmail.com

---

**Made with ❤️ for the Meta Horizon Worlds creator community**

*Universal InputMapper - Because every player deserves a great experience, regardless of their device.*

