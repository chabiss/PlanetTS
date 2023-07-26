import * as THREE from 'three';
import * as ThreeTsEngine from './ThreeTsEngine.js'
import * as UnitTest from './UnitTests.js'
import * as Heightmap from './HeightMap.js'
import { SimplexNoiseGenerator } from './NoiseGenerator.js';

export class PlanetTsEngine extends ThreeTsEngine.GraphicEngine {
    constructor(){
        super();
        const BasicNode = new BasicScenenode();
        //this.AttachSceneEntity(BasicNode);
        this.AttachSceneEntity(new LightSceneEntity());
        this.AttachSceneEntity(new TerrainSceneEntity());
        this.AttachSceneEntity(new UnitTest.UniTests());
    }
    Render() : void {
        super.Render();
    }
}

const PLANEWIDTH = 500;
const PLANEHEIGHT = 500;
const PLANEXRES = 60;
const planeYRes = 60;

export enum TerrainResolution {
    RES_50 = 50,
    RES_100 = 100,
    RES_200 = 200,
    RES_400 = 400,
    RES_800 = 800,
    RES_1600 = 1600
};

export class TerrainChunk {
    private mesh : THREE.Mesh;
    private planes : THREE.Mesh[];
    private resolution : TerrainResolution;        // resolution of the chunk
    private centerWorld : THREE.Vector3;    // Center of the chunk in world coordinates
    private dimensions : THREE.Vector2;    // Dimension of the chunk

    // Generate an enum of 6 resolutions
    
    
    constructor(resolution : TerrainResolution, centerWorld : THREE.Vector3, dimensions : THREE.Vector2) {
        this.resolution = resolution;
        this.centerWorld = centerWorld;
        this.dimensions = dimensions;
    }

    public GeneratePlane() : THREE.Mesh {
        let planeGeometry = new THREE.PlaneGeometry(this.dimensions.x, this.dimensions.y, this.resolution, this.resolution);
        let planeMaterial = new THREE.MeshStandardMaterial({color: this.ResolutionToColor(this.resolution), side: THREE.FrontSide});
        let plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotateX(-Math.PI / 2);
        plane.position.set(this.centerWorld.x-this.dimensions.x, this.centerWorld.y-this.dimensions.y, this.centerWorld.z);   
        return plane;
    }

    public get Mesh() : THREE.Mesh {return this.mesh; };
    public get Resolution() : number {return this.resolution; };
    public get CenterWorld() : THREE.Vector3 {return this.centerWorld; };
    public get Dimensions() : THREE.Vector2 {return this.dimensions; };

    private ResolutionToColor(resolution : TerrainResolution) : number {
        switch(resolution) {
            case 50:
                return 0xFFFFFF;
            case 100:
                return 0x00FF00;
            case 200:
                return 0x0000FF;
            case 400:
                return 0x00FFFF;
            case 800:
                return 0xFFFF00;
            case 1600:
                return 0xFF00FF;
            default:
                return 0xFF0000;
        }
    }
}

export class TraverseContext {
    private addedChunks : TerrainChunk[];
    private removedChunks : TerrainChunk[];
    private position : THREE.Vector3;

    constructor(position : THREE.Vector3) {
        this.addedChunks = [];
        this.removedChunks = [];
        this.position = position;
    }

    public AddChunk(chunk : TerrainChunk) : void {
        this.addedChunks.push(chunk);
    }

    public RemoveChunk(chunk : TerrainChunk) : void {
        this.removedChunks.push(chunk);
    }

    public get AddedChunks() : TerrainChunk[] {return this.addedChunks; };
    public get RemovedChunks() : TerrainChunk[] {return this.removedChunks; };
}


export class QuadTreeChunkNode {
    private chunk : TerrainChunk;
    private children : QuadTreeChunkNode[];

    constructor(chunk : TerrainChunk){
        this.chunk = chunk;
    }
    
    // getting for the chunk
    public get Chunk() : TerrainChunk {return this.chunk; };
    public get Children() : QuadTreeChunkNode[] {return this.children; }; 

    // Generate the children of the node
    public EnsureChildren() : void {  
        
        // If children are already generated, return
        if(this.children != null) {
            return;
        }

        // Compute the dimension of the children
        let childDimension = new THREE.Vector2(this.chunk.Dimensions.x / 2, this.chunk.Dimensions.y / 2);
        // Create the children
        this.children = [];

        // Compute the center of the children 
        // Bottom left
        let childCenter = new THREE.Vector3(this.chunk.CenterWorld.x - childDimension.x / 2, childDimension.y - this.chunk.Dimensions.y / 2, this.chunk.CenterWorld.z);
        this.children.push(new QuadTreeChunkNode(new TerrainChunk(this.chunk.Resolution * 2, childCenter, childDimension)));

        // Bottom right
        childCenter = new THREE.Vector3(this.chunk.CenterWorld.x + this.chunk.Dimensions.x / 2, this.chunk.CenterWorld.y - this.chunk.Dimensions.y / 2, this.chunk.CenterWorld.z);
        this.children.push(new QuadTreeChunkNode(new TerrainChunk(this.chunk.Resolution * 2, childCenter, childDimension)));

        // Top Right
        childCenter = new THREE.Vector3(this.chunk.CenterWorld.x + this.chunk.Dimensions.x / 2, this.chunk.CenterWorld.y + this.chunk.Dimensions.y / 2, this.chunk.CenterWorld.z);
        this.children.push(new QuadTreeChunkNode(new TerrainChunk(this.chunk.Resolution * 2, childCenter, childDimension)));
        
        // Top left
        childCenter = new THREE.Vector3(this.chunk.CenterWorld.x - this.chunk.Dimensions.x / 2, this.chunk.CenterWorld.y + this.chunk.Dimensions.y / 2, this.chunk.CenterWorld.z);
        this.children.push(new QuadTreeChunkNode(new TerrainChunk(this.chunk.Resolution * 2, childCenter, childDimension)));
    }

