import * as THREE from 'three';
import { QuadTreeChunkNode } from './QuadTreeChunkNode.ts';

export enum TraverseContextMode {
    ADD,                // In this mode, we're adding chunks to the scene if the meet the criteria for insertion
    REMOVE,             // In this mode, we're removing chunks from the scene if they meet the criteria for removal
    SKIP                // In this mode, nodes are skip and traversal is not longer recursive for a given node
}

export class TraverseContext {
    private addedChunks : QuadTreeChunkNode[];
    private removedChunks : QuadTreeChunkNode[];
    private position : THREE.Vector3;
    private mode : TraverseContextMode;
    private forceRebuild : boolean;

    constructor(position : THREE.Vector3, mode : TraverseContextMode = TraverseContextMode.ADD, forceRebuild : boolean = false) {
        this.addedChunks = [];
        this.removedChunks = [];
        this.position = position;
        this.mode = mode;
        this.forceRebuild = forceRebuild;
    }
    
    public AddChunkNode(chunkNode : QuadTreeChunkNode) : void {
        
        if(chunkNode.Chunk != null && chunkNode.Chunk.IsCommitted && !this.forceRebuild) {
            return;
        }

        this.addedChunks.push(chunkNode);
    }

    public RemoveChunkNode(chunkNode : QuadTreeChunkNode, markChunkForGarbageCollection : boolean) : void {

        if(chunkNode.Chunk == null){
            return;
        }
        
        // if this chunk is not committed, not need to remove it again
        if(!chunkNode.Chunk.IsCommitted) {   
            return;
        }

        chunkNode.MarkChunkForGarbageCollection = markChunkForGarbageCollection;
   
        this.removedChunks.push(chunkNode);
    }

    public get AddedChunkNodes() : QuadTreeChunkNode[] {return this.addedChunks; };
    public get RemovedChunkNodes() : QuadTreeChunkNode[] {return this.removedChunks; };
    public set Mode(mode : TraverseContextMode) {this.mode = mode; };
    public get Mode() : TraverseContextMode {return this.mode; };
    public get Position() : THREE.Vector3 {return this.position; };
}