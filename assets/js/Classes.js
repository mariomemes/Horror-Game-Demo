
let initPlayer = function( data ){
	// if player doesnt exist then create, else just change the params
	if( player.body == undefined ){
		
		player = new Player({
			pos: new THREE.Vector3().copy( data.position ),
			camera: data.camera,
			rotation: data.rotation,
		});
		
	} else {
		
		// if( box3helpers ) Levels[ currentLevel ].scene.add( player.body, player.body.BBoxHelper )
		player.body.position.copy( data.position );
		player.body.rotation.copy( data.rotation );
		
	}

}

class Entity {
	constructor( data ){
		this.body = new THREE.Group();
		this.cylinder = new THREE.Mesh( 
			new THREE.CylinderBufferGeometry( 0.9 , 0.9 , playerStats.height, 64 ),
			new THREE.MeshLambertMaterial({ 
				color: 0xff0000,
				flatShading: true,
				visible: false,
			})
		);
		
	}
}

class Player extends Entity {
	constructor( data ){
		super( data ); // call Entity constructor
		
		this.controls = {
			up: false,
			down: false,
			left: false,
			right: false,
			running: false,
			turning: {
				right: false,
				left: false,
			},
		};
		this.rays = {
			forward: new THREE.Raycaster(),
			backwards: new THREE.Raycaster(),
			up: new THREE.Raycaster(),
			down: new THREE.Raycaster(),
			left: new THREE.Raycaster(),
			right: new THREE.Raycaster(),
		};
		this.speedWalking = playerStats.speed;
		this.sideWalkingSpeed = playerStats.speed * 0.6;
		this.runningSpeed = playerStats.speed * 1.7;
		this.turningSpeed = 300.0;
		this.pHeight = playerStats.height;
		this.body.tmpPosition = new THREE.Vector3().copy( data.pos );
		this.tmpVec3 = new THREE.Vector3();
		
		this.neck = new THREE.Object3D();
		this.neck.position.y = -2;
		this.camera = data.camera;
		this.camera.position.y += 2;
		this.neck.add( data.camera );
		this.body.add( this.neck );
		
		this.body.add( this.cylinder );
		this.cylinder.position.y -= this.pHeight/2;
		
		// Lantern
		this.lanternON = true;
		this.lanternLight = new THREE.PointLight( 0x0000dd , 0.9 , 20 , 2 );
		this.lantern = new THREE.Mesh(
			new THREE.CylinderBufferGeometry( 0.1 , 0.1 , 0.5 , 10 ),
			new THREE.MeshBasicMaterial({ color: 0x000099 })
		);
		this.lantern.add( this.lanternLight );
		this.body.add( this.lantern );
		this.lantern.position.set( 0.3 , -0.5 , -0.5 );
		
		
		this.body.position.copy( data.pos );
		this.body.rotation.copy( data.rotation );
		// this.body.rotation.y = data.rotation.y;
		
		
		// Bounding Box
		this.body.BBox = new THREE.Box3().setFromObject( this.body );
		Levels[currentLevel].scene.add( this.body );
		if( box3helpers ){
			this.body.BBoxHelper = new THREE.BoxHelper( this.body, 0x00ff00 );
			Levels[currentLevel].scene.add( this.body.BBoxHelper );
		}
		
		this.body.rotation.order = 'YXZ';
		
		
		this.initControls();
	}
	
	update( time ){
		this.updateMovement( time );
		// Setting Bounding Boxes and collision testing happens in move
		this.updateGravity();
		if( box3helpers ) this.body.BBoxHelper.update();
		
		if( this.lanternON ){
			this.lantern.visible = true;
			
		} else {
			this.lantern.visible = false;
		}
	}
	
	testCollision( axis ){
		let self = this;
		let boxIntersection = false;
		
		Levels[currentLevel].staticCollideMesh.some( function( staticMesh ){
			if( self.body.BBox.intersectsBox( staticMesh.BBox ) ){
				boxIntersection = true;
				return true;
			}
		});
		
		if( boxIntersection ){
			if( axis != undefined ){
				switch( axis ){
					case 'x':
						this.body.position.x = this.body.tmpPosition.x;
						break;
					case 'z':
						this.body.position.z = this.body.tmpPosition.z;
						break;
				}
			} else {
				this.body.position.copy( this.body.tmpPosition );
			}
		}
	}
	
