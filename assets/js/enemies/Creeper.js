
class Enemy {
	
	constructor( data ){
		this.body = data.body;
		this.body.name = "body";
		this.animationClips = data.animationClips;
	}
}

class Creeper extends Enemy {
	
	constructor( data ){
		
		super( data ); // call Entity constructor
		
		// Stats
		this.walkingSpeed = data.walkingSpeed;
		this.runningSpeed = data.runningSpeed;
		
		// Animation
		this.mixer = new THREE.AnimationMixer( this.body );
		this.animations = {
			idle_stance: this.mixer.clipAction( new THREE.AnimationClip.findByName( this.animationClips , 'Armature|Idle_Stance' ) ),
			idle_4legs: this.mixer.clipAction( new THREE.AnimationClip.findByName( this.animationClips , 'Armature|Idle_4Legs' ) ),
			walk_slow: this.mixer.clipAction( new THREE.AnimationClip.findByName( this.animationClips , 'Armature|Walk_slow' ) ),
			run_4legs: this.mixer.clipAction( new THREE.AnimationClip.findByName( this.animationClips , 'Armature|Run_4legs' ) ),
		};
		this.animations.walk_slow.timeScale = 0.5;
		this.animations.idle_stance.timeScale = 0.5;
		this.animations.run_4legs.timeScale = 3.0;
		this.animations.idle_4legs.timeScale = 0.5;
		
		// this.animations.idle_4legs.play();
		
		// Adding
		this.body.scale.set( data.scale , data.scale , data.scale );
		this.body.rotation.copy( data.rotation );
		this.body.position.copy( data.position );
		
		Levels[currentLevel].scene.add( this.body );
		
		// Skeleton Helper
		/* this.body.SkeletonHelper = new THREE.SkeletonHelper( this.body );
		this.body.SkeletonHelper.material.linewidth = 3;
		Levels[currentLevel].scene.add( this.body.SkeletonHelper ); */
		
		/* this.eyeBoxHelper = new THREE.BoxHelper( this.body , 0xff0000 );
		Levels[currentLevel].scene.add( this.eyeBoxHelper ); */
		
		
		Monsters.array.push( this );
		console.log( this );
		
		// extra
		
		this.head = this.body.children[0].getObjectByName( 'Head' );
		
		/* let dir = new THREE.Vector3( 0, 0, -1 ).applyQuaternion( this.head.quaternion );
		dir.multiplyScalar( 8 );
		dir.y += 10;
		
		let start = new THREE.Vector3( this.head.position.x , this.head.position.y + 10 , this.head.position.z )
		let geo = new THREE.Geometry();
		geo.vertices.push( start, dir );
		
		this.arrow = new THREE.Line( 
			geo,
			new THREE.LineBasicMaterial({ color: 0xff0000 })
		);
		Levels[currentLevel].scene.add( this.arrow );
		
		console.log( this.head ); */
		
		// this.head.rotation.y += 90 * Math.PI/180; 
	}
	
	update( time ){
		
		if( time * 60 > 2.0 ) time = 1.0/60;
		
		this.mixer.update( time );
		
		// this.walk( time )
		
		// this.run( time );
		
		/* if( player.body != undefined ){
			
			// this.body.children[0].getObjectByName( 'Head' ).rotation.order = "ZYX";
			this.head.lookAt( player.body.position.clone() );
			// boneLookAt( this.head , player.body.position )
			this.head.rotation.y -= 90*Math.PI/180;
			
		} */
		
		// this.eyeBoxHelper.update();
		
	}
	
	walk( time ){
		
		this.body.translateZ( this.walkingSpeed * time );
	}
	
	run( time ){
		this.body.translateZ( this.runningSpeed * time );
	}
	
	initLevel1Scare(){
		
		this.animations.idle_stance.stop();
		this.animations.walk_slow.play();
		
		this.update = function( time ){
			if( time * 60 > 2.0 ) time = 1.0/60;
		
			this.mixer.update( time );
			this.walk( time );
			
			if( this.body.position.x <= -80 ){
				Levels[currentLevel].scene.remove( this.body );
				Monsters.array.splice( Monsters.array.indexOf( this ) , 1 );
			}
		}
	}
	
	initLevel1Chase(){
		this.animations.idle_4legs.stop();
		this.animations.run_4legs.play();
		
		this.update = function( time ){
			if( time * 60 > 2.0 ) time = 1.0/60;
		
			this.mixer.update( time );
			this.run( time );
			
			// TURN LEFT
			if( this.body.position.x >= -225 ){
				
			}
			// TURN RIGHT
			if( this.body.position.z <= -140 ){
				
			}
			// DELETE
			if( this.body.position.x >= -170 ){
				Levels[currentLevel].scene.remove( this.body );
				Monsters.array.splice( Monsters.array.indexOf( this ) , 1 );
			}
		}
	}
}

let v = new THREE.Vector3( 0 , 0 , -1 );
function boneLookAt(bone, position) {
        var target = new THREE.Vector3(
                position.x - bone.matrixWorld.elements[12],
                position.y - bone.matrixWorld.elements[13],
                position.z - bone.matrixWorld.elements[14]
        ).normalize();
    // var v = new THREE.Vector3( 0 , 2 , -1 );
        var q = new THREE.Quaternion().setFromUnitVectors( v, target );
        var tmp = q.z;
        q.z = -q.y;
        q.y = tmp;
    bone.quaternion.copy(q);
}

