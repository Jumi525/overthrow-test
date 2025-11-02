import Phaser from "phaser";
import { GAME_CONFIG } from "./config";
// import BootScene from "./game/scenes/BootScene";
// import GameScene from "./game/scenes/GameScene";
// import UIScene from "./game/scenes/UIScene";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { SettingsScene } from "./scenes/SettingsScene";
import { MainMenuScene } from "./scenes/MainMenuScene";

// GAME_CONFIG.scene = [BootScene, GameScene, UIScene];
GAME_CONFIG.scene = [
  BootScene,
  MenuScene,
  GameScene,
  UIScene,
  GameOverScene,
  SettingsScene,
  MainMenuScene,
];
new Phaser.Game(GAME_CONFIG);
