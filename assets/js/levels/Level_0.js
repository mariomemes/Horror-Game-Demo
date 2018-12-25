
Levels[0].createStartingMesh = function(){
	let floor = new THREE.Mesh(
		new THREE.PlaneGeometry( 200, 200 ),
		new THREE.MeshPhongMaterial({
			color: 0x107010,
			// map: Textures.grass,
			shininess: 0,
		})
	);
	floor.rotation.x = -90 * Math.PI/180;
	Levels[0].scene.add( floor )
}

Levels[0].initModels = function(){
	
	// Levels[0].gltf.scene.position.y += 0.01; // avoid Z fighting

	Levels[0].gltf.scene.traverse( function( node ) {
		
		if( node.name.includes( "Lamp" ) ) {
			let light = new THREE.PointLight( 0xffffee, 1.0, 15 , 2 ); // 1.5
			light.position.copy( node.position );
			// light.position.y += 1;
			if(shadows){
				light.castShadow = true;
				light.shadow.mapSize.width = 512*1;
				light.shadow.mapSize.height = 512*1;
				light.shadow.camera.near = 0.1;
				light.shadow.camera.far = 1000;
				light.shadow.bias = 0.0001;
			}
			
			Levels[0].Lights.push( light );

			// let help = new THREE.PointLightHelper( light, 0.2 );
			// Levels[0].scene.add( help );
		}
		
		if( node.name === "Door" && node instanceof THREE.Mesh ){
			
			node.clickEvent = function(){
				if( GameState.progress >= 1 ){
					
					player.ready = false;
					fadeIn( waitingScreenDiv );
				
					setTimeout( function(){
						Levels[1].init();
					}, 300 );
					
				} else {
					MessageSystem.showMessage( 
						Levels[0].messages.noLantern.text, 
						Levels[0].messages.noLantern.duration 
					);
				}
			}
			
			
			Levels[0].interractiveItems.push( node );
			

		}

		if( node.name.includes( "Box" ) ){
			// "http://localhost:8080/models/room1/wood.png"
			// Bad texture naming led to a bug
			let baseUri = node.material.map.image.baseURI;
			node.material.map.image.currentSrc = baseUri + 'assets/models/Level_0/box_wood.jpg';
			node.material.map.image.src = baseUri + 'assets/models/Level_0/box_wood.jpg';
		}

		if( ( node.name.includes( "Box" ) ||
			node.name.includes( "Barrel" ) ||
			node.name.includes( "Wall" ) ||
			node.name.includes( "Table" ) ) && 
			node instanceof THREE.Mesh ){

			Levels[0].staticCollideMesh.push( node );

		}

		if( node.name.includes( "Wall_Block" ) ){
			// only serve as bounding boxes
			node.visible = false;
		}

		if( shadows ){
			node.castShadow = true;
			node.receiveShadow = true;
		}
		
		if( node instanceof THREE.Mesh ){
			// console.log( " m: " + node.material.metalness + " r: " + node.material.roughness  );
			node.material.metalness = 0;
			node.material.roughness = 1;
		}
		
		if( node.name.includes( "Room" ) || node.name.includes( "Floor" ) ){
			node.material.metalnessMap = Textures.walls.metalnessMap;
			node.material.roughnessMap = Textures.walls.roughnessMap;
		}

		if( node.name === "Floor" ){
			
			if( node.children.length === 0 ){
				node.geometry.computeBoundingBox();
				let size = new THREE.Vector3();
				node.geometry.boundingBox.getSize( size );
				let geo = new THREE.PlaneBufferGeometry( size.x , size.z );
				let mat = new THREE.MeshBasicMaterial({
					color: 0x000000,
					alphaMap: Textures.floor.alphaMap,
					transparent: true,
				});
				
				let shadowPlane = new THREE.Mesh( geo, mat );
				shadowPlane.position.y += 0.01;
				shadowPlane.rotation.x = -90 * Math.PI/180;
				node.add( shadowPlane );
			}
		}

	});

	Levels[0].gltf.scene.getObjectByName('Player').visible = false;
	Levels[0].playerPos = new THREE.Vector3().copy( Levels[0].gltf.scene.getObjectByName('Player').position );
	Levels[0].playerPos.y = playerStats.height;
	Levels[0].playerRot = new THREE.Euler().copy( Levels[0].gltf.scene.getObjectByName('Player').rotation );

	
	if( GameState.progress === 0 ) Levels[0].buildLanternOnTable();
	
	console.log( "Room: " );
	//console.log( Levels[0].gltf );
	Levels[0].scene.add( Levels[0].gltf.scene );
	
}

