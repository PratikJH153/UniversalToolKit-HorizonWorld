import {
  Component,
  PropTypes,
  World,
  Player,
  PlayerDeviceType,
  CameraMode,
  Vec3,
} from 'horizon/core';

// This component provides a collection of functions to control a player's camera.
// It should be attached to a single, persistent object in the world.
export class CameraPresets extends Component<typeof CameraPresets> {

  // We expose properties so a creator can set a target for the CCTV camera.
  static propsDefinition = {
    // The entity (e.g., a CCTV camera model) the player's camera will be fixed on.
    cctvTarget: {
      type: PropTypes.Entity,
    },
  };

  private world!: World;

  // preStart() is called once when the script is instantiated.
  preStart() {
    this.world = this.entity.world;
  }

  // Applies a fixed, CCTV-style camera to the local player.
  applyCCTV(player: Player) {
    // Get the CCTV target entity from the public properties.
    const cctvTarget = this.props.cctvTarget;
    if (!cctvTarget) {
      console.error('CCTV target is not set.');
      return;
    }

    player.camera.setMode(CameraMode.Fixed, {
      position: cctvTarget.position.get(),
      rotation: cctvTarget.rotation.get(),
    });
    console.log('Set CCTV camera for player:', player.id);
  }

  // Applies a third-person camera mode for mobile/desktop players.
  applyThirdPerson(player: Player) {
    player.camera.setMode(CameraMode.Follow, {
      horizontalOffset: 0,
      verticalOffset: 1.5,
      distance: 3,
    });
    console.log('Set Third-Person camera for player:', player.id);
  }

  // A helper function that applies a camera preset based on the player's device.
  setCameraForDevice(player: Player) {
    const deviceType = player.deviceType.get();
    if (deviceType === PlayerDeviceType.Mobile || deviceType === PlayerDeviceType.Desktop) {
      this.applyThirdPerson(player);
    } else {
      // For VR players, we typically do nothing and let the default camera run.
      console.log('VR player detected, not changing camera mode.');
    }
  }
}

Component.register(CameraPresets);
