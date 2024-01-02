import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
export class GraphicEngine {
    scene;
    camera;
    renderer;
    sceneEntities;
    orbitControls;
    gui;
    guiParams;
    // Texture manager
    textureLoader;
    loadingManager;
    textures;
    // create a dictionay of keys that map to a boolean value
    keyState = {};
    // Some keys map
    // Define an object to hold the state of the keys
    static Keys = {
        LEFT_ARROW: 37,
        RIGHT_ARROW: 39,
        UP_ARROW: 38,
        DOWN_ARROW: 40,
        SPACE: 32,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        KEYPAD_PLUS: 107,
        KEYPAD_MINUS: 109,
        KEYPAD_MULTIPLY: 106,
        KEYPAD_DIVIDE: 111,
        KEYPAD_0: 96,
        KEYPAD_1: 97,
        KEYPAD_2: 98,
        KEYPAD_3: 99,
        KEYPAD_4: 100,
        KEYPAD_5: 101,
        KEYPAD_6: 102,
        KEYPAD_7: 103,
        KEYPAD_8: 104,
        KEYPAD_9: 105,
    };
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('#target')
        });
        window.addEventListener('resize', () => {
            this.OnWindowResize();
        });
        window.addEventListener('keydown', (event) => {
            this.HandleKeyDown(event);
        });
        window.addEventListener('keyup', (event) => {
            this.HandleKeyUp(event);
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // position the camera to look at positive z axis
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.position.setZ(300);
        // initialize the Scenes
        this.sceneEntities = [];
        // Create the grid helper
        // const gridHelper = new THREE.GridHelper(500, 50);
        // this.scene.add(gridHelper);
        // Create OrbitControl
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.target.set(0, 0, 0);
        this.orbitControls.object.position.set(0, 0, 300);
        this.orbitControls.update();
        // Create the GUI
        this.gui = new GUI();
        this.gui.addFolder("General");
        this.guiParams = {
            General: {}
        };
        // Initialize the texture loader
        this.loadingManager = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        this.textures = {};
    }
    get Gui() { return this.gui; }
    get GuiParams() { return this.guiParams; }
    get Camera() { return this.camera; }
    OnWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    Render() {
        this.sceneEntities.forEach(node => {
            node.Update();
        });
        this.renderer.render(this.scene, this.camera);
    }
    AddObject3DToScene(mesh) {
        this.scene.add(mesh);
    }
    RemoveObject3DFromScene(mesh) {
        this.scene.remove(mesh);
    }
    AttachSceneEntity(sceneEntity) {
        // Not expected to Attach an already attached SceneNode
        if (sceneEntity.IsAttached) {
            throw new Error("AttachSceneNode error: SceneNode is already attached");
        }
        sceneEntity.Engine = this;
        sceneEntity.Attach();
        this.sceneEntities.push(sceneEntity);
    }
    HandleKeyUp(event) {
        // map the key to the key state in the dictionary'
        this.keyState[event.keyCode] = false;
    }
    HandleKeyDown(event) {
        // map the key to the key state in the dictionary'
        this.keyState[event.keyCode] = true;
    }
    DetachSceneEntity(sceneEntity) {
        let index = this.sceneEntities.indexOf(sceneEntity);
        if (index == -1) {
            throw new Error("DetachSceneNode error: Scenenode is not found in the scene");
        }
        sceneEntity.Detach();
        sceneEntity.Engine = null;
        this.sceneEntities.splice(index, 1);
    }
    CameraPosition() {
        return this.camera.position;
    }
    GetSceneEntity(entityName) {
        let result = this.sceneEntities.find((node) => {
            return node.Name == entityName;
        });
        return result;
    }
    GetTexture(texturePath, onLoad) {
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
    EnableFrameMode(enable) {
        // for each scene mesh in the scene, set the wireframe mode
        this.scene.traverse((node) => {
            if (node instanceof THREE.Mesh) {
                node.material.wireframe = enable;
            }
        });
    }
    IskeyPressed(key) {
        // check if the entry exists in the dictionary
        if (this.keyState[key] == null) {
            return false;
        }
        return this.keyState[key];
    }
}
export class SceneEntity {
    graphicEngine;
    isAttached;
    name;
    constructor(name) {
        this.name = name;
    }
    ;
    get Name() {
        return this.name;
    }
    get IsAttached() {
        return this.isAttached;
    }
    get Engine() {
        return this.graphicEngine;
    }
    set Engine(value) {
        this.graphicEngine = value;
    }
    set IsAttached(value) {
        this.isAttached = value;
    }
}
//# sourceMappingURL=ThreeTsEngine.js.map