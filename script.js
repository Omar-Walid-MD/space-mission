(function(){
// GAME VARIABLES

let gameWindow = document.getElementById("gamewindow");
let gameOverlay = document.getElementById("gameoverlay");
let gameCanvas = document.getElementById("gamecanvas");
let ctx = gameCanvas.getContext("2d");
let canvasWidth = gameCanvas.width; let canvasHeight = gameCanvas.height;

let startNewButton = document.querySelector(".start-new-btn");
let continueButtonContainer = document.querySelector(".continue-btn-container");
let retryButton = document.querySelector(".retry-btn");

let rightButton = document.getElementById("rightbutton");
let leftButton = document.getElementById("leftbutton");
let shootButton = document.getElementById("shootbutton");

let audioContainer = document.getElementById("audiocontainer");
let scoreLabel = document.getElementById("scorelabel");
let healthBar = document.getElementById("healthbar");
let progressBar = document.getElementById("progressbar");
let bossHealthBar = document.getElementById("bosshealthbar");

let player;

let started = false;
let active = false;
let canShoot = true;
let canTakeDamage = true;

let debugColliders = false;
let debugImages = false;

let controlsActive = true;

let fullHealth = 3;
let health = fullHealth;
let score = 0;

let speed = 10;

let initialEnemySpawnRate = 60; //per minute
let maxEnemySpawnRate = 200;
let enemySpawnRate = initialEnemySpawnRate;

let initialCometSpawnRate = 100; //per minute
let maxCometSpawnRate = 500;
let cometSpawnRate = initialCometSpawnRate;

let timers = [];
let gameSprites = [];
let animations = [];
let gameBackgroundLayers = [];

let shootSound = "./assets/audio/shoot-sound.wav";
let enemyLaserSound = "./assets/audio/laser.wav";
let longLaser  = "./assets/audio/long-laser.wav"; 
let enemyDiveSound = "./assets/audio/dive.wav";
let enemyShootSound = "./assets/audio/shoot-sound.mp3";

let damageSound = "./assets/audio/hit.mp3";
let explodeSound = "./assets/audio/explode.wav";
let shieldUpSound = "./assets/audio/shield-up.mp3";
let shieldDownSound = "./assets/audio/shield-down.mp3";
let healthSound = "./assets/audio/health.mp3";

let uiSound = "./assets/audio/ui.wav";

let masterVolume = 0.3;

let enemyWaveTime = 0.5;
let cometWaveTime = 0.5;

let currentWave = +localStorage.getItem("currentWave") || 0;


//GAME CONTROLS

let controls = {
    65:
    {
        pressed: false,
        fired: true,
        onHold: function(){player.move(-1);},
        onDown: function()
            {
                player.setProperty("scaleX",-1);
                // player.setProperty("scaleX",1.5);
                player.animationPlayer.playSprite(steeringAnimation); 
                player.steer="left";
            },
        onUp: function()
            {
                new Timer("timeout",steeringAnimation.duration*0.5,()=>{player.setProperty("scaleX",1);});
                if(player.steer=="left")
                {
                    if(!controls[68].pressed)
                    {
                        player.animationPlayer.playSprite(steeringAnimation,true);
                        player.steer = "none";
                    }
                }
                else if(player.steer==="right")
                {
                    if(controls[68].pressed)
                    {
                        player.setProperty("scaleX",1);
                    }
                    else
                    {
                        player.animationPlayer.playSprite(steeringAnimation,true);
                    }
                }
            }
    }, //a
    68:
    {
        pressed: false,
        fired: true,
        onHold: function(){player.move(1);},
        onDown: function()
        {
                player.setProperty("scaleX",1);
                player.animationPlayer.playSprite(steeringAnimation);
                player.steer="right";

            },
        onUp: function()
            {
                if(player.steer==="right")
                {
                    if(!controls[65].pressed)
                    {
                        player.animationPlayer.playSprite(steeringAnimation,true);
                        player.steer = "none";
                        player.setProperty("scaleX",1);
                    }
                    else
                    {
                        player.setProperty("scaleX",-1);
                        player.steer="left";
                    }
                }
            }
    }, //d
    32:
    {
        pressed: false,
        fired: true,
        onDown: function(){
            player.shoot();
        }
    } //space
};
document.body.onkeydown = function(e)
{
    if(controls[e.which])
    {
        controls[e.which].pressed = true;
    }

    if(active)
    {
        if(e.which===27) setGameWindow(1);
    }
    else
    {
        if(e.which===27) 
        {
           if(started) setGameWindow(4);
           else if(gameOverlay.getAttribute("window")==="gameOptions") setGameWindow(0);
        }
    }
}
document.body.onkeyup = function(e)
{
    if(controls[e.which])
    {
        controls[e.which].pressed = false;
        controls[e.which].fired = true;

        if(controls[e.which].onUp) 
        {
            controls[e.which].onUp();
        }
    }
}
rightButton.onpointerdown = () => {controls[68].pressed=true;};
rightButton.onpointerup = rightButton.onpointerleave = () => {controls[68].pressed = false; controls[68].fired = true; if(controls[68].onUp) controls[68].onUp();};
leftButton.onpointerdown = () => {controls[65].pressed=true;};
leftButton.onpointerup = leftButton.onpointerleave = () => {controls[65].pressed = false; controls[65].fired = true; if(controls[65].onUp) controls[65].onUp();};
shootButton.onpointerdown = () => {player.shoot()};

//ANIMATIONS
let steeringAnimation = {
    name: "steering",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 1
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 2
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 3
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 4
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 5
            }
        }
    ],
    duration: 150
}
let bulletAnimation = {
    name: "bullet",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 1
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 2
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 3
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 4
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 5
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 6
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 7
            }
        }
    ],
    duration: 50
}
let plasmaAnimation = {
    name: "plasma",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 1
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 2
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 3
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 4
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 5
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 6
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 7
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 8
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 9
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 10
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 11
            }
        }
        
    ],
    duration: 80
}
let laserAnimation = {
    name: "laser",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 1
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 2
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 3
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 4
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 5
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 6
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 7
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 8
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 9,
                colliders:
                [
                    {
                        x: 0,
                        y: 0,
                        w: 100,
                        h: 100,
                    }
                ]
            }
        },
        {
            time: 20,
            properties:
            {
                frameV: 9
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 0,
                colliders:
                [
                    {
                        x: 0,
                        y: 0,
                        w: 100,
                        h: 0,
                    }
                ]
            }
        }
    ],
    duration: 1000
}
let spiralShootAnimation = {
    name: "spiralShoot",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 1
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 2
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 3
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 4
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 5
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 6
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 7
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 8
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 9
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 10
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 11
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 12
            }
        }
        
    ],
    duration: 80
}
let spiralSpinAnimation = {
    name: "spiralShoot",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 13
            }
        },
        {
            time: 0,
            properties:
            {
                frameV: 14
            }
        },
        {
            time: 0,
            properties:
            {
                frameV: 13
            }
        },
        {
            time: 0,
            properties:
            {
                frameV: 15
            }
        }
        
    ],
    duration: 200
}
let enemyGreenAnimation = {
    name: "screwdive",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 1
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 2
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 3
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 4
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 5
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 6
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 7
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 8
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 1,
            }
        }
    ],
    duration: 400

}
let shieldAnimation = {
    name: "shield",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 1
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 2
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 3
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 4
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 5
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 6
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 7
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 8
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 9
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 10
            }
        }
    ],
    duration: 200
}
let explosionAnimation = {
    name: "explode",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 1
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 2
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 3
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 4
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 5
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 6
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 7
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 8
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 9
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 10
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 11
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 12
            }
        }
    ],
    duration: 500
}
let bossExplosionAnimation = {
    name: "bossExplode",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 1
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 2
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 3
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 4
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 5
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 6
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 7
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 8
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 9
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 10
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 11
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 12
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 13
            }
        }
    ],
    duration: 650
}
let damagedAnimation = {
    name: "damage",
    keyframes: [
        {
            time: 0,
            properties:
            {
                translateX: 0
            }
        },
        {
            time: 1,
            properties:
            {
                translateX: 10
            }
        },
        {
            time: 1,
            properties:
            {
                translateX: 0
            }
        },
        {
            time: 1,
            properties:
            {
                translateX: -10,
            }
        },
        {
            time: 1,
            properties:
            {
                translateX: 0
            }
        }
    ],
    duration: 200
}
let cometAnimation = {
    name: "comet",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 1 
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 2 
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 3 
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 4 
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 5 
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 6 
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 7 
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 8 
            }
        }
    ],
    duration: 700
}
let laserBossChargeAnimation = {
    name: "laserBossCharge",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 1
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 2
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 3
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 4
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 5
            }
        }
    ],
    duration: 100

}
let laserBossIdleAnimation = {
    name: "laserBossIdle",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 6
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 7
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 8
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 7
            }
        }
    ],
    duration: 200

}
let healthPickupAnimation = {
    name: "healthPickUp",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frameV: 1
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 2
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 3
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 4
            }
        },
        {
            time: 1,
            properties:
            {
                frameV: 5
            }
        }
    ],
    duration: 200

}
let healthIdleAnimation = {
    name: "healthIdle",
    keyframes: [
        {
            time: 0,
            properties:
            {
                scaleX: 1,
                scaleY: 1
            }
        },
        {
            time: 1,
            properties:
            {
                scaleX: 1.1,
                scaleY: 1.1
            }
        },
        {
            time: 1,
            properties:
            {
                scaleX: 1,
                scaleY: 1
            }
        }
    ],
    duration: 500
}

let playerInAnimation = {
    name: "playerIn",
    keyframes:
    [
        {
            time: 0,
            properties: {
                top: canvasHeight
            }
        },
        {
            time: 3,
            properties: {
                top: canvasHeight*4/5+10
            }
        },
        {
            time: 1,
            properties: {
                top: canvasHeight*4/5-20
            }
        },
        {
            time: 1,
            properties: {
                top: canvasHeight*4/5-40
            }
        },
        {
            time: 1,
            properties: {
                top: canvasHeight*4/5-50
            }
        },
    ],
    duration: 1000
}

let labelFloatAnimation = {
    name: "labelFloat",
    keyframes: [
        {
            time: 0,
            properties: {
                translateY: 0,
                opacity: 1
            }
        },
        {
            time: 1,
            properties: {
                opacity: 1
            }
        },
        {
            time: 1,
            properties: {
                translateY: -50,
                opacity: 0
            }
        }
    ],
    duration: 1000
}


// GAME TEMPLATES
let playerTemplate = {
    left: canvasWidth/2-50,
    top: canvasHeight*4/5-50,
    width: 120,
    height: 120,
    colliders:
    [
        {
            x: 25,
            y: 25,
            w: 50,
            h: 50,
        }
    ],
    speed: speed,
    image: "./assets/img/spaceship-sprites.png",
    filters: ["drop-shadow(0 0 10px gold)"],
    vf: 5,
    hf: 1,
    zIndex: 1
}