    DistanceTo (position : THREE.Vector3) : number {
        return this.chunk.CenterWorld.distanceTo(position);
    }

    public Traverse() : void {

        if (this.children != null) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].Traverse();
            }
        }
    }
}

export class QuadTreeChunk {
    private rootNode : QuadTreeChunkNode;
    
    constructor(terrainChunk : TerrainChunk) {
        this.rootNode = new QuadTreeChunkNode(terrainChunk);
    }

    public Compute(centerWorld : THREE.Vector3) : QuadTreeChunkNode[] {
        // Compute the chunk that contains the world position
        this.rootNode.EnsureChildren();

        QuadTreeChunkNode[] result = []
            
        return null;
    }

    private ComputeChunk(worldPosition: THREE.Vector3) : QuadTreeChunkNode[] {

    }

}

class TerrainChunkManager { 
    // keep track of the current wolrd position
    private cachedPosition : THREE.Vector3;
    private initialFaceDimension : number;

    constructor(initialFaceDimension : number) {
       this.cachedPosition = new THREE.Vector3(0,0,0);     
       this.initialFaceDimension = initialFaceDimension;
    }

    public Update(engine : PlanetTsEngine, worldPosition : THREE.Vector3) : void {
        // Compute the chunk that contains the world position
        let chunk = this.ComputeChunk(worldPosition);
        // Generate the chunk if needed
        this.GenerateChunk(engine, chunk);
        // Remove the chunks that are too far
        this.RemoveFarChunks(engine, chunk);
    }

    ComputeChunk(worldPosition: THREE.Vector3) : [TerrainChunk[], TerrainChunk[]] {

        // If the cache world position didn't change, return no changes
        if (this.cachedPosition.equals(worldPosition)) {
            return null;
        }

        // Compute the chunk that contains the world position        

        return null
    }
    GenerateChunk(engine: PlanetTsEngine, chunk: any) {
        throw new Error('Method not implemented.');
    }
    RemoveFarChunks(engine: PlanetTsEngine, chunk: any) {
        throw new Error('Method not implemented.');
    }
}

class TerrainSceneEntity extends ThreeTsEngine.SceneEntity {
    private mesh : THREE.Mesh;
    private planes : THREE.Mesh[];
    private heightMap : Heightmap.HeightMap;
    private heightGenerators: {};
    
    constructor(){
        super("Terrain");
        this.planes = [];
         
        this.planes[0] = this.CreatePlane(0xFF0000);
        this.planes[0].rotateX(Math.PI / 2);
        this.planes[0].position.set(0, -250, 0);
        
        this.planes[1] = this.CreatePlane(0xFFFFFF);
        this.planes[1].rotateX(-Math.PI / 2);
        this.planes[1].position.set(0, 250, 0);

        this.planes[2] = this.CreatePlane(0x0000FF);
        this.planes[2].rotateY(Math.PI / 2);
        this.planes[2].position.set(250, 0, 0);

        this.planes[3] = this.CreatePlane(0x00FFFF);
        this.planes[3].rotateY(-Math.PI / 2);
        this.planes[3].position.set(-250, 0, 0);

        this.planes[4] = this.CreatePlane(0xFFFF00);
        this.planes[4].position.set(0, 0, 250);

        this.planes[5] = this.CreatePlane(0xFF00FF);
        this.planes[5].rotateY(Math.PI);
        this.planes[5].position.set(0, 0, -250);

    }

    private CreatePlane(planeColor : number) : THREE.Mesh {
        let planeGeometry = new THREE.PlaneGeometry(PLANEWIDTH, PLANEHEIGHT, PLANEXRES, planeYRes);
        let planeMaterial = new THREE.MeshStandardMaterial({color: planeColor, side: THREE.FrontSide});
        let plane = new THREE.Mesh(planeGeometry, planeMaterial);
        return plane;
    }

    private ApplyHeightMapToPlane(plane : THREE.Mesh, heightGenerator : ThreeTsEngine.IHeightGenerator) : void {
        // Let's iterate over the vertices and apply a height map to them
        let vMin = new THREE.Vector3(PLANEWIDTH / 2, PLANEHEIGHT / 2);
        let vMax = new THREE.Vector3(-PLANEWIDTH / 2, -PLANEHEIGHT / 2);

        let positionAttribute = plane.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < positionAttribute.count; i ++) {
            let v = new THREE.Vector3();
            v.fromBufferAttribute(positionAttribute, i);
            vMin.min(v);
            vMax.max(v);
        }

