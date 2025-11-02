export class SettingsScene extends Phaser.Scene {
  // Current value of the volume (0.0 to 1.0)
  private masterVolume: number = 0.5;
  private isFullscreen: boolean = false;

  // Graphical elements for the slider and toggle state
  private volumeSlider!: Phaser.GameObjects.Graphics;
  private volumeText!: Phaser.GameObjects.Text;
  private fullscreenToggleText!: Phaser.GameObjects.Text;

  constructor() {
    super("SettingsScene");
  }

  create(data: { callingSceneKey: string }): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // --- 1. Semi-Transparent Background (Dimmer) ---
    // This is necessary because the calling scene might be paused behind us.
    this.add
      .rectangle(
        centerX,
        centerY,
        this.scale.width,
        this.scale.height,
        0x000000,
        0.7
      )
      .setInteractive(); // Makes background consume clicks

    // --- 2. Settings Panel (Futuristic Frame) ---
    this.createSettingsPanel(centerX, centerY);

    // --- 3. Content Sections ---

    // Volume (Y Position: Center - 100)
    this.createVolumeSlider(centerX, centerY - 100);

    // Fullscreen Toggle (Y Position: Center + 50)
    this.createFullscreenToggle(centerX, centerY + 50);

    // --- 4. Action Buttons ---
    this.createActionButtons(centerX, centerY + 200, data.callingSceneKey);

    // Initial state update
    this.updateVolumeDisplay();
    this.updateFullscreenToggle(false);
  }

  // --- UI Component Creation ---

  private createSettingsPanel(centerX: number, centerY: number): void {
    const panelWidth = 600;
    const panelHeight = 500;

    // Draw Main Frame/Background (Light Grey/White for advanced feel)
    this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0xf0f0f5, 1);

    // Draw Neon Cyan Border
    const frame = this.add.graphics();
    frame.lineStyle(6, 0x00ffff, 1);
    frame.strokeRect(
      centerX - panelWidth / 2,
      centerY - panelHeight / 2,
      panelWidth,
      panelHeight
    );

    // Title
    this.add
      .text(centerX, centerY - 200, ":: SYSTEM SETTINGS ::", {
        fontSize: "40px",
        color: "#333333",
        fontFamily: "Electrolize, Arial",
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#00FFFF",
          blur: 5,
          fill: true,
        },
      })
      .setOrigin(0.5);
  }

  private createVolumeSlider(centerX: number, y: number): void {
    // Label
    this.add
      .text(centerX - 250, y, "Master Volume:", {
        fontSize: "24px",
        color: "#333333",
      })
      .setOrigin(0, 0.5);

    // Volume Text (e.g., "50%")
    this.volumeText = this.add
      .text(centerX + 230, y, "", {
        fontSize: "24px",
        color: "#0000ff", // Blue text for value
      })
      .setOrigin(1, 0.5);

    // Graphical Slider Track
    const trackWidth = 300;
    const trackHeight = 10;
    const trackX = centerX - trackWidth / 2;

    // Background Track
    this.add.rectangle(centerX, y, trackWidth, trackHeight, 0x999999);

    // Foreground Bar (The current volume level)
    this.volumeSlider = this.add.graphics();

    // SLIDER INTERACTION AREA (Invisible area for drag input)
    const hitArea = this.add
      .zone(centerX, y, trackWidth + 20, 50)
      .setInteractive();

    // Drag/Click Handler
    hitArea.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        // Calculate new volume based on mouse position
        let newVolume = (pointer.x - trackX) / trackWidth;
        newVolume = Phaser.Math.Clamp(newVolume, 0, 1);

        this.masterVolume = Math.round(newVolume * 100) / 100; // Round to 2 decimals
        this.updateVolumeDisplay();
      }
    });
  }

  private updateVolumeDisplay(): void {
    const trackWidth = 300;
    const trackX = this.scale.width / 2 - trackWidth / 2;
    const y = this.scale.height / 2 - 100; // Same Y as track

    // Redraw the volume bar
    this.volumeSlider.clear();
    this.volumeSlider.fillStyle(0x0000ff, 1);
    this.volumeSlider.fillRect(
      trackX,
      y - 5,
      trackWidth * this.masterVolume,
      10
    );

    // Update the text percentage
    this.volumeText.setText(`${Math.round(this.masterVolume * 100)}%`);

    // You would apply this volume to the actual Phaser Audio Manager here:
    // this.sound.volume = this.masterVolume;
  }

  private createFullscreenToggle(centerX: number, y: number): void {
    // Label
    this.add
      .text(centerX - 250, y, "Toggle Fullscreen:", {
        fontSize: "24px",
        color: "#333333",
      })
      .setOrigin(0, 0.5);

    // Toggle Button Text (Displays state: ON/OFF)
    this.fullscreenToggleText = this.add
      .text(centerX, y, "OFF", {
        fontSize: "24px",
        color: "#FF0000",
        backgroundColor: "#AAAAAA",
        padding: { x: 20, y: 10 },
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.fullscreenToggleText.on("pointerdown", () => {
      this.updateFullscreenToggle(true);
    });
  }

  private updateFullscreenToggle(toggle: boolean): void {
    if (toggle) {
      this.isFullscreen = !this.isFullscreen;
      this.scale.toggleFullscreen(); // Actual Phaser API call
    }

    if (this.isFullscreen) {
      this.fullscreenToggleText.setText("ON");
      this.fullscreenToggleText.setColor("#00FF00"); // Green for ON
      this.fullscreenToggleText.setBackgroundColor("#000000");
    } else {
      this.fullscreenToggleText.setText("OFF");
      this.fullscreenToggleText.setColor("#FF0000"); // Red for OFF
      this.fullscreenToggleText.setBackgroundColor("#AAAAAA");
    }
  }

  private createActionButtons(
    centerX: number,
    y: number,
    callingSceneKey: string
  ): void {
    // Function to create a stylish button
    const createActionButton = (
      x: number,
      text: string,
      color: string,
      callback: () => void
    ) => {
      const button = this.add
        .text(x, y, text, {
          fontSize: "30px",
          color: "#FFFFFF",
          backgroundColor: color,
          padding: { x: 20, y: 10 },
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      button.on("pointerdown", callback);
      button.on("pointerover", () => button.setScale(1.05));
      button.on("pointerout", () => button.setScale(1.0));

      return button;
    };

    // --- 1. APPLY Button ---
    createActionButton(centerX - 100, "APPLY", "#008800", () => {
      // In a real game, save settings to local storage here
      console.log(
        `Settings applied: Volume ${this.masterVolume}, Fullscreen ${this.isFullscreen}`
      );
      this.exitScene(callingSceneKey);
    });

    // --- 2. BACK Button ---
    createActionButton(centerX + 100, "BACK", "#880000", () => {
      // Cancel changes and go back
      this.exitScene(callingSceneKey);
    });
  }

  private exitScene(callingSceneKey: string): void {
    // Stop the current Settings scene
    this.scene.stop();

    // Resume the scene we came from (GameScene or MainMenuScene)
    this.scene.resume(callingSceneKey);

    console.log(`Returned to ${callingSceneKey}`);
  }
}
