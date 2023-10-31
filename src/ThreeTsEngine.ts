import * as THREE from "three"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {GUI} from "dat.gui";

export class GraphicEngine {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer : THREE.WebGLRenderer;
    private sceneEntities : SceneEntity[];
    private orbitControls : OrbitControls;
    private gui : GUI;
    private guiParams : any;

    // Texture manager
    private textureLoader : THREE.TextureLoader;
    private loadingManager : THREE.LoadingManager;
    private textures : any;


    constructor(){
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer =  new THREE.WebGLRenderer({
            canvas: document.querySelector('#target')
        });
        window.addEventListener('resize', ()=>{
            this.OnWindowResize();
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.position.setZ(30);

        // initialize the Scenes
        this.sceneEntities = [];

        // Create the grid helper
        const gridHelper = new THREE.GridHelper(500, 50);
        this.scene.add(gridHelper);

        // Create OrbitControl
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.target.set(0,0,0);
        this.orbitControls.object.position.set(0, 0, -300);
        this.orbitControls.update();

        // Create the GUI
        this.gui = new GUI();
        this.gui.addFolder("General")
        this.guiParams = {
            General : {
        }
        };

        // Initialize the texture loader
        this.loadingManager = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        this.textures = {};
    }

    get Gui() : GUI { return this.gui; }
    get GuiParams() : any { return this.guiParams; }

    OnWindowResize() : void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }

    Render() : void {
        this.sceneEntities.forEach(node =>{
            node.Update();
        });

        this.renderer.render(this.scene, this.camera);
    }
    
    AddObject3DToScene(mesh: THREE.Object3D) : void {
        this.scene.add(mesh);
    }

    RemoveObject3DFromScene(mesh: THREE.Object3D) : void {
        this.scene.remove(mesh);
    }

    AttachSceneEntity(sceneEntity : SceneEntity) {
        // Not expected to Attach an already attached SceneNode
        if (sceneEntity.IsAttached){
            throw new Error("AttachSceneNode error: SceneNode is already attached");
        }

        sceneEntity.Engine = this;
        sceneEntity.Attach();
        this.sceneEntities.push(sceneEntity);
    }

    DetachSceneEntity(sceneEntity : SceneEntity) {
        let index = this.sceneEntities.indexOf(sceneEntity);
        if(index == -1 ){
            throw new Error("DetachSceneNode error: Scenenode is not found in the scene");
        }
        sceneEntity.Detach();
        sceneEntity.Engine = null;
        this.sceneEntities.splice(index, 1);    
    }
    
    GetTexture(texturePath : string, onLoad?: (texture: THREE.Texture) => void) {

        // if the texture is already loaded, return it
        if (this.textures[texturePath] != null) {
            onLoad(this.textures[texturePath]);
        }

        // Wait for texture to be loaded
        this.textureLoader.load(texturePath, (result) => {
            this.textures[texturePath] = result.image;
            onLoad(result.image);
        });
    }
}

export abstract class SceneEntity {
    private graphicEngine : GraphicEngine;
    private isAttached : boolean;
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

export interface IHeightGenerator {
    GeHeightFromNCoord(x : number, y : number): number;
}
