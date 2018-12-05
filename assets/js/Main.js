let canvas = document.getElementById("myCanvas");
let pointer = document.getElementById("pointer");

let camera0, scene0, scene1, renderer, stats, controls, audioListener;
let loadingManager, textureLoader, gltfLoader, audioLoader;
let clock, delta;
let currentLevel;

// Files
let Textures = {
	grass: null,
	walls: {
		roughnessMap: null,
		metalnessMap: null,
	},
	floor: {
		lightMap: null,
		alphaMap: null, 
		blackMap: null,
	},
	radio: {
		normalMap: null,
		aoMap: null,
		specularMap: null,
	},
};
let Sounds = {
	footsteps: null,
	doorOpening: null,
	december: null,
};


let shadows = false;
let box3helpers = false;

// LOADING SCREEN
let loadingReady = false;
let ls = {
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera( 55, window.innerWidth/window.innerHeight, 0.1, 1000 ),
	sphere: new THREE.Mesh( 
		new THREE.SphereBufferGeometry(1), 
		new THREE.MeshBasicMaterial({ color: 0xff0040, wireframe: true }),
	),
};

// PLAYER
let playerStats = {
	height: 5,
	speed: 7.0,
}
let player = {
	update: function(){
		// just to avoid ifing existance of player being classed
	}
};

// GAME
let gameProgress = 0;

// LEVELS
let Levels = [
	{
		name: "Level 0",
		Lights: [],
		scene: null,
		staticCollideMesh: [],
		interractiveItems: [],
		lightHelpers: true,
		events: [
			{},
		],
	},
	{
		name: "Level 1",
		Lights: [],
		scene: null,
		staticCollideMesh: [],
		interractiveItems: [],
		lightHelpers: false,
		events: [
			{},
		],
	}
];


let init = function() {
	renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	if(shadows){
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	}

	scene0 = new THREE.Scene();
	scene0.background = new THREE.Color( 0x101020 );
	scene1 = new THREE.Scene();
	Levels[0].scene = scene0;
	Levels[1].scene = scene0;

	camera0 = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.01, 1000 );
	
	audioListener = new THREE.AudioListener();
	camera0.add( audioListener );

	clock = new THREE.Clock();
	
	stats = new Stats();
	document.body.appendChild( stats.dom );

	window.addEventListener("resize", function(){
		renderer.setSize( window.innerWidth, window.innerHeight );
		camera0.aspect = window.innerWidth / window.innerHeight;
		camera0.updateProjectionMatrix();
	}, false);
	
	ls.scene.add( ls.sphere );
	ls.camera.position.z = 5;
	ls.sphere.position.y += 0.5;
	
	
	loadingManager = new THREE.LoadingManager();
	loadingManager.onStart = function ( url, itemsLoaded, itemsTotal ) {
		// console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
	};
	loadingManager.onLoad = function ( ) {
		setTimeout( function(){ 
			loadingFinished();
		}, 1000 );
		Levels[1].init();
		
	};
	loadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
		// console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
	};
	loadingManager.onError = function ( url ) {
		console.log( 'There was an error loading ' + url );
	};
	
	textureLoader = new THREE.TextureLoader( loadingManager );
	gltfLoader = new THREE.GLTFLoader( loadingManager );
	// Optional: Provide a DRACOLoader instance to decode compressed mesh data
	THREE.DRACOLoader.setDecoderPath( '/assets/js/draco/gltf/' );
	THREE.DRACOLoader.setDecoderConfig({type: 'js'});
	gltfLoader.setDRACOLoader( new THREE.DRACOLoader() );
	audioLoader = new THREE.AudioLoader( loadingManager );
	
	initSounds();
	initTextures();
	loadModels();
	
}

let loadingFinished = function(){
	loadingReady = true;
}

let LoadingScreen = function() {
	ls.sphere.rotation.x += 0.004;
	ls.sphere.rotation.y += 0.007;
	
	requestAnimationFrame(animate);
	renderer.render( ls.scene, ls.camera );
}

Levels[0].init = function( pos ){
	let startPosition;
	currentLevel = 0;
	
	clearScene( Levels[0] );
	
	Levels[0].initModels();
	Levels[0].constructCollisionBoxes();
	Levels[0].initLights();
	if( Sounds.december.isPlaying ) Sounds.december.stop();
		
	if( pos instanceof THREE.Vector3 ) startPosition = new THREE.Vector3().copy( pos );
	else startPosition = Levels[0].playerPos;
	initPlayer({
		position: startPosition,
		camera: camera0,
		rotation: Levels[0].playerRot,
	});
	
	console.log( scene0 );
}

