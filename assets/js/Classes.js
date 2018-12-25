
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
		Levels[currentLevel].scene.add( player.body );
		
		player.body.position.copy( data.position );
		player.body.rotation.copy( data.rotation );
		console.log("teleporto");
	}
	
	setTimeout( function(){
		player.ready = true;
		audioListener.setMasterVolume( 1.0 ); // back to 1 after loading screen mute
	}, 4000 );

}

class Entity {
	constructor( data ){
		this.body = new THREE.Group();
		this.body.name = "Body";
		this.cylinder = new THREE.Mesh(
			new THREE.CylinderBufferGeometry( 1.0 , 1.0 , playerStats.height, 64 ),
			new THREE.MeshLambertMaterial({ 
				color: 0xff0000,
				flatShading: true,
				visible: false,
			})
		);
		this.cylinder.name = "Cylinder Body";
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
			crouching: false,
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
		this.sounds = {
			footsteps: Sounds.footsteps,
		};
		this.body.name = "PlayerObj";
		this.mouseCoord = new THREE.Vector2( 0 , 0 );
		this.pHeight = playerStats.height;
		this.standingHeight = playerStats.height;
		this.crouchingHeight = 3;
		this.reach = 4.5;
		this.pointedObject = null;
		
		this.walkingSpeed = playerStats.speed;
		this.sideWalkingSpeed = playerStats.speed * 0.7;
		this.runningSpeed = 12.0; // 2.0
		this.crouchingSpeed = 0.5;
		this.turningSpeed = 300.0;
		
		this.body.tmpPosition = new THREE.Vector3().copy( data.pos );
		this.tmpVec3 = new THREE.Vector3(); // used for limiting head rotations
		
		this.neck = new THREE.Object3D();
		this.neck.position.y = -2.0;
		this.camera = data.camera;
		this.camera.position.y += 2.0;
		this.neck.add( data.camera );
		this.body.add( this.neck );
		
		this.body.add( this.cylinder );
		this.cylinder.position.y -= this.pHeight/2;
		
		// Lantern
		this.lanternON = false;
		this.lanternCD = 0;
		this.lanternCDmax = 30;
		this.lanternMaxIntensity = 1.2;
		this.buildLantern();
		if( GameState.progress >= 1 ) this.activateLantern();
		
		
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
		this.updateCrouching();
		this.updateMovement( time );
		// Setting Bounding Boxes and collision testing happens in move
		this.updateGravity();
		if( box3helpers ) this.body.BBoxHelper.update();
		this.walkingSound();
		
		this.raycastFront();
		
		if( this.lanternCD > 0 ) this.lanternCD--;
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
		
		if( time * 60 > 2.0 ) time = 1.0/60;
		
		// Crouching
		/* if( this.controls.crouching ){
			this.pHeight = this.crouchingHeight;
			console.log("CCC");
		} else {
			this.pHeight = this.standingHeight;
		} */
		
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
		let speed;
		
		// Forward
		if( this.controls.up == true ){
		
			speed = this.walkingSpeed;
			if( this.controls.crouching ) speed *= this.crouchingSpeed;
			else if( this.controls.running ) speed *= this.runningSpeed;
			
			this.body.position.x -= Math.sin( this.body.rotation.y ) * speed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('x');
			
			this.body.position.z -= Math.cos( this.body.rotation.y ) * speed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('z');
		}
		// Back
		if( this.controls.down == true ){
			
			speed = this.sideWalkingSpeed;
			if( this.controls.crouching ) speed *= this.crouchingSpeed;
			else if( this.controls.running ) speed *= this.runningSpeed;
			
			this.body.position.x += Math.sin( this.body.rotation.y ) * speed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('x');
			
			this.body.position.z += Math.cos( this.body.rotation.y ) * speed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('z');
			
		}
		
		// Left
		if( this.controls.left == true ){ 
			
			speed = this.sideWalkingSpeed;
			if( this.controls.crouching ) speed *= this.crouchingSpeed;
			else if( this.controls.running ) speed *= this.runningSpeed;
			
			this.body.position.x -= Math.sin( this.body.rotation.y + Math.PI/2 ) * speed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('x');
			
			this.body.position.z -= Math.cos( this.body.rotation.y + Math.PI/2 ) * speed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('z');
		}
		
		// Right
		if( this.controls.right == true ){
			
			speed = this.sideWalkingSpeed;
			if( this.controls.crouching ) speed *= this.crouchingSpeed;
			else if( this.controls.running ) speed *= this.runningSpeed;
			
			this.body.position.x -= Math.sin( this.body.rotation.y - Math.PI/2 ) * speed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('x');
			
			this.body.position.z -= Math.cos( this.body.rotation.y - Math.PI/2 ) * speed * time;
			this.body.BBox.setFromObject( this.body );
			this.testCollision('z');
		}
		
	}
	
