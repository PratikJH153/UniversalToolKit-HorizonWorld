import {
  Component,
  PropTypes,
  World,
  Player,
  PlayerDeviceType,
  GrabbableEntity,
  TriggerGizmo,
  Vec3,
} from 'horizon/core';

// This is the main script component that a creator will attach to their door object.
// It handles all logic to make the door open/close based on the player's device type.
export class Door extends Component<typeof Door> {

  // We expose public variables here so creators can configure the asset in the editor.
  static propsDefinition = {
    // The entity that VR players will grab.
    vrGrabTarget: {
      type: PropTypes.Entity,
    },
    // The trigger that mobile players will tap.
    mobileTapTarget: {
      type: PropTypes.Entity,
    },
    // The angle in degrees the door should open to.
    openAngle: {
      type: PropTypes.Number,
      default: 90,
    },
  };

  private world!: World;
  private isOpen = false;
  private initialRotation = new Vec3(0, 0, 0);

  // preStart() is called once when the script is instantiated.
  preStart() {
    this.world = this.entity.world;
    // Capture the door's initial rotation to reset it later.
    this.initialRotation = this.entity.rotation.get().toEuler();
  }

  // start() is called when the script is fully ready.
  start() {
    // Get the local player. This script must be in 'Local' execution mode.
    const player = this.world.getLocalPlayer();

    // Determine the player's device type. This is the core of the universal logic.
    const deviceType = player.deviceType.get();

    // Branch logic based on device type.
    if (deviceType === PlayerDeviceType.VR) {
      this.setupVRInteraction();
    } else if (deviceType === PlayerDeviceType.Mobile || deviceType === PlayerDeviceType.Desktop) {
      this.setupMobileInteraction();
    }
  }

  // Handles all VR-specific interaction logic.
  setupVRInteraction() {
    const vrTarget = this.props.vrGrabTarget.as(GrabbableEntity);
    if (!vrTarget) {
      console.error('Door: VR Grab Target is not set or is not a GrabbableEntity.');
      return;
    }

    // Subscribe to the grab event.
    vrTarget.onGrab.subscribe(() => this.toggleDoor());
  }

  // Handles all Mobile/Desktop-specific interaction logic.
  setupMobileInteraction() {
    const mobileTarget = this.props.mobileTapTarget.as(TriggerGizmo);
    if (!mobileTarget) {
      console.error('Door: Mobile Tap Target is not set or is not a TriggerGizmo.');
      return;
    }

    // Subscribe to the tap event.
    mobileTarget.onTap.subscribe(() => this.toggleDoor());
  }

  // The actual logic for opening and closing the door.
  toggleDoor() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Rotate the door to the open position.
      this.entity.rotation.setFromEuler(
        this.initialRotation.x,
        this.initialRotation.y + this.props.openAngle,
        this.initialRotation.z
      );
    } else {
      // Rotate the door back to its initial, closed position.
      this.entity.rotation.set(this.initialRotation);
    }
  }
}

// Make the script available as a component in the editor.
Component.register(Door);
