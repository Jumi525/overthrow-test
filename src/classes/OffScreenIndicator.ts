import Phaser from "phaser";

/**
 * OffScreenIndicator
 * -------------------
 * Displays an on-screen arrow or icon pointing toward a target sprite
 * when that target is outside the camera's visible area.
 *
 * This class is autonomous — it registers itself to the scene's update loop
 * and manages its own visibility, positioning, and cleanup.
 */
export class OffScreenIndicator extends Phaser.GameObjects.Image {
  private target: Phaser.GameObjects.Sprite;
  private margin: number;
  private color: number;
  private scaleFactor: number;
  private isVisible: boolean = false;

  constructor(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.Sprite,
    texture: string,
    options?: {
      margin?: number;
      color?: number;
      scale?: number;
    }
  ) {
    super(scene, 0, 0, texture);

    this.target = target;
    this.margin = options?.margin ?? 30;
    this.color = options?.color ?? 0xffff00;
    this.scaleFactor = options?.scale ?? 1.5;

    // Initial setup
    this.setDepth(1000);
    this.setScrollFactor(0);
    this.setScale(this.scaleFactor);
    this.setTint(this.color);
    this.setVisible(false);

    scene.add.existing(this);

    // ✅ Hook into scene’s update loop automatically
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.handleUpdate, this);

    // ✅ Clean up automatically when scene shuts down
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /**
   * Handles position + rotation updates every frame.
   * Only runs while target exists.
   */
  private handleUpdate(): void {
    if (!this.target.active || !this.scene.cameras?.main) {
      this.destroy();
      return;
    }

    const camera = this.scene.cameras.main;

    // Check if target is on-screen
    const inView = camera.worldView.contains(this.target.x, this.target.y);

    this.setVisible(!inView);

    if (inView) return; // Don’t waste cycles if target is visible

    const angle = Phaser.Math.Angle.Between(
      camera.worldView.centerX,
      camera.worldView.centerY,
      this.target.x,
      this.target.y
    );

    this.rotation = angle + Math.PI / 2;

    const indicatorVector = new Phaser.Math.Vector2(
      Math.cos(angle),
      Math.sin(angle)
    );

    let indicatorX =
      camera.width / 2 + indicatorVector.x * (camera.width / 2 - this.margin);
    let indicatorY =
      camera.height / 2 + indicatorVector.y * (camera.height / 2 - this.margin);

    // Clamp to screen edges
    indicatorX = Phaser.Math.Clamp(
      indicatorX,
      this.margin,
      camera.width - this.margin
    );
    indicatorY = Phaser.Math.Clamp(
      indicatorY,
      this.margin,
      camera.height - this.margin
    );

    this.setPosition(indicatorX, indicatorY);
  }

  /**
   * Optional manual destroy (auto-registered cleanup included).
   */
  public override destroy(fromScene?: boolean): void {
    this.scene?.events?.off(
      Phaser.Scenes.Events.UPDATE,
      this.handleUpdate,
      this
    );
    super.destroy(fromScene);
  }
}
