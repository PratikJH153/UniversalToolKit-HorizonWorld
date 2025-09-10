import * as hz from 'horizon/core';

export class DeviceTest extends hz.Component<typeof DeviceTest> {
    static propsDefinition = {};

    preStart() {
        // ✅ ONLY detect device when real players join
        this.connectCodeBlockEvent(
            this.entity,
            hz.CodeBlockEvents.OnPlayerEnterWorld,
            this.onPlayerJoin.bind(this)
        );
    }

    start() {
        console.log('DeviceTest initialized - waiting for real players to join...');
        // ✅ DON'T test with local player in start() - it might be server player
    }

    onPlayerJoin(player: hz.Player) {
        // ✅ Check if this is a real player (not server player)
        if (this.isRealPlayer(player)) {
            this.testDeviceDetection(player);
        } else {
            console.log('Skipping server player - not a real human player');
        }
    }

    // ✅ Helper to check if player is real (not server)
    isRealPlayer(player: hz.Player): boolean {
        try {
            const playerName = player.name.get();
            // Server players typically have empty names or specific patterns
            return playerName != null && playerName.length > 0 && playerName !== 'Server';
        } catch (error) {
            console.log('Unable to get player name - likely server player');
            return false;
        }
    }

    testDeviceDetection(player: hz.Player) {
        try {
            const deviceType = player.deviceType.get();
            const playerName = player.name.get();
            
            console.log(`✅ ${playerName} is using device type: ${deviceType}`);
            
            // Convert to our simplified enum
            let simpleType = 'desktop';
            if (deviceType === hz.PlayerDeviceType.VR) {
                simpleType = 'vr';
            } else if (deviceType === hz.PlayerDeviceType.Mobile) {
                simpleType = 'mobile';
            }
            
            console.log(`✅ ${playerName} simplified device: ${simpleType}`);
            
        } catch (error) {
            console.error('Error detecting device type:', error);
        }
    }
}

hz.Component.register(DeviceTest);
