import * as ThreeTsEngine from './ThreeTsEngine.js'
import * as Math from './MathHelper.js'
import * as PlanetTs from './PlanetTs.js'
import * as THREE from 'three';

export class UniTests extends ThreeTsEngine.SceneEntity {
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

    private TestHeightMap() : void {
        
    }

    private TestQuadTree() : void { 
        // Create an initial chunk
        let chunk = new PlanetTs.TerrainChunk(  PlanetTs.TerrainResolution.RES_50, 
                                                new THREE.Vector3(250,250,100),
                                                new THREE.Vector2(500,500));
        // Create a quad tree
        let quadTreeNode = new PlanetTs.QuadTreeChunkNode(chunk);
    }


    private Verify (condition : boolean, message : string = "") : void {
        if (!condition) {
            console.error("Failed!:", message);
        }
    }           
}