        let vRange = new THREE.Vector2(vMax.x - vMin.x, vMax.y - vMin.y);

        for (let i = 0; i < positionAttribute.count; i ++) {
            let v = new THREE.Vector3();
            v.fromBufferAttribute(positionAttribute, i);
            let vector2Normalized = new THREE.Vector2((v.x - vMin.x) / vRange.x, (v.y - vMin.y) / vRange.y);
            let height = heightGenerator.GeHeightFromNCoord(v.x, v.y);
            v.z = height;
            positionAttribute.setXYZ(i, v.x, v.y, v.z);
            // console.log("Vertex : v.x: " + v.x + " v.y: " + v.y + " v.z: " + v.z)
        }
        positionAttribute.needsUpdate = true;
        plane.geometry.computeVertexNormals();
    }

    Attach(): void {
        // add each plane
        this.planes.forEach(plane => {  
            this.Engine.AddObject3DToScene(plane);
        });

        this.heightMap = new Heightmap.HeightMap(this.Engine, "./resources/043-ue4-heightmap-guide-02.jpg",  (heightMap : Heightmap.HeightMap) => {
            this.Rebuild();});

        // wireframe
        this.Engine.GuiParams.General = {"Wireframe": false};
        this.Engine.Gui.__folders["General"].add(this.Engine.GuiParams.General, 'Wireframe').onChange((value : boolean) => {
            this.planes.forEach(plane => {
                // cast material to MeshStandardMaterial
                let material = plane.material as THREE.MeshStandardMaterial;
                material.wireframe = value;
                material.needsUpdate = true;
            });

        });

        // Noise parameters
        this.Engine.GuiParams.Noise = { "scale": 215.0, 
                                        "octaves": 7, 
                                        "persistence": 0.91, 
                                        "lacunarity": 1.9, 
                                        "exponentiation": 4.2, 
                                        "height": 70.7 };

        this.Engine.Gui.addFolder("Noise");                               
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'scale', 64.0, 4096.0).onChange((value : number) => {
            this.Rebuild()
        });

        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'octaves', 1, 20, 1).onChange((value : number) => {
            this.Rebuild()
        });

        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'persistence', 0.01, 1.0).onChange((value : number) => {
            this.Rebuild()
        });
        
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'lacunarity', 0.01, 4.0).onChange((value : number) => {
            this.Rebuild()
        });
        
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'exponentiation', 0.1, 10.0).onChange((value : number) => {
            this.Rebuild()
        });    
        
        this.Engine.Gui.__folders["Noise"].add(this.Engine.GuiParams.Noise, 'height', 0, 1000).onChange((value : number) => {
            this.Rebuild()
        }); 
        
        // Create a new dictionary of IHeightGenerator
        this.heightGenerators = {
            "heightmap": new Heightmap.HeightMap(this.Engine, "./resources/043-ue4-heightmap-guide-02.jpg", (heightMap: Heightmap.HeightMap) => {
                // do something with the heightmap
            }),
            "simplex" : new SimplexNoiseGenerator(this.Engine.GuiParams)};
    }

    private Rebuild() : void {
        this.planes.forEach(plane => {
            this.ApplyHeightMapToPlane(plane,this.heightGenerators["simplex"]);    
        });    
    }

    Detach(): void {
        // remove each plane
        this.planes.forEach(plane => {  
            this.Engine.RemoveObject3DFromScene(plane);
        });
    }

    Update(): void {
    }
}


class LightSceneEntity extends ThreeTsEngine.SceneEntity {
    private directionalLight : THREE.Light;
    private ambientLight : THREE.Light;
    
    constructor(){
        super("Light");
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.directionalLight.position.set(1000, 1000, 0);

        this.ambientLight = new THREE.AmbientLight(0x404040);
    }

    Attach(): void {
        this.Engine.AddObject3DToScene(this.directionalLight);
        this.Engine.AddObject3DToScene(this.ambientLight);
    }

    Detach(): void {
        this.Engine.RemoveObject3DFromScene(this.directionalLight);
        this.Engine.RemoveObject3DFromScene(this.ambientLight);
    }

    Update(): void {
    }
}

class BasicScenenode extends ThreeTsEngine.SceneEntity {
    private mesh : THREE.Mesh;
    
    constructor(){
        super("basicNode");
        const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
        const material = new THREE.MeshBasicMaterial({color: 0xFF6347, wireframe: true});
        this.mesh = new THREE.Mesh(geometry, material);
    }

    Attach(): void {
        this.Engine.AddObject3DToScene(this.mesh);
    }

    Detach(): void {
        this.Engine.RemoveObject3DFromScene(this.mesh);
    }

    Update(): void {
        this.mesh.rotation.x += 0.01;
        this.mesh.rotation.y += 0.005;
    }
}

