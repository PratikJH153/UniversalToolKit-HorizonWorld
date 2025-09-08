import {
  Component,
  PropTypes,
  World,
  Player,
  TextGizmo,
} from 'horizon/core';

// This component manages player teams and can be hooked up to UI elements.
// It should be attached to a single, persistent object in the world.
export class TeamManager extends Component<typeof TeamManager> {

  static propsDefinition = {
    // A TextGizmo to display the score or number of players on Team A.
    teamAScoreboard: {
      type: PropTypes.Entity,
    },
    // A TextGizmo to display the score or number of players on Team B.
    teamBScoreboard: {
      type: PropTypes.Entity,
    },
    // An event to trigger when a player joins a team.
    onPlayerJoinedTeam: {
      type: PropTypes.CodeBlockEvent,
      default: new CodeBlockEvent<{player: Player, teamName: string}>('playerJoinedTeam'),
    },
  };

  private world!: World;
  private teams: Map<string, Player[]> = new Map();

  // preStart() is called once when the script is instantiated.
  preStart() {
    this.world = this.entity.world;
    this.teams.set('A', []);
    this.teams.set('B', []);
  }

  // Assigns a player to a specific team.
  assignToTeam(player: Player, teamName: 'A' | 'B') {
    // Remove the player from any team they are currently on.
    for (const [key, team] of this.teams.entries()) {
      this.teams.set(key, team.filter(p => p.id !== player.id));
    }

    // Add the player to the new team.
    const team = this.teams.get(teamName);
    if (team) {
      team.push(player);
    }

    // Call the update function to refresh the UI and dispatch an event.
    this.updateUI();
    this.world.dispatchEvent(this.props.onPlayerJoinedTeam, {
      player: player,
      teamName: teamName,
    });
  }

  // Automatically balances all players into two teams.
  autoBalancePlayers() {
    // Get all players currently in the world.
    const allPlayers = this.world.players;

    // Clear existing teams.
    this.teams.set('A', []);
    this.teams.set('B', []);

    // Distribute players in a round-robin fashion.
    allPlayers.forEach((player, index) => {
      if (index % 2 === 0) {
        this.teams.get('A')?.push(player);
      } else {
        this.teams.get('B')?.push(player);
      }
    });

    this.updateUI();
  }

  // Updates the visual UI elements.
  updateUI() {
    // Get the TextGizmos from the public properties.
    const teamAScoreboard = this.props.teamAScoreboard.as(TextGizmo);
    const teamBScoreboard = this.props.teamBScoreboard.as(TextGizmo);

    if (teamAScoreboard) {
      teamAScoreboard.text.set(`Team A: ${this.teams.get('A')?.length}`);
    }

    if (teamBScoreboard) {
      teamBScoreboard.text.set(`Team B: ${this.teams.get('B')?.length}`);
    }

    console.log('Teams updated. A:', this.teams.get('A')?.length, 'B:', this.teams.get('B')?.length);
  }
}

Component.register(TeamManager);