Levels[1].init = function( pos ){
	
	currentLevel = 1;
	
	clearScene( Levels[1] );
	
	Levels[1].initModels();
	Levels[1].constructCollisionBoxes();
	Levels[1].initLights();
	
	initPlayer({
		position: Levels[1].playerPos,
		camera: camera0,
		rotation: Levels[1].playerRot,
	});
	
	console.log( scene0 );
}

let loadModels = function(){

	// gltfLoader.load( '/assets/models/Level_0_alt/glb/room1_ver2.glb',
	gltfLoader.load( '/assets/models/Level_0/room1_ver2.gltf',
		function ( gltf ) {
			
			Levels[0].gltf = gltf;

		}, function ( xhr ) {
			// console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		}, function ( error ) {
			console.log( 'Error happened: ' + error);
		}
	);
	
	gltfLoader.load( '/assets/models/Level_1/corridor.gltf',
		function ( gltf ) {
			
			Levels[1].gltf = gltf;

		}, function ( xhr ) {
			// console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		}, function ( error ) {
			console.log( 'Error happened: ' + error);
		}
	);
	
}

let initTextures = function(){
	// THREE.RepeatWrapping; // 1000 
	// THREE.ClampToEdgeWrapping; // 1001
	// THREE.MirroredRepeatWrapping; // 1002
	Textures.grass = textureLoader.load( "assets/textures/grass2.png" );
	Textures.grass.wrapS = THREE.RepeatWrapping;
	Textures.grass.wrapT = THREE.RepeatWrapping;
	Textures.grass.repeat.set( 20, 20 );
	
	Textures.walls.roughnessMap = textureLoader.load( "assets/models/Level_1/redbricks2b-rough.png" );
	Textures.walls.metalnessMap = textureLoader.load( "assets/models/Level_1/redbricks2b-metalness.png" );
	
	Textures.floor.lightMap = textureLoader.load( "assets/models/Level_0/floor_bake.png" );
	Textures.floor.alphaMap = textureLoader.load( "assets/models/Level_0/negative_shadows.jpg" );
	
}

let initSounds = function(){
	audioListener.setMasterVolume( 0.0 ); // update when loaded
	
	Sounds.footsteps = new THREE.Audio( audioListener );
	audioLoader.load( 'assets/sounds/footsteps-concrete-denoised.ogg', function( buffer ) {
		Sounds.footsteps.setBuffer( buffer );
		Sounds.footsteps.setLoop( true );
		Sounds.footsteps.setVolume( 0.0 );
		Sounds.footsteps.walkingVolume = 0.1;
		Sounds.footsteps.runningVolume = 0.4;
		Sounds.footsteps.crouchingVolume = 0.0;
		Sounds.footsteps.walkingPlaybackRate = 1.2;
		Sounds.footsteps.runningPlaybackRate = 2.0;
		Sounds.footsteps.crouchingPlaybackRate = 0.5;
		Sounds.footsteps.play();
	});
	
	Sounds.december = new THREE.PositionalAudio( audioListener );
	audioLoader.load( 'assets/sounds/Once_Upon_A_December_distorted.ogg', function( buffer ) {
		Sounds.december.setBuffer( buffer );
		Sounds.december.setLoop( false );
		Sounds.december.setVolume( 0.05 );
		Sounds.december.setRefDistance( 1.0 ); // distance from which the sound weakens
		
		Sounds.december.setRolloffFactor( 0.2 );
		Sounds.december.setDistanceModel( "inverse" );
		// Sounds.december.setMaxDistance( 85 );
		
	});
}

let clearScene = function( level ){
	let Scene = level.scene;
	for( let i = Scene.children.length -1; i >= 0; i-- ){
		let child = Scene.children[i];
		if( child != player.body ){
			Scene.remove( child );
			// console.log(child);
		}
	}
	level.Lights = [];
	level.staticCollideMesh = [];
	level.interractiveItems = [];
}

let spam = function(num){
	let x = 0;
	
	let f = {
		func: function(){
			// console.log( x );
			Levels[0].init();
			
			x++;
			if( x < num ) setTimeout( f.func, 1 );
		}
	};
	
	f.func();
}

let animate = function( time ) {
	
	if( loadingReady == false ){
		LoadingScreen();
		pointer.src = "assets/textures/pointer_empty.png";
		return;
	}
	
	stats.begin();
	
	delta = clock.getDelta();
	if( player.ready ) player.update( delta );

	renderer.render( scene0 , camera0 );
	requestAnimationFrame( animate );

	stats.end();
}

init();
requestAnimationFrame( animate );