let enemyPurpleTemplate = {
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    colliders:
    [
        {
            x: 5,
            y: 5,
            w: 90,
            h: 90,
        }
    ],
    collisionMask: ["player"],
    image: "./assets/img/enemy.png",
    speed: 5,
    vf: 1,
    hf: 1,
    filters: ["drop-shadow(0 0 5px magenta)"],
    shoot: function(){let bullet = this.addChild(new Bullet({top: this.height*0.9,left: this.width/2-15,...enemyBulletTemplate})); playSound(enemyShootSound);} 
}
let enemyRedTemplate = {
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    colliders:
    [
        {
            x: 5,
            y: 5,
            w: 90,
            h: 90,
        }
    ],
    image: "./assets/img/enemy-red.png",
    speed: 5,
    vf: 1,
    hf: 1,
    filters: ["drop-shadow(0 0 5px brown)"],
    shootIntervalBase: 1500,
    shoot: function(){let bullet = this.addChild(new Bullet({top: this.height*0.78,left: this.width/2-15,...enemyLaserTemplate})); playSound(enemyLaserSound);} 
}
let enemyCyanTemplate = {
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    colliders:
    [
        {
            x: 5,
            y: 5,
            w: 90,
            h: 90,
        }
    ],
    image: "./assets/img/enemy-cyan.png",
    speed: 5,
    vf: 1,
    hf: 1,
    filters: ["drop-shadow(0 0 5px cyan)"],
    shoot: function(){let bullet = this.addChild(new Bullet({top: this.height*0.78,left: this.width*0.15,...enemyPlasmaTemplate}));playSound(enemyShootSound);this.timers.push(new Timer("timeout",750,()=>{let bullet = this.addChild(new Bullet({top: this.height*0.78,left: this.width*0.52,...enemyPlasmaTemplate}));playSound(enemyShootSound);}))} 
}
let enemyGreenTemplate = {
    top: 0,
    left: 0,
    width: 125,
    height: 125,
    colliders:
    [
        {
            x: 5,
            y: 5,
            w: 90,
            h: 90,
        }
    ],
    image: "./assets/img/enemy-green-sheet.png",
    speed: 5,
    vf: 8,
    hf: 1,
    collisionMask: ["player"],
    filters: ["drop-shadow(0 0 5px greenyellow)"],
    customBehaviour: function(){ if(!this.downVelocity) { if(Math.abs((this.left+this.width/2)-(player.left+player.width/2))<125 && health>0) {this.downVelocity = 15; this.speed/=1; this.animationPlayer.playSprite(enemyGreenAnimation,false,5); playSound(enemyDiveSound);}} else {this.top += this.downVelocity; if(!this.hitPlayer && this.getCollisions().includes(player)) {player.onHit(); this.hitPlayer=true;}}} 
}
let enemyBlueTempltate = {
    top: 0,
    left: 0,
    width: 120,
    height: 100,
    colliders:
    [
        {
            x: 5,
            y: 5,
            w: 90,
            h: 90,
        }
    ],
    collisionMask: ["player"],
    image: "./assets/img/enemy-blue.png",
    speed: 5,
    vf: 1,
    hf: 1,
    filters: ["drop-shadow(0 0 5px darkblue)"],
    shoot: function(){let bullet = this.addChild(new Bullet({top: this.height*0.9,left: this.width/2-15,...enemySpiralTemplate})); playSound(enemyShootSound);} 
}



let playerBulletTemplate = {
    width: 30,
    height: 30,
    image: "./assets/img/bullet.png",
    velocity: -10,
    colliders:
    [
        {
            x: 0,
            y: 0,
            w: 100,
            h: 100,
        }
    ],
    collisionMask: ["enemy","comet"],
    animation: bulletAnimation,
    dispatch: true,
    vf: 7,
    hf: 1,
    customOnHit: function(){
        if(!this.parent)
        {
            let bulletImpact = new AnimatedGameSprite({top: this.top-this.height/2-25, left: this.left-this.width/2-25, width:100,height:100,image:"./assets/img/bullet-impact.png",vf:4,hf:1});
            let impactAnimation = createSpriteAnimation(150,[0,1,2,3,3],"impact");
            bulletImpact.animationPlayer.playSprite(impactAnimation);
            new Timer("timeout",impactAnimation.duration,()=>{
                bulletImpact.delete();
            })
        }
    }
}


let enemyBulletTemplate = {
    ...playerBulletTemplate,
    image: "./assets/img/enemy-bullet.png",
    velocity: 10,
    colliders:
    [
        {
            x: 0,
            y: 0,
            w: 100,
            h: 100,
        }
    ],
    collisionMask: ["player"],
    animation: bulletAnimation,
    dispatch: true,
    vf: 7,
    hf: 1
}
let enemyPlasmaTemplate = {
    ...playerBulletTemplate,
    image: "./assets/img/plasma.png",
    velocity: 15,
    colliders:
    [
        {
            x: 0,
            y: 0,
            w: 100,
            h: 100,
        }
    ],
    collisionMask: ["player"],
    animation: plasmaAnimation,
    dispatch: true,
    vf: 11,
    hf: 1
}
let enemyLaserTemplate = {
    ...playerBulletTemplate,
    width: 30,
    height: 600,
    image: "./assets/img/laser.png",
    velocity: 0,
    colliders:
    [
        {
            x: 0,
            y: 0,
            w: 100,
            h: 0,
        }
    ],
    collisionMask: ["player"],
    animation: laserAnimation,
    dispatch: false,
    destroyAfterAnimation: true,
    vf: 10,
    hf: 1
}
let enemySpiralTemplate = {
    ...playerBulletTemplate,
    image: "./assets/img/spiral.png",
    velocity: 7,
    colliders:
    [
        {
            x: 0,
            y: 0,
            w: 100,
            h: 100,
        }
    ],
    collisionMask: ["player"],
    animation: spiralShootAnimation,
    dispatch: true,
    vf: 15,
    hf: 1,
    customBehaviour: function() {this.delta+=0.5; this.startSpin = false; if(this.delta>5){if(!this.startSpin) {this.startSpin = true; this.animationPlayer.playSprite(spiralSpinAnimation,false,Infinity);} this.left+=20*Math.sin(this.delta);}}
}
let enemyWaveTemplate = {
    ...playerBulletTemplate,
    image: "./assets/img/boss-wave-bullet.png",
    width: 80,
    height: 40,
    velocity: 15,
    colliders:
    [
        {
            x: 0,
            y: 0,
            w: 100,
            h: 100,
        }
    ],
    collisionMask: ["player"],
    animation: createSpriteAnimation(200,[1,2,3,4,5]),
    dispatch: true,
    dispatchDuration: 150,
    vf: 5,
    hf: 1,
}

let shieldTemplate = {
    top: 0,
    left: 0,
    width: 120,
    height: 120,
    colliders:
    [
        {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
        }
    ],
    image: "./assets/img/shield-spritesheet.png",
    vf: 10,
    hf: 1,
    zIndex: 1
}
let explosionTemplate = {
    width: 200,
    height: 200,
    colliderPercent: 0,
    image: "./assets/img/explode.png",
    vf: 11,
    hf: 1,
    animation: explosionAnimation
}
let bossExplosionTemplate = {
    width: 200,
    height: 200,
    colliderPercent: 0,
    image: "./assets/img/boss-explode-2.png",
    vf: 13,
    hf: 1,
    animation: bossExplosionAnimation
}
let cometTemplate = {
    width: 200,
    height: 200,
    colliders:
    [
        {
            x: 10,
            y: 10,
            w: 80,
            h: 80,
        }
    ],
    image: "./assets/img/comet-spritesheet.png",
    velocity: 5,
    collisionMask: ["player"],
    vf: 8,
    hf: 4
}

let backgroundLayersTemplate = [
    {
        layer: 1,
        speed: 1
    },
    {
        layer: 2,
        speed: 2
    },
    {
        layer: 3,
        speed: 3
    },
    {
        layer: 4,
        speed: 4
    }
]

let enemyWaves = [
    {
        enemyTemplate: enemyPurpleTemplate,
        backgroundFilter: "hue-rotate(30deg) saturate(1) contrast(1.4)"
    },
    {
        enemyTemplate: enemyCyanTemplate,
        backgroundFilter: "hue-rotate(-80deg) saturate(1) contrast(1.5)"
    },
    {
        enemyTemplate: enemyBlueTempltate,
        backgroundFilter: "hue-rotate(0) saturate(1) contrast(1.4)"
    },
    {
        enemyTemplate: enemyRedTemplate,
        backgroundFilter: "hue-rotate(80deg) saturate(0.5) contrast(1.6)"
    }, 
    {
        enemyTemplate: enemyGreenTemplate,
        backgroundFilter: "hue-rotate(190deg) saturate(1.2) contrast(1.4)"
    }
]




