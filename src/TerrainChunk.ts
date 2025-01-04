import * as THREE from 'three';
import { TerrainChunkManager, TerrainResolution } from './TerrainChunkManager';


export class TerrainChunk {
    private static idgen : number = 0;
    private id : number = 0;                // Id of the chunk
    private plane! : THREE.Mesh;
    private geometry! : THREE.BufferGeometry;
    private resolution! : TerrainResolution; // resolution of the chunk
    private centerLocal! : THREE.Vector3;    // Center of the chunk in local coordinates
    private centerWorld! : THREE.Vector3;    // Center of the chunk in world coordinates
    private dimensions! : THREE.Vector3;     // Dimension of the chunk
    private bounds! : THREE.Box3;            // Bounds of the chunk
    private localToWorld! : THREE.Matrix4 | null;   // Local to world matrix
    private needRebuild! : boolean;          // Flag to indicate if the chunk needs to be rebuild
    private committed! : boolean;            // Flag to indicate if the chunk is committed to the scene
    private terrainChunkManager : TerrainChunkManager; // Reference to the terrain chunk manager managing the chunks
    private cacheGeometryData : any;         // Cache geometry data

    public get Id() : number {return this.id; };
    public get Plane() : THREE.Mesh {return this.plane; };
    public get Resolution() : TerrainResolution {return this.resolution; };
    public get CenterLocal() : THREE.Vector3 {return this.centerLocal; };
    public get CenterWorld() : THREE.Vector3 {return this.centerWorld; };
    public get Dimensions() : THREE.Vector3 {return this.dimensions; };
    public get Diagonal() : number {return this.bounds.getSize(new THREE.Vector3()).length(); };
    public get LocalToWorld() : THREE.Matrix4 | null {return this.localToWorld; };
    public get Bounds() : THREE.Box3 {return this.bounds; };
    public get IsCommitted() : boolean {return this.committed; };
    public get NeedRebuild() : boolean {return this.needRebuild; };
    public set NeedRebuild(value : boolean) {this.needRebuild = value; };
    public get Manager() : TerrainChunkManager {return this.terrainChunkManager; };
    static get MaxResolution() : TerrainResolution { return TerrainChunkManager.GetMaxResolution(); }


    constructor(terrainChunkManager : TerrainChunkManager , resolution : TerrainResolution, bounds : THREE.Box3, locaToWorld : THREE.Matrix4 | null = null) {
        this.terrainChunkManager = terrainChunkManager;
        this.Init(resolution, bounds, locaToWorld);
    }

    public Init(resolution : TerrainResolution, bounds : THREE.Box3, locaToWorld : THREE.Matrix4 | null = null) : void {
        this.id = TerrainChunk.idgen++;
        this.resolution = resolution;
        this.bounds = bounds;
        this.centerLocal = bounds.getCenter(new THREE.Vector3());
        this.dimensions = bounds.getSize(new THREE.Vector3());
        this.needRebuild = true;
        this.committed = false;
        this.localToWorld = locaToWorld;
    }

    public EnsureCenterWorld(localToWorld: THREE.Matrix4, radius : number) : void {
        this.centerWorld = this.centerLocal.clone();
        this.localToWorld = localToWorld.clone();
        this.centerWorld.applyMatrix4(this.localToWorld);

        if(!this.terrainChunkManager.Engine.GuiParams.General.SingleFaceDebug){
            this.centerWorld.normalize()
            this.centerWorld.multiplyScalar(radius);
        }
    }


    public Commit(manager : TerrainChunkManager,  group : THREE.Group | null = null) : void {
        this.EnsurePlane(manager);
        this.committed = true;

        if (group != null){
            group.add(this.plane);
        }
    }

    public Uncommit(group : THREE.Group | null = null) : void {
        this.committed = false;
        this.Hide();

        if (group != null){
            group.remove(this.plane);
        }
    }

    public CacheGeometry(data: any ) : void {
        this.cacheGeometryData = data;
    }
    
    public UpdateGeometryFromCache(frameTime : number) : void {
        
        if(this.cacheGeometryData != null){
            this.UpdateGeometry(this.cacheGeometryData, frameTime);
            this.cacheGeometryData = null;
        }
    }

