import * as THREE from 'three';
import { TerrainChunk, TerrainResolution } from "./TerrainChunk.ts";
import { TraverseContext, TraverseContextMode } from './TraverseContext.ts';
import { TerrainChunkManager } from './TerrainChunkManager.ts';

export class QuadTreeChunkNode {
    private chunk : TerrainChunk | null;
    private children! : QuadTreeChunkNode[] | null;
    private group : THREE.Group | null;
    private radius : number;
    private markChunkForGarbageCollection : boolean = false;
    private leafNode : boolean = false;
    private selfOrDescendandVisible : boolean = false;

    constructor(chunk : TerrainChunk, radius : number, group : THREE.Group | null = null) {
        this.chunk = chunk;
        this.group = group;
        this.radius = radius;

        if(  this.group != null){        
            this.chunk.EnsureCenterWorld(this.group.matrix, radius);
        }
    }
    
    // getting for the chunk
    public get Chunk() : TerrainChunk | null {return this.chunk; };
    public get Children() : QuadTreeChunkNode[] | null {return this.children; }; 
    public get Group() : THREE.Group | null {return this.group; };
    public get MarkChunkForGarbageCollection() : boolean {return this.markChunkForGarbageCollection; };
    public set MarkChunkForGarbageCollection(value : boolean) {this.markChunkForGarbageCollection = value; };
    public get LeafNode() : boolean {return this.leafNode; };

    // Generate the children of the node
    public EnsureChildrenVisible() : boolean {  
       
        // If the were no children, create them, but they are not ready to be visible
        if(!this.EnsureChildrenNode()){
            return false;
        }

        // If the children are built, ensure they are visible   
        if(!this.AllChildrenBuilt()){
            return false;
        }
   
        return true;
    }

    private EnsureVisible() : boolean {

        if(this.chunk == null) {
            return false;
        }

        if(this.chunk.IsCommitted && !this.chunk.NeedRebuild){
            this.chunk.Show();
            return true;
        }

        return false
    }

    private EnsureChildrenNode() : boolean {
    // If children are already generated, return
        if(this.children == null && this.chunk != null) {
            // Compute the dimension of the children
            // Create the children
            this.children = [];

            // Compute the center of the children 
            const midPoint = this.chunk.Bounds.getCenter(new THREE.Vector3());
            
            // Bottom Left
            const bottomLeft = new THREE.Box3(this.chunk.Bounds.min, midPoint);
            // Bottom Right
            const bottomRight = new THREE.Box3( new THREE.Vector3(midPoint.x, this.chunk.Bounds.min.y, 0),
                                    new THREE.Vector3(this.chunk.Bounds.max.x, midPoint.y, 0));
            // Top Right 
            const topRight = new THREE.Box3(midPoint, this.chunk.Bounds.max);
            // Top Left
            const topLeft = new THREE.Box3(new THREE.Vector3(this.chunk.Bounds.min.x, midPoint.y, 0),
                                    new THREE.Vector3(midPoint.x, this.chunk.Bounds.max.y, 0));

            let newResolution : TerrainResolution = this.chunk.Resolution+1;

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

    private AllChildrenBuilt() : boolean {
        if(this.children == null) {
            return false;
        }

        for (let i = 0; i < this.children.length; i++) {
            let chunk = this.children[i].Chunk;

            if(chunk == null) {
                throw new Error("AllChildrenBuilt error: Chunk is null");
            }

            if(!chunk.IsCommitted || chunk.NeedRebuild){
                return false;
            }
        }

        return true;
    }

    DistanceTo (position : THREE.Vector3) : number {
        if(this.chunk == null) {
            throw new Error("DistanceTo error: Chunk is null");
        }
        return this.chunk.CenterWorld.distanceTo(position);
    }

    public Traverse(context : TraverseContext) : void {

        let  modeForChildren = context.Mode;

        if (context.Mode == TraverseContextMode.ADD) {
            // check the distance to the center of the chunk with context.Position
            let distance = this.DistanceTo(context.Position);

            // If the distance is greater than the diagonal of the chunk, or if we're in remove mode, we can remove the chunk
            if (this.chunk != null && (distance > this.chunk.Dimensions.x * 1.25 || this.chunk.Resolution == TerrainChunk.MaxResolution)) {
                // The node doesn't need to be subdivided, add a chunk to it
                context.AddChunkNode(this);
                this.leafNode = true;
                // if the node is ready to be shown, we can remove the children
                if(this.EnsureVisible()) {
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
        }else {
            // If we're in remove mode, we can remove the chunk
            context.RemoveChunkNode(this, true);
        }
        
        let descendantVisible = true;
        if(modeForChildren != TraverseContextMode.SKIP){
            if (this.children != null) {
                for (let i = 0; i < this.children.length; i++) {
                    context.Mode = modeForChildren;
                    this.children[i].Traverse(context);
                    if(descendantVisible && !this.children[i].selfOrDescendandVisible){
                        descendantVisible = false;
                    }
                }
            }    
        }

        this.selfOrDescendandVisible = this.leafNode? this.EnsureVisible() : descendantVisible;

        // If this is not a leaf node and all the children are visible, we can remove the chunk
        if(!this.leafNode && this.selfOrDescendandVisible){
            context.RemoveChunkNode(this, false);
        }

        if (modeForChildren == TraverseContextMode.REMOVE) {
            // remove the children 
            this.children = null;
        }
    }

    CommitToScene(terrainChunkManager: TerrainChunkManager,  forceRebuild : boolean = false) : IterableIterator<void> | null {
        let gen = null;

        if(this.chunk == null){
            throw new Error("CommitToScene error: Chunk is null");
        }

        // If the plane is not committed to the scene, commit it
        if(!this.chunk.IsCommitted){
            this.markChunkForGarbageCollection = false;
            this.chunk.Commit(terrainChunkManager, this.Group);
            this.chunk.Manager.Engine.Log("CommitToScene", "Adding plane to scene Chunk min(" + this.chunk.Bounds.min.x + "," + this.chunk.Bounds.min.y + ") max(" + this.chunk.Bounds.max.x + ", " + this.chunk.Bounds.max.y + ") Res: " + this.chunk.Resolution + "");
        }
        else {
            // If the plane is already committed, ensure it's visible
            this.EnsureVisible();
        }


        if(this.chunk.NeedRebuild || forceRebuild){
            terrainChunkManager.ScheduleChunkRebuild(this.chunk);
        }

        return gen;
    }

    UnCommitFromScene() : void
    {
        if (this.chunk != null){
            this.chunk.Uncommit(this.group)
            this.chunk.Manager.Engine.Log("CommitToScene", "Removing plane to scene Chunk min(" + this.chunk.Bounds.min.x + "," + this.chunk.Bounds.min.y + ") max(" + this.chunk.Bounds.max.x + ", " + this.chunk.Bounds.max.y + ") Res: " + this.chunk.Resolution + "");
            if (this.markChunkForGarbageCollection){
                this.chunk.Manager.GarbageCollectChunk(this.chunk);
                this.chunk = null;
            }    
        }
    }
}