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
	speed: 7.0,
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
	},
};

// GAME
let GameState = {
	progress: 0,
};

// LEVELS
let Levels = [
	{
		name: "Level 0",
		Lights: [],
		scene: null,
		playerPos: new THREE.Vector3( 9 , playerStats.height, 4 ),
		playerRot: new THREE.Euler( 0 , 0 , 0 ),
		staticCollideMesh: [],
		interractiveItems: [],
		lightHelpers: false,
		events: [],
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
		lightHelpers: true,
		events: [],
		messages: {
			lockedDoor: {
				text: `It's locked..`,
				duration: 1000,
			},
		},
	}
];