    public UpdateGeometry(data : any, _frameTime : number ) : void {
        
        const positions = data.positions;
        const colors = data.colors;
        const normals = data.normals;
        const tangents = data.tangents;
        const uvs = data.uvs;
        const indices = data.indices;

        // safe time now
        let start = Date.now();

        this.geometry.setAttribute(
            'position', new THREE.Float32BufferAttribute(positions, 3));
        this.geometry.setAttribute(
            'color', new THREE.Float32BufferAttribute(colors, 3));
        this.geometry.setAttribute(
            'normal', new THREE.Float32BufferAttribute(normals, 3));    
        this.geometry.setAttribute(
            'tangent', new THREE.Float32BufferAttribute(tangents, 4));    
        this.geometry.setAttribute(
            'uv', new THREE.Float32BufferAttribute(uvs, 2));
    
        this.geometry.setIndex(
            new THREE.BufferAttribute(new Uint32Array(indices), 1));
        
        // Log the time it took to update the geometry
        let end = Date.now();
        let buildTime = end - start;

        this.Manager.Engine.Log("ChunkManager", "Updating geometry for chunk " + this.Id + " Resolution " + this.resolution.toString() + " with " + positions.length + " vertices and " + indices.length + " indices." + " build time: " + buildTime + " ms");

        this.needRebuild = false;    
    }

    public Show() : void {
        this.plane.visible = true;
    }

    public Hide () : void {
        this.plane.visible = false;
    }

    public EnsureBuilt() : IterableIterator<void> | null {

        if(!this.needRebuild) {
            return null
        }

        return this.Rebuild(false);
    }

    public Rebuild(buildMeshSynchronously : boolean = false ) : IterableIterator<void> | null {
        this.needRebuild = true;  
        let iterator = this.BuildGeometry();
        if (buildMeshSynchronously){
            while(true){
                let result = iterator.next();
                if (result.done) {
                    return null;
                }
            }
        }
        return iterator;
    }

    private EnsurePlane(manager : TerrainChunkManager) : void {
        if(this.plane == null) {
            this.geometry = new THREE.BufferGeometry();
            let plane = new THREE.Mesh(this.geometry, manager.TerrainMaterial);
            plane.castShadow = false;
            plane.receiveShadow = true;
            plane.frustumCulled = false;
            this.plane = plane;
            this.needRebuild = true;    
        }
    }

