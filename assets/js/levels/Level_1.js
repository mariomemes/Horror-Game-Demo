

Levels[1].initModels = function(){

	Levels[1].gltf.scene.traverse( function( node ) {
		/* 
			List:
			-shadows too expensive
			-change empty objects into lamps
		*/
		
		if( ( node.name.includes( "Box" ) ||
			node.name.includes( "Barrel" ) ||
			node.name.includes( "Wall" ) ||
			node.name.includes( "Table" ) ) && 
			node instanceof THREE.Mesh ){

			Levels[1].staticCollideMesh.push( node );

		}
		
		
		if( node.name === "Radio" && node instanceof THREE.Mesh ){
			
			Sounds.december.isPaused = true;
			node.add( Sounds.december );
			node.clickEvent = function(){
				if( Sounds.december.isPaused === true ){
					Sounds.december.play();
					Sounds.december.isPaused = false;
				} else {
					Sounds.december.pause();
					Sounds.december.isPaused = true;
				}
			};
			Levels[1].interractiveItems.push( node );
		}
		
		if( node.name === "Door_1" && node instanceof THREE.Mesh ){
			
			node.clickEvent = function(){
				
				fadeIn( waitingScreenDiv );
				player.ready = false;
				
				setTimeout( function(){
						
					Levels[0].init( 
						new THREE.Vector3( -10 , 5 , -4 ), 
						new THREE.Euler( 0 , -90*Math.PI/180 , 0 ) 
					);
					Levels[0].loading = false;
				}, 300 );
				
			}
			
			Levels[1].interractiveItems.push( node );
		}
		
		if( node.name.includes( "Lamp" ) ){
			let light = new THREE.PointLight( 0xffffee, 0.8, 40 , 2 );
			light.position.copy( node.position );
			light.position.y = 18;
			// light.position.x += 10;
			if(shadows){
				light.castShadow = true;
				light.shadow.mapSize.width = 512*1;
				light.shadow.mapSize.height = 512*1;
				light.shadow.camera.near = 0.1;
				light.shadow.camera.far = 1000;
				light.shadow.bias = 0.0001;
			}
			
			Levels[1].Lights.push( light );
		}
		
		if( shadows ){
			node.castShadow = true;
			node.receiveShadow = true;
		}
		
		if( node.name.includes( "Pole_" ) ){
			node.material.color = new THREE.Color( 0.43 , 0.27 , 0.14 );
		}
		
		if( node.name === "Stairs_body" || node.name === "Player" ){
			node.material.visible = false;
		}
		
		if( node instanceof THREE.Mesh ){
			// console.log( " m: " + node.material.metalness + " r: " + node.material.roughness  );
			node.material.metalness = 0;
			node.material.roughness = 1;
		}
		
		if( node.name.includes( "Wall" ) ){
			node.material.metalnessMap = Textures.walls.metalnessMap;
			node.material.roughnessMap = Textures.walls.roughnessMap;
		}
		
	});
	
	Levels[1].playerPos = new THREE.Vector3().copy( Levels[1].gltf.scene.getObjectByName('Player').position );
	// Levels[1].playerPos = new THREE.Vector3( 55 , 20 , 0 );
	// Levels[1].playerRot = new THREE.Euler().copy( Levels[1].gltf.scene.getObjectByName('Player').rotation );
	Levels[1].playerRot = new THREE.Euler( 0 , 90*Math.PI/180 , 0 );
	
	console.log( "corridor: " );
	//console.log( Levels[1].gltf );
	
	/* Levels[1].gltf.scene.children.forEach( function(obj, i) {
		console.log(i);
		Levels[1].scene.add( obj );
	}); */
	Levels[1].scene.add( Levels[1].gltf.scene );
	
}

// ( 72 , 0 , 15.5 )
Levels[1].constructCollisionBoxes = function() {
	
	Levels[1].staticCollideMesh.forEach( function( mesh ){
		// Bounding Box
		mesh.BBox = new THREE.Box3().setFromObject( mesh );

		// helper
		if( box3helpers ){
			mesh.BBoxHelper = new THREE.Box3Helper( mesh.BBox , 0xff0000 );
			Levels[1].scene.add( mesh.BBoxHelper );
		}
	});
	
}


