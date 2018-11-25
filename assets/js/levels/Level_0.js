
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
			let light = new THREE.PointLight( 0xffffee, 1.5, 15 , 2 );
			light.position.copy( node.position );
			light.position.y += 1;
			if(shadows){
				light.castShadow = true;
				light.shadow.mapSize.width = 512*1;
				light.shadow.mapSize.height = 512*1;
				light.shadow.camera.near = 0.1;
				light.shadow.camera.far = 1000;
				light.shadow.bias = 0.0001;
			}
			
			//Levels[0].Lights.push( light );

			// let help = new THREE.PointLightHelper( light, 0.2 );
			// Levels[0].scene.add( help );
		}

		if( node.name.includes( "Box" ) ){
			// "http://localhost:8080/models/room1/wood.png"
			// Bad texture naming led to a bug
			let baseUri = node.material.map.image.baseURI;
			node.material.map.image.currentSrc = baseUri + 'assets/models/Level_0_alt/box_wood.jpg';
			node.material.map.image.src = baseUri + 'assets/models/Level_0_alt/box_wood.jpg';
		}

		if( node.name.includes( "Box" ) ||
			node.name.includes( "Barrel" ) ||
			node.name.includes( "Wall" ) ||
			node.name.includes( "Table" ) ){

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

	});

	Levels[0].gltf.scene.getObjectByName('Player').visible = false;
	Levels[0].playerPos = new THREE.Vector3().copy( Levels[0].gltf.scene.getObjectByName('Player').position );
	Levels[0].playerPos.y = playerStats.height;
	Levels[0].playerRot = new THREE.Euler().copy( Levels[0].gltf.scene.getObjectByName('Player').rotation );

	// initPlayer();
	/* player = new Player({
		pos: new THREE.Vector3( 
			Levels[0].playerPos.x, 
			playerStats.height, 
			Levels[0].playerPos.z 
		),
		camera: camera0,
	}); */
	
	Levels[0].constructCollisionBoxes();

	console.log( Levels[0].gltf );
	Levels[0].scene.add( Levels[0].gltf.scene );
	
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

Levels[0].initLights = function(){
	let ambientLight = new THREE.AmbientLight( 0xffffff , 0.02 );
	Levels[0].Lights.push( ambientLight );
	
	Levels[0].Lights.forEach( function( light ){
		Levels[0].scene.add( light );
		if( Levels[0].lightHelpers && light instanceof THREE.PointLight ) {
			let lightHelp = new THREE.PointLightHelper( light, 0.2 );
			Levels[0].scene.add( lightHelp );
		}
	});
}

