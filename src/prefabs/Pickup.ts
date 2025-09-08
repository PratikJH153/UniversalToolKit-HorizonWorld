import {
  Component,
  PropTypes,
  World,
  Player,
  PlayerDeviceType,
  GrabbableEntity,
  TriggerGizmo,
} from 'horizon/core';

// This is a universal pickup asset that can be grabbed by a VR player
// or picked up with a tap by a mobile player.
export class Pickup extends Component<typeof Pickup> {

  static propsDefinition = {
    // The physical object that can be grabbed in VR.
    vrGrabTarget: {
      type: PropTypes.Entity,
    },
    // The invisible trigger area that mobile players can tap to pick up.
    mobileTapTarget: {
      type: PropTypes.Entity,
    },
    // The action to perform when the object is picked up.
    onPickup: {
      type: PropTypes.CodeBlockEvent,
      default: new CodeBlockEvent<[]>('pickup'),
    },
  };

  private world!: World;

  preStart() {
    this.world = this.entity.world;
  }

  start() {
    const player = this.world.getLocalPlayer();
    const deviceType = player.deviceType.get();

    if (deviceType === PlayerDeviceType.VR) {
      this.setupVRInteraction();
    } else if (deviceType === PlayerDeviceType.Mobile || deviceType === PlayerDeviceType.Desktop) {
      this.setupMobileInteraction();
    }
  }

  // Handles VR-specific input (grabbing the object).
  setupVRInteraction() {
    const vrTarget = this.props.vrGrabTarget.as(GrabbableEntity);
    if (!vrTarget) {
      console.error('Pickup: VR Grab Target is not set or is not a GrabbableEntity.');
      return;
    }

    // Listen for the grab event.
    vrTarget.onGrab.subscribe(() => {
      this.onPickup();
    });
  }

  // Handles mobile-specific input (tapping the object).
  setupMobileInteraction() {
    const mobileTarget = this.props.mobileTapTarget.as(TriggerGizmo);
    if (!mobileTarget) {
      console.error('Pickup: Mobile Tap Target is not set or is not a TriggerGizmo.');
      return;
    }

    // Listen for the tap event.
    mobileTarget.onTap.subscribe(() => {
      this.onPickup();
    });
  }

  // The central function that performs the pickup action and sends an event.
  onPickup() {
    // Dispatch the event to indicate the object has been picked up.
    this.world.dispatchEvent(this.props.onPickup, {
      player: this.world.getLocalPlayer(),
      object: this.entity,
    });
    console.log('Object picked up!');
  }
}

Component.register(Pickup);
