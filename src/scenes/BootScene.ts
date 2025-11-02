type SpriteSheetConfig = {
  key: string; // unique key for Phaser
  path: string; // path to the image
  frameWidth: number;
  frameHeight: number;
  anim?: {
    // optional animation info
    key: string; // animation key
    frameRate: number;
    repeat: number;
  };
};

type AudioConfig = {
  key: string;
  path: string | string[]; // can be single file or array (mp3, ogg)
  loop?: boolean;
  volume?: number;
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    this.createLoadingUI();
    this.loadSpriteSheets();
    this.loadImages();
    this.loadAudio(); // <-- load audio here

    this.load.on("filecomplete", (key: string) =>
      console.log(`Loaded: ${key}`)
    );
    this.load.on("loaderror", (file: any) =>
      console.error("Failed to load file:", file)
    );
  }

  private createLoadingUI() {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2 - 50, "LOADING...", {
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2, 320, 50);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 30);
    });
  }

  private loadAudio() {
    const audios: AudioConfig[] = [
      { key: "bg_music", path: "audio/quiet.wav", loop: true, volume: 0.5 },
      {
        key: "player_attack_sfx",
        path: "audio/combat.wav",
      },
      { key: "player_power_sfx", path: "audio/powerup.wav" },
      { key: "player_death_sfx", path: "audio/death.wav" },
      {
        key: "enemy_hit_sfx",
        path: "audio/bullet.wav",
      },
    ];

    audios.forEach((audio) => {
      this.load.audio(audio.key, audio.path);
    });
  }

  private loadSpriteSheets() {
    const sheets: SpriteSheetConfig[] = [
      // Player animations (each as a separate sheet)
      {
        key: "player_idle",
        path: "images/player_idle.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player_idle", frameRate: 8, repeat: -1 },
      },
      {
        key: "player_run",
        path: "images/player_run.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player_run", frameRate: 12, repeat: -1 },
      },
      {
        key: "player_attack",
        path: "images/player_attack.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player_attack", frameRate: 12, repeat: 0 },
      },
      {
        key: "player_fire",
        path: "images/fx_fireball.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player_attack", frameRate: 12, repeat: 0 },
      },
      {
        key: "player_dead",
        path: "images/player_dead.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player_attack", frameRate: 8, repeat: -1 },
      },

      // Player1 animations
      {
        key: "player1_idle",
        path: "images/player1_idle.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player1_idle", frameRate: 8, repeat: 0 },
      },
      {
        key: "player1_run",
        path: "images/player1_run.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player1_run", frameRate: 12, repeat: -1 },
      },
      {
        key: "player1_attack",
        path: "images/player1_attack.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player1_attack", frameRate: 12, repeat: 0 },
      },
      {
        key: "player1_fire",
        path: "images/player_fire.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player_fire", frameRate: 12, repeat: 0 },
      },
      {
        key: "player1_dead",
        path: "images/player_dead.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player_dead", frameRate: 8, repeat: -1 },
      },

      // Player1 animations
      {
        key: "player2_idle",
        path: "images/player2_idle.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player2_idle", frameRate: 8, repeat: 0 },
      },
      {
        key: "player2_run",
        path: "images/player2_run.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player2_run", frameRate: 12, repeat: -1 },
      },
      {
        key: "player2_attack",
        path: "images/player2_attack.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player2_attack", frameRate: 12, repeat: 0 },
      },
      {
        key: "player2_fire",
        path: "images/player2_fire.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player2_fire", frameRate: 12, repeat: 0 },
      },
      {
        key: "player2_dead",
        path: "images/player2_dead.png",
        frameWidth: 64,
        frameHeight: 64,
        anim: { key: "player2_dead", frameRate: 8, repeat: -1 },
      },
    ];

    sheets.forEach((sheet) => {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    });

    this.load.once("complete", () => {
      sheets.forEach((sheet) => {
        if (sheet.anim && this.textures.exists(sheet.key)) {
          const totalFrames = this.textures
            .get(sheet.key)
            .getFrameNames().length;
          this.anims.create({
            key: sheet.anim.key,
            frames: this.anims.generateFrameNumbers(sheet.key, {
              start: 0,
              end: totalFrames - 1,
            }),
            frameRate: sheet.anim.frameRate,
            repeat: sheet.anim.repeat,
          });
        }
      });
    });
  }

  private loadImages() {
    const images = [
      { key: "background", path: "images/arena_bg.png" },
      { key: "background1", path: "images/bg1.png" },
      { key: "background2", path: "images/bg2.png" },
      // { key: "ui_bar_frame", path: "images/fx_fireball.png" },
      { key: "hit_particle", path: "images/fx_fireball.png" },
    ];

    images.forEach((img) => this.load.image(img.key, img.path));
  }

  create(): void {
    console.log("All textures loaded!");
    this.scene.start("MenuScene");
  }
}
