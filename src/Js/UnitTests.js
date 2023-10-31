"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniTests = void 0;
const ThreeTsEngine = __importStar(require("./ThreeTsEngine.js"));
const Math = __importStar(require("./MathHelper.js"));
const PlanetTs = __importStar(require("./PlanetTs.js"));
const THREE = __importStar(require("three"));
class UniTests extends ThreeTsEngine.SceneEntity {
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
        let chunk = new PlanetTs.TerrainChunk(PlanetTs.TerrainResolution.RES_50, new THREE.Vector3(250, 250, 100), new THREE.Vector2(500, 500));
        // Create a quad tree
        let quadTreeNode = new PlanetTs.QuadTreeChunkNode(chunk);
    }
    Verify(condition, message = "") {
        if (!condition) {
            console.error("Failed!:", message);
        }
    }
}
exports.UniTests = UniTests;
//# sourceMappingURL=UnitTests.js.map