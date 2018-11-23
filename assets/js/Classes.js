
let initPlayer = function( data ){
	// if player doesnt exist then create, else just change the position
	if( player.body == undefined ){
		
		player = new Player({
			pos: new THREE.Vector3().copy( data.position ),
			camera: data.camera,
		});
		
	} else {
		
		player.body.position.copy( data.position );
		
	}

}

class Entity {
	constructor( data ){
		this.body = new THREE.Group();
		this.cylinder = new THREE.Mesh( 
			new THREE.CylinderBufferGeometry( 0.7 , 0.7 , playerStats.height, 64 ),
			new THREE.MeshLambertMaterial({ 
				color: 0xff0000,
				flatShading: true,
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
		this.runningSpeed = playerStats.speed * 1.5;
		this.turningSpeed = 100.0;
		this.pHeight = playerStats.height;
		this.quater = new THREE.Quaternion();
		this.body.tmpPosition = new THREE.Vector3().copy( data.pos );
		this.tmpVec3 = new THREE.Vector3();
		
		// this.camera = data.camera;
		
		this.body.add( data.camera );
		this.camera = this.body.children[0];
		this.body.add( this.cylinder );
		
		this.cylinder.position.y -= playerStats.height/2;
		// data.camera.position.set( 0 , this.pHeight , 0 );
		
		
		this.body.position.copy( data.pos );
		
		// Bounding Box
		this.body.BBoxHelper = new THREE.BoxHelper( this.body, 0x00ff00 );
		this.body.BBox = new THREE.Box3().setFromObject( this.body );
		
		Levels[currentLevel].scene.add( this.body );
		Levels[currentLevel].scene.add( this.body.BBoxHelper );
		
		this.body.rotation.order = 'YXZ';
		
		
		this.initControls();
		// controls = new THREE.FirstPersonControls( this.body , canvas );
	}
	
	update( time ){
		this.updateMovement( time );
		// this.body.BBox.setFromObject( this.body );
		// this.testCollision();
		this.updateGravity();
		this.body.BBoxHelper.update();
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
					case 'y':
						this.body.position.y = this.body.tmpPosition.y;
						break;
					case 'z':
						this.body.position.z = this.body.tmpPosition.z;
						break;
				}
			} else {
				this.body.position.copy( this.body.tmpPosition );
			}
			// console.log( 'aaaaa im in a box' );
		}
	}
	
	updateMovement( time ){
		this.body.tmpPosition.copy( this.body.position );
		
		// TURNING
		if( this.controls.turning.right == true ){
			this.body.rotation.y -= this.turningSpeed * Math.PI/180 * time;
		}
		if( this.controls.turning.left == true ){
			this.body.rotation.y += this.turningSpeed * Math.PI/180 * time;
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
		
		
		/* // MOVEMENT
		// Forward
		if( this.controls.up == true ){ 
			this.body.translateZ( -this.speedWalking * time );
		}
		// Back
		if( this.controls.down == true ){ 
			this.body.translateZ( this.speedWalking * time );
		}
		// Left
		if( this.controls.left == true ){ 
			this.body.translateX( -this.speedWalking * time * 0.7 );
		}
		// Right
		if( this.controls.right == true ){ 
			this.body.translateX( this.speedWalking * time * 0.7 );
		} */
		
	}
	
	updateGravity(){
		let intersects = {};
		
		this.rays.down.set( this.body.position , new THREE.Vector3( 0 , -1 , 0) );
		
		if( currentLevel === 0 ){
			intersects.down = this.rays.down.intersectObject(
				Levels[0].scene.getObjectByName('Room')
			);
		} else if( currentLevel === 1 ){
			intersects.down = this.rays.down.intersectObjects([
				Levels[1].scene.getObjectByName('Floor'),
				Levels[1].scene.getObjectByName('Stairs_body'),
			]);
		}
		
		
		if( intersects.down.length > 0 ){
			// console.log( intersects.down[0].distance );
			this.body.position.y = intersects.down[0].point.y + this.pHeight;
		}
	}
	
	initControls(){
		let self = this;
		window.addEventListener( 'keydown', function(evt){
			
			self.keyset( evt , true );
			
			// console.log( evt );
			/* if( evt.key !== 'F5' && evt.key !== 'Ctrl' ){
				evt.preventDefault();
				console.log( "haha");
			} */
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
			self.tmpVec3.copy( self.body.children[0].rotation );
			self.tmpVec3.x -= movementY/300;
			if( self.tmpVec3.x > -1.0 && // down boundry
				self.tmpVec3.x < 1.4 ) { // up boundry 
				self.body.children[0].rotation.x -= movementY/300;
			}
			self.body.rotation.y -= movementX/300;
					
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
		
		if( evt.keyCode === 70 ){ // F
			// Light
		}
		
		if( evt.keyCode === 81 ){ // Q
			this.controls.turning.left = trueOrFalse;
		}
		if( evt.keyCode === 69 ){ // E
			this.controls.turning.right = trueOrFalse;
		}
	}
	
}

