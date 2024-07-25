import * as THREE from 'three';
import { SimplexNoiseGenerator } from './NoiseGenerator.ts';
import { HyposemetricTints } from './ColorGenerator.ts';
import { TerrainResolution } from './TerrainChunk.ts';

class TerrainBuildGeometryworker {
    private heightGenerator! : SimplexNoiseGenerator;
    private hyposemetricTints! : HyposemetricTints;
    private params : any;

    constructor() {
    }

    Init(params : any) {
        console.log("Init");
        this.heightGenerator = new SimplexNoiseGenerator(params.Noise);
        this.hyposemetricTints = new HyposemetricTints(new SimplexNoiseGenerator(params.TerrainTintNoise));
        this.heightGenerator.GeHeightFromNCoord(0, 0, 0);
        this.params = params;
    }

    BuildGeometry() : any {
        console.log("BuildGeometry");

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
      
            const resolution = this.params.TerrainChunk.Resolution;
            const radius = this.params.TerrainChunk.Radius;
            const localToWorld = this.params.TerrainChunk.localToWorld;
            const offset = new THREE.Vector3(this.params.TerrainChunk.CenterLocal.x, this.params.TerrainChunk.CenterLocal.y, this.params.TerrainChunk.CenterLocal.z);
            const width = this.params.TerrainChunk.Size.x;
            const half = width / 2;
      
            for (let x = 0; x < resolution + 1; x++) {
              const xp = width * x / resolution;
              for (let y = 0; y < resolution + 1; y++) {
                const yp = width * y / resolution;
      
                // Compute position
                _P.set(xp - half, yp - half, radius);
                _P.add(offset);
                _P.normalize();
                _D.copy(_P);
                _P.multiplyScalar(radius);
                _P.z -= radius;
      
                // Compute a world space position to sample noise
                _W.copy(_P);
                _W.applyMatrix4(localToWorld);

                
                const height = this.heightGenerator.GeHeightFromNCoord(_W.x, _W.y, _W.z);
                // const color = this._params.colourGenerator.Get(_W.x, _W.y, height);
                let  color = null;
                if(this.params.Debug.QuadTreeDebug) {
                  color = new THREE.Color();
                  color.setHex(this.ResolutionToColor(this.params.TerrainChunk.TerrainResolution));
                }else {
                  color = this.hyposemetricTints.Get(_W.x, _W.y, height);
                }
      
                // Purturb height along z-vector
                _H.copy(_D);
                _H.multiplyScalar(height);
                _P.add(_H);
      
                positions.push(_P.x, _P.y, _P.z);
                colors.push(color.r, color.g, color.b);
                normals.push(_D.x, _D.y, _D.z);
                tangents.push(1, 0, 0, 1);
                uvs.push(_P.x / 10, _P.y / 10);
              }
            }
      
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
      
            for (let i = 0, n = normals.length; i < n; i+=3) {
              _N.fromArray(normals, i);
              _N.normalize();
              normals[i] = _N.x;
              normals[i+1] = _N.y;
              normals[i+2] = _N.z;
            }

            const bytesInFloat32 = 4;
            const positionsArray = new Float32Array(
                new ArrayBuffer(bytesInFloat32 * positions.length));
            const coloursArray = new Float32Array(
                new ArrayBuffer(bytesInFloat32 * colors.length));
            const normalsArray = new Float32Array(
                new ArrayBuffer(bytesInFloat32 * normals.length));
            const tangentsArray = new Float32Array(
                new ArrayBuffer(bytesInFloat32 * tangents.length));
            const uvsArray = new Float32Array(
                new ArrayBuffer(bytesInFloat32 * uvs.length));
            const indicesArray = new Uint32Array(
                new ArrayBuffer(4 * indices.length));
                
            positionsArray.set(positions);
            coloursArray.set(colors);
            normalsArray.set(normals);
            tangentsArray.set(tangents);
            uvsArray.set(uvs);
            indicesArray.set(indices);
      
            return {
              positions: positionsArray,
              colors: coloursArray,
              normals: normalsArray,
              tangents: tangentsArray,
              uvs: uvsArray,
              indices: indicesArray
            };
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


self.onmessage = (m : any) => {
    const terrainBuildGeometryworker = new TerrainBuildGeometryworker();

    if(m.data.message == "Build_Geometry") {
        terrainBuildGeometryworker.Init(m.data.data);
        console.log("Receiving: Build_Geometry", m.data);
        const result = terrainBuildGeometryworker.BuildGeometry();

        let time = Math.floor(Math.random() * 10000);
        // wait 4 seconds
        setTimeout(() => {
        self.postMessage({ message: "Build_Geometry Completed", data: result });
        }, time);
    }
}
export { };