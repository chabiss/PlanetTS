import * as THREE from 'three';
import { TerrainChunkManager } from '../TerrainChunkManager.ts';
import { SceneEntity } from './SceneEntity';
import { HeightMap } from '../HeightMap.ts';
import { SimplexNoiseGenerator } from '../NoiseGenerator.ts';
import { PlanetTsEngine } from './PlanetTsEngine.ts';


export class TerrainSceneEntity extends SceneEntity {
    // @ts-ignore
    private heightGenerators!: {};
    private terrainChunkManager : TerrainChunkManager;
    private cameraPosition : THREE.Vector3;
    
    constructor(){
        super("Terrain");
        this.terrainChunkManager = new TerrainChunkManager(PlanetTsEngine.PlanetRadius);
        this.cameraPosition = new THREE.Vector3(0,1000,0);         
    }

    Attach(): void {

        // this.heightMap = new Heightmap.HeightMap(this.Engine, "./resources/043-ue4-heightmap-guide-02.jpg",  (heightMap : Heightmap.HeightMap) => {
        //    this.Rebuild();});

        this.Engine.GuiParams.General = {"Wireframe": false, "QuadTreeDebug": false};
        // wireframe
        this.Engine.Gui.__folders["General"].add(this.Engine.GuiParams.General, 'Wireframe').onChange((value : boolean) => {
            this.Engine.EnableFrameMode(value);
            this.terrainChunkManager.UpdateMeshMaterial(value);
        });

        // Quadtree Debugging
        // @ts-ignore                               
        this.Engine.Gui.__folders["General"].add(this.Engine.GuiParams.General, 'QuadTreeDebug').onChange((value : boolean) => {
            this.Rebuild();
        });

        this.Engine.GuiParams.Traces = {"CommitToScene": false, "ChunkManager": false};
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
            "seed": 1};

        this.Engine.Gui.addFolder("Noise");
        // @ts-ignore                               
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'scale', 64.0, 4096.0).onChange((value : number) => {
            this.Rebuild()
        });

        // @ts-ignore                               
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'octaves', 1, 20, 1).onChange((value : number) => {
            this.Rebuild()
        });

        // @ts-ignore                               
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'persistence', 0.01, 1.0).onChange((value : number) => {
            this.Rebuild()
        });
        
        // @ts-ignore                               
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'lacunarity', 0.01, 4.0).onChange((value : number) => {
            this.Rebuild()
        });
        
        // @ts-ignore                               
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'exponentiation', 0.1, 10.0).onChange((value : number) => {
            this.Rebuild()
        });    
        
        // @ts-ignore                               
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'height', 0, 1000).onChange((value : number) => {
            this.Rebuild()
        });
        
        // Noise parameters
        this.Engine.GuiParams.TerrainTintNoise = { 
                                        "scale": 2048.0, 
                                        "octaves": 2, 
                                        "persistence": 0.5, 
                                        "lacunarity": 2.0, 
                                        "exponentiation": 3.9, 
                                        "height": 1,
                                        "seed": 2};

        this.Engine.Gui.addFolder("TerrainTintNoise");
        // @ts-ignore                                                              
        this.Engine.Gui.__folders["TerrainTintNoise"].add(this.Engine.GuiParams.TerrainTintNoise, 'scale', 64.0, 4096.0).onChange((value : number) => {
            this.Rebuild()
        });

        // @ts-ignore                               
        this.Engine.Gui.__folders["TerrainTintNoise"].add(this.Engine.GuiParams.TerrainTintNoise, 'octaves', 1, 20, 1).onChange((value : number) => {
            this.Rebuild()
        });

        // @ts-ignore                               
        this.Engine.Gui.__folders["TerrainTintNoise"].add(this.Engine.GuiParams.TerrainTintNoise, 'persistence', 0.01, 1.0).onChange((value : number) => {
            this.Rebuild()
        });
        
        // @ts-ignore                               
        this.Engine.Gui.__folders["TerrainTintNoise"].add(this.Engine.GuiParams.TerrainTintNoise, 'lacunarity', 0.01, 4.0).onChange((value : number) => {
            this.Rebuild()
        });
        
        // @ts-ignore                               
        this.Engine.Gui.__folders["TerrainTintNoise"].add(this.Engine.GuiParams.TerrainTintNoise, 'exponentiation', 0.1, 10.0).onChange((value : number) => {
            this.Rebuild()
        });    
        // @ts-ignore                               
        this.Engine.Gui.__folders["TerrainTintNoise"].add(this.Engine.GuiParams.TerrainTintNoise, 'height', 0, 1000).onChange((value : number) => {
            this.Rebuild()
        });
        
        // Create a new dictionary of IHeightGenerator
        this.heightGenerators = {
            // @ts-ignore                               
            "heightmap": new HeightMap(this.Engine, "./resources/043-ue4-heightmap-guide-02.jpg", (heightMap: Heightmap.HeightMap) => {
                // do something with the heightmap
            }),
            "simplex" : new SimplexNoiseGenerator(this.Engine.GuiParams.Noise)};

        this.Engine.Camera.position.set(0, 0, PlanetTsEngine.PlanetRadius + 1000);
        this.Engine.Camera.lookAt(0, 0, 0);

        // Attach the terrainChunkManager
        this.terrainChunkManager.Attach(this.Engine);
    }

    private Rebuild() : void {
        this.terrainChunkManager.Update(this.cameraPosition, true);
    }

    Detach(): void {

        // Detach the terrainChunkManager
        this.terrainChunkManager.Detach(this.Engine);
    }

    Update(): void {

        // let node = this.Engine.GetSceneEntity("basicNode") as BasicScenenode;
        // this.cameraPosition =  node.Position();
        this.cameraPosition = this.Engine.CameraPosition();
        
        this.terrainChunkManager.Update(this.cameraPosition);
    }
}