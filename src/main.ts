import * as THREE from 'three';
import * as PlanetTs from './PlanetTs.js'

const graphicEngine = new PlanetTs.PlanetTsEngine();

function gameloop() {
    requestAnimationFrame(gameloop)
    graphicEngine.Render();
}

gameloop();
