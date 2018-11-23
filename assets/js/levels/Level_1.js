

Levels[1].initModels = function(){

	Levels[1].gltf.scene.traverse( function( node ) {
		
		
		if( node.name === "Stairs_body" || node.name === "Player" ){
			node.material.visible = false;
		}
		
		if( node instanceof THREE.Mesh ){
			// console.log( " m: " + node.material.metalness + " r: " + node.material.roughness  );
			node.material.metalness = 0;
			node.material.roughness = 1;
		}
		
	});
	
	Levels[1].playerPos = new THREE.Vector3( 72 , 15.5 , 0 );
	
	console.log( "corridor: " );
	console.log( Levels[1].gltf );
	
	/* Levels[1].gltf.scene.children.forEach( function(obj, i) {
		console.log(i);
		Levels[1].scene.add( obj );
	}); */
	Levels[1].scene.add( Levels[1].gltf.scene );
	
}

// ( 72 , 0 , 15.5 )
Levels[1].constructCollisionBoxes = function() {
	
}

Levels[1].initLights = function(){
	// let ambientLight = new THREE.AmbientLight( 0xffffff , 0.02 );
	let ambientLight = new THREE.AmbientLight( 0xffffff , 1.0 );
	Levels[1].Lights.push( ambientLight );
	
	Levels[1].Lights.forEach( function( light ){
		Levels[1].scene.add( light );
	});
}