let enemyBosses = [
    {
        width: 400,
        height: 300,
        image: "./assets/img/boss-1.png",
        colliders: [
            {
                x: 0,
                y: 25,
                w: 100,
                h: 40
            },
            {
                x: 15,
                y: 65,
                w: 70,
                h: 15
            },
            {
                x: 40,
                y: 80,
                w: 20,
                h: 15
            }
        ],
        bulletTemplate: enemyBulletTemplate,
        shootSound: enemyShootSound,
        fullHealth: 125,
        shootInterval: 400,
        speed: 5,    
        
        checkPoints: [
            {
                health: 0.75,
                passed: false,
                func: function ()
                {
                    let enemiesLeft = 5;
    
                    let enemySpawnTimer = new Timer("interval",1500,()=>{
                        let enemy = new Enemy(enemyWaves[currentWave].enemyTemplate);
                        enemiesLeft--;
    
                        if(enemiesLeft <= 0)
                        {
                            enemySpawnTimer.remove();
                        }
                    })
                }
            }
        ],
        shoot: function()
        {
            if(!this.targetPosition)
            {
                let availableShooterList = this.shooters.slice();
                for (let i = 0; i < this.shootCapacity; i++)
                {
                    let shooter = availableShooterList[Math.min(Math.floor(Math.random()*availableShooterList.length),4)];
                    this.addChild(new Bullet({top: shooter.top*this.height,left: shooter.left*this.width,...this.bulletTemplate}));
                    availableShooterList = availableShooterList.filter((shooterInList)=>shooterInList!==shooter);
                }
    
                playSound(this.shootSound);
            }
        },
        onStart: function()
        {
            this.health = this.fullHealth;

            this.shooters = [
                {top: 4/5, left: 0.85/6},
                {top: 5/6, left: 1.8/6},
                {top: 5.6/6, left: 2.8/6},
                {top: 5/6, left: 3.75/6},
                {top: 4/5, left: 4.7/6}
            ],

            this.targetPosition = null;
            this.active = false;
            this.shootCapacity = 1;        
        },
        behaviour: function()
        {
            if(this.health > 0)
            {
                if(this.top<0 && !this.active)
                {
                    this.top += 5;
        
                    if(this.top >= 0) 
                    {
                        bossHealthBar.querySelector("*").style.transitionDuration = "0.2s";
                        this.active = true;
                        this.timers.push(new Timer("interval",this.shootInterval,()=>{this.shoot()}));
                        this.timers.push(new Timer("interval",3000,()=>{
                            this.targetPosition = player.left + player.width/2 - this.width/2;
                            this.targetPosition -= Math.sign(this.targetPosition-this.left) * Math.random()*100;
                        }));

                    }
                }
    
                if(this.active)
                {
                    if(this.specialPhase)
                    {
                        this.specialPhase();
                    }
                    else
                    {
    
                        if(this.targetPosition)
                        {
                            this.left += this.speed * Math.sign(this.targetPosition - this.left);
                
                            if(Math.abs(this.left-this.targetPosition)<5 || this.left <= 0 || this.left+this.width >= canvasWidth) this.targetPosition = null;
                        }
                    }
                }
        
            }
        }
    },
    {
        width: 400,
        height: 300,
        image: "./assets/img/boss-4.png",
        colliders: [
            {
                x: 2.5,
                y: 25,
                w: 95,
                h: 40
            },
            {
                x: 10,
                y: 65,
                w: 80,
                h: 10
            },
            {
                x: 32.5,
                y: 75,
                w: 35,
                h: 15
            },
            {
                x: 10,
                y: 75,
                w: 9,
                h: 15
            },
            {
                x: 80,
                y: 75,
                w: 9,
                h: 15
            },
        ],
        bulletTemplate: enemyPlasmaTemplate,
        shootSound: enemyShootSound,
        fullHealth: 125,
        shootInterval: 400,
        speed: 5,    
        
        checkPoints: [
            {
                health: 0.5,
                passed: false,
                func: function()
                {

                    let enemiesLeft = 5;
    
                    let enemySpawnTimer = new Timer("interval",2000,()=>{
                        // console.log(enemyWaves[currentWave].enemyTemplate)
                        let enemy = new Enemy(enemyWaves[currentWave].enemyTemplate);
                        enemiesLeft--;
    
                        if(enemiesLeft <= 0)
                        {
                            enemySpawnTimer.remove();
                        }
                    })
                }
            },
            {
                health: 0.25,
                passed: false,
                func: function ()
                {
                    this.specialShootInterval = function(direction,i)
                    {
                        if(this.active)
                        {
                            if(i >= 0 && i <= this.shooters.length-1)
                            {
                                this.specialShoot(i);
                                new Timer("timeout",100,()=>{
                                    this.specialShootInterval(direction,i+=direction);
                                });
                            }
                        }
                    }

                    this.specialShoot = function(i)
                    {
                        let shooter = this.shooters[i];
                        this.addChild(new Bullet({top: shooter.top*this.height,left: shooter.left*this.width,...this.bulletTemplate}));
                        playSound(this.shootSound);
                    }

                    new Timer("interval",1500,()=>{
                        if(this.direction===1) this.specialShootInterval(1,0);
                        else this.specialShootInterval(-1,this.shooters.length-1);
                    });

                    this.specialPhase = function()
                    {
                        if(this.direction===1)
                        {
                            if(this.left+this.width < canvasWidth)
                            {
                                this.left += speed/2;
                            }
                            else
                            {
                                this.direction = -1;
                            }
                        }
                        else
                        {
                            if(this.left>0)
                            {
                                this.left -= speed/2;
                            }
                            else
                            {
                                this.direction = 1;
                            }
                        }

                       
                    };
                }
            }
        ],
        shoot: function()
        {
            if(!this.targetPosition)
            {
                let availableShooterList = this.shooters.slice();
                for (let i = 0; i < this.shootCapacity; i++)
                {
                    let shooter = availableShooterList[Math.min(Math.floor(Math.random()*availableShooterList.length),5)];
                    this.addChild(new Bullet({top: shooter.top*this.height,left: shooter.left*this.width,...this.bulletTemplate}));
                    availableShooterList = availableShooterList.filter((shooterInList)=>shooterInList!==shooter);
                }
    
                playSound(this.shootSound);
            }
        },
        onStart: function()
        {
            this.health = this.fullHealth;

            this.shooters = [
                {top: 4.3/5, left: 0.65/6},
                {top: 4.6/6, left: 1.325/6},
                {top: 5.7/6, left: 1.975/6},
                {top: 5.7/6, left: 3.55/6},
                {top: 4.6/6, left: 4.2/6},
                {top: 4.3/5, left: 4.9/6}
            ],

            this.targetPosition = null;
            this.active = false;
            this.shootCapacity = 1;        
        },
        behaviour: function()
        {
            if(this.health > 0)
            {
                if(this.top<0 && !this.active)
                {
                    this.top += 5;
        
                    if(this.top >= 0) 
                    {
                        bossHealthBar.querySelector("*").style.transitionDuration = "0.2s";
                        this.active = true;
                        this.timers.push(new Timer("interval",this.shootInterval,()=>{this.shoot()}));
                        this.timers.push(new Timer("interval",2000,()=>{
                            this.targetPosition = player.left + player.width/2 - this.width/2;
                            this.targetPosition -= Math.sign(this.targetPosition-this.left) * Math.random()*100;
                        }));

                    }
                }
    
                if(this.active)
                {
                    if(this.specialPhase)
                    {
                        this.specialPhase();
                    }
                    else
                    {
    
                        if(this.targetPosition)
                        {
                            this.left += this.speed * Math.sign(this.targetPosition - this.left);
                
                            if(Math.abs(this.left-this.targetPosition)<5 || this.left <= 0 || this.left+this.width >= canvasWidth) this.targetPosition = null;
                        }
                    }
                }
        
            }
        }
    },
    {
        width: 450,
        height: 300,
        image: "./assets/img/boss-5.png",
        colliders: [
            {
                x: 15,
                y: 15,
                w: 70,
                h: 10
            },
            {
                x: 20,
                y: 25,
                w: 60,
                h: 30
            },
            {
                x: 17.5,
                y: 55,
                w: 65,
                h: 18
            },
            {
                x: 32.5,
                y: 73,
                w: 35,
                h: 10
            },
            {
                x: 40,
                y: 83,
                w: 5,
                h: 12
            },
            {
                x: 55.5,
                y: 83,
                w: 5,
                h: 12
            },
        ],
        bulletTemplate: enemyWaveTemplate,
        shootSound: enemyShootSound,
        fullHealth: 175,
        shootInterval: 100,
        speed: 5,    
        
        checkPoints: [
            {
                health: 0.75,
                passed: false,
                func: function ()
                {
                    let enemiesLeft = 5;
    
                    let enemySpawnTimer = new Timer("interval",2000,()=>{
                        let enemy = new Enemy(enemyWaves[currentWave].enemyTemplate);
                        enemiesLeft--;
    
                        if(enemiesLeft <= 0)
                        {
                            enemySpawnTimer.remove();
                        }
                    })
                }
            },
            {
                health: 0.35,
                passed: false,
                func: function ()
                {
                    this.specialPosition = canvasWidth/2 + Math.floor(Math.random()*(canvasWidth/2));
                    this.specialDir = 1;
                    this.specialPhaseTimer;
                    this.specialShootTimer;

                    this.speed = 20;

                    this.timers.forEach((timer) => timer.remove());
                    this.timers = [];

                    this.specialPhase = function()
                    {
                        
                        let dir = Math.sign(this.specialPosition - (this.left + this.width/2));
                        if(Math.abs(this.left + this.width/2 - this.specialPosition) > 10)
                        {
                            this.left += this.speed * dir;
                        }
                        else if(!this.specialPhaseTimer)
                        {
                            this.specialPhaseTimer = new Timer("timeout",500,()=>{
                                this.specialPosition = this.specialDir===1 ? Math.floor(Math.random()*(canvasWidth/2)) : canvasWidth/2 + Math.floor(Math.random()*(canvasWidth/2));
                                this.specialDir = this.specialDir===1 ? -1 : 1;
                                this.specialPhaseTimer = null;

                            });
                            
                            if(!this.specialShootTimer)
                            {
                                this.specialShootTimer = new Timer("interval",50,()=>{
                                    this.shoot();
                                });

                                new Timer("timeout",350,()=>{
                                    this.specialShootTimer.remove();
                                    this.specialShootTimer = null;

                                });
                            }
                        }
                    }
                }
            }
        ],
        shoot: function()
        {
            if(!this.targetPosition || this.specialPhase)
            {
                
                this.addChild(new Bullet({top: this.height - 50,left: this.width/2 - this.bulletTemplate.width/2,...this.bulletTemplate}));
                playSound(this.shootSound);
            }
        },
        onStart: function()
        {
            this.health = this.fullHealth;

            this.targetPosition = null;
            this.active = false;
        },
        behaviour: function()
        {
            if(this.health > 0)
            {
                if(this.top<0 && !this.active)
                {
                    this.top += 5;
        
                    if(this.top >= 0) 
                    {
                        bossHealthBar.querySelector("*").style.transitionDuration = "0.2s";
                        this.active = true;
                        this.timers.push(new Timer("interval",this.shootInterval,()=>{this.shoot()}));
                        this.timers.push(new Timer("interval",2000,()=>{
                            this.targetPosition = player.left + player.width/2 - this.width/2;
                            this.targetPosition -= Math.sign(this.targetPosition-this.left) * Math.random()*100;
                        }));

                    }
                }
    
                if(this.active)
                {
                    if(this.specialPhase)
                    {
                        this.specialPhase();
                    }
                    else
                    {
    
                        if(this.targetPosition)
                        {
                            this.left += this.speed * Math.sign(this.targetPosition - this.left);
                
                            if(Math.abs(this.left-this.targetPosition)<5 || this.left <= 0 || this.left+this.width >= canvasWidth) this.targetPosition = null;
                        }
                    }
                }
        
            }
        }
    },
    {
        width: 400,
        height: 300,
        image: "./assets/img/boss-2.png",
        colliders: [
            {
                x: 0,
                y: 0,
                w: 100,
                h: 40
            },
            {
                x: 10,
                y: 40,
                w: 80,
                h: 20
            },
            {
                x: 20,
                y: 60,
                w: 60,
                h: 20
            },
            {
                x: 35,
                y: 80,
                w: 30,
                h: 15
            }
        ],
        bulletTemplate: enemyLaserTemplate,
        shootSound: enemyLaserSound,
        fullHealth: 250,
        shootInterval: 400,
        speed: 5,
        checkPoints: [
            {
                health: 0.6,
                passed: false,
                func: function ()
                {
                    let enemiesLeft = 5;
    
                    let enemySpawnTimer = new Timer("interval",2000,()=>{
                        let enemy = new Enemy(enemyWaves[currentWave].enemyTemplate);
                        enemiesLeft--;
    
                        if(enemiesLeft <= 0)
                        {
                            enemySpawnTimer.remove();
                        }
                    })
                }
            },
            {
                health: 0.25,
                passed: false,
                func: function ()
                {
                    this.timers.forEach((timer)=>timer.remove());
                    this.timers = [];
                    this.specialPhase = function()
                    {
                        if(!this.startLaserAttack)
                        {
                            if(this.left + this.width <= canvasWidth)
                            {
                                this.left += 5;
                            }
                            else
                            {
                                this.startLaserAttack = true;
                            }

                        }
                        else
                        {
                            if(!this.laserAttackPoint) this.laserAttackPoint = 0.1;
                            if(this.left > 0)
                            {
                                this.left -= 2;

                                if((canvasWidth - this.left + this.width)/canvasWidth > this.laserAttackPoint)
                                {
                                    this.laserAttackPoint += 0.25;
                                    // this.opacity = 0;
                                    let laserCharge = new AnimatedGameSprite({top: this.height-40, left: 0, height: this.height*1.2, width: this.width, colliders: [{w: 10, h: 100, x: 45, y:0}], collisionMask: ["player"], image:"./assets/img/laser-boss-charge.png",vf:7,hf:1});
                                    this.addChild(laserCharge);
                                    laserCharge.frameV = 7;
                                    laserCharge.hitPlayer = false;
                                    laserCharge.behaviour = () =>
                                    {
                                        if(!laserCharge.hitPlayer && laserCharge.getCollisions().includes(player)) 
                                        {
                                            player.onHit();
                                            laserCharge.hitPlayer = true;
                                        }
                                        
                                    }
                                    playSound(longLaser,1000);

                                    new Timer("timeout",1000,()=>{
                                        laserCharge.delete();
                                    });
                                }

                            }
                            else
                            {
                                this.startLaserAttack = false;
                                this.laserAttackPoint = null;
                            }
                        }
                    };

                }
            }
        ],
        onStart: function()
        {
            this.health = this.fullHealth;

            this.shooters = [
                {i:2,left:10},
                {i:3,left:80},
                {i:4,left:30},
                {i:5,left:60},
                {i:6,left:48}
            ],

            this.targetPosition = null;
            this.active = false;
            this.shootCapacity = 1;        
        },
        shoot: function() {
            if(!this.targetPosition)
            {
                let availableShooterList = this.shooters.slice();
                    
                new Timer("timeout",250,()=>{
                    
                    let shooter = availableShooterList[Math.min(Math.floor(Math.random()*availableShooterList.length),4)];
                    let laserCharge = new AnimatedGameSprite({top: this.height-30, left: 0, height: this.height*1.2, width: this.width, colliders: [{w: 10, h: 100, x: shooter.left, y:0}], collisionMask: ["player"], image:"./assets/img/laser-boss-charge.png",vf:7,hf:1});
                    this.addChild(laserCharge);
                    laserCharge.hitPlayer = false;
                    laserCharge.behaviour = () =>
                    {
                        if(!laserCharge.hitPlayer && laserCharge.getCollisions().includes(player)) 
                        {
                            player.onHit();
                            laserCharge.hitPlayer = true;
                        }
                        
                    }
                    laserCharge.frameV = shooter.i;

                    new Timer("timeout",200,()=>{laserCharge.delete()});

                    availableShooterList = availableShooterList.filter((shooterInList)=>shooterInList!==shooter);
                });

                playSound(this.shootSound);
            }
        },
        behaviour: function()
        {
            if(this.health > 0)
            {
                if(this.top<0 && !this.active)
                {
                    this.top += 5;
        
                    if(this.top >= 0) 
                    {
                        bossHealthBar.querySelector("*").style.transitionDuration = "0.2s";
                        this.active = true;
                        this.timers.push(new Timer("interval",this.shootInterval,()=>{this.shoot()}));
                        this.timers.push(new Timer("interval",3000,()=>{
                            this.targetPosition = player.left + player.width/2 - this.width/2;
                            this.targetPosition -= Math.sign(this.targetPosition-this.left) * Math.random()*100;
                        }));

                        let laserOrb = new AnimatedGameSprite({top: 30, left: 0, height: this.height, width: this.width, colliders: [], image:"./assets/img/laser-boss-orb.png",vf:8,hf:1});
                        this.addChild(laserOrb);
                        laserOrb.frameV = 3;
                        laserOrb.animationPlayer.playSprite(laserBossChargeAnimation);
                        new Timer("timeout",laserBossChargeAnimation.duration,()=>{
                            laserOrb.animationPlayer.playSprite(laserBossIdleAnimation,false,Infinity);
                        });
                    }

                }
    
                if(this.active)
                {
                    if(this.specialPhase)
                    {
                        this.specialPhase();
                    }
                    else
                    {
    
                        if(this.targetPosition)
                        {
                            this.left += this.speed * Math.sign(this.targetPosition - this.left);
                
                            if(Math.abs(this.left-this.targetPosition)<5 || this.left <= 0 || this.left+this.width >= canvasWidth) this.targetPosition = null;
                        }
                    }
                }
        
            }
        }
    },  
    {
        width: 400,
        height: 300,
        image: "./assets/img/boss-3.png",
        colliders: [
            {
                x: 12,
                y: 0,
                w: 76,
                h: 40
            },
            {
                x: 15,
                y: 40,
                w: 70,
                h: 10
            },
            {
                x: 20,
                y: 50,
                w: 60,
                h: 10
            },
            {
                x: 23,
                y: 60,
                w: 56,
                h: 15
            },
            {
                x: 28,
                y: 75,
                w: 44,
                h: 12
            },
            {
                x: 45,
                y: 87,
                w: 10,
                h: 12
            }
        ],
        bulletTemplate: enemyLaserTemplate,
        shootSound: enemyDiveSound,
        fullHealth: 300,
        shootInterval: 800,
        speed: 5,
        collisionMask: ["player"],
        checkPoints: [
            {
                health: 0.6,
                passed: false,
                func: function ()
                {

                    let enemiesLeft = 5;
    
                    let enemySpawnTimer = new Timer("interval",2000,()=>{
                        let enemy = new Enemy(enemyWaves[currentWave].enemyTemplate);
                        enemiesLeft--;
    
                        if(enemiesLeft <= 0)
                        {
                            enemySpawnTimer.remove();
                        }
                    })
                }
            },
            {
                health: 0.35,
                passed: false,
                func: function ()
                {
                    this.specialPhase = function()
                    {

                        if(!this.startDiveAttack)
                        {
                            if(this.top+this.height > 0)
                            {
                                this.top -= 5;
                            }
                            else
                            {
                                this.diveStopped = false;
                                this.left = player.left - this.width/2 + player.width/2;
                                new Timer("timeout",1000,()=>{
                                    this.startDiveAttack = true;
                                    this.diveDirection = 1;
                                    this.diveCount = 3;
                                });
                            }
                        }
                        else if(this.idlePhase)
                        {
                            if(this.top<0) this.top += 5;
                            else
                            {
                                if(!this.idlePhaseTimer)
                                {
                                    this.idlePhaseTimer = new Timer("timeout",1000,()=>{
                                        this.idlePhase = false;
                                        this.idlePhaseTimer = false;
                                        this.startDiveAttack = false;
                                    })
                                }
                            }
                        }
                        else
                        {
                            let hitPlayer = () =>
                            {
                                if(this.getCollisions().includes(player))
                                {
                                    player.onHit();
                                }
                            }

                            if(this.diveDirection === 1)
                            {
                                if(this.top < canvasHeight)
                                {
                                    this.top += 30;
                                    hitPlayer();
                                }
                                else if(!this.diveStopped)
                                {
                                    this.diveStopped = true;
                                    this.left = player.left - this.width/2 + player.width/2;
                                    
                                    new Timer("timeout",1000,()=>{
                                        // this.startDiveAttack = true;
                                        this.diveDirection = -1;
                                        this.scaleY = -1;
                                        playSound(this.shootSound);
                                        this.diveStopped = false;
                                        this.diveCount--;

                                    });
                                }
                            }
                            if(this.diveDirection === -1)
                            {
                                if(this.top+this.height > 0)
                                {
                                    this.top -= 30;
                                    hitPlayer();
                                }
                                else if(!this.diveStopped)
                                {
                                    this.diveStopped = true;

                                    if(this.diveCount<=0)
                                    {
                                        if(this.diveCount===0)
                                        {
                                            this.diveCount = -1;
                                            new Timer("timeout",1000,()=>{

                                                this.idlePhase = true;
                                                this.diveDirection = 1;
                                                this.scaleY = 1;
                                                this.diveCount = 6;
                                                this.left = canvasWidth/2 - this.width/2;
                                            })

                                        }
                                    }
                                    else
                                    {
                                        new Timer("timeout",1000,()=>{
                                            this.left = player.left - this.width/2 + player.width/2;
                                            // this.startDiveAttack = true;
                                            this.diveDirection = 1;
                                            this.scaleY = 1;
                                            playSound(this.shootSound);
                                            this.diveStopped = false;
                                        });
                                    }
                                    
                                }
                            }
                        }

                       
                    };

                }
            }
        ],
        onStart: function()
        {
            this.health = this.fullHealth;

            this.targetPosition = null;
            this.active = false;

            this.spinner = new AnimatedGameSprite({top:this.height/4.6,left:this.width/2-this.width/(2*2.2)-1,width:this.width/2.2,height:this.height/4,image: "./assets/img/boss-dive-spin.png",vf:9,hf:1}) 
            this.addChild(this.spinner);
            this.spinnerAnimation = createSpriteAnimation(250,[1,2,3,4,5,6,7,8,9,1],"spinner");
            this.shootAnimation = createSpriteAnimation(250,[1,2,3,4,5,6,7,8],"dive-shoot");
        },
        shoot: function() {
            if(!this.startDiveAttack)
            {
                
                let exp = new Explosion({...explosionTemplate,top:this.top + this.height/1.9,left:this.width/2 - this.width/5,width: this.width/2.5,height:50,image: "./assets/img/dive-explode.png",vf:8,hf:1,animation:this.shootAnimation});
                this.addChild(exp);

                new Timer("timeout",100,()=>{

                    let enemy = new Enemy(enemyWaves[currentWave].enemyTemplate);
                    enemy.left = this.left + this.width/2 - enemy.width/2;
                    enemy.downVelocity = 10; enemy.speed = 0; enemy.animationPlayer.playSprite(enemyGreenAnimation,false,5);
                    enemy.top = this.top + this.height/2;
                    playSound(this.shootSound);
    
                    new Timer("timeout",100,()=>{
                        this.spinner.animationPlayer.playSprite(this.spinnerAnimation);
                    })
                })


            }
        },
        behaviour: function()
        {
            if(this.health > 0)
            {
                if(this.top<0 && !this.active)
                {
                    this.top += 5;
        
                    if(this.top >= 0) 
                    {
                        bossHealthBar.querySelector("*").style.transitionDuration = "0.2s";
                        this.active = true;
                        this.timers.push(new Timer("interval",this.shootInterval,()=>{this.shoot()}));
                        this.timers.push(new Timer("interval",1000,()=>{
                            this.targetPosition = player.left + player.width/2 - this.width/2;
                            this.targetPosition -= Math.sign(this.targetPosition-this.left) * Math.random()*100;
                        }));

                    }

                }
    
                if(this.active)
                {
                    if(this.specialPhase)
                    {
                        this.specialPhase();
                    }
                    else
                    {
    
                        if(this.targetPosition)
                        {
                            this.left += this.speed * 1.5 * Math.sign(this.targetPosition - this.left);
                
                            if(Math.abs(this.left-this.targetPosition)<5 || this.left <= 0 || this.left+this.width >= canvasWidth) this.targetPosition = null;
                        }
                    }
                }
        
            }
        },
        vf: 1,
        hf: 1
    },
]



