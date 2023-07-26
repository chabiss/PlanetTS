import * as ThreeTsEngine from './ThreeTsEngine.js';
import * as Math from './MathHelper.js';
export class MathUnitTest extends ThreeTsEngine.SceneEntity {
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
    Verify(condition, message = "") {
        if (!condition) {
            console.error("Failed!:", message);
        }
    }
}
//# sourceMappingURL=UnitTests.js.map