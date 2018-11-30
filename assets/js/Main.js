let canvas = document.getElementById("myCanvas");
let pointer = document.getElementById("pointer");

let camera0, scene0, scene1, renderer, stats, controls;
let loadingManager, textureLoader, gltfLoader;
let currentLevel;
let Textures = {
	grass: null,
};
let clock = new THREE.Clock() , delta;
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

// LEVELS
let Levels = [
	{
		Lights: [],
		scene: null,
		staticCollideMesh: [],
		interractiveItems: [],
		lightHelpers: true,
	},
	{
		Lights: [],
		scene: null,
		staticCollideMesh: [],
		interractiveItems: [],
		lightHelpers: false,
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
			Levels[0].init();
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

Levels[0].init = function(){
	
	currentLevel = 0;
	
	// if( Levels[0].scene.children.length == 0 ) {
		
		// Levels[0].scene = scene0;
		Levels[0].initModels();
		Levels[0].constructCollisionBoxes();
		Levels[0].initLights();
		
	// } 
	
	initPlayer({
		position: Levels[0].playerPos,
		camera: camera0,
		rotation: Levels[0].playerRot,
	});
	
	console.log( Levels[0].scene );
}

Levels[1].init = function(){
	
	currentLevel = 1;
	
	/* if( Levels[1].scene == null ) {
		
		Levels[1].scene = scene0;
		Levels[1].initModels();
		Levels[1].constructCollisionBoxes();
		Levels[1].initLights();
	} */
	
	
	
	if( Levels[0].gltf.scene.parent == Levels[1].scene ) {
		
		disposeHierarchy( Levels[1].scene, disposeNode );
		Levels[1].scene.remove( Levels[0].gltf.scene );
	}
	
	if( Levels[1].gltf.scene.parent == Levels[1].scene ) {
		
		disposeHierarchy( Levels[1].scene, disposeNode );
		Levels[1].scene.remove( Levels[1].gltf.scene );
	}
	
	Levels[1].initModels();
	Levels[1].constructCollisionBoxes();
	Levels[1].initLights();
	
	
	initPlayer({
		position: Levels[1].playerPos,
		camera: camera0,
		rotation: Levels[1].playerRot,
	});
	
	console.log( Levels[1].scene );
	
}

let loadModels = function(){

	gltfLoader.load( '/assets/models/Level_0_alt/room1_ver2.gltf',
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
	Textures.grass = textureLoader.load( "assets/textures/grass2.png" );
	Textures.grass.wrapS = THREE.RepeatWrapping;
	Textures.grass.wrapT = THREE.RepeatWrapping;
	Textures.grass.repeat.set( 20, 20 );
}

let clearScene = function( Scene ){
	for( let i = Scene.children.length -1; i >= 0; i-- ){
		let child = Scene.children[i];
		Scene.remove( child );
	}
	// Scene.children = [];
}


function disposeNode(node)
{
    if (node instanceof THREE.Mesh)
    {
        if (node.geometry)
        {
            node.geometry.dispose ();
        }

        if (node.material)
        {
            if (node.material instanceof THREE.MeshFaceMaterial)
            {
                $.each (node.material.materials, function (idx, mtrl)
                {
                    if (mtrl.map)           mtrl.map.dispose ();
                    if (mtrl.lightMap)      mtrl.lightMap.dispose ();
                    if (mtrl.bumpMap)       mtrl.bumpMap.dispose ();
                    if (mtrl.normalMap)     mtrl.normalMap.dispose ();
                    if (mtrl.specularMap)   mtrl.specularMap.dispose ();
                    if (mtrl.envMap)        mtrl.envMap.dispose ();

                    mtrl.dispose ();    // disposes any programs associated with the material
                });
            }
            else
            {
                if (node.material.map)          node.material.map.dispose ();
                if (node.material.lightMap)     node.material.lightMap.dispose ();
                if (node.material.bumpMap)      node.material.bumpMap.dispose ();
                if (node.material.normalMap)    node.material.normalMap.dispose ();
                if (node.material.specularMap)  node.material.specularMap.dispose ();
                if (node.material.envMap)       node.material.envMap.dispose ();

                node.material.dispose ();   // disposes any programs associated with the material
            }
        }
    }
}   // disposeNode

function disposeHierarchy (node, callback){
	let removables = [];
	
    for (var i = node.children.length - 1; i >= 0; i--)
    {
        var child = node.children[i];
        disposeHierarchy(child, callback);
        callback(child);
		// removables.push( child );
    }
	
	removables.forEach( function(rm){
		node.remove( rm );
	});
}




let animate = function( time ) {
	
	if( loadingReady == false ){
		LoadingScreen();
		pointer.src = "assets/textures/pointer_empty.png";
		return;
	}
	
	stats.begin();
	
	delta = clock.getDelta();
	player.update( delta );

	renderer.render( Levels[currentLevel].scene , camera0 );
	requestAnimationFrame( animate );

	stats.end();
}

init();
requestAnimationFrame( animate );