// GAME CLASSES

class GameSprite
{
    constructor({top,left,width,height,colliders=[],image=null,collisionMask=[],zIndex=0})
    {
        this.top = top;
        this.left = left;
        this.width = width;
        this.height = height;

        this.image = image;
        this.colliders = colliders;

        this.layer = "";
        this.id = makeId(5);

        this.timers = [];
        this.children = [];
        this.parent = null;

        this.zIndex = zIndex;

        gameSprites.push(this);
    }

    getFromRect(attr,local=false)
    {
        let r;
        switch (attr) {
            case "top":
                r = !local * (this.parent ? this.parent.top : 0) + this.top
                break;
            case "bottom":
                r = !local * (this.parent ? this.parent.bottom : 0) + this.bottom
                break;
            case "left":
                r = !local * (this.parent ? this.parent.left : 0) + this.left
                break;
            case "right":
                r = !local * (this.parent ? this.parent.right : 0) + this.right
                break;
            default:
                break;
        }

        return r;
    }

    drawImage(left,top,width,height)
    {
        if(this.image)
        {
            let img = new Image();
            img.src = this.image;
            ctx.drawImage(img,left,top,width,height);
        }
    }

    draw()
    {
        this.drawImage(this.getFromRect("left"),this.getFromRect("top"),this.width,this.height)
        // if(this.parent) this.drawImage(this.parent.left + this.left,this.parent.top + this.top, this.width, this.height);
        // else this.drawImage(this.left, this.top, this.width, this.height);

        if(debugColliders)
        {
            this.colliders.forEach(collider => {

                let x = this.getFromRect("left") + collider.x * this.width / 100;
                let y = this.getFromRect("top") + collider.y * this.height / 100;
                let w = collider.w * this.width / 100;
                let h = collider.h * this.height / 100;
                
                ctx.beginPath();
                ctx.lineWidth = "4";
                ctx.strokeStyle = "lime";
                ctx.rect(x,y,w,h);
                ctx.stroke();
            });
        }
    }

    isColliding(objectX,objectY)
    {
        for (let i = 0; i < objectX.colliders.length; i++)
        {
            const colXinfo = objectX.colliders[i];
            let colliderX = {
                xMid: objectX.getFromRect("left") + colXinfo.x * objectX.width / 100 + colXinfo.w * objectX.width / 100 / 2,
                yMid: objectX.getFromRect("top") + colXinfo.y * objectX.height / 100 + colXinfo.h * objectX.height / 100 / 2,
                width: colXinfo.w * objectX.width / 100,
                height: colXinfo.h * objectX.height / 100
            }
            
            for (let j = 0; j < objectY.colliders.length; j++)
            {
                const colYinfo = objectY.colliders[j];

                let colliderY = {
                    xMid: objectY.getFromRect("left") + colYinfo.x * objectY.width / 100 + colYinfo.w * objectY.width / 100 / 2,
                    yMid: objectY.getFromRect("top") + colYinfo.y * objectY.height / 100  + colYinfo.h * objectY.height / 100 / 2,
                    width: colYinfo.w * objectY.width / 100,
                    height: colYinfo.h * objectY.height / 100
                }

                if((Math.abs(colliderX.xMid-colliderY.xMid)<=(colliderX.width+colliderY.width)/2
                     && Math.abs(colliderX.yMid-colliderY.yMid)<=(colliderX.height+colliderY.height)/2)) return true;
                
            }
        }

        return false;

        // let colliderX = {
        //     xMid: objectX.getFromRect("left") + objectX.width/2,
        //     yMid: objectX.getFromRect("top") + objectX.height/2,
        //     width: objectX.width*objectX.colliderPercent,
        //     height: objectX.height*objectX.colliderPercent
        // }

        // let colliderY = {
        //     xMid: objectY.getFromRect("left") + objectY.width/2,
        //     yMid: objectY.getFromRect("top") + objectY.height/2,
        //     width: objectY.width*objectY.colliderPercent,
        //     height: objectY.height*objectY.colliderPercent
        // }

        // return (Math.abs(colliderX.xMid-colliderY.xMid)<=(colliderX.width+colliderY.width)/2
        //      && Math.abs(colliderX.yMid-colliderY.yMid)<=(colliderX.height+colliderY.height)/2);

    }

