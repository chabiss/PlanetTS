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
// The different resolution mapping we have for the terrain
export var TerrainResolution;
(function (TerrainResolution) {
    TerrainResolution[TerrainResolution["RES_1"] = 0] = "RES_1";
    TerrainResolution[TerrainResolution["RES_2"] = 1] = "RES_2";
    TerrainResolution[TerrainResolution["RES_3"] = 2] = "RES_3";
    TerrainResolution[TerrainResolution["RES_4"] = 3] = "RES_4";
    TerrainResolution[TerrainResolution["RES_5"] = 4] = "RES_5";
    TerrainResolution[TerrainResolution["RES_6"] = 5] = "RES_6";
})(TerrainResolution || (TerrainResolution = {}));
;
const PLANEWIDTH = 500;
const PLANEHEIGHT = 500;
const PLANEXRES = 60;
const planeYRes = 60;
const PLANET_RADIUS = 8000;
const TERRAIN_CHUNK_DIMENSION = 2000;
const TERRAIN_MAX_RESOLUTION = TerrainResolution.RES_6;
export class TerrainChunk {
    plane;
    geometry;
    resolution; // resolution of the chunk
    centerLocal; // Center of the chunk in local coordinates
    centerWorld; // Center of the chunk in world coordinates
    dimensions; // Dimension of the chunk
    bounds; // Bounds of the chunk
    localToWorld; // Local to world matrix
    needRebuild; // Flag to indicate if the chunk needs to be rebuild
    committed; // Flag to indicate if the chunk is committed to the scene
    terrainChunkManager; // Reference to the terrain chunk manager managing the chunks
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
    get IsCommitted() { return this.committed; }
    ;
    get NeedRebuild() { return this.needRebuild; }
    ;
    set NeedRebuild(value) { this.needRebuild = value; }
    ;
    get Manager() { return this.terrainChunkManager; }
    ;
    constructor(terrainChunkManager, resolution, bounds, locaToWorld = null) {
        this.terrainChunkManager = terrainChunkManager;
        this.Init(resolution, bounds, locaToWorld);
    }
    Init(resolution, bounds, locaToWorld = null) {
        this.resolution = resolution;
        this.bounds = bounds;
        this.centerLocal = bounds.getCenter(new THREE.Vector3());
        this.dimensions = bounds.getSize(new THREE.Vector3());
        this.needRebuild = true;
        this.committed = false;
        this.localToWorld = locaToWorld;
    }
    EnsureCenterWorld(localToWorld, radius) {
        this.centerWorld = this.centerLocal.clone();
        this.localToWorld = localToWorld.clone();
        this.centerWorld.applyMatrix4(this.localToWorld);
        this.centerWorld.normalize();
        this.centerWorld.multiplyScalar(radius);
    }
    Commit(manager, group = null) {
        this.EnsurePlane(manager);
        this.committed = true;
        if (group != null) {
            group.add(this.plane);
        }
    }
    Uncommit(group = null) {
        this.committed = false;
        this.Hide();
        if (group != null) {
            group.remove(this.plane);
        }
    }
    Show() {
        this.plane.visible = true;
    }
    Hide() {
        this.plane.visible = false;
    }
    EnsureBuilt() {
        if (!this.needRebuild) {
            return null;
        }
        return this.Rebuild(false);
    }
    Rebuild(buildMeshSynchronously = false) {
        this.needRebuild = true;
        let iterator = this.BuildGeometry();
        if (buildMeshSynchronously) {
            while (true) {
                let result = iterator.next();
                if (result.done) {
                    return null;
                }
            }
        }
        return iterator;
    }
    EnsurePlane(manager) {
        if (this.plane == null) {
            this.geometry = new THREE.BufferGeometry();
            let plane = new THREE.Mesh(this.geometry, manager.TerrainMaterial);
            plane.castShadow = false;
            plane.receiveShadow = true;
            plane.frustumCulled = false;
            this.plane = plane;
            this.needRebuild = true;
        }
    }
    *BuildGeometry() {
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
        const resolution = this.Manager.GetResolution(this.resolution);
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
                _W.applyMatrix4(this.localToWorld);
                const height = this.terrainChunkManager.HeightGenerator.GeHeightFromNCoord(_W.x, _W.y, _W.z);
                // const color = this._params.colourGenerator.Get(_W.x, _W.y, height);
                let color = null;
                if (this.terrainChunkManager.Engine.GuiParams.General.QuadTreeDebug) {
                    color = new THREE.Color();
                    color.setHex(this.ResolutionToColor(this.resolution));
                }
                else {
                    color = this.terrainChunkManager.HyposemetricTints.Get(_W.x, _W.y, height);
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
        this.needRebuild = false;
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
    ResolutionToColor(resolution) {
        switch (resolution) {
            case TerrainResolution.RES_1:
                return 0xFFFFFF;
            case TerrainResolution.RES_2:
                return 0x00FF00;
            case TerrainResolution.RES_3:
                return 0x0000FF;
            case TerrainResolution.RES_4:
                return 0x00FFFF;
            case TerrainResolution.RES_5:
                return 0xFFFF00;
            case TerrainResolution.RES_6:
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
    TraverseContextMode[TraverseContextMode["SKIP"] = 2] = "SKIP"; // In this mode, nodes are skip and traversal is not longer recursive for a given node
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
        if (chunkNode.Chunk.IsCommitted && !this.forceRebuild) {
            return;
        }
        this.addedChunks.push(chunkNode);
    }
    RemoveChunkNode(chunkNode, markChunkForGarbageCollection) {
        if (chunkNode.Chunk == null) {
            return;
        }
        // if this chunk is not committed, not need to remove it again
        if (!chunkNode.Chunk.IsCommitted) {
            return;
        }
        chunkNode.MarkChunkForGarbageCollection = markChunkForGarbageCollection;
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
    markChunkForGarbageCollection = false;
    leafNode = false;
    selfOrDescendandVisible = false;
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
    get MarkChunkForGarbageCollection() { return this.markChunkForGarbageCollection; }
    ;
    set MarkChunkForGarbageCollection(value) { this.markChunkForGarbageCollection = value; }
    ;
    get LeafNode() { return this.leafNode; }
    ;
    // Generate the children of the node
    EnsureChildrenVisible() {
        // If the were no children, create them, but they are not ready to be visible
        if (!this.EnsureChildrenNode()) {
            return false;
        }
        // If the children are built, ensure they are visible   
        if (!this.AllChildrenBuilt()) {
            return false;
        }
        return true;
    }
    EnsureVisible() {
        if (this.chunk == null) {
            return false;
        }
        if (this.chunk.IsCommitted && !this.chunk.NeedRebuild) {
            this.chunk.Show();
            return true;
        }
        return false;
    }
    EnsureChildrenNode() {
        // If children are already generated, return
        if (this.children == null) {
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
            let newResolution = this.chunk.Resolution + 1;
            // Bottom left
            this.children.push(new QuadTreeChunkNode(this.chunk.Manager.AssignChunk(newResolution, bottomLeft, this.chunk.LocalToWorld), this.radius, this.Group));
            // Bottom right
            this.children.push(new QuadTreeChunkNode(this.chunk.Manager.AssignChunk(newResolution, bottomRight, this.chunk.LocalToWorld), this.radius, this.Group));
            // Top Right
            this.children.push(new QuadTreeChunkNode(this.chunk.Manager.AssignChunk(newResolution, topRight, this.chunk.LocalToWorld), this.radius, this.Group));
            // Top left
            this.children.push(new QuadTreeChunkNode(this.chunk.Manager.AssignChunk(newResolution, topLeft, this.chunk.LocalToWorld), this.radius, this.Group));
            return false;
        }
        return true;
    }
    AllChildrenBuilt() {
        if (this.children == null) {
            return false;
        }
        for (let i = 0; i < this.children.length; i++) {
            let chunk = this.children[i].Chunk;
            if (chunk == null) {
                throw new Error("AllChildrenBuilt error: Chunk is null");
            }
            if (!chunk.IsCommitted || chunk.NeedRebuild) {
                return false;
            }
        }
        return true;
    }
    DistanceTo(position) {
        if (this.chunk == null) {
            throw new Error("DistanceTo error: Chunk is null");
        }
        return this.chunk.CenterWorld.distanceTo(position);
    }
    Traverse(context) {
        let modeForChildren = context.Mode;
        if (context.Mode == TraverseContextMode.ADD) {
            // check the distance to the center of the chunk with context.Position
            let distance = this.DistanceTo(context.Position);
            // If the distance is greater than the diagonal of the chunk, or if we're in remove mode, we can remove the chunk
            if (distance > this.chunk.Dimensions.x * 1.25 || this.chunk.Resolution == TERRAIN_MAX_RESOLUTION) {
                // The node doesn't need to be subdivided, add a chunk to it
                context.AddChunkNode(this);
                this.leafNode = true;
                // if the node is ready to be shown, we can remove the children
                if (this.EnsureVisible()) {
                    modeForChildren = TraverseContextMode.REMOVE;
                }
                else {
                    // Skip the children until the parent node is ready to be visible
                    modeForChildren = TraverseContextMode.SKIP;
                }
            }
            else {
                this.EnsureChildrenNode();
                this.leafNode = false;
            }
        }
        else {
            // If we're in remove mode, we can remove the chunk
            context.RemoveChunkNode(this, true);
        }
        let descendantVisible = true;
        if (modeForChildren != TraverseContextMode.SKIP) {
            if (this.children != null) {
                for (let i = 0; i < this.children.length; i++) {
                    context.Mode = modeForChildren;
                    this.children[i].Traverse(context);
                    if (descendantVisible && !this.children[i].selfOrDescendandVisible) {
                        descendantVisible = false;
                    }
                }
            }
        }
        this.selfOrDescendandVisible = this.leafNode ? this.EnsureVisible() : descendantVisible;
        // If this is not a leaf node and all the children are visible, we can remove the chunk
        if (!this.leafNode && this.selfOrDescendandVisible) {
            context.RemoveChunkNode(this, false);
        }
        if (modeForChildren == TraverseContextMode.REMOVE) {
            // remove the children 
            this.children = null;
        }
    }
    CommitToScene(terrainChunkManager, forceRebuild = false) {
        let gen = null;
        if (this.Chunk == null) {
            throw new Error("CommitToScene error: Chunk is null");
        }
        // If the plane is not committed to the scene, commit it
        if (!this.chunk.IsCommitted) {
            this.markChunkForGarbageCollection = false;
            this.chunk.Commit(terrainChunkManager, this.Group);
            this.chunk.Manager.Engine.Log("CommitToScene", "Adding plane to scene Chunk min(" + this.chunk.Bounds.min.x + "," + this.chunk.Bounds.min.y + ") max(" + this.chunk.Bounds.max.x + ", " + this.chunk.Bounds.max.y + ") Res: " + this.chunk.Resolution + "");
        }
        else {
            // If the plane is already committed, ensure it's visible
            this.EnsureVisible();
        }
        if (this.chunk.NeedRebuild || forceRebuild) {
            terrainChunkManager.ScheduleChunkRebuild(this.chunk);
        }
        return gen;
    }
    UnCommitFromScene() {
        this.chunk.Uncommit(this.group);
        this.chunk.Manager.Engine.Log("CommitToScene", "Removing plane to scene Chunk min(" + this.chunk.Bounds.min.x + "," + this.chunk.Bounds.min.y + ") max(" + this.chunk.Bounds.max.x + ", " + this.chunk.Bounds.max.y + ") Res: " + this.chunk.Resolution + "");
        if (this.markChunkForGarbageCollection) {
            this.chunk.Manager.GarbageCollectChunk(this.chunk);
            this.chunk = null;
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
    terrainMaterial;
    // create a queue of IterableIterator<void> to generate the mesh
    chunkRebuildQueue;
    garbadgeCollectQueue;
    activeGen;
    needUpdate;
    saveGarbadgeCollectorSize = 0;
    // Resolution for each relolution settings
    terrainResolution = [
        400,
        200,
        200,
        100,
        100,
        100,
    ];
    // Create the 6 QuadTreeChunk and Nodes for each of the faces
    quadTreeChunkNodes;
    constructor(radius) {
        this.cachedPosition = new THREE.Vector3(0, 0, 0);
        this.radius = radius;
        this.quadTreeChunkNodes = [];
        this.chunkRebuildQueue = [];
        this.garbadgeCollectQueue = [];
        this.activeGen = null;
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
            let chunkNode = new QuadTreeChunkNode(this.AssignChunk(TerrainResolution.RES_1, new THREE.Box3(new THREE.Vector3(-radius, -radius, 0), new THREE.Vector3(radius, radius, 0))), this.radius, group);
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
    get TerrainMaterial() { return this.terrainMaterial; }
    ;
    GetResolution(resolution) {
        return this.terrainResolution[resolution];
    }
    UpdateMeshMaterial(wireframe) {
        this.terrainMaterial.wireframe = wireframe;
    }
    AssignChunk(resolution, bounds, locaToWorld = null) {
        // See first if we can get a chunk from the garbage collect queue
        if (this.garbadgeCollectQueue.length > 0) {
            let chunk = this.garbadgeCollectQueue.shift();
            chunk.Init(resolution, bounds, locaToWorld);
            return chunk;
        }
        let chunk = new TerrainChunk(this, resolution, bounds, locaToWorld);
        return chunk;
    }
    GarbageCollectChunk(chunk) {
        chunk.Uncommit();
        chunk.NeedRebuild = true;
        this.garbadgeCollectQueue.push(chunk);
    }
    Attach(engine) {
        // Add the chunk to the scene
        this.quadTreeChunkNodes.forEach(chunkNode => {
            engine.AddObject3DToScene(chunkNode.Group);
        });
        this.heightGenerator = new SimplexNoiseGenerator(engine.GuiParams.Noise);
        this.hyposemetricTints = new HyposemetricTints(new SimplexNoiseGenerator(engine.GuiParams.TerrainTintNoise));
        this.engine = engine;
        this.terrainMaterial = new THREE.MeshStandardMaterial({ side: THREE.FrontSide, wireframe: this.Engine.GuiParams.General.Wireframe, vertexColors: true, });
    }
    Detach(engine) {
        // Remove the chunk from the scene
        this.quadTreeChunkNodes.forEach(chunkNode => {
            engine.RemoveObject3DFromScene(chunkNode.Group);
        });
    }
    Rebuild() {
    }
    ScheduleChunkRebuild(chunk) {
        chunk.Hide();
        this.chunkRebuildQueue.push(chunk);
    }
    ProcessChunkRebuildQueue() {
        if (this.activeGen != null) {
            let result = this.activeGen.next();
            if (result.done) {
                this.activeGen = null;
            }
            else {
                return true;
            }
        }
        if (this.chunkRebuildQueue.length > 0) {
            let chunk = this.chunkRebuildQueue.shift();
            this.activeGen = chunk.Rebuild(false);
            return true;
        }
        return false;
    }
    ProcessChunckMultiThreadRebuildQueue() {
        // This method will process the chunk rebuild queue in a multi-threaded fashion
        // The idea is to have a pool of worker threads that will process the chunk rebuild queue
        // The worker threads will be responsible for generating the mesh of the chunk
        // The main thread will be responsible for committing the mesh to the scene
    }
    Update(worldPosition, forceRebuild = false) {
        // Process the mesh generation queue
        let moreToRebuild = this.ProcessChunkRebuildQueue();
        if (forceRebuild) {
            this.needUpdate = true;
        }
        //if (!this.cachedPosition.equals(worldPosition)) {
        //     this.cachedPosition = worldPosition.clone();
        //    this.needUpdate = true;
        // }
        this.needUpdate = true;
        if (!moreToRebuild && this.needUpdate) {
            // Update the quadtree of each side of the cube sphere
            this.UpdateQuadTrees(worldPosition, forceRebuild);
        }
        if (this.engine.GuiParams.Traces.ChunkManager) {
            if (this.saveGarbadgeCollectorSize != this.garbadgeCollectQueue.length) {
                this.engine.Log("ChunkManager", "Garbadge Collector Size: " + this.garbadgeCollectQueue.length);
            }
            this.saveGarbadgeCollectorSize = this.garbadgeCollectQueue.length;
        }
    }
    UpdateQuadTrees(worldPosition, forceRebuild) {
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
                chunkNode.CommitToScene(this, forceRebuild);
            });
            // For each removed chunk, remove it from the scene and remove the plane
            context.RemovedChunkNodes.forEach(chunkNode => {
                chunkNode.UnCommitFromScene();
            });
        });
        this.needUpdate = false;
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
            this.terrainChunkManager.UpdateMeshMaterial(value);
        });
        // Quadtree Debugging
        this.Engine.Gui.__folders["General"].add(this.Engine.GuiParams.General, 'QuadTreeDebug').onChange((value) => {
            this.Rebuild();
        });
        this.Engine.GuiParams.Traces = { "CommitToScene": false, "ChunkManager": false };
        this.Engine.Gui.__folders["Traces"].add(this.Engine.GuiParams.Traces, 'CommitToScene');
        this.Engine.Gui.__folders["Traces"].add(this.Engine.GuiParams.Traces, 'ChunkManager');
        // Noise parameters
        this.Engine.GuiParams.Noise = {
            "scale": 1100.0,
            "octaves": 13,
            "persistence": 0.707,
            "lacunarity": 1.8,
            "exponentiation": 4.5,
            "height": 300,
            "seed": 1
        };
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
        this.Engine.GuiParams.TerrainTintNoise = {
            "scale": 2048.0,
            "octaves": 2,
            "persistence": 0.5,
            "lacunarity": 2.0,
            "exponentiation": 3.9,
            "height": 1,
            "seed": 2
        };
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
        this.Engine.Camera.position.set(0, 0, PLANET_RADIUS + 1000);
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
        // this.cameraPosition =  node.Position();
        this.cameraPosition = this.Engine.CameraPosition();
        this.terrainChunkManager.Update(this.cameraPosition);
    }
}
class LightSceneEntity extends ThreeTsEngine.SceneEntity {
    directionalLight;
    ambientLight;
    constructor() {
        super("Light");
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.directionalLight.position.set(10000, 10000, 0);
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
    followMode = false;
    rotationMode = true;
    constructor() {
        super("basicNode");
        const sphereGeometry = new THREE.SphereGeometry(10, 8, 6);
        const material = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
        this.mesh = new THREE.Mesh(sphereGeometry, material);
        this.mesh.position.set(0, 0, PLANET_RADIUS);
    }
    Attach() {
        this.Engine.AddObject3DToScene(this.mesh);
        this.Engine.Camera.rotateX(-Math.PI / 2);
    }
    Detach() {
        this.Engine.RemoveObject3DFromScene(this.mesh);
    }
    Update() {
        this.rotateAngle += this.increment;
        let position = new THREE.Vector3(0, 0, PLANET_RADIUS + 300);
        let positionLookAt = new THREE.Vector3(PLANET_RADIUS, 0, 0);
        let matrix = new THREE.Matrix4();
        matrix.makeRotationY(this.rotateAngle);
        position.applyMatrix4(matrix);
        if (this.rotationMode) {
            this.mesh.position.set(position.x, position.y, position.z);
        }
        if (this.followMode) {
            this.Engine.Camera.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
            if (this.rotationMode) {
                let matrix2 = matrix.clone();
                positionLookAt.applyMatrix4(matrix);
                this.Engine.Camera.lookAt(positionLookAt.x, positionLookAt.y, positionLookAt.z);
                this.Engine.Camera.rotateZ(-Math.PI / 2);
            }
        }
        // if the left key arrow is pressed, move the mesh position to 10 left
        if (this.IsKeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_4)) {
            this.mesh.position.x -= 1;
        }
        // if the right key arrow is pressed, move the mesh position to 10 right
        if (this.IsKeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_6)) {
            this.mesh.position.x += 1;
        }
        // if the up key arrow is pressed, move the mesh position to 10 in z direction
        if (this.IsKeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_8)) {
            this.mesh.position.z -= 1;
        }
        // if the down key arrow is pressed, move the mesh position to -10 in z direction
        if (this.IsKeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_2)) {
            this.mesh.position.z += 1;
        }
        // if thepage up key  is pressed, move the mesh position to 10 in y direction
        if (this.IsKeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_PLUS)) {
            this.mesh.position.y += 1;
        }
        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.IsKeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_MINUS)) {
            this.mesh.position.y -= 1;
        }
        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.IsKeyLatched(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_MULTIPLY)) {
            this.increment += 0.0001;
        }
        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.IsKeyLatched(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_DIVIDE)) {
            this.increment -= 0.0001;
        }
        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.IsKeyLatched(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_0)) {
            this.increment = 0;
        }
        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.IsKeyLatched(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_PERIOD)) {
            this.followMode = !this.followMode;
        }
        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.IsKeyLatched(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_ENTER)) {
            this.rotationMode = !this.rotationMode;
        }
        if (this.IsKeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_7)) {
            this.Engine.Camera.rotateX(0.01);
        }
        if (this.IsKeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_9)) {
            this.Engine.Camera.rotateX(-0.01);
        }
        if (this.IsKeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_1)) {
            this.Engine.Camera.rotateY(0.01);
        }
        if (this.IsKeyPressed(ThreeTsEngine.GraphicEngine.Keys.KEYPAD_3)) {
            this.Engine.Camera.rotateY(-0.01);
        }
    }
    Position() {
        return this.mesh.position;
    }
    IsKeyLatched(key) {
        if (this.Engine.IskeyPressed(key)) {
            if (this.keyLatchState[key] == false) {
                this.keyLatchState[key] = true;
                return true;
            }
        }
        else {
            this.keyLatchState[key] = false;
        }
        return false;
    }
    IsKeyPressed(key) {
        if (this.Engine.IskeyPressed(key)) {
            return true;
        }
        return false;
    }
}
//# sourceMappingURL=PlanetTs.js.map