
let MessageSystem = {
	timeout: null,
};

/* Levels[0].messages.instructions = {
	text: `
		Use [W][S][A][D] to move. </br>
		Hold [Shift] to run or [C] to crouch. </br>
		Press [Q] or [E] to look around. </br> 
	`,
	duration: 7000,
}
Levels[0].messages.noLantern = {
	text: `I feel like I'm forgetting something...`,
	duration: 2000,
}
Levels[0].messages.howToUseLantern = {
	text: `Press [F] to switch on your glowstick`,
	duration: 4000,
}


Levels[1].messages.lockedDoor = {
	text: `It's locked..`,
	duration: 1000,
} */


MessageSystem.showMessage = function( message, duration ){
	// if( duration == undefined ) duration = 3000;
	
	fadeIn( messager );
	
	messager.innerHTML = message;
	
	messageToBeRemoved = false;
	
	if( duration == undefined ) return;
	//Clear timeout if one exists to reset
	clearTimeout( MessageSystem.timeout );
	MessageSystem.timeout = window.setTimeout( function(){
		
		fadeOut( messager );
	}, duration );
	
}


let fadeIn = function( element ){
	// console.log("fadein");
	
	let arr = element.className.split(" ");
	
	if ( arr.indexOf( "fade-out" ) != -1 ) {
		element.classList.remove( "fade-out" );
	}
	
	if ( arr.indexOf( "fade-in" ) == -1 ) {
		element.classList.add( "fade-in" );
	}
}

let fadeOut = function( element ){
	
	let arr = element.className.split(" ");
	
	if ( arr.indexOf( "fade-in" ) != -1 ) {
		element.classList.remove( "fade-in" );
	}
	
	if ( arr.indexOf( "fade-out" ) == -1 ) {
		element.classList.add( "fade-out" );
	}
}