    getCollisions()
    {
        let collisions = gameSprites.filter((gameSprite)=>gameSprite!==this && this.collisionMask.includes(gameSprite.layer)).filter((gameSprite)=>this.isColliding(this,gameSprite));
        return collisions;
    }

    addChild(childGameSprite)
    {
        this.children.push(childGameSprite);
        childGameSprite.parent = this;
        return childGameSprite;
    }

    removeFromParent = () =>
    {
        this.parent.children = this.parent.children.filter((child)=> child.id!==this.id);
        this.top += this.parent.top;
        this.left += this.parent.left;
        this.parent = null;
    }
    

    behaviour()
    {

    }

    update()
    {
        this.behaviour();
        this.draw();
    }

    delete()
    {
        this.timers.forEach(timer => {
            timer.remove();
        });
        this.children.forEach(child => {
            child.delete();
        });
        gameSprites = gameSprites.filter((gameSprite)=>gameSprite.id!==this.id);
    }

}
class AnimationPlayer
{
    constructor(parentObject)
    {
        this.playingAnimations = [];
        this.parentObject = parentObject;
    }

    playSprite(animation,reversed=false,iteration=0)
    {
        let animationInstance = new SpriteAnimation(reversed ? this.getReversedAnimation(animation) : animation, iteration,this)
        
        this.playingAnimations
        .filter((animation)=>animation.currentAnimation.name===animation.name)
        .map((animation)=>animation.removeFromAnimationPlayer());

        this.playingAnimations.push(animationInstance);
    }

    playLinear(animation,reversed=false,iteration=0)
    {
        let animationInstance = new LinearAnimation(reversed ? this.getReversedAnimation(animation) : animation, iteration,this)
        
        this.playingAnimations
        .filter((animation)=>animation.currentAnimation.name===animation.name)
        .map((animation)=>animation.removeFromAnimationPlayer());

        this.playingAnimations.push(animationInstance);
    }

    getReversedAnimation(animation)
    {
        let revesedAnimation  = {...animation, keyframes: []};
        for (let i = animation.keyframes.length - 1; i >= 0; i--)
        {
            const keyframe = animation.keyframes[i];

            revesedAnimation.keyframes.push({
                time: 100 - keyframe.time,
                properties: keyframe.properties
            });
            
        }
        return revesedAnimation;
    }

    getPlayingAnimations()
    {
        return this.playingAnimations.map((animation)=>animation.name);
    }

    isPlaying(animation)
    {
        return this.getPlayingAnimations().includes(animation);
    }
}
class SpriteAnimation
{
    constructor(animation, iteration, parentPlayer)
    {
        this.parentPlayer = parentPlayer;
        this.id = makeId(5);
        this.currentAnimation = animation;
        this.iteration = iteration;

        this.currentKeyframe = 0;
        this.lastKeyframe = 0;
        this.animationTimer = 0;

        this.playKeyframe();
    }

    playKeyframe = () =>
    {
        
        let properties = this.getKeyframe(this.currentKeyframe).properties;
        for (const property in properties)
        {
            if (Object.hasOwnProperty.call(properties, property))
            {
                const value = properties[property];
                this.parentPlayer.setProperty(property,value);
            }
        }

        if((this.currentKeyframe + 1 !== this.currentAnimation.keyframes.length))
        {
            let t = this.getKeyframe(this.currentKeyframe).time/this.getTimeSum(this.currentAnimation) * this.currentAnimation.duration;
            this.animationTimer = new Timer("timeout",t,this.playKeyframe);
            this.lastKeyframe = this.currentKeyframe;
            this.currentKeyframe++;
        }
        else
        {
            this.currentKeyframe = this.lastKeyframe = 0;
            if(this.iteration > 0)
            {
                this.animationTimer = 0;

                if(this.iteration!==Infinity) this.iteration--;

                this.playKeyframe();
            }
            else
            {
                this.removeFromAnimationPlayer();
            }

        }
    }

    getKeyframe(keyframe)
    {
        return this.currentAnimation.keyframes[keyframe];
    }

    getTimeSum(animation)
    {
        let sum = 0;
        animation.keyframes.forEach(keyframe => {
            sum += keyframe.time
        });

        return sum;
    }

    removeFromAnimationPlayer()
    {
        this.animationTimer.remove();
        this.iteration = -1;
        this.parentPlayer.playingAnimations = this.parentPlayer.playingAnimations.filter((animation)=>animation.id!==this.id);
    }
}
class LinearAnimation
{
    constructor(animation, iteration, parentPlayer=null)
    {
        this.parentPlayer = parentPlayer;
        this.parentObject = parentPlayer.parentObject;
        this.id = makeId(5);
        this.currentAnimation = animation;
        this.iteration = iteration;
        
        this.properties = this.getAnimationProperties(this.currentAnimation);
        this.setBoundaryKeyframes();
        this.timeSum = this.getTimeSum();
        
        this.testDuration = 3000;

        this.startTime = Date.now();
        this.deltaTime = this.startTime;

        this.t = 0;
        this.endDelay = !(this.iteration > 1) * 0.1;

        animations.push(this);

        this.finished = false;

        this.playFrame();
    }

    update()
    {

        if(this.t<=1+this.endDelay)
        {
            this.playFrame();
            this.t += (Date.now()-this.deltaTime) / this.currentAnimation.duration;
            this.deltaTime = Date.now(); 
        }
        else
        {
            if(!this.finished)
            {
                this.finished = true;
                this.removeFromAnimationPlayer();
                if(this.iteration > 1) this.parentPlayer.playLinear(this.currentAnimation,false,this.iteration-1);
            }
        }
    }

    playFrame()
    {
        this.properties.forEach(property =>{

            let lastKeyframeIndex = this.getBeforeKeyframeWithProperty(property);
            let nextKeyframeIndex = this.getAfterKeyframeWithProperty(property);
            
            let lastKeyframeTime = this.getTimeToKeyframe(lastKeyframeIndex)/this.timeSum;
            let nextKeyframeTime = this.getTimeToKeyframe(nextKeyframeIndex)/this.timeSum;

            let lastValue = this.getKeyframe(lastKeyframeIndex).properties[property];
            let nextValue = this.getKeyframe(nextKeyframeIndex).properties[property];

            let propertyValue = lastValue + (nextValue - lastValue) * (this.t - lastKeyframeTime) / ((nextKeyframeTime - lastKeyframeTime) || 0.01);
            
            this.parentPlayer.setProperty(property,propertyValue);
            
        });
    }

    getAnimationProperties()
    {
        let properties = new Set();
        this.currentAnimation.keyframes.map((keyframe)=>Object.keys(keyframe.properties).map((property)=>properties.add(property)));
        return properties;
    }

    setBoundaryKeyframes()
    {
        let last = this.currentAnimation.keyframes.length-1;
        this.properties.forEach(property => {
            if(!this.currentAnimation.keyframes[0].properties.hasOwnProperty(property))
            {
                this.currentAnimation.keyframes[0].properties[property] = this.parentObject[property];
            }

            if(!this.currentAnimation.keyframes[last].properties.hasOwnProperty(property))
            {
                this.currentAnimation.keyframes[last].properties[property] = this.getLastKeyframeWithProperty(property).properties[property];
            }
            
        });

    }

    getBeforeKeyframeWithProperty(property)
    {

        let timeToKeyframe = 0;
        let targetKeyFrame = 0;

        for (let i = 0; i < this.currentAnimation.keyframes.length; i++)
        {
            const keyframe = this.currentAnimation.keyframes[i];

            timeToKeyframe += keyframe.time;
            if(keyframe.properties.hasOwnProperty(property) && timeToKeyframe/this.getTimeSum() <= this.t)
            {
                targetKeyFrame = i;
            }

            
        }
        return targetKeyFrame;

    }

    getAfterKeyframeWithProperty(property)
    {
        let timeToKeyframe = 0;
        let targetKeyframe = 0;
        for (let i = 0; i < this.currentAnimation.keyframes.length; i++)
        {
            const keyframe = this.currentAnimation.keyframes[i];
            timeToKeyframe += keyframe.time;

            if(keyframe.properties.hasOwnProperty(property) && (timeToKeyframe/this.getTimeSum() >= this.t || i === this.currentAnimation.keyframes.length-1))
            {
                targetKeyframe = i;
                return targetKeyframe;;
            }

        }
    }

    getLastKeyframeWithProperty(property)
    {
        let targetKeyFrame;
        for (let i = 0; i < this.currentAnimation.keyframes.length; i++)
        {
            const keyframe = this.currentAnimation.keyframes[i];

            if(keyframe.properties.hasOwnProperty(property))
            {
                targetKeyFrame = i;
            }
            
        }
        return targetKeyFrame;
    }

    getTimeToKeyframe(frameIndex)
    {
        let time = 0;
        for (let i = 0; i <= frameIndex; i++)
        {
            const keyframe = this.currentAnimation.keyframes[i];

            time += keyframe.time;
        }

        return time;
    }

    getKeyframe(keyframe)
    {
        return this.currentAnimation.keyframes[keyframe];
    }

    getTimeSum()
    {
        let sum = 0;
        this.currentAnimation.keyframes.forEach(keyframe => {
            sum += keyframe.time;
        });

        return sum;
    }

    removeFromAnimationPlayer()
    {
        this.parentPlayer.playingAnimations = this.parentPlayer.playingAnimations.filter((animation)=>animation.id!==this.id);
        animations = animations.filter((animation)=>animation.id!==this.id);
    }
}
class AnimatedGameSprite extends GameSprite
{
    constructor(args)
    {
        super(args);
        this.frameCountV = args.vf;
        this.frameCountH = args.hf;
        this.frameV = 1;
        this.frameH = 1;

        this.scaleX = 1;
        this.scaleY = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.opacity = 1;
        this.filters = args.filters || [];

        this.collisionMask = args.collisionMask || null;

        this.animationPlayer = new AnimationPlayer(this);
        this.animationPlayer.setProperty = this.setProperty;

        this.img = new Image();
        if(this.image) this.img.src = this.image;

    }

    drawImage(left,top)
    {
        if(this.image)
        {
            let frameWidth = Math.abs(this.img.width)/this.frameCountV;
            let frameHeight = Math.abs(this.img.height)/this.frameCountH;
            let frameVOffset = frameWidth * (this.frameV - 1);
            let frameHOffset = frameHeight * (this.frameH - 1);


            ctx.scale(Math.sign(this.scaleX),Math.sign(this.scaleY));
            if(this.translateX!==0 || this.translateY!==0) ctx.translate(this.translateX, this.translateY);
            if(this.opacity!==1) ctx.globalAlpha = this.opacity;
            if(this.filters.length > 0)
            {
                let filterText = "";
                for (let i = 0; i < this.filters.length; i++) {
                    filterText +=  (this.filters[i] + " ");
                    
                }
                ctx.filter = filterText;
            }

            let newLeft = left * Math.sign(this.scaleX) - this.width * (Math.abs(this.scaleX)-1)/2;
            let newTop = top * Math.sign(this.scaleY) - this.height * (Math.abs(this.scaleY)-1)/2;
            ctx.drawImage(this.img,frameVOffset,frameHOffset,frameWidth,frameHeight,newLeft,newTop,this.scaleX * this.width,this.scaleY * this.height);
            
            if(this.translateX!==0 || this.translateY!==0) ctx.translate(-this.translateX, -this.translateY);
            if(this.scaleX!==1 || this.scaleY!==1) ctx.scale(1/Math.sign(this.scaleX),1/Math.sign(this.scaleY));
            
            if(this.opacity!==1) ctx.globalAlpha = 1;
            ctx.filter = "none";

            // if(debugImages)
            // {
            //     ctx.beginPath();
            //     ctx.lineWidth = "4";
            //     ctx.strokeStyle = "lightskyblue";
            //     ctx.rect(newLeft,top,this.width,this.height);
            //     ctx.stroke();
            // }
        }
    }

    setProperty = (property,value) =>
    {
        if(this[property]!==null)
        {
            this[property] = value;
        }
    }

}
class Player extends AnimatedGameSprite
{
    constructor()
    {
        super(playerTemplate);
        this.speed = speed;
        this.layer = "player";

        this.shield = this.addChild(
            new AnimatedGameSprite(shieldTemplate)
        );
        this.shield.setProperty("opacity",0.4);
        this.filters = playerTemplate.filters;

        this.active = true;

        this.steer = "none";
    }

