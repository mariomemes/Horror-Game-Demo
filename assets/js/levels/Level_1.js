

Levels[1].initModels = function(){

	Levels[1].gltf.scene.traverse( function( node ) {
		
	});
	
	Levels[1].playerPos = new THREE.Vector3( 72 , 15.5 , 0 );
	
	console.log( "corridor: " );
	console.log( Levels[1].gltf );
	
}

// ( 72 , 0 , 15.5 )
Levels[1].constructCollisionBoxes = function() {
	
}

Levels[1].initLights = function(){
	// let ambientLight = new THREE.AmbientLight( 0xffffff , 0.02 );
	let ambientLight = new THREE.AmbientLight( 0xffffff , 0.6 );
	Levels[1].Lights.push( ambientLight );
	
	Levels[1].Lights.forEach( function( light ){
		Levels[1].scene.add( light );
	});
}

