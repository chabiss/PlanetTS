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
exports.QuadTreeChunkNode = exports.TraverseContext = exports.TraverseContextMode = exports.TerrainChunk = exports.TerrainResolution = exports.PlanetTsEngine = void 0;
const THREE = __importStar(require("three"));
const ThreeTsEngine = __importStar(require("./ThreeTsEngine.js"));
const UnitTest = __importStar(require("./UnitTests.js"));
const Heightmap = __importStar(require("./HeightMap.js"));
const NoiseGenerator_js_1 = require("./NoiseGenerator.js");
class PlanetTsEngine extends ThreeTsEngine.GraphicEngine {
    constructor() {
        super();
        const BasicNode = new BasicScenenode();
        //this.AttachSceneEntity(BasicNode);
        this.AttachSceneEntity(new LightSceneEntity());
        this.AttachSceneEntity(new TerrainSceneEntity());
        this.AttachSceneEntity(new UnitTest.UniTests());
    }
    Render() {
        super.Render();
    }
}
exports.PlanetTsEngine = PlanetTsEngine;
const PLANEWIDTH = 500;
const PLANEHEIGHT = 500;
const PLANEXRES = 60;
const planeYRes = 60;
var TerrainResolution;
(function (TerrainResolution) {
    TerrainResolution[TerrainResolution["RES_50"] = 50] = "RES_50";
    TerrainResolution[TerrainResolution["RES_100"] = 100] = "RES_100";
    TerrainResolution[TerrainResolution["RES_200"] = 200] = "RES_200";
    TerrainResolution[TerrainResolution["RES_400"] = 400] = "RES_400";
    TerrainResolution[TerrainResolution["RES_800"] = 800] = "RES_800";
    TerrainResolution[TerrainResolution["RES_1600"] = 1600] = "RES_1600";
})(TerrainResolution || (exports.TerrainResolution = TerrainResolution = {}));
;
class TerrainChunk {
    plane;
    resolution; // resolution of the chunk
    centerWorld; // Center of the chunk in world coordinates
    dimensions; // Dimension of the chunk
    // Generate an enum of 6 resolutions
    constructor(resolution, centerWorld, dimensions) {
        this.resolution = resolution;
        this.centerWorld = centerWorld;
        this.dimensions = dimensions;
    }
    EnsurePlane() {
        // If we already have a plane, return null to prevent generating a new one
        if (this.plane == null) {
            let planeGeometry = new THREE.PlaneGeometry(this.dimensions.x, this.dimensions.y, this.resolution, this.resolution);
            let planeMaterial = new THREE.MeshStandardMaterial({ color: this.ResolutionToColor(this.resolution), side: THREE.FrontSide });
            let plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotateX(-Math.PI / 2);
            plane.position.set(this.centerWorld.x - this.dimensions.x, this.centerWorld.y - this.dimensions.y, this.centerWorld.z);
            this.plane = plane;
        }
        return this.plane;
    }
    RemovePlane() {
        let plane = this.plane;
        this.plane = null;
        return plane;
    }
    get Plane() { return this.plane; }
    ;
    get Resolution() { return this.resolution; }
    ;
    get CenterWorld() { return this.centerWorld; }
    ;
    get Dimensions() { return this.dimensions; }
    ;
    get Diagonal() { return this.dimensions.length(); }
    ;
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
            case 1600:
                return 0xFF00FF;
            default:
                return 0xFF0000;
        }
    }
}
exports.TerrainChunk = TerrainChunk;
var TraverseContextMode;
(function (TraverseContextMode) {
    TraverseContextMode[TraverseContextMode["ADD"] = 0] = "ADD";
    TraverseContextMode[TraverseContextMode["REMOVE"] = 1] = "REMOVE";
})(TraverseContextMode || (exports.TraverseContextMode = TraverseContextMode = {}));
class TraverseContext {
    addedChunks;
    removedChunks;
    position;
    mode;
    constructor(position, mode = TraverseContextMode.ADD) {
        this.addedChunks = [];
        this.removedChunks = [];
        this.position = position;
        this.mode = mode;
    }
    AddChunk(chunk) {
        if (chunk.Plane != null) {
            return;
        }
        this.addedChunks.push(chunk);
    }
    RemoveChunk(chunk) {
        if (chunk.Plane == null) {
            return;
        }
        this.removedChunks.push(chunk);
    }
    get AddedChunks() { return this.addedChunks; }
    ;
    get RemovedChunks() { return this.removedChunks; }
    ;
    set Mode(mode) { this.mode = mode; }
    ;
    get Position() { return this.position; }
    ;
}
exports.TraverseContext = TraverseContext;
class QuadTreeChunkNode {
    chunk;
    children;
    constructor(chunk) {
        this.chunk = chunk;
    }
    // getting for the chunk
    get Chunk() { return this.chunk; }
    ;
    get Children() { return this.children; }
    ;
    // Generate the children of the node
    EnsureChildren() {
        // If children are already generated, return
        if (this.children != null) {
            return;
        }
        // Compute the dimension of the children
        let childDimension = new THREE.Vector2(this.chunk.Dimensions.x / 2, this.chunk.Dimensions.y / 2);
        // Create the children
        this.children = [];
        // Compute the center of the children 
        // Bottom left
        let childCenter = new THREE.Vector3(this.chunk.CenterWorld.x - childDimension.x / 2, this.chunk.CenterWorld.y - this.chunk.Dimensions.y / 2, this.chunk.CenterWorld.z);
        this.children.push(new QuadTreeChunkNode(new TerrainChunk(this.chunk.Resolution * 2, childCenter, childDimension)));
        // Bottom right
        childCenter = new THREE.Vector3(this.chunk.CenterWorld.x + this.chunk.Dimensions.x / 2, this.chunk.CenterWorld.y - this.chunk.Dimensions.y / 2, this.chunk.CenterWorld.z);
        this.children.push(new QuadTreeChunkNode(new TerrainChunk(this.chunk.Resolution * 2, childCenter, childDimension)));
        // Top Right
        childCenter = new THREE.Vector3(this.chunk.CenterWorld.x + this.chunk.Dimensions.x / 2, this.chunk.CenterWorld.y + this.chunk.Dimensions.y / 2, this.chunk.CenterWorld.z);
        this.children.push(new QuadTreeChunkNode(new TerrainChunk(this.chunk.Resolution * 2, childCenter, childDimension)));
        // Top left
        childCenter = new THREE.Vector3(this.chunk.CenterWorld.x - this.chunk.Dimensions.x / 2, this.chunk.CenterWorld.y + this.chunk.Dimensions.y / 2, this.chunk.CenterWorld.z);
        this.children.push(new QuadTreeChunkNode(new TerrainChunk(this.chunk.Resolution * 2, childCenter, childDimension)));
    }
    DistanceTo(position) {
        return this.chunk.CenterWorld.distanceTo(position);
    }
    Traverse(context) {
        let modeForChildren = context.Mode;
        if (context.Mode == TraverseContextMode.ADD) {
            // check the distance to the center of the chunk with context.Position
            let distance = this.DistanceTo(context.Position);
            // If the distance is greater than the diagonal of the chunk, or if we're in remove mode, we can remove the chunk
            if (distance > this.chunk.Diagonal) {
                modeForChildren = TraverseContextMode.REMOVE;
                context.AddChunk(this.chunk);
            }
            else {
                // If we're inside the diagonal, ensure the children and traverse them
                this.EnsureChildren();
                // Outer plan will not be visible as we will recures into the children     
                context.RemoveChunk(this.chunk);
            }
        }
        else {
            // If we're in remove mode, we can remove the chunk
            context.RemoveChunk(this.chunk);
        }
        if (this.children != null) {
            context.Mode = modeForChildren;
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].Traverse(context);
            }
        }
        if (modeForChildren == TraverseContextMode.REMOVE) {
            // remove the children 
            this.children = null;
        }
    }
}
exports.QuadTreeChunkNode = QuadTreeChunkNode;
class TerrainChunkManager {
    // keep track of the current wolrd position
    cachedPosition;
    initialFaceDimension;
    // Create the 6 QuadTreeChunk and Nodes for each of the faces
    quadTreeChunkNodes;
    constructor(initialFaceDimension) {
        this.cachedPosition = new THREE.Vector3(0, 0, 0);
        this.initialFaceDimension = initialFaceDimension;
        // Create the 6 QuadTreeChunk and Nodes for each of the faces
        // Top Node 
        let chunkNode = new QuadTreeChunkNode(new TerrainChunk(TerrainResolution.RES_50, new THREE.Vector3(250, 250, 100), new THREE.Vector2(500, 500)));
        this.quadTreeChunkNodes.push(chunkNode);
    }
    Update(engine, worldPosition) {
        // This method will walk the quadtree and generate the chunks that are needed
        // Algorigthm goes like this:
        // 1. Start at the root, walk the children of the quadtree and calculate the distance from worldPosition to each of the children center point
        // 2. For each children visited, ensure their terain chunk is the list of visited chunks
        // 3. For the other visited nodes, make sure that all descendants are removed from the list of visited chunks
        // 4. For the visited child node with the smallest distance, remove his chunk from visited chunks, and ensure the children node are visited
        // 5. Recurse into the children node with the smallest distance
        // Create a new TraverseContext
        let context = new TraverseContext(worldPosition);
        // Go through each of the quadTreeChunkNodes and traverse them
        this.quadTreeChunkNodes.forEach(chunkNode => {
            chunkNode.Traverse(context);
        });
        // For each chunk in the context, ensure the plane is generated and add it to the scene
        context.AddedChunks.forEach(chunk => {
            let plane = chunk.EnsurePlane();
            if (plane != null) {
                engine.AddObject3DToScene(plane);
            }
        });
        // For each removed chunk, remove it from the scene and remove the plane
        context.RemovedChunks.forEach(chunk => {
            let plane = chunk.RemovePlane();
            if (plane != null) {
                engine.RemoveObject3DFromScene(plane);
            }
        });
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
            "simplex": new NoiseGenerator_js_1.SimplexNoiseGenerator(this.Engine.GuiParams)
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