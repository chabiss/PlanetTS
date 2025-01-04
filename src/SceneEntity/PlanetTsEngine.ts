import * as ThreeTsEngine from '../GraphicEngine.ts'
import { UniTests } from './UnitTestsSceneEntity.ts'
import { TerrainSceneEntity } from './TerrainSceneEntity.ts'
import { BasicSceneEntity } from './BasicSceneEntity.ts';
import { LightSceneEntity } from './LightSceneEntity.ts';
import { CameraSceneEntity } from './CameraSceneEntity.ts';

const PLANET_RADIUS = 8000;
export class PlanetTsEngine extends ThreeTsEngine.GraphicEngine {
    Start() {
        super.Start();
    }
    
    constructor(){
        super();
        this.AttachSceneEntity(new CameraSceneEntity());
        this.AttachSceneEntity(new BasicSceneEntity());
        this.AttachSceneEntity(new LightSceneEntity());
        this.AttachSceneEntity(new TerrainSceneEntity());
        this.AttachSceneEntity(new UniTests());
    }
    Render(frameTime : number) : void {
        super.Render(frameTime);
    }

    static get PlanetRadius() : number {
        return PLANET_RADIUS;
    }
}