Levels[0].buildLanternOnTable = function(){
	
	Levels[0].lantern = new THREE.Mesh(
		new THREE.CylinderBufferGeometry( 0.05 , 0.05 , 0.6 , 20 ),
		new THREE.MeshPhongMaterial({ color:0x888888, transparent: true, opacity: 0.94, shininess: 30 })
	);
	let capGeometry = new THREE.CylinderBufferGeometry( 0.06 , 0.06 , 0.10 , 10 );
	
	Levels[0].lantern.capUp = new THREE.Mesh(
		capGeometry,
		new THREE.MeshPhongMaterial({ color: 0x999999, flatShading: true })
	);
	Levels[0].lantern.capUp.position.y += 0.3;
	Levels[0].lantern.capDown = new THREE.Mesh(
		capGeometry,
		new THREE.MeshPhongMaterial({ color: 0x999999, flatShading: true })
	);
	Levels[0].lantern.capDown.position.y -= 0.3;
	Levels[0].lantern.add( Levels[0].lantern.capUp, Levels[0].lantern.capDown );
	Levels[0].lantern.position.set( -4.0 , 3.0 , -1 );
	Levels[0].lantern.scale.multiplyScalar( 2.0 );
	
	Levels[0].scene.add( Levels[0].lantern );
	
	Levels[0].interractiveItems.push( Levels[0].lantern );
	Levels[0].lantern.clickEvent = function(){
		Levels[0].scene.remove( Levels[0].lantern );
		let i = Levels[0].interractiveItems.indexOf( Levels[0].lantern );
		Levels[0].interractiveItems.splice( i , 1 );
		
		GameState.progress = 1;
		player.activateLantern();
		setTimeout( Levels[0].turnOffLights, 2000 );
	}
}

Levels[0].constructCollisionBoxes = function() {

	Levels[0].staticCollideMesh.forEach( function( mesh ){
		// Bounding Box
		mesh.BBox = new THREE.Box3().setFromObject( mesh );

		if( mesh.name.includes("Table") ){
			let amount = 1;
			mesh.BBox.expandByScalar( -amount );
			mesh.BBox.max.y += amount + 0.05;
			mesh.BBox.min.y -= amount + 0.05;
		}

		// helper
		if( box3helpers ){
			mesh.BBoxHelper = new THREE.Box3Helper( mesh.BBox , 0xff0000 );
			Levels[0].scene.add( mesh.BBoxHelper );
		}
	});
}

Levels[0].turnOffLights = function(){
	
	let lights = [];
	Levels[0].Lights.forEach( function( light ){
		if( light instanceof THREE.PointLight ) {
			lights.push( light );
		}
	});
	
	let count = 0;
	let lStartingIntensity = lights[0].intensity;
	let length = 20; // in frames
	let turnOff = setInterval( function(){
		
		if( lights[0].intensity > 0 ){
			
			lights[0].intensity -= lStartingIntensity/length;
			if( count === 30 - 29 ){
				lights[0].add( Sounds.lightSlam );
				Sounds.lightSlam.play();
				console.log( "boom" );
			}
			
		} else if( lights[1].intensity > 0 && count > 90 ){
			
			lights[1].intensity -= lStartingIntensity/length;
			if( count === 120 - 29 ){
				// play dying light sound
				lights[1].add( Sounds.lightSlam );
				Sounds.lightSlam.stop();
				Sounds.lightSlam.play();
				console.log( "boom" );
			}
			
		} else if( lights[1].intensity <= 0 ){
			
			lights[0].intensity = 0;
			lights[1].intensity = 0;
			MessageSystem.showMessage( 
				Levels[0].messages.howToUseLantern.text, 
				Levels[0].messages.howToUseLantern.duration
			);
			clearInterval( turnOff );
		}
		
		count++;
		
	}, 1000/60 );
	
}

Levels[0].initLights = function(){
	let ambientLight = new THREE.AmbientLight( 0xffffff , 0.02 );
	Levels[0].Lights.push( ambientLight );
	
	if( GameState.progress === 0 ){
		
		Levels[0].Lights.forEach( function( light ){
			Levels[0].scene.add( light );
			if( Levels[0].lightHelpers && light instanceof THREE.PointLight ) {
				let lightHelp = new THREE.PointLightHelper( light, 0.2 );
				Levels[0].scene.add( lightHelp );
			}
		});
	}
}

