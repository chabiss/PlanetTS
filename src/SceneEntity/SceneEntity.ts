import { GraphicEngine } from "../GraphicEngine.ts";

export abstract class SceneEntity {
    private graphicEngine! : GraphicEngine;
    private isAttached! : boolean;
    private name : string;

    constructor(name: string) {
        this.name = name;
    };

    get Name() : string {
        return this.name;
    }

    get IsAttached() : boolean {
        return this.isAttached;
    }

    get Engine() : GraphicEngine {
        return this.graphicEngine;
    }

    set Engine(value : GraphicEngine) {
        this.graphicEngine = value;
    }   

    private set IsAttached(value: boolean) {
        this.isAttached = value;
    }

    // Attach the SceneNode to the Scene
    abstract Attach() : void 
    // Detach the SceneNode to the Scene
    abstract Detach() : void
    // Update the SceneNode
    abstract Update(): void
}