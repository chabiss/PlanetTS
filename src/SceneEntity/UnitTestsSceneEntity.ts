import * as Math from '../MathHelper.ts'
import * as WTM from '../WorkerThreadsManager.ts';
import { SceneEntity } from './SceneEntity.ts';

export class UniTests extends SceneEntity {
    private runTests : boolean = true;

    constructor(){
        super("UnitTest");
    }
    Attach(): void {
        
    }
    Detach(): void {
        
    }
    Update(): void {
        if (this.runTests){
            this.DoPerformTest();
            this.runTests = false;
        }
    }

    private DoPerformTest() {
        this.TestLerp();
        this.TestBilinearInterpolation();
        this.TestQuadTree();
        this.TestWorkerThreadsManager();
    }

    // Verify that the Lerp function works
    private TestLerp() : void {
        let result = Math.Lerp(2.0, 4.0, 0.5);
        // Verify the result is the expected value
        this.Verify(result == 3.0, "Failed to Lerp 2.0 and 4.0 at 0.5");
    }

    private TestBilinearInterpolation() : void {
        let result = Math.DoBilinearInterpolation(2.0, 6.0, 7.0, 9.0, 0.5, 0.5);
        this.Verify(result == 6.0, "result == 6.0");
    }

    // @ts-ignore                               
    private TestHeightMap() : void {
        
    }

    private TestQuadTree() : void { 
       // Create an initial chunk
       // let chunk = new PlanetTs.TerrainChunk(  PlanetTs.TerrainResolution.RES_50, 
       //                                         new THREE.Vector3(250,250,100),
       //                                         new THREE.Vector3(500,0,500), null);
       // Create a quad tree
       //  let quadTreeNode = new PlanetTs.QuadTreeChunkNode(chunk);
    }

    private TestWorkerThreadsManager() : void {
        let workerThreadsManager = new WTM.WorkerThreadsManager("./BuildTerrainThread.worker.ts", 4, (data: any) => {
                console.log("Received message from worker", data);
            });

        let mockData = { 
                        Resolution : 0, 
                        Radius : 10000, 
                        CenterLocal : { x: 0, y: 0, z: 0 }, 
                        Size : { x: 10000, y: 10000 },
                        Debug: {},
                        Noise: { scale: 1100, octaves: 6, persistence: 0.71, lacunarity: 1.8, exponentiation: 4.5, height: 300 },
                        TerrainTintNoise: { scale: 1100, octaves: 6, persistence: 0.71, lacunarity: 1.8, exponentiation: 4.5, height: 300 },
                    }; 
                
        
        workerThreadsManager.Schedule({ message: "Build_Geometry", data: mockData});
        workerThreadsManager.Schedule({ message: "Build_Geometry", data: mockData});
        workerThreadsManager.Schedule({ message: "Build_Geometry", data: mockData});
        workerThreadsManager.Schedule({ message: "Build_Geometry", data: mockData});
        try {
            workerThreadsManager.Schedule({ message: "Build_Geometry", data: mockData});
        } catch (e) {
            console.log("Caught exception", e);
        }
    }

    private Verify (condition : boolean, message : string = "") : void {
        if (!condition) {
            console.error("Failed!:", message);
        }
    }           
}