import * as ThreeTsEngine from './ThreeTsEngine.js';
import * as Math from './MathHelper.js';
export class UniTests extends ThreeTsEngine.SceneEntity {
    runTests = true;
    constructor() {
        super("UnitTest");
    }
    Attach() {
    }
    Detach() {
    }
    Update() {
        if (this.runTests) {
            this.DoPerformTest();
            this.runTests = false;
        }
    }
    DoPerformTest() {
        this.TestLerp();
        this.TestBilinearInterpolation();
        this.TestQuadTree();
    }
    // Verify that the Lerp function works
    TestLerp() {
        let result = Math.Lerp(2.0, 4.0, 0.5);
        // Verify the result is the expected value
        this.Verify(result == 3.0, "Failed to Lerp 2.0 and 4.0 at 0.5");
    }
    TestBilinearInterpolation() {
        let result = Math.DoBilinearInterpolation(2.0, 6.0, 7.0, 9.0, 0.5, 0.5);
        this.Verify(result == 6.0, "result == 6.0");
    }
    TestHeightMap() {
    }
    TestQuadTree() {
        // Create an initial chunk
        // let chunk = new PlanetTs.TerrainChunk(  PlanetTs.TerrainResolution.RES_50, 
        //                                         new THREE.Vector3(250,250,100),
        //                                         new THREE.Vector3(500,0,500), null);
        // Create a quad tree
        //  let quadTreeNode = new PlanetTs.QuadTreeChunkNode(chunk);
    }
    Verify(condition, message = "") {
        if (!condition) {
            console.error("Failed!:", message);
        }
    }
}
//# sourceMappingURL=UnitTests.js.map