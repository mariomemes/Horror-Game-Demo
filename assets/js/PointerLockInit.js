
let initPointerLock = function(){
	
	// Optimize for different browser versions
	if ("onpointerlockchange" in document) {
		document.addEventListener('pointerlockchange', onLockChange, false);
	} else if ("onmozpointerlockchange" in document) {
		document.addEventListener('mozpointerlockchange', onLockChange, false);
	}
	
	startPointerLock();
	
}

let onLockChange = function( evt ){
	
	// Check whether pointer has just been locked or unlocked
	if( pointerIsLocked( canvas ) ){
		console.log('The pointer lock status is now locked');
	} else {
		console.log('The pointer lock status is now unlocked'); 
	}
	
}

let startPointerLock = function(){
	// these should probably be in init
	canvas.requestPointerLock = canvas.requestPointerLock || 
								canvas.mozRequestPointerLock;
	
	canvas.requestPointerLock();
}

let exitPointerLock = function(){
	document.exitPointerLock = document.exitPointerLock ||
							   document.mozExitPointerLock;
	
	// Attempt to unlock
	document.exitPointerLock();
}

let pointerIsLocked = function( element ){
	
	// CHECK IF ELEMENT HAS POINTER LOCKED ON IT
	if(document.pointerLockElement === element ||
		document.mozPointerLockElement === element) {
		// console.log('The pointer lock status is now locked');
		return true;
	} else {
		// console.log('The pointer lock status is now unlocked'); 
		return false;
	}
}

initPointerLock();