Levels[1].spawnMonsterOne = function(){
	
	// console.log( THREE.AnimationUtils.clone );
	console.log( cloneGltf( Monsters.Creeper.gltf ) );
	
	Levels[1].Creeper = new Creeper({
		// body: Monsters.Creeper.body,
		body: cloneGltf( Monsters.Creeper.gltf ).scene.children[0],
		animationClips: Monsters.Creeper.animationClips,
		position: new THREE.Vector3( -60 , 0 , -152 ), // Main
		rotation: new THREE.Euler( 0 , -90 *Math.PI/180 , 0 ), // Main
		scale: 0.7, // Main
		// position: new THREE.Vector3( 0 , 25 , 0 ),
		// rotation: new THREE.Euler( 0 , 90 *Math.PI/180 , 180 *Math.PI/180 ),
		// position: new THREE.Vector3( 10 , 0 , 3 ),
		// rotation: new THREE.Euler( 0 , 90 *Math.PI/180 , 0 ),
		// scale: 2.5,
		walkingSpeed: Monsters.Creeper.walkingSpeed,
		runningSpeed: Monsters.Creeper.runningSpeed,
	});
	
	Levels[1].Creeper.body.children[1].material.color = new THREE.Color( 0.33, 0.25, 0.15 );
	Levels[1].Creeper.body.children[1].material.map = Textures.Creeper.skin;
	
	Levels[1].Creeper.animations.idle_stance.play();
	Levels[1].Creeper.body.add( Sounds.quietGrowl );
}

Levels[1].spawnBigMonster = function(){
	
	Levels[1].BigCreeper = new Creeper({
		body: cloneGltf( Monsters.Creeper.gltf ).scene.children[0],
		animationClips: Monsters.Creeper.animationClips,
		position: new THREE.Vector3( -360 , 25 , 0 ),
		// position: new THREE.Vector3( 0 , 25 , 0 ),
		rotation: new THREE.Euler( 0 , 90 *Math.PI/180 , 180 *Math.PI/180 ),
		scale: 2.5,
		walkingSpeed: Monsters.Creeper.walkingSpeed,
		runningSpeed: Monsters.Creeper.runningSpeed,
	});
	
	Levels[1].BigCreeper.body.children[1].material.color = new THREE.Color( 0.5, 0.4, 0.3 );
	Levels[1].BigCreeper.body.children[1].material.map = Textures.Creeper.skin;
	
	Levels[1].BigCreeper.animations.idle_4legs.play();
	// Levels[1].BigCreeper.body.add( Sounds.quietGrowl );
}

Levels[1].initLights = function(){
	let ambientLight = new THREE.AmbientLight( 0xffffff , 0.02 );
	Levels[1].Lights.push( ambientLight );
	
	Levels[1].Lights.forEach( function( light ){
		Levels[1].scene.add( light );
		
		if( Levels[1].lightHelpers && light instanceof THREE.PointLight ) {
			let lightHelp = new THREE.PointLightHelper( light, 0.5 );
			Levels[1].scene.add( lightHelp );
		}
	});
}

Levels[1].initEvents = function(){
	
	let firstMonsterEvent = {
		name: "First Encounter",
		trigger: function(){
			if( GameState.progress === 1 ){
				
				if( player.body.position.x <= -54 ){
					GameState.progress = 2;
					
					// Start the monster
					setTimeout( function(){
						Levels[1].Creeper.initLevel1Scare();
					}, 3000 );
					
					// Play sound
					Sounds.quietGrowl.play();
				}
			}
		},
	};
	
	let doorSlammingEvent = {
		name: "Slamming On The Door",
		trigger: function(){
			if( GameState.progress === 2 ){
				
				if( player.body.position.x <= -140 ){
					GameState.progress = 3;
					
					// Slamming on the door sounds
					Sounds.doubleDoorSlam.play();
				}
			}
		},
	};
	
	let lastMonsterChaseEvent = {
		name: "Big Chase",
		trigger: function(){
			if( GameState.progress === 3 ){
				
				if( player.body.position.x <= -270 ){
					GameState.progress = 4;
					
					// Start the monster chase
					setTimeout( function(){
						Levels[1].BigCreeper.initLevel1Chase();
					}, 2000 );
					
					// Play sound
					console.log( "Chase music" );
				}
			}
		},
	};
	
	Levels[1].events.push( 
		firstMonsterEvent, 
		doorSlammingEvent, 
		lastMonsterChaseEvent 
	);
}




