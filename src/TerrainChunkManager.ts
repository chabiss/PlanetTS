import * as THREE from 'three';
import { PlanetTsEngine } from './SceneEntity/PlanetTsEngine.ts'
import { TerrainChunk, TerrainResolution } from './TerrainChunk.ts'
import { IHeightGenerator } from './IHeighGenerator.ts';
import { HyposemetricTints } from './ColorGenerator.ts';
import { QuadTreeChunkNode } from './QuadTreeChunkNode.ts';
import { SimplexNoiseGenerator } from './NoiseGenerator.ts';
import { TraverseContext, TraverseContextMode } from './TraverseContext.ts';

export class TerrainChunkManager {
    // keep track of the current wolrd position
    private cachedPosition : THREE.Vector3;
    private radius : number;
    private heightGenerator! : IHeightGenerator;
    private hyposemetricTints! : HyposemetricTints;
    private engine! : PlanetTsEngine;
    private terrainMaterial! : THREE.MeshStandardMaterial;
    // create a queue of IterableIterator<void> to generate the mesh
    private chunkRebuildQueue : TerrainChunk[];
    private garbadgeCollectQueue : TerrainChunk[];
    private activeGen : IterableIterator<void> | null;
    private needUpdate! : boolean;
    private saveGarbadgeCollectorSize : number = 0;
    // Resolution for each relolution settings
    private terrainResolution : number[] = [
        400, 
        200, 
        200, 
        100, 
        100, 
        100,
        ];

    // Create the 6 QuadTreeChunk and Nodes for each of the faces
    private quadTreeChunkNodes : QuadTreeChunkNode[];
 
    constructor(radius : number) {

        this.cachedPosition = new THREE.Vector3(0,0,0);     
        this.radius = radius;
        this.quadTreeChunkNodes = [];
        this.chunkRebuildQueue = [];
        this.garbadgeCollectQueue = [];
        this.activeGen = null;        

        // Create the 6 QuadTreeChunk and Nodes for each of the faces
        const transforms : THREE.Matrix4[] = []; 
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
            let chunkNode = new QuadTreeChunkNode(this.AssignChunk( TerrainResolution.RES_1, 
                                                                    new THREE.Box3(new THREE.Vector3(-radius,-radius,0),new THREE.Vector3(radius,radius,0))), this.radius,  group);                                                           
            this.quadTreeChunkNodes.push(chunkNode);
        });
    }

    get QuadTreeChunkNodes() : QuadTreeChunkNode[] {return this.quadTreeChunkNodes; };
    get Radius() : number {return this.radius; };
    get HeightGenerator() : IHeightGenerator {return this.heightGenerator; };
    get HyposemetricTints() : HyposemetricTints {return this.hyposemetricTints; };
    get CachedPosition() : THREE.Vector3 {return this.cachedPosition; };
    get Engine() : PlanetTsEngine {return this.engine; };
    get TerrainMaterial() : THREE.MeshStandardMaterial {return this.terrainMaterial; };
    
    GetResolution(resolution : TerrainResolution) : number {
        return this.terrainResolution[resolution];
    }   

    public UpdateMeshMaterial(wireframe: boolean) {
        this.terrainMaterial.wireframe = wireframe;
    }

    public AssignChunk(resolution : TerrainResolution, bounds : THREE.Box3, locaToWorld : THREE.Matrix4 | null = null) : TerrainChunk {
        // See first if we can get a chunk from the garbage collect queue
        if (this.garbadgeCollectQueue.length > 0) {
            let chunk  = this.garbadgeCollectQueue.shift();
            if( chunk != null){
                chunk?.Init(resolution, bounds, locaToWorld);
                return chunk;
            }
        }

        let chunk = new TerrainChunk(this, resolution, bounds, locaToWorld);
        return chunk;
    }

    public GarbageCollectChunk(chunk : TerrainChunk) : void {
        chunk.Uncommit();
        chunk.NeedRebuild = true;
        this.garbadgeCollectQueue.push(chunk);
    }

    public Attach(engine : PlanetTsEngine) : void {
        // Add the chunk to the scene
        this.quadTreeChunkNodes.forEach(chunkNode => {
            if (chunkNode.Group != null){
                engine.AddObject3DToScene(chunkNode.Group);
            }
        });

        this.heightGenerator = new SimplexNoiseGenerator(engine.GuiParams.Noise);
        this.hyposemetricTints = new HyposemetricTints(new SimplexNoiseGenerator(engine.GuiParams.TerrainTintNoise));
        this.engine = engine;
        this.terrainMaterial = new THREE.MeshStandardMaterial({side: THREE.FrontSide, wireframe: this.Engine.GuiParams.General.Wireframe, vertexColors: true,});
    }

    public Detach(engine : PlanetTsEngine) : void {
        // Remove the chunk from the scene
        this.quadTreeChunkNodes.forEach(chunkNode => {
            if (chunkNode.Group != null){
                engine.RemoveObject3DFromScene(chunkNode.Group);
            }
        });
    }

    public Rebuild() : void {

    }
    
    public ScheduleChunkRebuild(chunk : TerrainChunk) : void {
        chunk.Hide();
        this.chunkRebuildQueue.push(chunk);
    }

    public ProcessChunkRebuildQueue() : boolean {

        if(this.activeGen != null) {
            let result = this.activeGen.next();
            if (result.done) {
                this.activeGen = null;
            }else{
                return true
            }
        }

        if (this.chunkRebuildQueue.length > 0) {
            let chunk = this.chunkRebuildQueue.shift();
            if (chunk != null){
                this.activeGen = chunk.Rebuild(false);
                return true;   
            }
        } 

        return false;
    }

    public ProcessChunckMultiThreadRebuildQueue() : void {
        // This method will process the chunk rebuild queue in a multi-threaded fashion
        // The idea is to have a pool of worker threads that will process the chunk rebuild queue
        // The worker threads will be responsible for generating the mesh of the chunk
        // The main thread will be responsible for committing the mesh to the scene
        
    }


    public Update(worldPosition : THREE.Vector3, forceRebuild: boolean = false) : void {
        
        // Process the mesh generation queue
        let moreToRebuild = this.ProcessChunkRebuildQueue();

        if(forceRebuild) {
            this.needUpdate = true;
        }

        //if (!this.cachedPosition.equals(worldPosition)) {
        //     this.cachedPosition = worldPosition.clone();
        //    this.needUpdate = true;
       // }
        this.needUpdate = true;

        if(!moreToRebuild && this.needUpdate){
            // Update the quadtree of each side of the cube sphere
            this.UpdateQuadTrees(worldPosition, forceRebuild);
        }

        if(this.engine.GuiParams.Traces.ChunkManager){
            if(this.saveGarbadgeCollectorSize != this.garbadgeCollectQueue.length){
                this.engine.Log("ChunkManager", "Garbadge Collector Size: " + this.garbadgeCollectQueue.length);
            }
            this.saveGarbadgeCollectorSize = this.garbadgeCollectQueue.length;
        }
    }

    private UpdateQuadTrees(worldPosition: THREE.Vector3, forceRebuild: boolean) : void {
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