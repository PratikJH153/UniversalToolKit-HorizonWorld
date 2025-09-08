import {
  Component,
  PropTypes,
  World,
  Player,
  PlayerDeviceType,
  GrabbableEntity,
  TriggerGizmo,
} from 'horizon/core';

// This is the main script component for a button asset.
// It detects the player's device and allows them to "press" the button
// by either a VR grab or a mobile tap.
export class Button extends Component<typeof Button> {

  // Public properties to expose in the editor for easy configuration.
  static propsDefinition = {
    // The visual part of the button that VR players can grab.
    vrGrabTarget: {
      type: PropTypes.Entity,
    },
    // The trigger area that mobile players can tap.
    mobileTapTarget: {
      type: PropTypes.Entity,
    },
    // The action to perform when the button is pressed.
    onPress: {
      type: PropTypes.CodeBlockEvent,
      default: new CodeBlockEvent<[]>('buttonPress'),
    },
  };

  private world!: World;

  // preStart() is called once when the script is instantiated.
  preStart() {
    this.world = this.entity.world;
  }

  // start() is called when the script is fully ready.
  start() {
    // Get the local player to determine their device type.
    const player = this.world.getLocalPlayer();
    const deviceType = player.deviceType.get();

    if (deviceType === PlayerDeviceType.VR) {
      this.setupVRInteraction();
    } else if (deviceType === PlayerDeviceType.Mobile || deviceType === PlayerDeviceType.Desktop) {
      this.setupMobileInteraction();
    }
  }

  // Handles VR-specific input (grabbing the button).
  setupVRInteraction() {
    const vrTarget = this.props.vrGrabTarget.as(GrabbableEntity);
    if (!vrTarget) {
      console.error('Button: VR Grab Target is not set or is not a GrabbableEntity.');
      return;
    }

    // When the button is grabbed, trigger the press event.
    vrTarget.onGrab.subscribe(() => {
      this.onPress();
    });
  }

  // Handles mobile-specific input (tapping the button).
  setupMobileInteraction() {
    const mobileTarget = this.props.mobileTapTarget.as(TriggerGizmo);
    if (!mobileTarget) {
      console.error('Button: Mobile Tap Target is not set or is not a TriggerGizmo.');
      return;
    }

    // When the button is tapped, trigger the press event.
    mobileTarget.onTap.subscribe(() => {
      this.onPress();
    });
  }

  // The central function that performs the action and sends the event.
  onPress() {
    // Dispatch the CodeBlockEvent to trigger an action in the world.
    this.world.dispatchEvent(this.props.onPress, {
      player: this.world.getLocalPlayer(),
    });
    console.log('Button pressed!');
  }
}

// Register the component so it can be attached to entities in the editor.
Component.register(Button);
