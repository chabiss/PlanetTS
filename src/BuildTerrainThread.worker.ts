import { SimplexNoiseGenerator } from './NoiseGenerator.js';
import { HyposemetricTints } from './ColorGenerator.js';

self.onmessage = (m : any) => {

    class TerrainBuildGeometryworker {
        private heightGenerator : SimplexNoiseGenerator;
        private hyposemetricTints : HyposemetricTints;
    
        constructor() {
        }
    
        Init(params : any) {
            console.log("Init");
            //this.heightGenerator = new SimplexNoiseGenerator(params.Noise);
            //this.hyposemetricTints = new HyposemetricTints(new SimplexNoiseGenerator(params.TerrainTintNoise));
        }
    }

    // const terrainBuildGeometryworker = new TerrainBuildGeometryworker();
    let simplex = new SimplexNoiseGenerator(m.data.data);

    if(m.data.message == "Build_Geometry") {
        // terrainBuildGeometryworker.Init(m.data.data);
        console.log("received message from main thread", m.data);
        let time = Math.floor(Math.random() * 10000);
        // wait 4 seconds
        setTimeout(() => {
        self.postMessage("Done in " + time + " ms");
        }, time);
    }
}
export { };