    private *BuildGeometry() : IterableIterator<void> {
      const _D = new THREE.Vector3();
      const _D1 = new THREE.Vector3();
      const _D2 = new THREE.Vector3();
      const _P = new THREE.Vector3();
      const _H = new THREE.Vector3();
      const _W = new THREE.Vector3();
      // @ts-ignore                               
      const _C = new THREE.Vector3();
      // @ts-ignore                               
      const _S = new THREE.Vector3();

      const _N = new THREE.Vector3();
      const _N1 = new THREE.Vector3();
      const _N2 = new THREE.Vector3();
      const _N3 = new THREE.Vector3();

      const positions = [];
      const colors = [];
      const normals = [];
      const tangents = [];
      const uvs = [];
      const indices = [];

      const resolution = this.terrainChunkManager.Engine.GuiParams.General.QuadTreeDebug? 1 : TerrainChunkManager.GetResolution(this.resolution);
      const radius = this.terrainChunkManager.Engine.GuiParams.General.PlanetRadius;
      const offset = this.centerLocal
      const width = this.Dimensions.x;
      const half = width / 2;

      for (let x = 0; x < resolution + 1; x++) {
        const xp = width * x / resolution;
        for (let y = 0; y < resolution + 1; y++) {
          const yp = width * y / resolution;
          
          // unless we're in SingleSurfaceDebug mode
          if(this.terrainChunkManager.Engine.GuiParams.General.SingleFaceDebug) {
            // Compute position
            _P.set(xp - half, yp - half, 0);
            _P.add(offset);
            //_P.normalize();
            _D.copy(_P);
            //_P.multiplyScalar(radius);
            //_P.z -= radius;
          } else {
            // Compute position
            _P.set(xp - half, yp - half, radius);
            _P.add(offset);
            _P.normalize();
            _D.copy(_P);
            _P.multiplyScalar(radius);
            _P.z -= radius;
          } 
    
          // Compute a world space position to sample noise
          _W.copy(_P);
          if (this.localToWorld != null)
          {
            _W.applyMatrix4(this.localToWorld);
          }
          
          const height = this.terrainChunkManager.HeightGenerator.GeHeightFromNCoord(_W.x, _W.y, _W.z);
          // const color = this._params.colourGenerator.Get(_W.x, _W.y, height);
          let  color = null;
          if(this.terrainChunkManager.Engine.GuiParams.General.QuadTreeDebug){
            color = new THREE.Color();
            color.setHex(this.ResolutionToColor(this.resolution));
          }else {
            color = this.terrainChunkManager.HyposemetricTints.Get(_W.x, _W.y, height);
          }

          // Purturb height along z-vector
          _H.copy(_D);
          if(!this.terrainChunkManager.Engine.GuiParams.General.QuadTreeDebug){
            if(this.terrainChunkManager.Engine.GuiParams.General.SingleFaceDebug){
                _H.z += height;
              } else { 
                _H.multiplyScalar(height);
              }
              _P.add(_H);    
          }

          positions.push(_P.x, _P.y, _P.z);
          colors.push(color.r, color.g, color.b);
          normals.push(_D.x, _D.y, _D.z);
          tangents.push(1, 0, 0, 1);
          uvs.push(_P.x / 10, _P.y / 10);
        }
      }
      yield;

      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          indices.push(
              i * (resolution + 1) + j,
              (i + 1) * (resolution + 1) + j + 1,
              i * (resolution + 1) + j + 1);
          indices.push(
              (i + 1) * (resolution + 1) + j,
              (i + 1) * (resolution + 1) + j + 1,
              i * (resolution + 1) + j);
        }
      }
      yield;

      for (let i = 0, n = indices.length; i < n; i+= 3) {
        const i1 = indices[i] * 3;
        const i2 = indices[i+1] * 3;
        const i3 = indices[i+2] * 3;

        _N1.fromArray(positions, i1);
        _N2.fromArray(positions, i2);
        _N3.fromArray(positions, i3);

        _D1.subVectors(_N3, _N2);
        _D2.subVectors(_N1, _N2);
        _D1.cross(_D2);

        normals[i1] += _D1.x;
        normals[i2] += _D1.x;
        normals[i3] += _D1.x;

        normals[i1+1] += _D1.y;
        normals[i2+1] += _D1.y;
        normals[i3+1] += _D1.y;

        normals[i1+2] += _D1.z;
        normals[i2+2] += _D1.z;
        normals[i3+2] += _D1.z;
      }
      yield;

      for (let i = 0, n = normals.length; i < n; i+=3) {
        _N.fromArray(normals, i);
        _N.normalize();
        normals[i] = _N.x;
        normals[i+1] = _N.y;
        normals[i+2] = _N.z;
      }
      yield;

      this.geometry.setAttribute(
          'position', new THREE.Float32BufferAttribute(positions, 3));
      this.geometry.setAttribute(
          'color', new THREE.Float32BufferAttribute(colors, 3));
      this.geometry.setAttribute(
          'normal', new THREE.Float32BufferAttribute(normals, 3));
      this.geometry.setAttribute(
          'tangent', new THREE.Float32BufferAttribute(tangents, 4));
      this.geometry.setAttribute(
          'uv', new THREE.Float32BufferAttribute(uvs, 2));
      this.geometry.setIndex(
          new THREE.BufferAttribute(new Uint32Array(indices), 1));

      this.needRebuild = false;
    }

    // @ts-ignore
    private ApplyHeightMapToPlane(plane : THREE.Mesh, heightGenerator : ThreeTsEngine.IHeightGenerator, centerWorld : THREE.Vector3,  worldDimension: number) : void {
        // Let's iterate over the vertices and apply a height map to them
        let vMin = new THREE.Vector3(worldDimension, worldDimension, worldDimension);
        let vMax = new THREE.Vector3(-worldDimension / 2, -worldDimension / 2, -worldDimension/2);

        let positionAttribute = plane.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < positionAttribute.count; i ++) {
            let v = new THREE.Vector3();
            v.fromBufferAttribute(positionAttribute, i);
            vMin.min(v);
            vMax.max(v);
        }

        // @ts-ignore
        let vRange = new THREE.Vector3(worldDimension, worldDimension, worldDimension);

        for (let i = 0; i < positionAttribute.count; i ++) {
            let v = new THREE.Vector3();
            v.fromBufferAttribute(positionAttribute, i);
            let v2 = new THREE.Vector3(v.x, v.y, v.z);
            // Because the verices are not transformed, we need to transform them to the normalized coordinate system of the world coordinate
            // since all plane in three.js are created in the plane x and y, the noise needs to be sample on y and world coordinate of z. 
            // Once we generate the vertice automatically, we won't need to do this anymore 
            let vector2Normalized = new THREE.Vector3((v2.x + centerWorld.x), (-v2.y + centerWorld.z), 0);
            let height = heightGenerator.GeHeightFromNCoord(vector2Normalized.x, vector2Normalized.y, vector2Normalized.z);
            v.z = height;
            positionAttribute.setXYZ(i, v.x, v.y, v.z);
            // console.log("Vertex : v.x: " + v.x + " v.y: " + v.y + " v.z: " + v.z)
        }
        positionAttribute.needsUpdate = true;
        plane.geometry.computeVertexNormals();
    }

    private ResolutionToColor(resolution : TerrainResolution) : number {
        switch(resolution) {
            case TerrainResolution.RES_1:
                return 0xFFFFFF;
            case TerrainResolution.RES_2:
                return 0x00FF00;
            case TerrainResolution.RES_3:
                return 0x0000FF;
            case TerrainResolution.RES_4:
                return 0x00FFFF;
            case TerrainResolution.RES_5:
                return 0xFFFF00;
            case TerrainResolution.RES_6:
                return 0xFF00FF;
            default:
                return 0xFF0000;
        }
    }
}