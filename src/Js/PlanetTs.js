import * as THREE from 'three';
import * as ThreeTsEngine from './ThreeTsEngine.js';
import * as UnitTest from './UnitTests.js';
import * as Heightmap from './HeightMap.js';
import { SimplexNoiseGenerator } from './NoiseGenerator.js';
export class PlanetTsEngine extends ThreeTsEngine.GraphicEngine {
    constructor() {
        super();
        const BasicNode = new BasicScenenode();
        //this.AttachSceneEntity(BasicNode);
        this.AttachSceneEntity(new LightSceneEntity());
        this.AttachSceneEntity(new TerrainSceneEntity());
        this.AttachSceneEntity(new UnitTest.MathUnitTest());
    }
    Render() {
        super.Render();
    }
}
const PLANEWIDTH = 500;
const PLANEHEIGHT = 500;
const PLANEXRES = 60;
const planeYRes = 60;
class TerrainChunk {
    mesh;
    planes;
    resolution; // resolution of the chunk
    centerWorld; // Center of the chunk in world coordinates
    dimensions; // Dimension of the chunk
    // Generate an enum of 6 resolutions
    constructor(resolution, centerWorld, dimensions) {
        this.resolution = resolution;
        this.centerWorld = centerWorld;
        this.dimensions = dimensions;
    }
    GeneratePlane() {
        let planeGeometry = new THREE.PlaneGeometry(this.dimensions.x, this.dimensions.y, this.resolution, this.resolution);
        let planeMaterial = new THREE.MeshStandardMaterial({ color: this.ResolutionToColor(this.resolution), side: THREE.FrontSide });
        let plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotateX(-Math.PI / 2);
        plane.position.set(this.centerWorld.x - this.dimensions.x, this.centerWorld.y - this.dimensions.y, this.centerWorld.z);
        return plane;
    }
    ResolutionToColor(resolution) {
        switch (resolution) {
            case 50:
                return 0xFFFFFF;
            case 100:
                return 0x00FF00;
            case 200:
                return 0x0000FF;
            case 400:
                return 0x00FFFF;
            case 800:
                return 0xFFFF00;
            case 16000:
                return 0xFF00FF;
            default:
                return 0xFF0000;
        }
    }
}
class QuadTreeChunk {
    constructor() {
    }
}
class TerrainChunkManager {
    // keep track of the current wolrd position
    cachedPosition;
    initialFaceDimension;
    constructor(initialFaceDimension) {
        this.cachedPosition = new THREE.Vector3(0, 0, 0);
        this.initialFaceDimension = initialFaceDimension;
    }
    Update(engine, worldPosition) {
        // Compute the chunk that contains the world position
        let chunk = this.ComputeChunk(worldPosition);
        // Generate the chunk if needed
        this.GenerateChunk(engine, chunk);
        // Remove the chunks that are too far
        this.RemoveFarChunks(engine, chunk);
    }
    ComputeChunk(worldPosition) {
        // If the cache world position didn't change, return no changes
        if (this.cachedPosition.equals(worldPosition)) {
            return null;
        }
        // Compute the chunk that contains the world position        
        return null;
    }
    GenerateChunk(engine, chunk) {
        throw new Error('Method not implemented.');
    }
    RemoveFarChunks(engine, chunk) {
        throw new Error('Method not implemented.');
    }
}
class TerrainSceneEntity extends ThreeTsEngine.SceneEntity {
    mesh;
    planes;
    heightMap;
    heightGenerators;
    constructor() {
        super("Terrain");
        this.planes = [];
        this.planes[0] = this.CreatePlane(0xFF0000);
        this.planes[0].rotateX(Math.PI / 2);
        this.planes[0].position.set(0, -250, 0);
        this.planes[1] = this.CreatePlane(0xFFFFFF);
        this.planes[1].rotateX(-Math.PI / 2);
        this.planes[1].position.set(0, 250, 0);
        this.planes[2] = this.CreatePlane(0x0000FF);
        this.planes[2].rotateY(Math.PI / 2);
        this.planes[2].position.set(250, 0, 0);
        this.planes[3] = this.CreatePlane(0x00FFFF);
        this.planes[3].rotateY(-Math.PI / 2);
        this.planes[3].position.set(-250, 0, 0);
        this.planes[4] = this.CreatePlane(0xFFFF00);
        this.planes[4].position.set(0, 0, 250);
        this.planes[5] = this.CreatePlane(0xFF00FF);
        this.planes[5].rotateY(Math.PI);
        this.planes[5].position.set(0, 0, -250);
    }
    CreatePlane(planeColor) {
        let planeGeometry = new THREE.PlaneGeometry(PLANEWIDTH, PLANEHEIGHT, PLANEXRES, planeYRes);
        let planeMaterial = new THREE.MeshStandardMaterial({ color: planeColor, side: THREE.FrontSide });
        let plane = new THREE.Mesh(planeGeometry, planeMaterial);
        return plane;
    }
    ApplyHeightMapToPlane(plane, heightGenerator) {
        // Let's iterate over the vertices and apply a height map to them
        let vMin = new THREE.Vector3(PLANEWIDTH / 2, PLANEHEIGHT / 2);
        let vMax = new THREE.Vector3(-PLANEWIDTH / 2, -PLANEHEIGHT / 2);
        let positionAttribute = plane.geometry.getAttribute('position');
        for (let i = 0; i < positionAttribute.count; i++) {
            let v = new THREE.Vector3();
            v.fromBufferAttribute(positionAttribute, i);
            vMin.min(v);
            vMax.max(v);
        }
        let vRange = new THREE.Vector2(vMax.x - vMin.x, vMax.y - vMin.y);
        for (let i = 0; i < positionAttribute.count; i++) {
            let v = new THREE.Vector3();
            v.fromBufferAttribute(positionAttribute, i);
            let vector2Normalized = new THREE.Vector2((v.x - vMin.x) / vRange.x, (v.y - vMin.y) / vRange.y);
            let height = heightGenerator.GeHeightFromNCoord(v.x, v.y);
            v.z = height;
            positionAttribute.setXYZ(i, v.x, v.y, v.z);
            // console.log("Vertex : v.x: " + v.x + " v.y: " + v.y + " v.z: " + v.z)
        }
        positionAttribute.needsUpdate = true;
        plane.geometry.computeVertexNormals();
    }
    Attach() {
        // add each plane
        this.planes.forEach(plane => {
            this.Engine.AddObject3DToScene(plane);
        });
        this.heightMap = new Heightmap.HeightMap(this.Engine, "./resources/043-ue4-heightmap-guide-02.jpg", (heightMap) => {
            this.Rebuild();
        });
        // wireframe
        this.Engine.GuiParams.General = { "Wireframe": false };
        this.Engine.Gui.__folders["General"].add(this.Engine.GuiParams.General, 'Wireframe').onChange((value) => {
            this.planes.forEach(plane => {
                // cast material to MeshStandardMaterial
                let material = plane.material;
                material.wireframe = value;
                material.needsUpdate = true;
            });
        });
        // Noise parameters
        this.Engine.GuiParams.Noise = { "scale": 215.0,
            "octaves": 7,
            "persistence": 0.91,
            "lacunarity": 1.9,
            "exponentiation": 4.2,
            "height": 70.7 };
        this.Engine.Gui.addFolder("Noise");
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'scale', 64.0, 4096.0).onChange((value) => {
            this.Rebuild();
        });
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'octaves', 1, 20, 1).onChange((value) => {
            this.Rebuild();
        });
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'persistence', 0.01, 1.0).onChange((value) => {
            this.Rebuild();
        });
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'lacunarity', 0.01, 4.0).onChange((value) => {
            this.Rebuild();
        });
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'exponentiation', 0.1, 10.0).onChange((value) => {
            this.Rebuild();
        });
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'height', 0, 1000).onChange((value) => {
            this.Rebuild();
        });
        // Create a new dictionary of IHeightGenerator
        this.heightGenerators = {
            "heightmap": new Heightmap.HeightMap(this.Engine, "./resources/043-ue4-heightmap-guide-02.jpg", (heightMap) => {
                // do something with the heightmap
            }),
            "simplex": new SimplexNoiseGenerator(this.Engine.GuiParams)
        };
    }
    Rebuild() {
        this.planes.forEach(plane => {
            this.ApplyHeightMapToPlane(plane, this.heightGenerators["simplex"]);
        });
    }
    Detach() {
        // remove each plane
        this.planes.forEach(plane => {
            this.Engine.RemoveObject3DFromScene(plane);
        });
    }
    Update() {
    }
}
class LightSceneEntity extends ThreeTsEngine.SceneEntity {
    directionalLight;
    ambientLight;
    constructor() {
        super("Light");
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.directionalLight.position.set(1000, 1000, 0);
        this.ambientLight = new THREE.AmbientLight(0x404040);
    }
    Attach() {
        this.Engine.AddObject3DToScene(this.directionalLight);
        this.Engine.AddObject3DToScene(this.ambientLight);
    }
    Detach() {
        this.Engine.RemoveObject3DFromScene(this.directionalLight);
        this.Engine.RemoveObject3DFromScene(this.ambientLight);
    }
    Update() {
    }
}
class BasicScenenode extends ThreeTsEngine.SceneEntity {
    mesh;
    constructor() {
        super("basicNode");
        const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
        const material = new THREE.MeshBasicMaterial({ color: 0xFF6347, wireframe: true });
        this.mesh = new THREE.Mesh(geometry, material);
    }
    Attach() {
        this.Engine.AddObject3DToScene(this.mesh);
    }
    Detach() {
        this.Engine.RemoveObject3DFromScene(this.mesh);
    }
    Update() {
        this.mesh.rotation.x += 0.01;
        this.mesh.rotation.y += 0.005;
    }
}
//# sourceMappingURL=PlanetTs.js.map