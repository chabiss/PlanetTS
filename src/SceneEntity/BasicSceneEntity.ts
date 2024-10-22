import * as THREE from 'three';
import { SceneEntity } from './SceneEntity';
import { GraphicEngine } from '../GraphicEngine';

export class BasicSceneEntity extends SceneEntity {
    private mesh : THREE.Mesh;
    private rotateAngle : number = 0;
    private increment : number = 0.0001;
    private followMode : boolean = false;
    private rotationMode : boolean = true;
    
    constructor(){
        super("basicNode");
        const sphereGeometry = new THREE.SphereGeometry(10, 8, 6);
        const material = new THREE.MeshStandardMaterial({color: 0xFF00FF});
        this.mesh = new THREE.Mesh(sphereGeometry, material);
    }

    Attach(): void {
        this.Engine.AddObject3DToScene(this.mesh);
        this.Engine.Camera.rotateX(-Math.PI / 2);

        this.mesh.position.set(0, 0, this.Engine.GuiParams.General.PlanetRadius+300);
    }

    Detach(): void {
        this.Engine.RemoveObject3DFromScene(this.mesh);
    }

    Update(): void {
        this.rotateAngle += this.increment;
        let position = new THREE.Vector3(0, 0, this.Engine.GuiParams.General.PlanetRadius+200);
        let positionLookAt = new THREE.Vector3(this.Engine.GuiParams.General.PlanetRadiusPlanetRadius, 0, 0);
        let matrix = new THREE.Matrix4();
        matrix.makeRotationY(this.rotateAngle);
        position.applyMatrix4(matrix);   
        
        if(this.rotationMode){
            this.mesh.position.set(position.x, position.y, position.z);
        }

        if(this.followMode){
            this.Engine.Camera.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);

            if(this.rotationMode){
                positionLookAt.applyMatrix4(matrix);
                this.Engine.Camera.lookAt(positionLookAt.x, positionLookAt.y, positionLookAt.z);
                this.Engine.Camera.rotateZ(-Math.PI / 2);
                this.Engine.Camera.rotateX(Math.PI / 2);    
            }
        }
         
        // if the left key arrow is pressed, move the mesh position to 10 left
        if (this.IsKeyPressed(GraphicEngine.Keys.KEYPAD_4)) {
            this.mesh.position.x -= 1;
        }

        // if the right key arrow is pressed, move the mesh position to 10 right
        if (this.IsKeyPressed(GraphicEngine.Keys.KEYPAD_6)) {
            this.mesh.position.x += 1;
        }

        // if the up key arrow is pressed, move the mesh position to 10 in z direction
        if (this.IsKeyPressed(GraphicEngine.Keys.KEYPAD_8)) {
            this.mesh.position.z -= 1;
        }

        // if the down key arrow is pressed, move the mesh position to -10 in z direction
        if (this.IsKeyPressed(GraphicEngine.Keys.KEYPAD_2)) {
            this.mesh.position.z += 1;
        }

        // if thepage up key  is pressed, move the mesh position to 10 in y direction
        if (this.IsKeyPressed(GraphicEngine.Keys. KEYPAD_PLUS)) {
            this.mesh.position.y += 1;
        }

        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.IsKeyPressed(GraphicEngine.Keys.KEYPAD_MINUS)) {
            this.mesh.position.y -= 1;
        }

        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.IsKeyLatched(GraphicEngine.Keys.KEYPAD_MULTIPLY)) {
                this.increment += 0.0001;
        }

        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.IsKeyLatched(GraphicEngine.Keys.KEYPAD_DIVIDE)) {
                this.increment -= 0.0001;
        }

        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.IsKeyLatched(GraphicEngine.Keys.KEYPAD_0)) {
            this.increment = 0;
        }

        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.IsKeyLatched(GraphicEngine.Keys.KEYPAD_PERIOD)) {
            this.followMode = !this.followMode;
        }

        // if the page down key is pressed, move the mesh position to -10 in y direction
        if (this.IsKeyLatched(GraphicEngine.Keys.KEYPAD_ENTER)) {
            this.rotationMode = !this.rotationMode;
        } 

        if (this.IsKeyPressed(GraphicEngine.Keys.KEYPAD_7)) {
            this.Engine.Camera.rotateX(0.01);
        }

        if (this.IsKeyPressed(GraphicEngine.Keys.KEYPAD_9)) {
            this.Engine.Camera.rotateX(-0.01);
        }

        if (this.IsKeyPressed(GraphicEngine.Keys.KEYPAD_1)) {
            this.Engine.Camera.rotateY(0.01);
        }

        if (this.IsKeyPressed(GraphicEngine.Keys.KEYPAD_3)) {
            this.Engine.Camera.rotateY(-0.01);
        }
    }

    Position() : THREE.Vector3 {
        return this.mesh.position;
    }
}