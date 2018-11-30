

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

			Levels[1].interractiveItems.push( node );

		}
		
		if( node.name.includes( "Lamp" ) ){
			let light = new THREE.PointLight( 0xffffee, 0.8, 40 , 2 );
			light.position.copy( node.position );
			light.position.y = 18;
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
		
	});
	
	// Temporaary Lighting
	/* let poses = [
		new THREE.Vector3( 70 , 23 , 0 ),
		new THREE.Vector3( -65 , 23 , 0 ),
		new THREE.Vector3( -65 , 23 , -150 ),
		new THREE.Vector3( -215 , 23 , -150 ),
		new THREE.Vector3( -215 , 23 , 0 ),
		new THREE.Vector3( -365 , 23 , 0 )
	];
	poses.forEach(function(lig){
		let light = new THREE.PointLight( 0xffffee, 1.5, 50 , 2 );
		light.position.copy( lig );
		light.position.y -= 1;
		if(shadows){
			light.castShadow = true;
			light.shadow.mapSize.width = 512*1;
			light.shadow.mapSize.height = 512*1;
			light.shadow.camera.near = 0.1;
			light.shadow.camera.far = 1000;
			light.shadow.bias = 0.0001;
		}
		
		Levels[1].Lights.push( light );

		let help = new THREE.PointLightHelper( light, 0.5 );
		Levels[1].scene.add( help );
	}); */
	
	
	
	Levels[1].playerPos = new THREE.Vector3().copy( Levels[1].gltf.scene.getObjectByName('Player').position );
	// Levels[1].playerPos = new THREE.Vector3( 55 , 20 , 0 );
	// Levels[1].playerRot = new THREE.Euler().copy( Levels[1].gltf.scene.getObjectByName('Player').rotation );
	Levels[1].playerRot = new THREE.Euler( 0 , 90*Math.PI/180 , 0 );
	
	console.log( "corridor: " );
	// console.log( Levels[1].gltf );
	
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

Levels[1].initLights = function(){
	let ambientLight = new THREE.AmbientLight( 0xffffff , 0.02 );
	// let ambientLight = new THREE.AmbientLight( 0xffffff , 1.0 );
	Levels[1].Lights.push( ambientLight );
	
	Levels[1].Lights.forEach( function( light ){
		Levels[1].scene.children[0].add( light );
		
		if( Levels[1].lightHelpers && light instanceof THREE.PointLight ) {
			let lightHelp = new THREE.PointLightHelper( light, 0.5 );
			Levels[1].scene.children[0].add( lightHelp );
		}
	});
}


