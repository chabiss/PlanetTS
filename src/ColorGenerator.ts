import * as THREE from "three"
import * as MathHelper from './MathHelper.ts'
import { IHeightGenerator } from './IHeighGenerator.ts'

//@ts-ignore: TS6133
const _WHITE = new THREE.Color(0x808080);

const _DEEP_OCEAN = new THREE.Color(0x20020FF);
const _SHALLOW_OCEAN = new THREE.Color(0x8080FF);
//@ts-ignore: TS6133
const _BEACH = new THREE.Color(0xd9d592);
const _SNOW = new THREE.Color(0xFFFFFF);
//@ts-ignore: TS6133
const _FOREST_TROPICAL = new THREE.Color(0x4f9f0f);
//@ts-ignore: TS6133
const _FOREST_TEMPERATE = new THREE.Color(0x2b960e);
//@ts-ignore: TS6133
const _FOREST_BOREAL = new THREE.Color(0x29c100);

//@ts-ignore: TS6133
const _GREEN = new THREE.Color(0x80FF80);
//@ts-ignore: TS6133
const _RED = new THREE.Color(0xFF8080);
//@ts-ignore: TS6133
const _BLACK = new THREE.Color(0x000000);

//@ts-ignore: TS6133
const _MIN_CELL_SIZE = 500;
//@ts-ignore: TS6133
const _MIN_CELL_RESOLUTION = 128;
//@ts-ignore: TS6133
const _PLANET_RADIUS = 4000;

export class HyposemetricTints {
    private _colourSpline : MathHelper.LinearSpline[];
    private _oceanSpline : MathHelper.LinearSpline;
    private _heightGenerator : IHeightGenerator;
  // Cross-blended Hypsometric Tints
  // http://www.shadedrelief.com/hypso/hypso.html

    constructor(_heightGenerator : IHeightGenerator) {
      const _colourLerp = (t:any, p0:any, p1:any) => {
        const c = p0.clone();
  
        return c.lerp(p1, t);
      };
      this._colourSpline = [
        new MathHelper.LinearSpline(_colourLerp),
        new MathHelper.LinearSpline(_colourLerp)
      ];

      // Arid
      this._colourSpline[0].AddPoint(0.0, new THREE.Color(0xb7a67d));
      this._colourSpline[0].AddPoint(0.5, new THREE.Color(0xf1e1bc));
      this._colourSpline[0].AddPoint(1.0, _SNOW);
  
      // Humid
      this._colourSpline[1].AddPoint(0.0, _FOREST_BOREAL);
      this._colourSpline[1].AddPoint(0.5, new THREE.Color(0xcee59c));
      this._colourSpline[1].AddPoint(1.0, _SNOW);

      this._oceanSpline = new MathHelper.LinearSpline(_colourLerp);
      this._oceanSpline.AddPoint(0, _DEEP_OCEAN);
      this._oceanSpline.AddPoint(0.03, _SHALLOW_OCEAN);
      this._oceanSpline.AddPoint(0.05, _SHALLOW_OCEAN);

      this._heightGenerator = _heightGenerator;
    }
  
    Get(x:any, y:any, z:any) {
      const m = this._heightGenerator.GeHeightFromNCoord(x, y, z);
      const h = z / 100.0;
  
      if (h < 0.05) {
        return this._oceanSpline.Get(h);
      }

      const c1 = this._colourSpline[0].Get(h);
      const c2 = this._colourSpline[1].Get(h);
  
      return c1.lerp(c2, m);
    }
  }