	updateCrouching(){
		
		if( this.controls.crouching ){ // crouching
		
			if( this.pHeight > this.crouchingHeight ){
				this.pHeight -= 0.2;
			}
		} else { // standing
		
			if( this.pHeight < this.standingHeight ){
				this.pHeight += 0.2;
			}
		}
		
	}
	
	updateGravity(){
		
		let intersects;
		
		this.rays.down.set( this.body.position , new THREE.Vector3( 0 , -1 , 0) );
		
		if( currentLevel === 0 ){
			
			intersects = this.rays.down.intersectObject(
				Levels[0].scene.getObjectByName('Floor')
			);
			
		} else if( currentLevel === 1 ){
			
			intersects = this.rays.down.intersectObjects([
				Levels[1].scene.getObjectByName('Floor'),
				Levels[1].scene.getObjectByName('Stairs_body'),
			]);
		}
		
		if( intersects.length > 0 ){
			this.body.position.y = intersects[0].point.y + this.pHeight;
		}
	}
	
	raycastFront(){
		let intersects;
		
		this.rays.forward.setFromCamera( this.mouseCoord , this.camera );
		
		intersects = this.rays.forward.intersectObjects( Levels[currentLevel].interractiveItems , true );
		
		if( intersects.length > 0 ){
			if( intersects[0].distance <= this.reach ){
				pointer.src = "assets/textures/pointer_hand.png";
				this.pointedObject = intersects[0].object;
			} else {
				pointer.src = "assets/textures/pointer.png";
				this.pointedObject = null;
			}
			
		} else {
			pointer.src = "assets/textures/pointer.png";
			this.pointedObject = null;
		}
	}
	
	switchLight(){
		let self = this;
		
		let lanternAnimation = function( ON, miliseconds ){
			
			if( ON == true ){ // switch off
				
				setTimeout( function(){
					if( self.lanternLight.intensity <= 0 ){
						self.lantern.material.emissive.g = 0;
						self.lanternLight.intensity = 0;
						return; // color is 0, job is done
					} else {
						self.lantern.material.emissive.g -= 0.5/miliseconds;
						self.lanternLight.intensity -= self.lanternMaxIntensity / miliseconds;
						
						return lanternAnimation( true, miliseconds )
					}
				}, 1000/60);
				
			} else { // switch on
				
				setTimeout( function(){
					if( self.lanternLight.intensity >= self.lanternMaxIntensity ){
						return;	
					} else {
						self.lantern.material.emissive.g += 0.5/miliseconds;
						self.lanternLight.intensity += self.lanternMaxIntensity / miliseconds;
						
						return lanternAnimation( false, miliseconds )
					}
				}, 1000/60);
				
			}
		};
		
		if( this.lanternCD === 0 ){
			if( this.lanternON ){ // switch off
				
				lanternAnimation( true, 10 );
				
			} else { // switch on
				
				lanternAnimation( false, 10 );
				
			}
			this.lanternON = !this.lanternON;
			this.lanternCD = this.lanternCDmax;
		}
	}
	
	buildLantern(){
		
		this.lanternLight = new THREE.PointLight( 0x00dd00 , 0.0 , 25 , 2 );
		this.lanternLight.position.set( -0.05 , 0 , 0.2 );
		this.lantern = new THREE.Mesh(
			new THREE.CylinderBufferGeometry( 0.05 , 0.05 , 0.6 , 20 ),
			new THREE.MeshPhongMaterial({ color:0x888888, transparent: true, opacity: 0.94, shininess: 30 })
		);
		let capGeometry = new THREE.CylinderBufferGeometry( 0.06 , 0.06 , 0.10 , 10 );
		
		this.lantern.capUp = new THREE.Mesh(
			capGeometry,
			new THREE.MeshPhongMaterial({ color: 0x999999, flatShading: true })
		);
		this.lantern.capUp.position.y += 0.3;
		this.lantern.capDown = new THREE.Mesh(
			capGeometry,
			new THREE.MeshPhongMaterial({ color: 0x999999, flatShading: true })
		);
		this.lantern.capDown.position.y -= 0.3;
		this.lantern.add( this.lantern.capUp, this.lantern.capDown );
		
		this.lantern.add( this.lanternLight );
		this.lantern.position.set( 0.24 , -2.4 , -0.3 ); // 0.24 , -0.4 , -0.3
		this.lantern.relativePositionY = -2.4;
		this.body.add( this.lantern );
		this.lantern.rotation.x -= 25 *Math.PI/180;
		this.lantern.name = "Glowstick";
		
		this.lantern.visible = false;
	}
	
