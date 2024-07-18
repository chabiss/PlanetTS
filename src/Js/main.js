import * as PlanetTs from './PlanetTs.js';
//import Worker from 'worker-loader!./BuildTerrainThread.worker.ts';
//const worker = new Worker();
const graphicEngine = new PlanetTs.PlanetTsEngine();
function gameloop() {
    requestAnimationFrame(gameloop);
    graphicEngine.Render();
}
gameloop();
//# sourceMappingURL=main.js.map