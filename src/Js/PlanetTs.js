import * as THREE from 'three';
import * as ThreeTsEngine from './ThreeTsEngine.js';
import * as UnitTest from './UnitTests.js';
import * as Heightmap from './HeightMap.js';
import { SimplexNoiseGenerator } from './NoiseGenerator.js';
import { HyposemetricTints } from './ColorGenerator.js';
export class PlanetTsEngine extends ThreeTsEngine.GraphicEngine {
    constructor() {
        super();
        const BasicNode = new BasicScenenode();
        this.AttachSceneEntity(BasicNode);
        this.AttachSceneEntity(new LightSceneEntity());
        this.AttachSceneEntity(new TerrainSceneEntity());
        this.AttachSceneEntity(new UnitTest.UniTests());
    }
    Render() {
        super.Render();
    }
}
export var TerrainResolution;
(function (TerrainResolution) {
    TerrainResolution[TerrainResolution["RES_50"] = 10] = "RES_50";
    TerrainResolution[TerrainResolution["RES_100"] = 20] = "RES_100";
    TerrainResolution[TerrainResolution["RES_200"] = 40] = "RES_200";
    TerrainResolution[TerrainResolution["RES_400"] = 80] = "RES_400";
    TerrainResolution[TerrainResolution["RES_800"] = 160] = "RES_800";
    TerrainResolution[TerrainResolution["RES_1600"] = 320] = "RES_1600";
})(TerrainResolution || (TerrainResolution = {}));
;
const PLANEWIDTH = 500;
const PLANEHEIGHT = 500;
const PLANEXRES = 60;
const planeYRes = 60;
const PLANET_RADIUS = 2000;
const TERRAIN_CHUNK_DIMENSION = 2000;
const TERRAIN_MAX_RESOLUTION = TerrainResolution.RES_800;
export class TerrainChunk {
    plane;
    geometry;
    resolution; // resolution of the chunk
    centerLocal; // Center of the chunk in local coordinates
    centerWorld; // Center of the chunk in world coordinates
    dimensions; // Dimension of the chunk
    bounds; // Bounds of the chunk
    localToWorld; // Local to world matrix
    // Generate an enum of 6 resolutions
    constructor(resolution, bounds) {
        this.resolution = resolution;
        this.bounds = bounds;
        this.centerLocal = bounds.getCenter(new THREE.Vector3());
        this.dimensions = bounds.getSize(new THREE.Vector3());
    }
    EnsureCenterWorld(localToWorld, radius) {
        this.centerWorld = this.centerLocal.clone();
        this.centerWorld.applyMatrix4(localToWorld);
        this.centerWorld.normalize();
        this.centerWorld.multiplyScalar(radius);
    }
    EnsurePlane(manager, localToWorld) {
        let planeMaterial = new THREE.MeshStandardMaterial({ side: THREE.FrontSide, wireframe: manager.Engine.GuiParams.General.Wireframe, vertexColors: true, });
        if (this.plane == null) {
            this.CreatePlane(planeMaterial);
            let gen = this.Rebuild(manager, localToWorld);
            return gen;
        }
        return null;
    }
    RemovePlane() {
        let plane = this.plane;
        this.plane = null;
        return plane;
    }
    Rebuild(manager, localToWorld, buildMeshSynchronously = true) {
        let iterator = this.BuildGeometry(manager, localToWorld);
        if (buildMeshSynchronously) {
            while (true) {
                let result = iterator.next();
                if (result.done) {
                    break;
                }
            }
        }
        return iterator;
    }
    CreatePlane(material) {
        this.geometry = new THREE.BufferGeometry();
        let plane = new THREE.Mesh(this.geometry, material);
        plane.castShadow = false;
        plane.receiveShadow = true;
        this.plane = plane;
    }
    *BuildGeometry(manager, localToWorld) {
        const _D = new THREE.Vector3();
        const _D1 = new THREE.Vector3();
        const _D2 = new THREE.Vector3();
        const _P = new THREE.Vector3();
        const _H = new THREE.Vector3();
        const _W = new THREE.Vector3();
        const _C = new THREE.Vector3();
        const _S = new THREE.Vector3();
        const _N = new THREE.Vector3();
        const _N1 = new THREE.Vector3();
        const _N2 = new THREE.Vector3();
        const _N3 = new THREE.Vector3();
        const positions = [];
        const colors = [];
        const normals = [];
        const tangents = [];
        const uvs = [];
        const indices = [];
        const resolution = this.resolution;
        const radius = PLANET_RADIUS;
        const offset = this.centerLocal;
        const width = this.Dimensions.x;
        const half = width / 2;
        for (let x = 0; x < resolution + 1; x++) {
            const xp = width * x / resolution;
            for (let y = 0; y < resolution + 1; y++) {
                const yp = width * y / resolution;
                // Compute position
                _P.set(xp - half, yp - half, radius);
                _P.add(offset);
                _P.normalize();
                _D.copy(_P);
                _P.multiplyScalar(radius);
                _P.z -= radius;
                // Compute a world space position to sample noise
                _W.copy(_P);
                _W.applyMatrix4(localToWorld);
                const height = manager.HeightGenerator.GeHeightFromNCoord(_W.x, _W.y, _W.z);
                // const color = this._params.colourGenerator.Get(_W.x, _W.y, height);
                let color = null;
                if (manager.Engine.GuiParams.General.QuadTreeDebug) {
                    color = new THREE.Color();
                    color.setHex(this.ResolutionToColor(this.resolution));
                }
                else {
                    color = manager.HyposemetricTints.Get(_W.x, _W.y, height);
                }
                // Purturb height along z-vector
                _H.copy(_D);
                _H.multiplyScalar(height);
                _P.add(_H);
                positions.push(_P.x, _P.y, _P.z);
                colors.push(color.r, color.g, color.b);
                normals.push(_D.x, _D.y, _D.z);
                tangents.push(1, 0, 0, 1);
                uvs.push(_P.x / 10, _P.y / 10);
            }
        }
        yield;
        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                indices.push(i * (resolution + 1) + j, (i + 1) * (resolution + 1) + j + 1, i * (resolution + 1) + j + 1);
                indices.push((i + 1) * (resolution + 1) + j, (i + 1) * (resolution + 1) + j + 1, i * (resolution + 1) + j);
            }
        }
        yield;
        for (let i = 0, n = indices.length; i < n; i += 3) {
            const i1 = indices[i] * 3;
            const i2 = indices[i + 1] * 3;
            const i3 = indices[i + 2] * 3;
            _N1.fromArray(positions, i1);
            _N2.fromArray(positions, i2);
            _N3.fromArray(positions, i3);
            _D1.subVectors(_N3, _N2);
            _D2.subVectors(_N1, _N2);
            _D1.cross(_D2);
            normals[i1] += _D1.x;
            normals[i2] += _D1.x;
            normals[i3] += _D1.x;
            normals[i1 + 1] += _D1.y;
            normals[i2 + 1] += _D1.y;
            normals[i3 + 1] += _D1.y;
            normals[i1 + 2] += _D1.z;
            normals[i2 + 2] += _D1.z;
            normals[i3 + 2] += _D1.z;
        }
        yield;
        for (let i = 0, n = normals.length; i < n; i += 3) {
            _N.fromArray(normals, i);
            _N.normalize();
            normals[i] = _N.x;
            normals[i + 1] = _N.y;
            normals[i + 2] = _N.z;
        }
        yield;
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        this.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        this.geometry.setAttribute('tangent', new THREE.Float32BufferAttribute(tangents, 4));
        this.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        this.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    }
    ApplyHeightMapToPlane(plane, heightGenerator, centerWorld, worldDimension) {
        // Let's iterate over the vertices and apply a height map to them
        let vMin = new THREE.Vector3(worldDimension, worldDimension, worldDimension);
        let vMax = new THREE.Vector3(-worldDimension / 2, -worldDimension / 2, -worldDimension / 2);
        let positionAttribute = plane.geometry.getAttribute('position');
        for (let i = 0; i < positionAttribute.count; i++) {
            let v = new THREE.Vector3();
            v.fromBufferAttribute(positionAttribute, i);
            vMin.min(v);
            vMax.max(v);
        }
        let vRange = new THREE.Vector3(worldDimension, worldDimension, worldDimension);
        for (let i = 0; i < positionAttribute.count; i++) {
            let v = new THREE.Vector3();
            v.fromBufferAttribute(positionAttribute, i);
            let v2 = new THREE.Vector3(v.x, v.y, v.z);
            // Because the verices are not transformed, we need to transform them to the normalized coordinate system of the world coordinate
            // since all plane in three.js are created in the plane x and y, the noise needs to be sample on y and world coordinate of z. 
            // Once we generate the vertice automatically, we won't need to do this anymore 
            let vector2Normalized = new THREE.Vector3((v2.x + centerWorld.x), (-v2.y + centerWorld.z), 0);
            let height = heightGenerator.GeHeightFromNCoord(vector2Normalized.x, vector2Normalized.y, vector2Normalized.z);
            v.z = height;
            positionAttribute.setXYZ(i, v.x, v.y, v.z);
            // console.log("Vertex : v.x: " + v.x + " v.y: " + v.y + " v.z: " + v.z)
        }
        positionAttribute.needsUpdate = true;
        plane.geometry.computeVertexNormals();
    }
    get Plane() { return this.plane; }
    ;
    get Resolution() { return this.resolution; }
    ;
    get CenterWorld() { return this.centerWorld; }
    ;
    get Dimensions() { return this.dimensions; }
    ;
    get Diagonal() { return this.bounds.getSize(new THREE.Vector3()).length(); }
    ;
    get LocalToWorld() { return this.localToWorld; }
    ;
    get Bounds() { return this.bounds; }
    ;
    ResolutionToColor(resolution) {
        switch (resolution) {
            case TerrainResolution.RES_50:
                return 0xFFFFFF;
            case TerrainResolution.RES_100:
                return 0x00FF00;
            case TerrainResolution.RES_200:
                return 0x0000FF;
            case TerrainResolution.RES_400:
                return 0x00FFFF;
            case TerrainResolution.RES_800:
                return 0xFFFF00;
            case TerrainResolution.RES_1600:
                return 0xFF00FF;
            default:
                return 0xFF0000;
        }
    }
}
export var TraverseContextMode;
(function (TraverseContextMode) {
    TraverseContextMode[TraverseContextMode["ADD"] = 0] = "ADD";
    TraverseContextMode[TraverseContextMode["REMOVE"] = 1] = "REMOVE";
})(TraverseContextMode || (TraverseContextMode = {}));
export class TraverseContext {
    addedChunks;
    removedChunks;
    position;
    mode;
    forceRebuild;
    constructor(position, mode = TraverseContextMode.ADD, forceRebuild = false) {
        this.addedChunks = [];
        this.removedChunks = [];
        this.position = position;
        this.mode = mode;
        this.forceRebuild = forceRebuild;
    }
    AddChunkNode(chunkNode) {
        if (chunkNode.Chunk.Plane != null && !this.forceRebuild) {
            return;
        }
        this.addedChunks.push(chunkNode);
    }
    RemoveChunkNode(chunkNode) {
        if (chunkNode.Chunk.Plane == null) {
            return;
        }
        this.removedChunks.push(chunkNode);
    }
    get AddedChunkNodes() { return this.addedChunks; }
    ;
    get RemovedChunkNodes() { return this.removedChunks; }
    ;
    set Mode(mode) { this.mode = mode; }
    ;
    get Mode() { return this.mode; }
    ;
    get Position() { return this.position; }
    ;
}
export class QuadTreeChunkNode {
    chunk;
    children;
    group;
    radius;
    constructor(chunk, radius, group = null) {
        this.chunk = chunk;
        this.group = group;
        this.radius = radius;
        this.chunk.EnsureCenterWorld(this.group.matrix, radius);
    }
    // getting for the chunk
    get Chunk() { return this.chunk; }
    ;
    get Children() { return this.children; }
    ;
    get Group() { return this.group; }
    ;
    // Generate the children of the node
    EnsureChildren() {
        // If children are already generated, return
        if (this.children != null) {
            return;
        }
        // Compute the dimension of the children
        let childDimension = new THREE.Vector3(this.chunk.Dimensions.x / 2, this.chunk.Dimensions.y / 2, this.chunk.Dimensions.z / 2);
        // Create the children
        this.children = [];
        // Compute the center of the children 
        const midPoint = this.chunk.Bounds.getCenter(new THREE.Vector3());
        // Bottom Left
        const bottomLeft = new THREE.Box3(this.chunk.Bounds.min, midPoint);
        // Bottom Right
        const bottomRight = new THREE.Box3(new THREE.Vector3(midPoint.x, this.chunk.Bounds.min.y, 0), new THREE.Vector3(this.chunk.Bounds.max.x, midPoint.y, 0));
        // Top Right 
        const topRight = new THREE.Box3(midPoint, this.chunk.Bounds.max);
        // Top Left
        const topLeft = new THREE.Box3(new THREE.Vector3(this.chunk.Bounds.min.x, midPoint.y, 0), new THREE.Vector3(midPoint.x, this.chunk.Bounds.max.y, 0));
        // Bottom left
        this.children.push(new QuadTreeChunkNode(new TerrainChunk(this.chunk.Resolution * 2, bottomLeft), this.radius, this.Group));
        // Bottom right
        this.children.push(new QuadTreeChunkNode(new TerrainChunk(this.chunk.Resolution * 2, bottomRight), this.radius, this.Group));
        // Top Right
        this.children.push(new QuadTreeChunkNode(new TerrainChunk(this.chunk.Resolution * 2, topRight), this.radius, this.Group));
        // Top left
        this.children.push(new QuadTreeChunkNode(new TerrainChunk(this.chunk.Resolution * 2, topLeft), this.radius, this.Group));
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
            if (distance > this.chunk.Dimensions.x * 1.25 || this.chunk.Resolution == TERRAIN_MAX_RESOLUTION) {
                modeForChildren = TraverseContextMode.REMOVE;
                context.AddChunkNode(this);
            }
            else {
                // If we're inside the diagonal, ensure the children and traverse them
                this.EnsureChildren();
                // Outer plan will not be visible as we will recures into the children     
                context.RemoveChunkNode(this);
            }
        }
        else {
            // If we're in remove mode, we can remove the chunk
            context.RemoveChunkNode(this);
        }
        if (this.children != null) {
            for (let i = 0; i < this.children.length; i++) {
                context.Mode = modeForChildren;
                this.children[i].Traverse(context);
            }
        }
        if (modeForChildren == TraverseContextMode.REMOVE) {
            // remove the children 
            this.children = null;
        }
    }
    CommitPlaneToScene(terrainChunkManager, forceRebuild = false) {
        let gen = null;
        if (this.chunk.Plane == null) {
            gen = this.chunk.EnsurePlane(terrainChunkManager, this.Group.matrix);
            if (this.chunk.Plane != null) {
                console.log("Adding plane to scene Chunk min(" + this.chunk.Bounds.min.x + "," + this.chunk.Bounds.min.y + ") max(" + this.chunk.Bounds.max.x + ", " + this.chunk.Bounds.max.y + ") Res: " + this.chunk.Resolution + "");
                this.group.add(this.chunk.Plane);
            }
        }
        if (forceRebuild) {
            gen = this.chunk.Rebuild(terrainChunkManager, this.Group.matrix);
        }
        return gen;
    }
    UnCommitPlaneFromScene() {
        if (this.chunk.Plane != null) {
            let plane = this.Chunk.RemovePlane();
            console.log("Removing plane to scene Chunk min(" + this.chunk.Bounds.min.x + "," + this.chunk.Bounds.min.y + ") max(" + this.chunk.Bounds.max.x + ", " + this.chunk.Bounds.max.y + ") Res: " + this.chunk.Resolution + "");
            this.group.remove(plane);
        }
    }
}
class TerrainChunkManager {
    // keep track of the current wolrd position
    cachedPosition;
    radius;
    heightGenerator;
    hyposemetricTints;
    engine;
    // Create the 6 QuadTreeChunk and Nodes for each of the faces
    quadTreeChunkNodes;
    constructor(radius) {
        this.cachedPosition = new THREE.Vector3(0, 0, 0);
        this.radius = radius;
        this.quadTreeChunkNodes = [];
        // Create the 6 QuadTreeChunk and Nodes for each of the faces
        const transforms = [];
        // 
        // +Y
        let m = new THREE.Matrix4();
        m.makeRotationX(-Math.PI / 2);
        m.premultiply(new THREE.Matrix4().makeTranslation(0, radius, 0));
        transforms.push(m);
        // -Y
        m = new THREE.Matrix4();
        m.makeRotationX(Math.PI / 2);
        m.premultiply(new THREE.Matrix4().makeTranslation(0, -radius, 0));
        transforms.push(m);
        // +X
        m = new THREE.Matrix4();
        m.makeRotationY(Math.PI / 2);
        m.premultiply(new THREE.Matrix4().makeTranslation(radius, 0, 0));
        transforms.push(m);
        // -X
        m = new THREE.Matrix4();
        m.makeRotationY(-Math.PI / 2);
        m.premultiply(new THREE.Matrix4().makeTranslation(-radius, 0, 0));
        transforms.push(m);
        // +Z
        m = new THREE.Matrix4();
        m.premultiply(new THREE.Matrix4().makeTranslation(0, 0, radius));
        transforms.push(m);
        // -Z
        m = new THREE.Matrix4();
        m.makeRotationY(Math.PI);
        m.premultiply(new THREE.Matrix4().makeTranslation(0, 0, -radius));
        transforms.push(m);
        transforms.forEach(m => {
            const group = new THREE.Group();
            group.matrix = m;
            group.matrixAutoUpdate = false;
            let chunkNode = new QuadTreeChunkNode(new TerrainChunk(TerrainResolution.RES_50, new THREE.Box3(new THREE.Vector3(-radius, -radius, 0), new THREE.Vector3(radius, radius, 0))), this.radius, group);
            this.quadTreeChunkNodes.push(chunkNode);
        });
    }
    get QuadTreeChunkNodes() { return this.quadTreeChunkNodes; }
    ;
    get Radius() { return this.radius; }
    ;
    get HeightGenerator() { return this.heightGenerator; }
    ;
    get HyposemetricTints() { return this.hyposemetricTints; }
    ;
    get CachedPosition() { return this.cachedPosition; }
    ;
    get Engine() { return this.engine; }
    ;
    Attach(engine) {
        // Add the chunk to the scene
        this.quadTreeChunkNodes.forEach(chunkNode => {
            engine.AddObject3DToScene(chunkNode.Group);
        });
        this.heightGenerator = new SimplexNoiseGenerator(engine.GuiParams.Noise);
        this.hyposemetricTints = new HyposemetricTints(new SimplexNoiseGenerator(engine.GuiParams.TerrainTintNoise));
        this.engine = engine;
    }
    Detach(engine) {
        // Remove the chunk from the scene
        this.quadTreeChunkNodes.forEach(chunkNode => {
            engine.RemoveObject3DFromScene(chunkNode.Group);
        });
    }
    Rebuild() {
    }
    Update(worldPosition, forceRebuild = false) {
        if (this.cachedPosition.equals(worldPosition) && !forceRebuild) {
            return;
        }
        this.cachedPosition = worldPosition.clone();
        // This method will walk the quadtree and generate the chunks that are needed
        // Algorigthm goes like this:
        // 1. Start at the root, walk the children of the quadtree and calculate the distance from worldPosition to each of the children center point
        // 2. For each children visited, ensure their terain chunk is the list of visited chunks
        // 3. For the other visited nodes, make sure that all descendants are removed from the list of visited chunks
        // 4. For the visited child node with the smallest distance, remove his chunk from visited chunks, and ensure the children node are visited
        // 5. Recurse into the children node with the smallest distance
        // Go through each of the quadTreeChunkNodes and traverse them
        this.quadTreeChunkNodes.forEach(chunkNode => {
            // Create a new TraverseContext
            let context = new TraverseContext(worldPosition, TraverseContextMode.ADD, forceRebuild);
            chunkNode.Traverse(context);
            // For each chunk in the context, ensure the plane is generated and add it to the scene
            context.AddedChunkNodes.forEach(chunkNode => {
                chunkNode.CommitPlaneToScene(this, forceRebuild);
            });
            // For each removed chunk, remove it from the scene and remove the plane
            context.RemovedChunkNodes.forEach(chunkNode => {
                chunkNode.UnCommitPlaneFromScene();
            });
        });
    }
}
class TerrainSceneEntity extends ThreeTsEngine.SceneEntity {
    heightGenerators;
    terrainChunkManager;
    cameraPosition;
    constructor() {
        super("Terrain");
        this.terrainChunkManager = new TerrainChunkManager(PLANET_RADIUS);
        this.cameraPosition = new THREE.Vector3(0, 1000, 0);
    }
    Attach() {
        // this.heightMap = new Heightmap.HeightMap(this.Engine, "./resources/043-ue4-heightmap-guide-02.jpg",  (heightMap : Heightmap.HeightMap) => {
        //    this.Rebuild();});
        this.Engine.GuiParams.General = { "Wireframe": false, "QuadTreeDebug": false };
        // wireframe
        this.Engine.Gui.__folders["General"].add(this.Engine.GuiParams.General, 'Wireframe').onChange((value) => {
            this.Engine.EnableFrameMode(value);
        });
        // Quadtree Debugging
        this.Engine.Gui.__folders["General"].add(this.Engine.GuiParams.General, 'QuadTreeDebug').onChange((value) => {
            this.Rebuild();
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
        // Noise parameters
        this.Engine.GuiParams.TerrainTintNoise = { "scale": 64.0,
            "octaves": 7,
            "persistence": 0.91,
            "lacunarity": 0.8,
            "exponentiation": 6.6,
            "height": 82 };
        this.Engine.Gui.addFolder("TerrainTintNoise");
        this.Engine.Gui.__folders["TerrainTintNoise"].add(this.Engine.GuiParams.TerrainTintNoise, 'scale', 64.0, 4096.0).onChange((value) => {
            this.Rebuild();
        });
        this.Engine.Gui.__folders["TerrainTintNoise"].add(this.Engine.GuiParams.TerrainTintNoise, 'octaves', 1, 20, 1).onChange((value) => {
            this.Rebuild();
        });
        this.Engine.Gui.__folders["TerrainTintNoise"].add(this.Engine.GuiParams.TerrainTintNoise, 'persistence', 0.01, 1.0).onChange((value) => {
            this.Rebuild();
        });
        this.Engine.Gui.__folders["TerrainTintNoise"].add(this.Engine.GuiParams.TerrainTintNoise, 'lacunarity', 0.01, 4.0).onChange((value) => {
            this.Rebuild();
        });
        this.Engine.Gui.__folders["TerrainTintNoise"].add(this.Engine.GuiParams.TerrainTintNoise, 'exponentiation', 0.1, 10.0).onChange((value) => {
            this.Rebuild();
        });
        this.Engine.Gui.__folders["TerrainTintNoise"].add(this.Engine.GuiParams.TerrainTintNoise, 'height', 0, 1000).onChange((value) => {
            this.Rebuild();
        });
        // Create a new dictionary of IHeightGenerator
        this.heightGenerators = {
            "heightmap": new Heightmap.HeightMap(this.Engine, "./resources/043-ue4-heightmap-guide-02.jpg", (heightMap) => {
                // do something with the heightmap
            }),
            "simplex": new SimplexNoiseGenerator(this.Engine.GuiParams.Noise)
        };
        this.Engine.Camera.position.set(0, 2000, 1000);
        this.Engine.Camera.lookAt(0, 0, 0);
        // Attach the terrainChunkManager
        this.terrainChunkManager.Attach(this.Engine);
    }
    Rebuild() {
        this.terrainChunkManager.Update(this.cameraPosition, true);
    }
    Detach() {
        // Detach the terrainChunkManager
        this.terrainChunkManager.Detach(this.Engine);
    }
    Update() {
        let node = this.Engine.GetSceneEntity("basicNode");
        this.cameraPosition = node.Position();
        // this.cameraPosition = this.Engine.CameraPosition();
        this.terrainChunkManager.Update(this.cameraPosition);
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
    rotateAngle = 0;
    increment = 0.0001;
    keyLatchState = {};
    constructor() {
        super("basicNode");
        const sphereGeometry = new THREE.SphereGeometry(10, 8, 6);
        const material = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
        this.mesh = new THREE.Mesh(sphereGeometry, material);
        this.mesh.position.set(0, 0, PLANET_RADIUS);
    }
    Attach() {
        this.Engine.AddObject3DToScene(this.mesh);
    }
    Detach() {
        this.Engine.RemoveObject3DFromScene(this.mesh);
    }
    Update() {
        this.rotateAngle += this.increment;
        let position = new THREE.Vector3(0, 0, PLANET_RADIUS + 100);
        let matrix = new THREE.Matrix4();
        matrix.makeRotationY(this.rotateAngle);
        position.applyMatrix4(matrix);
        this.mesh.position.set(position.x, position.y, position.z);
        // if the left key arrow is pressed, move the mesh position to 10 left
        if (this.Engine.IskeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_4)) {
            this.mesh.position.x -= 1;
        }
        // if the right key arrow is pressed, move the mesh position to 10 right
        if (this.Engine.IskeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_6)) {
            this.mesh.position.x += 1;
        }
        // if the up key arrow is pressed, move the mesh position to 10 in z direction
        if (this.Engine.IskeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_8)) {
            this.mesh.position.z -= 1;
        }
        // if the down key arrow is pressed, move the mesh position to -10 in z direction
        if (this.Engine.IskeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_2)) {
            this.mesh.position.z += 1;
        }
        // if thepage up key  is pressed, move the mesh position to 10 in y direction
        if (this.Engine.IskeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_PLUS)) {
            this.mesh.position.y += 1;
        }
        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.Engine.IskeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_MINUS)) {
            this.mesh.position.y -= 1;
        }
        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.Engine.IskeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_DIVIDE)) {
            if (this.keyLatchState[ThreeTsEngine.GraphicEngine.Keys.KEYPAD_DIVIDE] == false) {
                this.keyLatchState[ThreeTsEngine.GraphicEngine.Keys.KEYPAD_DIVIDE] = true;
                this.increment += 0.0001;
            }
        }
        else {
            this.keyLatchState[ThreeTsEngine.GraphicEngine.Keys.KEYPAD_DIVIDE] = false;
        }
        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.Engine.IskeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_MULTIPLY)) {
            if (this.keyLatchState[ThreeTsEngine.GraphicEngine.Keys.KEYPAD_MULTIPLY] == false) {
                this.keyLatchState[ThreeTsEngine.GraphicEngine.Keys.KEYPAD_MULTIPLY] = true;
                this.increment -= 0.0001;
            }
        }
        else {
            this.keyLatchState[ThreeTsEngine.GraphicEngine.Keys.KEYPAD_MULTIPLY] = false;
        }
        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.Engine.IskeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_9)) {
            this.increment = 0;
        }
        // this.mesh.rotation.x += 0.01;
        // this.mesh.rotation.y += 0.005;
    }
    Position() {
        return this.mesh.position;
    }
}
//# sourceMappingURL=PlanetTs.js.map