let audioFormat;

let setFormat = function(){
	let audio = new Audio();
	if(audio.canPlayType("audio/mp3")){
		audioFormat = ".mp3";
	} else {
		audioFormat = ".ogg";
	}
}