    move(direction)
    {
        if(direction===1 && this.left + this.width < canvasWidth)
        this.left += this.speed;
        else if(direction===-1 && this.left  > 0)
        this.left -= this.speed;        
    }
    
    shoot()
    {
        if(canShoot && health > 0)
        {
            // let bullet = new Bullet({top: this.top,left: this.left+this.width/2-playerBulletTemplate.width/2,...playerBulletTemplate});
            let bullet = player.addChild(new Bullet({top:0, left:this.width/2-playerBulletTemplate.width/2-2,...playerBulletTemplate}));
            canShoot = false;
            playSound(shootSound);

            new Timer("timeout",300,()=>{canShoot = true});
        }

    }

    setShield(enabled)
    {
        this.shield.animationPlayer.playSprite(shieldAnimation,!enabled);
        playSound(enabled ? shieldUpSound : shieldDownSound);
    }

    onHit(collision=null)
    {
        if(canTakeDamage)
        {
            canTakeDamage = false;
            player.animationPlayer.playLinear(damagedAnimation,false,3);
            this.setShield(true);
            health--;
            updateHealth();
            
            if(health<=0)
            {
                new Explosion({top: this.top - (explosionTemplate.height/2-this.height/2), left: this.left - (explosionTemplate.width/2 - this.width/2), ...explosionTemplate});
                // new Explosion({top: this.top-(explosionTemplate.height/2-this.height/2), left: this.left, ...explosionTemplate});
                this.delete();
                playSound(explodeSound);
                setTimeout(() => {
                    setGameWindow(3);
                }, 3000);
                return;
            }
            else
            {
                playSound(damageSound);
                // player.image = "./assets/img/spaceship-damaged.png";
    
            }

            new Timer("timeout",damagedAnimation.duration*3,()=>{
                this.translateX = 0;
            });
    
            new Timer("timeout",5000,()=>{
                canTakeDamage = true;
                this.setShield(false);
            });
        }
    }
}
class BackgroundImage extends AnimatedGameSprite
{
    constructor(top,left,width,height,speed,image,filters=[],fadeIn=false)
    {
        super(top,left,width,height,image,filters);

        this.top = top;
        this.left = left;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.image = image;

        this.id = makeId(5);

        this.opacity = fadeIn ? 0 : 1;
        this.fadeTime = 1; //percent per minute
        this.filters = filters;

        this.layers = [top,top-height];

        this.bgImage = new Image(this.width,this.height); this.bgImage.src = this.image;

    }

    drawImage()
    {

    }

    drawBackground()
    {

        if(this.opacity!==1) 
        {
            ctx.globalAlpha = this.opacity;
        }

        ctx.filter = this.filters;

        ctx.drawImage(this.bgImage,this.left,this.layers[0],canvasWidth,this.height);
        ctx.drawImage(this.bgImage,this.left,this.layers[1],canvasWidth,this.height);

        if(this.opacity!==1) 
        {
            ctx.globalAlpha = 1;
            this.opacity = Math.min(this.opacity + (1/this.fadeTime)/60,1);
        }

        if(this.filters) ctx.filter = "none";
    }
    moveBackground()
    {
        for (let i = 0; i < this.layers.length; i++)
        {
            let layer = this.layers[i];
            if(layer > this.height - this.speed)
            {
                this.layers[i] = this.top - this.height + this.speed;
            }
            else this.layers[i] += this.speed;
        }
    }

    behaviour()
    {
        this.drawBackground();
        this.moveBackground();
    }
}
class Enemy extends AnimatedGameSprite
{
    constructor(args)
    {
        super(args);

        this.direction = Math.sign(Math.random()-0.5) || 1;

        this.top = Math.random()*canvasHeight/3;
        this.left = this.direction===1 ? -args.width : canvasWidth + args.width;

        this.speed = args.speed;
        this.layer = "enemy";

        this.bulletTemplate;

        this.shoot = args.shoot || null;
        this.customBehaviour = args.customBehaviour || null;

        this.shootIntervalBase = args.shootIntervalBase;

        if(this.shoot)
        {
            this.shootInterval = (this.shootIntervalBase || 1200) + Math.sign(Math.random()-0.5) * Math.random()*200;
            this.shootCycle();
        }
    }
    behaviour()
    {
        this.left += this.direction * this.speed;

        if(this.customBehaviour) this.customBehaviour();

        if((this.direction===1 && this.left>canvasWidth)||
           (this.direction===-1 && this.left + this.width<0)||
           (this.top > canvasHeight))
        {
            addToScore(1,this.top,this.left);
            this.delete();
        }
    }

    shootCycle()
    {
        this.timers.push(new Timer("interval",this.shootInterval,()=>{
            if(health > 0) this.shoot();
        }));
    }

    onHit(collision=null)
    {
        this.timers.forEach((timer)=>timer.remove());
        this.timers = [];
        new Explosion({top: this.top - (explosionTemplate.height/2-this.height/2), left: this.left - (explosionTemplate.width/2 - this.width/2), ...explosionTemplate});
        addToScore(2,this.top,this.left);
        new Timer("timeout",50,()=>{this.delete()});
        playSound(explodeSound);

        if(Math.random()<0.05)
        {

            if(health<fullHealth)
            {
                let healthPickup = new AnimatedGameSprite({top:this.top + this.height/2 - 25,left: this.left + this.width/2 - 25,height: 50, width: 50, image: "./assets/img/health.png", colliders:[{w:100,h:100,x:0,y:0}],collisionMask: ["player"],vf:5,hf:1});
                healthPickup.picked = false;
                healthPickup.animationPlayer.playLinear(healthIdleAnimation,false,Infinity);
                healthPickup.behaviour = function()
                {
                    
                    if(this.top>canvasHeight) this.delete();
                    
                    if(!this.picked)
                    {
                        this.top += 5;
        
                        if(this.getCollisions().includes(player))
                        {
            
                            health++;
                            updateHealth();
            
                            this.picked = true;
                            playSound(healthSound);
                            this.animationPlayer.playSprite(healthPickupAnimation);
                            new Timer("timeout",healthPickupAnimation.duration,()=>{
                                this.delete();
                            })
                        }
                    }
                    
        
                }
            }
        }

    }
}
class Boss extends Enemy
{
    constructor(args)
    {
        super(args);

        this.bulletTemplate = args.bulletTemplate;
        this.shootSound = args.shootSound;
        this.fullHealth = args.fullHealth;
        this.health = this.fullHealth;
        this.shootInterval = args.shootInterval;
        this.speed = args.speed;
        
        this.onStart = args.onStart;
        this.behaviour = args.behaviour;
        this.shoot = args.shoot;

        this.checkPoints = args.checkPoints;
        this.passedCheckpoints = 0;
        
    }
    onHit(collision=null)
    {
        if(this.active)
        {
            addToScore(2,this.top,this.left);
            this.health -= 5;
            bossHealthBar.querySelector("*").style.width = Math.max(this.health/this.fullHealth,0) * 100 + "%";
    
            if(this.health <= 0)
            {
                addToScore(100,this.top,this.left);
                this.active = false;
                this.timers.forEach(timer => {
                    timer.remove();
                });
                let explosionTimer = new Timer("interval",100,()=>{
    
                    let w = 20 + Math.random() * 100;
                    let h = w;
                    let t = this.top + Math.random()*this.height;
                    let l = this.left + Math.random()*(this.width-w);
                    let explosionProperties = {
                        top: t,
                        left: l,
                        height: h,
                        width: w
                    }
                    new Explosion({...explosionTemplate,...explosionProperties});
                    playSound(explodeSound);
                });
                
                new Timer("timeout",3000,()=>{
                    explosionTimer.remove();
                    new Timer("timeout",500,()=>{

                        this.opacity = 0;
                        if(this.children.length > 0) this.children[0].opacity = 0;
                        let explosion = new Explosion({...bossExplosionTemplate,top: this.top, left: this.left - this.width*0.25/2, height: this.width, width: this.width*1.25});
                        new Timer("timeout",bossExplosionAnimation.duration,()=>{this.delete()});
                        playSound(explodeSound);
    
                        new Timer("timeout",2000,()=>{

                            bossHealthBar.style.opacity = 0;
                            bossHealthBar.querySelector("*").style.width = "0%";
                        
                            if(currentWave<5)
                            {
                                startWave("comet",cometWaveTime*60*1000,3000);
                                health = fullHealth
                                updateHealth();
                            }
                            
                        })
                    })
                
                })
            }
            else
            {
                this.checkPoints.forEach((checkpoint,index)=>{
                    if((this.health <= checkpoint.health * this.fullHealth) && index===this.passedCheckpoints)
                    {
                        this.tempFunc = checkpoint.func; this.tempFunc(); this.tempFunc = null;
                        this.passedCheckpoints++;
                    }
                })
            }

            this.shootCapacity = 5 - Math.floor(5 * this.health/this.fullHealth);
        }
    }
}
class Bullet extends AnimatedGameSprite
{
    constructor(args)
    {
        super(args);
        this.velocity = 0;
        this.collisionMask = args.collisionMask;
        this.layer = "bullet";
        this.delta = 0;
        
        this.customBehaviour = args.customBehaviour;
        this.customOnHit = args.customOnHit;

        this.dispatchDuration = args.dispatchDuration || args.animation.duration*2

        if(args.animation)
        {
            this.animationPlayer.playSprite(args.animation);
            if(args.dispatch)
            {
                new Timer("timeout",this.dispatchDuration,()=>{
                    this.removeFromParent();
                    this.velocity=args.velocity;
                })
            }

            if(args.destroyAfterAnimation)
            {
                new Timer("timeout",args.animation.duration,()=>{
                    this.delete()
                })
            }
        }
    }

    behaviour()
    {
        this.top += this.velocity;

        if(this.customBehaviour) this.customBehaviour();
        
        let collisions = this.getCollisions();
        if(collisions.length>0)
        {
            for (let i = 0; i < collisions.length; i++)
            {
                const collision = collisions[i];
                collision.onHit && collision.onHit(this);
                this.customOnHit();
                this.delete();
                
            }
        }

        if(this.getFromRect("top") > canvasHeight || this.getFromRect("top")+this.height < 0)
        {
            this.delete();
        }
    }

}
class Comet extends AnimatedGameSprite
{
    constructor(args)
    {
        super(args)
        this.velocity = args.velocity + Math.random()*args.velocity*0.5;
        this.collisionMask = args.collisionMask;
        this.layer = "comet";
        this.frameH = 1+Math.floor(Math.random()*3);

        this.top = -this.height;
        this.left = 100 + Math.random()*(canvasWidth-200);

        this.animationDuration = 1200 - this.velocity/(2.5 * args.velocity) * 1000;
        this.animationPlayer.playSprite({...cometAnimation,duration: this.animationDuration},true,20);
        this.zIndex = 1
    
    }
    behaviour()
    {
        this.top += this.velocity;

        let collisions = this.getCollisions();
        if(collisions.length>0)
        {
            for (let i = 0; i < collisions.length; i++)
            {
                const collision = collisions[i];
                collision.onHit && collision.onHit();

                this.onHit();                
            }
        }

        if(this.top > canvasHeight || this.top+this.height < 0)
        {
            addToScore(1,this.top,this.left + this.width/2);
            this.delete();
        }
    }

    onHit(collision=null)
    {
        if(collision){addToScore(2,this.top,this.left)};
        new Explosion({top: this.top - (explosionTemplate.height/2-this.height/2), left: this.left - (explosionTemplate.width/2 - this.width/2), ...explosionTemplate});
        playSound(explodeSound);
        this.delete();
    }
}
class Explosion extends AnimatedGameSprite
{
    constructor(args)
    {
        super(args);

        this.animationPlayer.playSprite(args.animation);
        new Timer("timeout",args.animation.duration,()=>{this.delete()});
    }
}
class Timer
{
    constructor(timerType,time,func)
    {
        this.timerType = timerType;
        this.func = func;
        this.time = time;
        this.remaining = time;
        this.delta = 20;
        // this.last = Date.now();
        // this.remainder = 0;
        this.paused = false;
        this.id = makeId(5);

        timers.push(this);

        return this;
    }

