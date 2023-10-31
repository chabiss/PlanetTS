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
exports.SceneEntity = exports.GraphicEngine = void 0;
const THREE = __importStar(require("three"));
const OrbitControls_js_1 = require("three/examples/jsm/controls/OrbitControls.js");
const dat_gui_1 = require("dat.gui");
class GraphicEngine {
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
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('#target')
        });
        window.addEventListener('resize', () => {
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
        this.orbitControls = new OrbitControls_js_1.OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.target.set(0, 0, 0);
        this.orbitControls.object.position.set(0, 0, -300);
        this.orbitControls.update();
        // Create the GUI
        this.gui = new dat_gui_1.GUI();
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
    DetachSceneEntity(sceneEntity) {
        let index = this.sceneEntities.indexOf(sceneEntity);
        if (index == -1) {
            throw new Error("DetachSceneNode error: Scenenode is not found in the scene");
        }
        sceneEntity.Detach();
        sceneEntity.Engine = null;
        this.sceneEntities.splice(index, 1);
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
}
exports.GraphicEngine = GraphicEngine;
class SceneEntity {
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
exports.SceneEntity = SceneEntity;
//# sourceMappingURL=ThreeTsEngine.js.map