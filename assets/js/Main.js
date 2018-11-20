var canvas = document.getElementById("myCanvas");
let camera0, camera1, scene0, renderer, stats, controls;
let textureLoader, gltfLoader;
let box, barrel, sphere;
let Textures = {
	grass: null,
};
let Lights = [];
let clock = new THREE.Clock() , delta;
let shadows = true;

let staticCollideMesh = [];
let dynamicCollideMesh = [];

let outsidePlayer = false; // remove in production
let player = {
	update: function(){
		// just to avoid ifing existance of player being classed
	}
};


function init() {
	renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	if(shadows){ 
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	}
	
	scene0 = new THREE.Scene();
	scene0.background = new THREE.Color( 0x101020 );
	// scene0.background = new THREE.Color( 0x3050b0 );
	// scene0.fog = new THREE.Fog( 0x101010 , 10 , 200 );
	
	camera0 = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.01, 10000 );
	
	if( outsidePlayer ){
		camera0.position.set( -3 , 4 , 10 );
		camera0.lookAt( new THREE.Vector3( -6 , 2 , 0 ) );
	}
	
	camera1 = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.01, 10000 );
	
	let camHelper = new THREE.CameraHelper( camera1 );
	if( outsidePlayer ) scene0.add( camHelper );
	
	stats = new Stats();
	document.body.appendChild( stats.dom );

	window.addEventListener("resize", function(){
		renderer.setSize( window.innerWidth, window.innerHeight );
		camera0.aspect = window.innerWidth / window.innerHeight;
		camera0.updateProjectionMatrix();
	}, false);
	
	textureLoader = new THREE.TextureLoader();
	gltfLoader = new THREE.GLTFLoader();
	// Optional: Provide a DRACOLoader instance to decode compressed mesh data
	THREE.DRACOLoader.setDecoderPath( '/assets/js/draco/gltf/' );
	THREE.DRACOLoader.setDecoderConfig({type: 'js'});
	gltfLoader.setDRACOLoader( new THREE.DRACOLoader() );
	
	
	initTextures();
	
	initLights();
	createStartingMesh();
	loadModels();
}

var createStartingMesh = function(){
	var floor = new THREE.Mesh( 
		new THREE.PlaneGeometry( 200, 200 ), 
		new THREE.MeshPhongMaterial({
			color: 0x107010,
			// map: Textures.grass,
			shininess: 0,
		})
	);
	// if(shadows) floor.receiveShadow = true;
	floor.rotation.x = -90 * Math.PI/180;
	scene0.add( floor )
	
	var cube1 = new THREE.Mesh(
		new THREE.BoxBufferGeometry( 2 , 2 , 2 ),
		new THREE.MeshLambertMaterial({ color: 0x900090 })
	);
	cube1.position.set( -6 , 1 , 0 );
	// scene0.add( cube1 );
}

var loadModels = function(){
	
	gltfLoader.load( '/assets/models/Level_1/room1.gltf', 
		function ( gltf ) {	
			
			gltf.scene.position.y += 0.01; // avoid Z fighting
			
			gltf.scene.traverse( function( node ) {
				if( node.name === "Lamp0" || node.name === "Lamp1" ) {
					let light = new THREE.PointLight( 0xffffee, 1.5, 15 , 2 );
					light.position.copy( node.position );
					light.position.y -= 1;
					if(shadows){
						light.castShadow = true;
						light.shadow.mapSize.width = 512*1;
						light.shadow.mapSize.height = 512*1;
						light.shadow.camera.near = 0.1;
						light.shadow.camera.far = 1000;
						light.shadow.bias = 0.0001;
					}
					
					Lights.push( light );
					scene0.add( light );
					
					let help = new THREE.PointLightHelper( light, 0.2 );
					// scene0.add( help );
				}
				
				if( node.name.includes( "Box" ) ){
					// "http://localhost:8080/models/room1/wood.png"
					// Bad texture naming led to a bug
					let baseUri = node.material.map.image.baseURI;
					node.material.map.image.currentSrc = baseUri + 'assets/models/Level_1/box_wood.jpg';
					node.material.map.image.src = baseUri + 'assets/models/Level_1/box_wood.jpg';
				}
				
				if( node.name.includes( "Box" ) || 
					node.name.includes( "Barrel" ) || 
					node.name.includes( "Wall" ) || 
					node.name.includes( "Table" ) ){
						
					staticCollideMesh.push( node );
					
				}
				
				if( node.name.includes( "Wall_Block" ) ){
					// only serve as bounding boxes
					node.visible = false;
				}

				if( shadows && node instanceof THREE.Mesh ){
					node.castShadow = true;
					node.receiveShadow = true;
					node.material.metalness = 0;
					node.material.roughness = 1;
				}
				
			});
			
			gltf.scene.getObjectByName('Player').visible = false;
			
			console.log( gltf.scene.getObjectByName("Room") );
			
			// initPlayer();
			if( outsidePlayer ) {
				player = new Player({
					pos: new THREE.Vector3( -8 , playerStats.height , 8 ),
					camera: camera1,
				});
			} else {
				player = new Player({
					pos: new THREE.Vector3( -8 , playerStats.height , 8 ),
					camera: camera0,
				});
			}
			constructCollisionBoxes();
			
			console.log( gltf );
			scene0.add( gltf.scene );

		}, function ( xhr ) {
			// console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		}, function ( error ) {
			console.log( 'Error happened: ' + error);
		}
	);
}

let constructCollisionBoxes = function() {
	
	staticCollideMesh.forEach( function( mesh ){
		// Bounding Box
		mesh.BBox = new THREE.Box3().setFromObject( mesh );
		
		if( mesh.name.includes("Table") ){
			let amount = 1;
			mesh.BBox.expandByScalar( -amount );
			mesh.BBox.max.y += amount + 0.05;
			mesh.BBox.min.y -= amount + 0.05;
		}
		
		// helper
		mesh.BBoxHelper = new THREE.Box3Helper( mesh.BBox , 0xff0000 );
		scene0.add( mesh.BBoxHelper );
	});
}

let initTextures = function(){
	Textures.grass = textureLoader.load( "assets/textures/grass2.png" );
	Textures.grass.wrapS = THREE.RepeatWrapping;
	Textures.grass.wrapT = THREE.RepeatWrapping;
	Textures.grass.repeat.set( 20, 20 );
}

var initLights = function(){
	Lights[0] = new THREE.AmbientLight( 0xffffff , 0.02 );
	/* Lights[1] = new THREE.PointLight( 0xffffee , 0.9 ); // 0.9
	Lights[1].position.set( 30 , 100 , -90 );
	if(shadows){
		Lights[1].castShadow = true;
		Lights[1].shadow.mapSize.width = 1024*2;
		Lights[1].shadow.mapSize.height = 1024*2;
		Lights[1].shadow.camera.near = 0.5;
		Lights[1].shadow.camera.far = 10000;
		Lights[1].shadow.bias = 0.0001;
	}
	
	var PointLightHelper = new THREE.PointLightHelper( Lights[1] , 10 );
	scene0.add( PointLightHelper ); */
	
	console.log( Lights[0] );
	for(var i in Lights){
		scene0.add( Lights[i] );
	}
}

function animate( time ) {
	stats.begin();
	
	delta = clock.getDelta();
	player.update( delta );

	renderer.render( scene0, camera0 );
	requestAnimationFrame( animate );
	
	stats.end();
}

init();
requestAnimationFrame( animate );