    // setTime = (newTime) => {
    //     this.time = newTime;
    // }

    execute = () => {
        if(!this.paused)
        {
            this.remaining -= this.delta;

            if(this.remaining <= 0)
            {
                this.func();

                if(this.timerType==="timeout")
                {
                    this.remove();
                    return;
                }

                this.remaining = this.time;
            }
        }
        // let t = this.remainder===0 ? this.time : this.remainder;
        // if(Date.now() >= this.last + t && !this.paused)
        // {
        //     this.func();
        //     this.last = Date.now();

        //     if(this.timerType==="timeout")
        //     {
        //         this.remove();
        //         return;
        //     }
        //     if(this.remainder!==0)
        //     {
        //         this.remainder = 0;
        //     }
        // }
    }

    pause = () => {
        this.paused = true;
        // this.remainder = (this.remainder===0 ? this.time : this.remainder) - ((Date.now() - this.last) % this.time)
    }

    resume = () => {
        // this.last = Date.now();
        this.paused = false;
    }

    remove = () => {
        timers = timers.filter((timer)=>timer.id!==this.id);
    }
}
class FloatingLabel extends AnimatedGameSprite
{
    constructor(args)
    {
        super(args)
        this.text = args.text;

        ctx.font = "bold 2rem Arial";
        ctx.fillStyle = "limegreen";

        this.zIndex = 1;
        
    }

    drawImage(left,top)
    {
        if(this.text)
        {
            let frameWidth = Math.abs(this.img.width)/this.frameCountV;
            let frameHeight = Math.abs(this.img.height)/this.frameCountH;
            let frameVOffset = frameWidth * (this.frameV - 1);
            let frameHOffset = frameHeight * (this.frameH - 1);


            ctx.scale(Math.sign(this.scaleX),Math.sign(this.scaleY));
            if(this.translateX!==0 || this.translateY!==0) ctx.translate(this.translateX, this.translateY);
            if(this.opacity!==1) ctx.globalAlpha = this.opacity;
            if(this.filters.length > 0)
            {
                let filterText = "";
                for (let i = 0; i < this.filters.length; i++) {
                    filterText +=  (this.filters[i] + " ");
                    
                }
                ctx.filter = filterText;
            }

            let newLeft = left * Math.sign(this.scaleX) - this.width * (Math.abs(this.scaleX)-1)/2;
            let newTop = top * Math.sign(this.scaleY) - this.height * (Math.abs(this.scaleY)-1)/2;

            ctx.fillText(this.text,newLeft,newTop);
            // ctx.drawImage(this.img,frameVOffset,frameHOffset,frameWidth,frameHeight,newLeft,newTop,this.scaleX * this.width,this.scaleY * this.height);
            
            if(this.translateX!==0 || this.translateY!==0) ctx.translate(-this.translateX, -this.translateY);
            if(this.scaleX!==1 || this.scaleY!==1) ctx.scale(1/Math.sign(this.scaleX),1/Math.sign(this.scaleY));
            
            if(this.opacity!==1) ctx.globalAlpha = 1;
            ctx.filter = "none";

            // if(debugImages)
            // {
            //     ctx.beginPath();
            //     ctx.lineWidth = "4";
            //     ctx.strokeStyle = "lightskyblue";
            //     ctx.rect(newLeft,top,this.width,this.height);
            //     ctx.stroke();
            // }
        }
    }
}

function setAllTimers(enabled)
{
    if(enabled)
    {
        timers.forEach(timer => {
            timer.resume();
        });
    }
    else
    {
        timers.forEach(timer => {
            timer.pause();
        });
    }
}

//functions

function playSound(sound,duration=0,volume=0.5)
{
    let element;
    let availableAudios = [...(audioContainer.querySelectorAll(`audio[src="${sound}"]`))].filter((audio)=>audio.paused);
    if(availableAudios.length > 0)
    {
        element = availableAudios[0];
        if(element.volume!==volume*masterVolume) element.volume = volume * masterVolume;
        if(document.body.contains(element)) element.play();
        let timerId = element.getAttribute("timer");

        if(timerId) timers = timers.filter((timer)=>timer.id!==timerId);
    }
    else
    {
        element = addElement(`<audio autoplay preload="metadata"></audio>`);
        element.src = sound;
        element.volume = volume * masterVolume;
        audioContainer.appendChild(element);

        element.onended = function()
        {
            let audioTimer = new Timer("timeout",5000,()=>{
                if(!element.paused) element.remove();
            });
            element.setAttribute("timer",audioTimer.id);
        }; 

    }

    element.onloadedmetadata = function()
    {
        if(duration>0 && duration < element.duration*1000)
        {
            new Timer("timeout",duration,()=>{
                element.remove();
            })
        }
    };

}
function addElement(html)
{
    let temp = document.createElement('template');
    html = html.trim();
    temp.innerHTML = html;
    return temp.content.firstChild;
}
function createSpriteAnimation(duration,spriteFrames,name="")
{
    return {
        name: name,
        duration: duration,
        keyframes: spriteFrames.map((f,index) => ({
            time:(index>0 ? 1 : 0),
            properties: {frameV: f}
        }))
    }
}
function createLinearAnimation(duration,property,values,name="")
{
    return {
        name: name,
        duration: duration,
        keyframes: values.map((v,index) => ({
            time:(index>0 ? 1 : 0),
            properties: {[property]: v}
        }))
    }
}
function resetGame()
{
    gameSprites.filter((gameSprite)=>gameSprite!==player).forEach(gameSprite => {
        gameSprite.delete();
    });
    gameSprites = [];

    player = new Player();
    
    timers.forEach(timer => {
        timer.remove();
    });
    timers = [];

    score = 0;
    addToScore(0);

    enemySpawnRate = initialEnemySpawnRate;
    cometSpawnRate = initialCometSpawnRate;

    bossHealthBar.style.opacity = 0;
    bossHealthBar.querySelector("*").style.width = "0%";

    active = true;
    canTakeDamage = true;
    canShoot = true;
    
    start();
}
function setGameWindow(newWindowIndex)
{
    let windowList = ["gameStart","gamePaused","gameOptions","gameOver","none","gameWon"];
    let newWindow = windowList[newWindowIndex];
    let currentWindow = gameOverlay.getAttribute("window");

    if(newWindow==="gameOver")
    {
        let lastHighscore = localStorage.getItem("spaceGameHighscore");
        let gameOverScoreLabel = gameWindow.querySelector(".game-over-score-label");
        let gameOverHighscoreLabel = gameWindow.querySelector(".game-over-highscore-label");

        if(score > lastHighscore)
        {
            gameOverScoreLabel.innerHTML = "أعلى نقاط جديدة: " + score;
            gameOverScoreLabel.setAttribute("new-highscore","true");
            localStorage.setItem("spaceGameHighscore",score);
        }
        else
        {
            gameOverScoreLabel.setAttribute("new-highscore","false");
            gameOverScoreLabel.innerHTML = "النقاط: " + score;
            gameOverHighscoreLabel.innerHTML = "أعلى نقاط: " + lastHighscore;
        }
        gameOverlay.setAttribute("window","gameOver");
        active = false;
        document.body.setAttribute("active", "false");
        // setAllTimers(false);
        setAllTimers(false);
        playSound(uiSound);
    }
    else if(newWindow==="gamePaused"||newWindow==="gameOptions")
    {

        if(currentWindow!=="gameOver" && health > 0)
        {
            document.querySelectorAll("audio").forEach((audio)=>{if(!audio.paused) {audio.classList.add("paused"); audio.pause();}});

            if((newWindow==="gamePaused" && active) || newWindow!=="gamePaused")
            {
                active = false;
                gameOverlay.setAttribute("window",newWindow);
                document.body.setAttribute("active", "false");
                setAllTimers(false);
                playSound(uiSound);
            }
        }
    }
    else if(newWindow==="gameStart")
    {
        active = true;
        player.left = canvasWidth;
        gameSprites.forEach((sprite)=> {if(!(sprite instanceof Player || sprite instanceof BackgroundImage) ) sprite.delete()});
        progressBar.style.opacity = 0;
        bossHealthBar.style.opacity = 0;
        setTimeout(() => {
            active = false;
            gameOverlay.setAttribute("window","gameStart");
            document.body.setAttribute("active", "false");
            document.body.setAttribute("started","false");
            timers.forEach((timer)=>timer.remove());
            timers = [];
            playSound(uiSound);
        }, 20);

        if(currentWave && !continueButtonContainer.firstChild)
        {
            continueButtonContainer.appendChild(addElement(`<button class="window-button continue-btn">استأنف اللعبة!</button>`));
            continueButtonContainer.querySelector(".continue-btn").addEventListener("click",()=>{currentWave=+localStorage.getItem("currentWave");setGameWindow(4);});
        }
        else if(!currentWave)
        {
            continueButtonContainer.innerHTML = "";
        }
    }
    else if(newWindow==="gameWon")
    {
        active = false;
        gameOverlay.setAttribute("window",newWindow);
        document.body.setAttribute("active", "false");
        setAllTimers(false);
        playSound(uiSound);
    }
    else if(newWindow==="none")
    {
        playSound(uiSound);
        document.querySelectorAll("audio").forEach((audio)=>{if(audio.paused && audio.classList.contains("paused")){audio.classList.remove("paused"); audio.play()}});
        if(currentWindow==="gameOver")
        {
            gameOverlay.setAttribute("window","none");
            document.body.setAttribute("active","true");
            resetGame();
        }
        else if(currentWindow==="gamePaused"||currentWindow==="gameOptions")
        {
            if(!active)
            {
                active = true;
                gameOverlay.setAttribute("window","none");
                document.body.setAttribute("active","true");
                // setAllTimers(true);
                setAllTimers(true);
            }
        }
        else if(currentWindow==="gameStart")
        {
            active = true;
            gameOverlay.setAttribute("window","none");
            document.body.setAttribute("active","true");
            document.body.setAttribute("started","true")
            start();
        }
    }
}