	activateLantern(){
		let self = this;
		
		this.hasLantern = true;
		this.lantern.visible = true;
		
		let step = 3.0 / 60;
		let pullUp = setInterval(function(){
			
			if( self.lantern.relativePositionY < -0.4 ){
				
				self.lantern.relativePositionY += step;
				self.lantern.position.y += step;
				
			} else {
				clearInterval( pullUp );
			}
		}, 1000/60 );
	}
	
	walkingSound(){
		
		if( this.XZpositionUnchanged() ){ 
			// standing in place
			Sounds.footsteps.setVolume( 0.0 );
			
		} else { // moving
			
			if( this.controls.crouching ) {
				Sounds.footsteps.setVolume( Sounds.footsteps.crouchingVolume );
			} else if( this.controls.running ) {
				Sounds.footsteps.setVolume( Sounds.footsteps.runningVolume );
				Sounds.footsteps.setPlaybackRate( Sounds.footsteps.runningPlaybackRate );
			} else { 
				Sounds.footsteps.setVolume( Sounds.footsteps.walkingVolume );
				Sounds.footsteps.setPlaybackRate( Sounds.footsteps.walkingPlaybackRate );
			}
		}
	}
	
	initControls(){
		let self = this;
		window.addEventListener( 'keydown', function(evt){
			
			if( self.ready === false ) return;
			
			self.keyset( evt , true );
			// console.log( evt );
			
			if( evt.key === 'p' ){
				if( pointerIsLocked( canvas ) === false ) {
					startPointerLock();
				}
				else exitPointerLock(); 
				
			}
			
		}, false );
		
		window.addEventListener( 'keyup', function(evt){
			
			if( self.ready === false ) return;
			
			self.keyset( evt , false, self );
		}, false );
		
		canvas.addEventListener('mousemove', function(evt){
			
			if( self.ready === false ) return;
			
			let movementX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || 0;
			let movementY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || 0;
			
			
			// MAKE SURE TO SET BODY ROTATION ORDER  TO 'YXZ' !!!!
			// restrict the camera x rotation
			self.tmpVec3.copy( self.camera.rotation );
			self.tmpVec3.x -= movementY/self.turningSpeed;
			if( self.tmpVec3.x > -0.9 && // down boundry
				self.tmpVec3.x < 1.3 ) { // up boundry 
				self.camera.rotation.x -= movementY / self.turningSpeed;
			}
			self.body.rotation.y -= movementX / self.turningSpeed;
					
		}, false);
		
		canvas.addEventListener('mousedown', function(evt){
			
			if( self.ready === false ) return;
			
			evt.preventDefault();
			if( evt.button === 0 ){ // LMB
				
				if( self.pointedObject != null ){
					
					if( self.pointedObject.clickEvent != null ){
						self.pointedObject.clickEvent();
					}	else {
						self.pointedObject.parent.clickEvent();
					}
				}
			}
					
		}, false);
		
		canvas.addEventListener('contextmenu', function (evt) { // Not compatible with IE < 9
			evt.preventDefault();
		}, false);
		
	}
	
	XZpositionUnchanged(){
		
		if( this.body.position.x === this.body.tmpPosition.x &&
			this.body.position.z === this.body.tmpPosition.z ) return true;
		else return false;
	}
	
	keyset( evt , trueOrFalse, self ){
		let moving = false;
		
		if( evt.keyCode === 87 ){ // W
			this.controls.up = trueOrFalse;
			if( trueOrFalse === true ) moving = true;
		}
		if( evt.keyCode === 83 ){ // S
			this.controls.down = trueOrFalse;
			if( trueOrFalse === true ) moving = true;
		}
		if( evt.keyCode === 65 ){ // A
			this.controls.left = trueOrFalse;
			if( trueOrFalse === true ) moving = true;
		}
		if( evt.keyCode === 68 ){  // D
			this.controls.right = trueOrFalse;
			if( trueOrFalse === true ) moving = true;
		}
		
		if( evt.key === 'Shift' ) {
			this.controls.running = trueOrFalse;
		}
		if( evt.keyCode === 67 ) { // C == 67 , Ctrl == 17
			this.controls.crouching = trueOrFalse;
		}
		
		if( evt.key === 'l' && trueOrFalse ) { // l for location
			console.log( this.body.position );
		}
		
		if( evt.keyCode === 81 ){ // Q
			this.controls.turning.left = trueOrFalse;
		}
		if( evt.keyCode === 69 ){ // E
			this.controls.turning.right = trueOrFalse;
		}
		
		if( evt.keyCode === 70 && this.hasLantern && trueOrFalse == true ){ // F
			this.switchLight();
		}
		
	}
	
}