	updateMovement( time ){
		this.body.tmpPosition.copy( this.body.position );
		
		// TURNING
		if( this.controls.turning.right == true ){ // E
			// this.body.rotation.y -= this.turningSpeed/3 * Math.PI/180 * time;
			
			this.tmpVec3.copy( this.neck.rotation );
			this.tmpVec3.z -= 5 / this.turningSpeed;
			if( this.tmpVec3.z > -0.4 ) { // right boundry 
				this.neck.rotation.z -= 5 / this.turningSpeed;
			}
		} else {
			if( this.neck.rotation.z < -0.01 ){
				this.neck.rotation.z += 15 / this.turningSpeed;
			}
		}
		
		if( this.controls.turning.left == true ){ // Q
			// this.body.rotation.y += this.turningSpeed/3 * Math.PI/180 * time;
			
			this.tmpVec3.copy( this.neck.rotation );
			this.tmpVec3.z += 5 / this.turningSpeed;
			if( this.tmpVec3.z < 0.4 ) { // left boundry 
				this.neck.rotation.z += 5 / this.turningSpeed;
			}
		} else {
			if( this.neck.rotation.z > 0.01 ){
				this.neck.rotation.z -= 15 / this.turningSpeed;
			}
		}
		
		// MOVEMENT
		// Forward
		if( this.controls.up == true ){ 
			let speed;
			if( this.controls.running ) {
				speed = this.runningSpeed;
			} else {
				speed = this.speedWalking;
			}
			
			this.body.position.x -= Math.sin( this.body.rotation.y ) * speed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('x');
			
			this.body.position.z -= Math.cos( this.body.rotation.y ) * speed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('z');
			
		}
		// Back
		if( this.controls.down == true ){ 
			this.body.position.x += Math.sin( this.body.rotation.y ) * this.sideWalkingSpeed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('x');
			
			this.body.position.z += Math.cos( this.body.rotation.y ) * this.sideWalkingSpeed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('z');
			
		}
		// Left
		if( this.controls.left == true ){ 
			this.body.position.x -= Math.sin( this.body.rotation.y + Math.PI/2 ) * this.sideWalkingSpeed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('x');
			
			this.body.position.z -= Math.cos( this.body.rotation.y + Math.PI/2 ) * this.sideWalkingSpeed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('z');
			
		}
		// Right
		if( this.controls.right == true ){ 
			this.body.position.x -= Math.sin( this.body.rotation.y - Math.PI/2 ) * this.sideWalkingSpeed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('x');
			
			this.body.position.z -= Math.cos( this.body.rotation.y - Math.PI/2 ) * this.sideWalkingSpeed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('z');
			
		}
		
	}
	
	updateGravity(){
		let intersects = {};
		let num;
		
		this.rays.down.set( this.body.position , new THREE.Vector3( 0 , -1 , 0) );
		
		if( currentLevel === 0 ){
			
			intersects.down = this.rays.down.intersectObject(
				Levels[0].scene.getObjectByName('Floor')
			);
			num = 0;
			
		} else if( currentLevel === 1 ){
			
			intersects.down = this.rays.down.intersectObjects([
				Levels[1].scene.getObjectByName('Floor'),
				Levels[1].scene.getObjectByName('Stairs_body'),
			]);
			num = 1;
		}
		
		if( intersects.down.length > num ){
			this.body.position.y = intersects.down[0].point.y + this.pHeight;
		}
	}
	
	initControls(){
		let self = this;
		window.addEventListener( 'keydown', function(evt){
			
			self.keyset( evt , true );
			// console.log( evt );
			
			if( evt.keyCode === 70 ){ // F
				self.lanternON = !self.lanternON;
			}
			
			if( evt.key === 'p' ){
				if( pointerIsLocked( canvas ) === false ) {
					startPointerLock();
				}
				else exitPointerLock(); 
				
			}
		}, false );
		
		window.addEventListener( 'keyup', function(evt){
			self.keyset( evt , false );
		}, false );
		
		canvas.addEventListener('mousemove', function(evt){
			let movementX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || 0;
			let movementY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || 0;
			
			
			// MAKE SURE TO SET BODY ROTATION ORDER  TO 'YXZ' !!!!
			// restrict the camera x rotation
			self.tmpVec3.copy( self.camera.rotation );
			self.tmpVec3.x -= movementY/self.turningSpeed;
			if( self.tmpVec3.x > -1.0 && // down boundry
				self.tmpVec3.x < 1.4 ) { // up boundry 
				self.camera.rotation.x -= movementY / self.turningSpeed;
			}
			self.body.rotation.y -= movementX / self.turningSpeed;
					
		}, false);
	}
	
	keyset( evt , trueOrFalse ){
		if( evt.keyCode === 87 ){ // W
			this.controls.up = trueOrFalse;
		}
		if( evt.keyCode === 83 ){ // S
			this.controls.down = trueOrFalse;
		}
		if( evt.keyCode === 65 ){ // A
			this.controls.left = trueOrFalse;
		}
		if( evt.keyCode === 68 ){  // D
			this.controls.right = trueOrFalse;
		}
		
		if( evt.key === 'Shift' ) {
			this.controls.running = trueOrFalse;
		}
		
		
		if( evt.keyCode === 81 ){ // Q
			this.controls.turning.left = trueOrFalse;
		}
		if( evt.keyCode === 69 ){ // E
			this.controls.turning.right = trueOrFalse;
		}
	}
	
}

