import * as THREE from 'three';
import { PlanetTsEngine } from './SceneEntity/PlanetTsEngine'
import { TerrainChunk, TerrainResolution } from './TerrainChunk'
import { IHeightGenerator } from './IHeighGenerator';
import { HyposemetricTints } from './ColorGenerator';
import { QuadTreeChunkNode } from './QuadTreeChunkNode';
import { SimplexNoiseGenerator } from './NoiseGenerator';
import { TraverseContext, TraverseContextMode } from './TraverseContext';
import { WorkerThreadsManager } from './WorkerThreadsManager';

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
    private workerThreadsManager : WorkerThreadsManager;
    private chunkInWokerThreads : Map<number, TerrainChunk>
    


    // Resolution for each relolution settings
    private static TerrainResolutionPresets : number[] = [
        400, 
        200, 
        200, 
        100, 
        100, 
        100,
        ];

    // Create the 6 QuadTreeChunk and Nodes for each of the faces
    private quadTreeChunkNodes : QuadTreeChunkNode[];
 
    constructor() {
        this.radius = 0;
        this.cachedPosition = new THREE.Vector3(0,0,0);     
        this.quadTreeChunkNodes = [];
        this.chunkRebuildQueue = [];
        this.garbadgeCollectQueue = [];
        this.chunkInWokerThreads = new Map<number, TerrainChunk>();
        this.activeGen = null;
        this.workerThreadsManager = new WorkerThreadsManager("./BuildTerrainThread.worker.ts", 10, (data: any) => {        
            this.TerrainChunkWorkCompleted(data);
          });
        }
 
    get QuadTreeChunkNodes() : QuadTreeChunkNode[] {return this.quadTreeChunkNodes; };
    get Radius() : number {return this.radius; };
    get HeightGenerator() : IHeightGenerator {return this.heightGenerator; };
    get HyposemetricTints() : HyposemetricTints {return this.hyposemetricTints; };
    get CachedPosition() : THREE.Vector3 {return this.cachedPosition; };
    get Engine() : PlanetTsEngine {return this.engine; };
    get TerrainMaterial() : THREE.MeshStandardMaterial {return this.terrainMaterial; };
    
    static GetResolution(resolution : TerrainResolution) : number {
        return TerrainChunkManager.TerrainResolutionPresets[resolution];
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
        this.heightGenerator = new SimplexNoiseGenerator(engine.GuiParams.Noise);
        this.hyposemetricTints = new HyposemetricTints(new SimplexNoiseGenerator(engine.GuiParams.TerrainTintNoise));
        this.engine = engine;
        this.terrainMaterial = new THREE.MeshStandardMaterial({side: THREE.FrontSide, wireframe: this.Engine.GuiParams.General.Wireframe, vertexColors: true,});
        this.radius = this.engine.GuiParams.General.PlanetRadius;

        // Create the 6 QuadTreeChunk and Nodes for each of the faces
        this.InitalizeQuadTrees();
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
        
        // Remove all the chunks from the scene
        this.quadTreeChunkNodes.forEach(chunkNode => {
            // uncommit all the chunks
            let context = new TraverseContext(this, new THREE.Vector3(0,0,0), TraverseContextMode.REMOVE, true);
            chunkNode.UpdateQuadTree(context);

            // Remove the group from the scene
            if (chunkNode.Group != null){
                this.engine.RemoveObject3DFromScene(chunkNode.Group);
            }
        });

        this.chunkRebuildQueue = [];
        this.garbadgeCollectQueue = [];
        this.chunkInWokerThreads.clear();
        this.quadTreeChunkNodes = [];

        // Re-initalize the quadtree
        this.InitalizeQuadTrees();
    }
    
    public ScheduleChunkRebuild(chunk : TerrainChunk) : void {
        chunk.Hide();
        this.chunkRebuildQueue.push(chunk);
    }

    public ProcessChunkSingleThreadRebuildQueue() : boolean {

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

        let noThreadsAvailable: Boolean = true;
        while(this.chunkRebuildQueue.length > 0 && noThreadsAvailable) {
            let chunk = this.chunkRebuildQueue[0];
            if (chunk != null){
                // Let build the data that needs to be sent to workerThreadsManager
                let chunkData = {
                    TerrainChunk :{ 
                        Id : chunk.Id,
                        TerrainResolution : chunk.Resolution, 
                        Radius : this.radius, 
                        CenterLocal : { 
                            x: chunk.CenterLocal.x, y: chunk.CenterLocal.y, z: chunk.CenterLocal.z 
                        }, 
                        Size : {
                             x: chunk.Dimensions.x, 
                             y: chunk.Dimensions.y 
                        },
                        localToWorld : chunk.LocalToWorld?.toArray(),
                        },
                    Flags: {
                        QuadTreeDebug : this.engine.GuiParams.General.QuadTreeDebug,
                        SingleFaceDebug : this.engine.GuiParams.General.SingleFaceDebug
                    },
                    Noise: {
                        scale: this.engine.GuiParams.Noise.scale,
                        octaves: this.engine.GuiParams.Noise.octaves,
                        persistence: this.engine.GuiParams.Noise.persistence,
                        lacunarity: this.engine.GuiParams.Noise.lacunarity,
                        exponentiation: this.engine.GuiParams.Noise.exponentiation,
                        height: this.engine.GuiParams.Noise.height,
                        seed : this.engine.GuiParams.Noise.seed 
                    },
                    TerrainTintNoise: {
                        scale: this.engine.GuiParams.TerrainTintNoise.scale,
                        octaves: this.engine.GuiParams.TerrainTintNoise.octaves,
                        persistence: this.engine.GuiParams.TerrainTintNoise.persistence,
                        lacunarity: this.engine.GuiParams.TerrainTintNoise.lacunarity,
                        exponentiation: this.engine.GuiParams.TerrainTintNoise.exponentiation,
                        height: this.engine.GuiParams.TerrainTintNoise.height,
                        seed : this.engine.GuiParams.TerrainTintNoise.seed
                    },
                }
                
                try {
                    this.workerThreadsManager.Schedule({ message: "Build_Geometry", data: chunkData});
                    this.chunkRebuildQueue.shift();
                    this.chunkInWokerThreads.set(chunk.Id, chunk);
                } catch (e) {
                    noThreadsAvailable = false;
                }
            }
            else {
                throw new Error("ProcessChunckMultiThreadRebuildQueue error: chunk is null");
            }   
        }
    }

    private TerrainChunkWorkCompleted(payload: any) : void {
        // The worker thread has completed the work
        // The data object contains the chunk that has been rebuilt
        // The chunk needs to be committed to the scene
        // find the chunk in the chunkInWokerThreads
        let chunk = this.chunkInWokerThreads.get(payload.data.chunkId);
        if(chunk != null) {
            // Commit the chunk to the scene
            chunk.UpdateGeometry(payload.data);
            // Remove the chunk from the chunkInWokerThreads
            this.chunkInWokerThreads.delete(payload.data.chunkId);
        }   
    }

    public Update(worldPosition : THREE.Vector3, forceRebuild: boolean = false) : void {
        
        let moreToRebuild = false;
        // Process the mesh generation queue
        if (this.engine.GuiParams.General.MultiThread) {
            this.ProcessChunckMultiThreadRebuildQueue();
        } else {
            moreToRebuild = this.ProcessChunkSingleThreadRebuildQueue();
        }
    
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

    private InitalizeQuadTrees() {

        if(this.quadTreeChunkNodes.length > 0){
            throw new Error("QuadTreeChunkNodes already initialized");
        }

        this.radius = this.engine.GuiParams.General.PlanetRadius;

        const transforms: THREE.Matrix4[] = [];
        // 
        // +Y
        let m = new THREE.Matrix4();
        m.makeRotationX(-Math.PI / 2);
        if (!this.engine.GuiParams.General.SingleFaceDebug) {
            m.premultiply(new THREE.Matrix4().makeTranslation(0, this.radius, 0));
        }
        transforms.push(m);

        // Debugging a single facr or not
        if (!this.engine.GuiParams.General.SingleFaceDebug) {
            // -Y
            m = new THREE.Matrix4();
            m.makeRotationX(Math.PI / 2);
            m.premultiply(new THREE.Matrix4().makeTranslation(0, -this.radius, 0));
            transforms.push(m);

            // +X
            m = new THREE.Matrix4();
            m.makeRotationY(Math.PI / 2);
            m.premultiply(new THREE.Matrix4().makeTranslation(this.radius, 0, 0));
            transforms.push(m);

            // -X
            m = new THREE.Matrix4();
            m.makeRotationY(-Math.PI / 2);
            m.premultiply(new THREE.Matrix4().makeTranslation(-this.radius, 0, 0));
            transforms.push(m);

            // +Z
            m = new THREE.Matrix4();
            m.premultiply(new THREE.Matrix4().makeTranslation(0, 0, this.radius));
            transforms.push(m);

            // -Z
            m = new THREE.Matrix4();
            m.makeRotationY(Math.PI);
            m.premultiply(new THREE.Matrix4().makeTranslation(0, 0, -this.radius));
            transforms.push(m);
        }

        transforms.forEach(m => {
            const group = new THREE.Group();
            group.matrix = m;
            group.matrixAutoUpdate = false;
            let chunkNode = new QuadTreeChunkNode(this.AssignChunk(TerrainResolution.RES_1,
                new THREE.Box3(new THREE.Vector3(-this.radius, -this.radius, 0), new THREE.Vector3(this.radius, this.radius, 0))), this.radius, group);
            this.quadTreeChunkNodes.push(chunkNode);
        });

        // Add the chunk to the scene
        this.quadTreeChunkNodes.forEach(chunkNode => {
            if (chunkNode.Group != null){
                this.engine.AddObject3DToScene(chunkNode.Group);
            }
        });
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
            let context = new TraverseContext(this, worldPosition, TraverseContextMode.ADD, forceRebuild);
            chunkNode.UpdateQuadTree(context);
        });

        this.needUpdate = false;
    }
    
}