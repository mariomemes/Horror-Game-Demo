let canvas = document.getElementById("myCanvas");
let pointer = document.querySelector(".pointer");
let messager = document.querySelector(".messager-container");
let waitingScreenDiv = document.querySelector(".waiting-screen");

let camera0, scene0, scene1, renderer, stats, controls, audioListener;
let loadingManager, textureLoader, gltfLoader, FBXLoader, audioLoader;
let clock, delta;
let currentLevel = 0;

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
	Creeper: {
		skin: null,
	},
	loadingPics: [],
};
let Sounds = {
	footsteps: null,
	doorOpening: null,
	december: null,
	quietGrowl: null,
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

// WAITING SCREEN
let ws = {
	scene: new THREE.Scene(),
	camera: new THREE.OrthographicCamera( -100 * window.innerWidth/window.innerHeight , 100 * window.innerWidth/window.innerHeight , 100 , -100 , 0.1, 100 ),
	sphere: new THREE.Mesh( 
		new THREE.SphereBufferGeometry(1), 
		new THREE.MeshBasicMaterial({ color: 0xff0040, wireframe: true }),
	),
};

// PLAYER
let playerStats = {
	height: 5,
	speed: 7.0, // 7.0 main
}
let player = {
	update: function(){
		// just to avoid ifing existance of player being classed
	}
};

// MONSTERS
let Monsters = {
	// Array of enemies
	array: [],
	// Info of enemies
	Creeper: {
		walkingSpeed: 4.0,
		runningSpeed: 32.0,
	},
};

// GAME
let GameState = {
	progress: 1,
};

// LEVELS
let Levels = [
	{
		name: "Level 0",
		Lights: [],
		scene: null,
		staticCollideMesh: [],
		interractiveItems: [],
		events: [],
		lightHelpers: false,
		loading: false,
		messages: {
			instructions: {
				text: `
					Use [W][S][A][D] to move. </br>
					Hold [Shift] to run or [C] to crouch. </br>
					Press [Q] or [E] to look around. </br> 
				`,
				duration: 7000,
			},
			noLantern: {
				text: `I feel like I'm forgetting something...`,
				duration: 2000,
			},
			howToUseLantern: {
				text: `Press [F] to switch on your glowstick`,
				duration: 4000,
			},
		},
	},
	{
		name: "Level 1",
		Lights: [],
		scene: null,
		staticCollideMesh: [],
		interractiveItems: [],
		events: [],
		lightHelpers: true,
		loading: false,
		messages: {
			lockedDoor: {
				text: `It's locked..`,
				duration: 1000,
			},
		},
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
	Levels[1].scene = scene1;

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
		
		requestAnimationFrame( animate );
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
	FBXLoader = new THREE.FBXLoader( loadingManager );
	
	fadeIn( waitingScreenDiv );
	initTextures();
	initSounds();
	loadModels();
	
}

let loadingFinished = function(){
	loadingReady = true;
	fadeOut( waitingScreenDiv );
}

let LoadingScreen = function() {
	ls.sphere.rotation.x += 0.004;
	ls.sphere.rotation.y += 0.007;
	
	renderer.render( ls.scene, ls.camera );
}

Levels[0].init = function( pos, rot ){
	let startPosition, startRotation;
	currentLevel = 0;
	
	Sounds.footsteps.setVolume( 0.0 );
	clearScene( Levels[0] );
	
	Levels[0].initModels();
	Levels[0].constructCollisionBoxes();
	Levels[0].initLights();
	if( Sounds.december.isPlaying ) Sounds.december.stop();
		
	if( pos instanceof THREE.Vector3 ) startPosition = new THREE.Vector3().copy( pos );
	else startPosition = Levels[0].playerPos;
	
	if( rot instanceof THREE.Euler ) startRotation = new THREE.Euler().copy( rot );
	else startRotation = Levels[0].playerRot;
	
	initPlayer({
		position: startPosition,
		camera: camera0,
		rotation: startRotation,
	});
	
	if( GameState.progress === 0 ) {
		setTimeout( function(){
			MessageSystem.showMessage( 
				Levels[0].messages.instructions.text , 
				Levels[0].messages.instructions.duration
			);
		}, 7000 )
	}
	
	console.log( Levels[0].scene );
	
	setTimeout( function(){
		fadeOut( waitingScreenDiv );
	}, 4000 );
}

Levels[1].init = function( pos ){
	// fadeIn( waitingScreenDiv );
	
	
	currentLevel = 1;
	
	Sounds.footsteps.setVolume( 0.0 );
	clearScene( Levels[1] );
	
	Levels[1].initModels();
	Levels[1].constructCollisionBoxes();
	if( GameState.progress <= 1 ) Levels[1].spawnMonsterOne();
	if( GameState.progress <= 3 ) Levels[1].spawnBigMonster();
	Levels[1].initLights();
	
	initPlayer({
		position: Levels[1].playerPos,
		camera: camera0,
		rotation: Levels[1].playerRot,
	});
	
	if( GameState.progress === 1 ) Levels[1].initEvents();
	
	console.log( Levels[1].scene );
	
	if( GameState.progress > 0 ) setTimeout( function(){
		fadeOut( waitingScreenDiv );
	}, 4000 );
	
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
	
	gltfLoader.load( '/assets/models/Creeper3/alien_v3.gltf',
	// gltfLoader.load( '/assets/models/Creeper_final/alien.gltf',
		function ( gltf ) {
			
			/* gltf.scene.children[0].traverse( function( node ){
				if( node instanceof THREE.SkinnedMesh || node instanceof THREE.Mesh ){
					node.material.metalness = 0;
				}
				if( node.name.includes( "eye" ) ){
					node.material.color = new THREE.Color( 0 , 0 , 0 );
				}
			}); */
			gltf.scene.traverse( function(node){
				
				if( node instanceof THREE.SkinnedMesh && node instanceof THREE.Mesh ){
					node.frustumCulled = false;
				}
			} );
			
			gltf.scene.getObjectByName( "eye1" ).material.color = new THREE.Color( 0 , 0 , 0 );
			gltf.scene.getObjectByName( "eye1" ).material.metalness = 0.7;
			gltf.scene.getObjectByName( "eye1" ).material.roughness = 0.3;
			
			Monsters.Creeper.body = gltf.scene.children[0];
			Monsters.Creeper.gltf = gltf;
			Monsters.Creeper.animationClips = gltf.animations;
			
		}, function ( xhr ) {
			// console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		}/* , function ( error ) {
			console.log( 'Error happened: ' + error);
		} */
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
	Textures.Creeper.skin = textureLoader.load( "assets/models/Creeper_final/skin.png" );
	
	Textures.loadingPics[0] = textureLoader.load( "assets/textures/dark-room-pic.jpg" );
	
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
		Sounds.december.setDistanceModel( "inverse" ); // default
		// Sounds.december.setMaxDistance( 85 );
		
	});
	
	Sounds.quietGrowl = new THREE.PositionalAudio( audioListener );
	audioLoader.load( 'assets/sounds/beast-growl-slow.ogg', function( buffer ) {
		Sounds.quietGrowl.setBuffer( buffer );
		Sounds.quietGrowl.setLoop( false );
		Sounds.quietGrowl.setVolume( 1.0 );
		Sounds.quietGrowl.setRefDistance( 1.0 ); // distance from which the sound weakens
		
		Sounds.quietGrowl.setRolloffFactor( 0.1 );
		Sounds.quietGrowl.setDistanceModel( "inverse" ); // default
		// Sounds.december.setMaxDistance( 85 );
		
	})
}

// Thanks to cdata/three-clone-gltf.js
// https://gist.github.com/cdata/f2d7a6ccdec071839bc1954c32595e87
const cloneGltf = (gltf) => {
  const clone = {
    animations: gltf.animations,
    scene: gltf.scene.clone(true)
  };

  const skinnedMeshes = {};

  gltf.scene.traverse(node => {
    if (node.isSkinnedMesh) {
      skinnedMeshes[node.name] = node;
    }
  });

  const cloneBones = {};
  const cloneSkinnedMeshes = {};

  clone.scene.traverse(node => {
    if (node.isBone) {
      cloneBones[node.name] = node;
    }

    if (node.isSkinnedMesh) {
      cloneSkinnedMeshes[node.name] = node;
    }
  });

  for (let name in skinnedMeshes) {
    const skinnedMesh = skinnedMeshes[name];
    const skeleton = skinnedMesh.skeleton;
    const cloneSkinnedMesh = cloneSkinnedMeshes[name];

    const orderedCloneBones = [];

    for (let i = 0; i < skeleton.bones.length; ++i) {
      const cloneBone = cloneBones[skeleton.bones[i].name];
      orderedCloneBones.push(cloneBone);
    }

    cloneSkinnedMesh.bind(
        new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
        cloneSkinnedMesh.matrixWorld);
  }

  return clone;
}

let clearScene = function( level ){
	// player.ready = false;
	
	// Clear all scene objects
	let Scene = level.scene;
	for( let i = Scene.children.length -1; i >= 0; i-- ){
		let child = Scene.children[i];
		if( child != player.body ){
			Scene.remove( child );
			/* for( let j = child.children.length -1; j >= 0; j-- ){
				child.remove( child.children[j] );
			} */
			// console.log(child);
		}
	}
	level.Lights = [];
	level.staticCollideMesh = [];
	level.interractiveItems = [];
	
	Monsters.array = [];
	
	level.events = [];
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
		// LoadingScreen();
		// pointer.src = "assets/textures/pointer_empty.png";
		requestAnimationFrame(animate);
		return;
	}
	
	stats.begin();
	
	delta = clock.getDelta();
	if( player.ready ) player.update( delta );
	for( let i = Monsters.array.length-1; i >= 0; i-- ){
		Monsters.array[i].update( delta );
	}
	Levels[currentLevel].events.forEach( function(lEvent){
		lEvent.trigger();
	});
	
	renderer.render( Levels[currentLevel].scene , camera0 );
	requestAnimationFrame( animate );

	stats.end();
}

init();
// requestAnimationFrame( animate );
