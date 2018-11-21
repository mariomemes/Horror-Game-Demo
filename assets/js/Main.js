var canvas = document.getElementById("myCanvas");
let camera0, scene0, scene1, renderer, stats, controls;
let loadingManager, textureLoader, gltfLoader;
let box, barrel, sphere;
let Textures = {
	grass: null,
};
let Lights = [];
let clock = new THREE.Clock() , delta;
let shadows = true;

let staticCollideMesh = [];
let dynamicCollideMesh = [];

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

// LEVELS
let Levels = [
	{
		
	},
	{
		
	}
];


function init() {
	renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	if(shadows){
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	}

	scene0 = new THREE.Scene();
	scene0.background = new THREE.Color( 0x101020 );

	camera0 = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.01, 10000 );

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
		console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
	};
	loadingManager.onLoad = function ( ) {
		setTimeout( function(){ 
			loadingFinished();
			initLevel0();
			console.log( "finished loading" );
		}, 0 );
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

let initLevel0 = function(){
	
	// createStartingMesh();
	initLevel0Models();
	initLights();
	
}

var loadModels = function(){

	gltfLoader.load( '/assets/models/Level_1/room1.gltf',
		function ( gltf ) {
			
			Levels[0].gltf = gltf;

		}, function ( xhr ) {
			// console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		}, function ( error ) {
			console.log( 'Error happened: ' + error);
		}
	);
	
}

let initTextures = function(){
	Textures.grass = textureLoader.load( "assets/textures/grass2.png" );
	Textures.grass.wrapS = THREE.RepeatWrapping;
	Textures.grass.wrapT = THREE.RepeatWrapping;
	Textures.grass.repeat.set( 20, 20 );
}

function animate( time ) {
	
	if( loadingReady == false ){
		LoadingScreen();
		return;
	}
	
	stats.begin();
	
	delta = clock.getDelta();
	player.update( delta );

	renderer.render( scene0, camera0 );
	requestAnimationFrame( animate );

	stats.end();
}

init();
requestAnimationFrame( animate );