function addToScore(add,top=100,left=200)
{
    score += add;
    scoreLabel.innerHTML = score;

    let scoreString = "" + score;
    if(scoreString.length>2)
    {
        scoreLabel.style.width = (0.6 *(scoreString.length+1)) + "em";
    }

    if(add)
    {
        let newTop = Math.max(100,Math.min(top,canvasHeight-25));
        let newLeft = Math.max(125+25*parseInt(Math.log10(score)),Math.min(left,canvasWidth-100));
    
        let testLabel = new FloatingLabel({top:newTop,left:newLeft,width:100,height: 100,text:`+${add}`,vf:1,hf:1});
        testLabel.animationPlayer.playLinear(labelFloatAnimation);
        new Timer("timeout",labelFloatAnimation.duration,()=>{
            testLabel.delete();
        })
    }

}
function initHealth()
{
    health = fullHealth;
    healthBar.innerHTML = "";
    for (let i = 0; i < health; i++)
    {
        healthBar.appendChild(addElement(`<div class="health-bar-point" full="true"></div>`))
    }
}
function updateHealth()
{
    let points = healthBar.querySelectorAll(".health-bar-point");
    
    for (let i = 0; i < points.length; i++)
    {
        const point = points[i];
        point.setAttribute("full",points.length-i-1<health ? "true" :  "false");
        
    }
}
function makeId(length)
{
    let s = "1234567890abcdefghijklmnopqrstuvwxyz";
    let id = "";

    for (let i = 0; i < length; i++) {
        let char = s[parseInt(Math.random()*(s.length-1))];
        id += char;
    }

    return id;

}
function changeBackgroundFilter(newFilter,fadeTime=1)
{
    let layerIds = gameBackgroundLayers.map((layer)=>layer.id);
    // let newLayers = [];
    let oldLayers = gameBackgroundLayers.slice();
    oldLayers.forEach(layer => {
        let newLayer = new BackgroundImage(layer.top,layer.left,layer.width,layer.height,layer.speed,layer.image,newFilter,true);
        newLayer.layers = layer.layers.slice();
        newLayer.fadeTime = fadeTime;
        gameBackgroundLayers.push(newLayer);
    });

    new Timer("timeout",fadeTime*1000,()=>{
        gameBackgroundLayers = gameBackgroundLayers.filter((layer)=>{
            if(!layerIds.includes(layer.id)) return true;
            else
            {
                layer.delete();
                return false;
            }
            
        });
    });

    
}
function startWave(waveType,waveDuration,waveDelay,intervalUpdateFactor=0,intervalUpdateRate=0)
{
    let waveFunc;
    let waveEndFunc;
    let waveSpawnRate;

    if(waveType==="enemy")
    {
        waveFunc = function()
        {
            let enemy = new Enemy({...enemyWaves[currentWave].enemyTemplate});
        }
        waveEndFunc = function()
        {
            startBossFight();
            progressBar.style.opacity = "0";

        };
        waveSpawnRate = enemySpawnRate;
    }
    else if(waveType==="comet")
    {
        waveFunc = function()
        {
            let cometWidth = cometTemplate.width * 0.5 + Math.random() * cometTemplate.width * 0.75;
            let cometHeight = cometWidth/cometTemplate.width * cometTemplate.height;
            let comet = new Comet({...cometTemplate,width: cometWidth, height: cometHeight});
            comet.filters.push("drop-shadow(0 0 10px rgb(255,255,255,0.5))")
        }
        waveEndFunc = function()
        {
            if(currentWave<4)
            {
                currentWave++;
                changeBackgroundFilter(enemyWaves[currentWave].backgroundFilter);
                localStorage.setItem("currentWave",currentWave);
                new Timer("timeout",2000,()=>startWave("enemy",enemyWaveTime*60*1000,3000));
            }
            else
            {
                progressBar.style.opacity = "0";
                startEndScene();
            }

        }
        waveSpawnRate = cometSpawnRate;
    }

    let spawnTimer = new Timer("interval",60/waveSpawnRate*1000,waveFunc);
    let updateSpawnRateTimer;
    if(intervalUpdateFactor && intervalUpdateRate) updateSpawnRateTimer = new Timer("interval",intervalUpdateRate,()=>{
        waveSpawnRate *= intervalUpdateRate
    });

    let endTimer = new Timer("timeout",waveDuration,()=>{
        waveEndFunc();
        spawnTimer.remove();
    });

    let elapsedTime = 0;
    progressBar.style.opacity = "1";
    
    function updateProgressBar()
    {
        let markerHeight = +getComputedStyle(progressBar.querySelector(".marker")).width.slice(0,-2)/16;
        progressBar.querySelector(".bottom").style.height = `${elapsedTime/waveDuration*100}%`;
        progressBar.querySelector(".top").style.height = `calc(${(waveDuration - elapsedTime)/waveDuration*100}% - ${markerHeight/4}em)`;

        new Timer("timeout",1000,()=>{
            elapsedTime+= 1000;
            let markerHeight = +getComputedStyle(progressBar.querySelector(".marker")).width.slice(0,-2)/16;
            progressBar.querySelector(".bottom").style.height = `${elapsedTime/waveDuration*100}%`;
            progressBar.querySelector(".top").style.height = `calc(${(waveDuration - elapsedTime)/waveDuration*100}% - ${markerHeight/4}em)`;

            if(elapsedTime < waveDuration && health>0)
            {
                updateProgressBar();
            }
        })
    };
    updateProgressBar();
}
function startBossFight()
{
    bossHealthBar.style.opacity = 1;
    bossHealthBar.querySelector("*").style.width = "100%";

    let bossTemplate = enemyBosses[currentWave];


    let boss = new Boss({...enemyWaves[currentWave].enemyTemplate,...bossTemplate});
    boss.top = -boss.height; boss.left = canvasWidth/2 - boss.width/2;
    boss.timers[0].remove();

    boss.onStart();
}
function startEndScene()
{
    new Timer("timeout",3000,()=>{

        //END SCENE
        playSound("./assets/audio/win.wav");

        health = 0;

        controlsActive = false;
        let midPoint = canvasWidth/2 - player.width/2;
        if(player.left!==midPoint)
        {
            let key = player.left > midPoint ? 65 : 68;
            player.speed = speed/2; 
            controls[key].onDown();
            player.behaviour = function(){
                if(player.left-midPoint!==0)
                {
                    controls[key].onHold();
                }
                else
                {
                    controls[key].onUp();
                    player.behaviour = function(){};
                }
            };
        }

        healthBar.style.opacity = "0";

        changeBackgroundFilter("hue-rotate(0deg)",3)

        let speedLines = new AnimatedGameSprite({top:0,left:0,width:canvasWidth,height: canvasHeight,image: "./assets/img/speed-spritesheet.png",vf:10,hf:1});
        let speedAnimation = createSpriteAnimation(200,[1,2,3,4,5,6,7,8,9,10],"speed");
        speedLines.animationPlayer.playSprite(speedAnimation,false,Infinity);
        speedLines.animationPlayer.playLinear(createLinearAnimation(1000,"opacity",[0,0.5],"speedLineOpacity"));
        speedLines.opacity = 0.5;

        gameBackgroundLayers.forEach((layer)=>{
            layer.animationPlayer.playLinear(createLinearAnimation(1000,"speed",[layer.speed,layer.speed*10],"backgroundSpeed"));
        });

        player.animationPlayer.playLinear(createLinearAnimation(1500,"top",[canvasHeight*4/5-50,150],"playerMoveUp"));

        new Timer("timeout",10000,()=>{
            let earth = new AnimatedGameSprite({top:0,left:0,width:canvasWidth/2,height: canvasWidth/2,image: "./assets/img/earth.png",vf:1,hf:1});
            earth.filters.push("drop-shadow(0 0 5px white)");
            earth.top = -earth.height/2; earth.left = canvasWidth/2 - earth.width/2;
            earth.animationPlayer.playLinear(createLinearAnimation(3000,"top",[-canvasWidth/2,0],"EarthMoveIn"));
            speedLines.animationPlayer.playLinear(createLinearAnimation(1000,"opacity",[0.5,0],"speedLineOpacity"));

            gameBackgroundLayers.forEach((layer)=>{
                layer.animationPlayer.playLinear(createLinearAnimation(1000,"speed",[layer.speed,layer.speed/15],"backgroundSpeed"));
            });

            player.animationPlayer.playLinear(createLinearAnimation(1500,"top",[150,canvasHeight*4/5-50],"playerMoveDown"));
            new Timer("timeout",3000,()=>{
                player.animationPlayer.playLinear(createLinearAnimation(5000,"top",[canvasHeight*4/5-50,75],"playerToEarthTop"));
                player.animationPlayer.playLinear(createLinearAnimation(5000,"scaleX",[1,0.01],"playerToEarthScaleX"));
                player.animationPlayer.playLinear(createLinearAnimation(5000,"scaleY",[1,0.01],"playerToEarthScaleY"));

                new Timer("timeout",8000,()=>{
                    setGameWindow(5);
                    // let blackScreen = new AnimatedGameSprite({top:0,left:0,width:canvasWidth,height:canvasHeight,image:"./assets/img/black.png",vf:1,hf:1});
                    // blackScreen.animationPlayer.playLinear(createLinearAnimation(2000,"opacity",[0,1],"blackFadeIn"));

                    // new Timer("timeout",4000,()=>{

                    // })
                });
            })
        })

    })
}

function start()
{
    started = true;

    player.left = canvasWidth/2-50;
    player.animationPlayer.playLinear(playerInAnimation);
    new Timer("timeout",playerInAnimation.duration,()=>{
        player.top = canvasHeight*4/5-50;
    })

    changeBackgroundFilter(enemyWaves[currentWave].backgroundFilter,0);

    initHealth();

    gameOverlay.addEventListener("transitionend", function(){if(gameOverlay.getAttribute("window")==="none") document.activeElement.blur();});

    let startDelay = 2000;
    if(document.body.getAttribute("started")==="false")
    {
        document.body.setAttribute("started","true");
        startDelay = 5000;
    }
    // ctrl
    new Timer("timeout",2000,()=>{
        // startWave("comet",cometWaveTime*60*1000,3000);
        startWave("enemy",enemyWaveTime*60*1000,1*1000,1.1,10*1000);
    });

    let markerHeight = +getComputedStyle(progressBar.querySelector(".marker")).width.slice(0,-2)/16;
    progressBar.querySelector(".bottom").style.height = `0%`;
    progressBar.querySelector(".top").style.height = `calc(100% - ${markerHeight/4}em)`;

}

player = new Player();

gameBackgroundLayers.push(
    ...(backgroundLayersTemplate)
.map((layer)=> new BackgroundImage(0,0,900,2700,layer.speed,`./assets/img/bg/${layer.layer}.png`)));

changeBackgroundFilter(enemyWaves[currentWave].backgroundFilter,0);

function loop()
{
    if(!started)
    {
        gameBackgroundLayers.forEach(layer => {
            layer.drawBackground();
        });
    }
    if(active)
    {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // for (let i = 0; i < gameBackgroundLayers.length; i++) {
        //     const layer = gameBackgroundLayers[i];
        //     layer.drawBackground();
        //     layer.moveBackground();
            
        // }
        
        for (let i = 0; i < 3; i++)
        {
            let spritesInLayer = gameSprites.filter((gameSprite)=>gameSprite.zIndex===i);
            spritesInLayer.forEach(gameSprite => {
                gameSprite.update();
            });
            
        }
        
        timers.forEach(timer => {
            timer.execute();
        });

        animations.forEach(animation =>{
            animation.update();
        })
        
        if(controlsActive)
        {
            for (const key in controls)
            {
                if (Object.hasOwnProperty.call(controls, key)) {
                    const control = controls[key];
                    if(control.pressed)
                    {
                        control.onHold && control.onHold();
                        
                        if(control.fired)
                        {
                            control.onDown();
                            control.fired = false;
                        }
                    }
                }
            }
        }
    }
    
    requestAnimationFrame(loop);
}
loop();

setPlatformControls();


function ResizeGameWindow()
{
    
    if(window.innerHeight < 600)
    {
        gameWindow.style.maxWidth = getComputedStyle(gameWindow).height.slice(0,-2) * 9/6 + "px";
    }
    else
    {
        gameWindow.style.maxWidth = "900px";
    }
    
    if(window.innerWidth < 900)
    {
        gameWindow.style.maxHeight = getComputedStyle(gameWindow).width.slice(0,-2) * 6/9 + "px";
    }
    else
    {
        gameWindow.style.maxHeight = "600px";

    }
    gameWindow.style.fontSize = getComputedStyle(gameWindow).height.slice(0,-2)/600*1 + "em";
    
    

}
function setPlatformControls()
{
    let platforms = {
        "keyboard": ["Windows","Win16","Win32","WinCE","Linux","Linux i686"],
        "touch": ["Android","Linux armv7l",null,"iPhone","iPod","iPad","BlackBerry"]
    };
    for (const key in platforms)
    {
        if (Object.hasOwnProperty.call(platforms, key))
        {
            const e = platforms[key];
            if(e.includes(navigator.platform)) document.body.setAttribute("controls",key);
        }
    }
}




document.body.addEventListener("blur",()=>{setGameWindow(1);});
window.addEventListener("resize",ResizeGameWindow);
window.addEventListener("load",ResizeGameWindow)

document.querySelectorAll(".pause-btn").forEach((btn)=>btn.addEventListener("click",()=>{setGameWindow(1);}));
document.querySelectorAll(".play-btn").forEach((btn)=>btn.addEventListener("click",()=>{setGameWindow(4);}));
document.querySelectorAll(".main-menu-btn").forEach((btn)=>btn.addEventListener("click",()=>{setGameWindow(0);}));

startNewButton.addEventListener("click",()=>{
    currentWave = 0;
    localStorage.setItem("currentWave",0);
    setGameWindow(4);
});

retryButton.addEventListener("click",()=>{setGameWindow(4);});

if(currentWave && !continueButtonContainer.firstChild)
{
    continueButtonContainer.appendChild(addElement(`<button class="window-button continue-btn">استأنف اللعبة!</button>`));
    continueButtonContainer.querySelector(".continue-btn").addEventListener("click",()=>{currentWave=+localStorage.getItem("currentWave");setGameWindow(4);});
}

})()