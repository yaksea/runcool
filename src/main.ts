import './style.css';
import Phaser from 'phaser';
import { CloudSync } from './systems/CloudSync';
import { gameConfig } from './game/config';

// Resolve Y8 auth / cloud save before scenes read profiles.
CloudSync.init();

new Phaser.Game(gameConfig);
