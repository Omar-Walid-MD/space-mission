// GAME VARIABLES

let gameWindow = window.gamewindow;
let gameOverlay = window.gameoverlay;
let gameCanvas = window.gamecanvas;
let ctx = gameCanvas.getContext("2d");
let canvasWidth = gameCanvas.width; let canvasHeight = gameCanvas.height;

let rightButton = window.rightbutton;
let leftButton = window.leftbutton;
let shootButton = window.shootbutton;

let audioContainer = window.audiocontainer
let scoreLabel = window.scorelabel;
let healthBar = window.healthbar;

let player;
let gameBackground;

let started = false;
let active = false;
let canShoot = true;
let canTakeDamage = true;

let fullHealth = 3;
let health = fullHealth;
let score = 0;

let frameRate = 12;
let speed = 10;
let playerRate = speed*100/frameRate;
let rate = 100/frameRate;
let gameLoop = 0;

let initialSpawnRate = 30; //per minute
let maxSpawnRate = 200;
let spawnRate = initialSpawnRate;

let newTimers = [];
let gameSprites = [];

let shootSound = "./assets/audio/shoot-sound.mp3";
let enemyShootSound = "./assets/audio/shoot-sound.mp3";
let damageSound = "./assets/audio/hit.wav";
let explodeSound = "./assets/audio/explode.wav";
let uiSound = "./assets/audio/ui.wav";


//GAME CONTROLS

let controls = {
    65:
    {
        pressed: false,
        fired: true,
        onHold: function(){player.move(-1);},
        onDown: function(){player.setProperty("scale",{x:-1,y:1});player.animationPlayer.play(steeringAnimation);},
        onUp: function(){new Timer("timeout",steeringAnimation.duration,()=>{player.setProperty("scale",{x:1,y:1});});player.animationPlayer.play(steeringAnimation,true);}
    }, //a
    68:
    {
        pressed: false,
        fired: true,
        onHold: function(){player.move(1);},
        onDown: function(){player.animationPlayer.play(steeringAnimation);},
        onUp: function(){player.setProperty("scale",{x:1,y:1});player.animationPlayer.play(steeringAnimation,true);}
    }, //d
    32:
    {
        pressed: false,
        fired: true,
        onDown: function(){player.shoot()}
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
        if(e.which===27) setGameWindow(4);
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

// GAME TEMPLATES
let playerTemplate = {
    left: canvasWidth/2-50,
    top: canvasHeight*4/5-50,
    width: 100,
    height: 100,
    colliderPercent: 0.5,
    speed: speed,
    image: "./assets/img/spaceship-sprites.png"
}
let enemyTemplate = {
    top: 0,
    left: 0,
    width: 100,
    height: 60,
    colliderPercent: 1,
    image: "./assets/img/enemy.png",
    speed: 5
}
let playerBulletTemplate = {
    width: 30,
    height: 30,
    image: "./assets/img/b.png",
    velocity: -10,
    collisionMask: ["enemy"]
}
let enemyBulletTemplate = {
    ...playerBulletTemplate,
    velocity: 10,
    collisionMask: ["player"]
}
let shieldTemplate = {
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    colliderPercent: 0,
    image: "./assets/img/shield-spritesheet.png"
}
let explosionTemplate = {
    width: 100,
    height: 100,
    colliderPercent: 0,
    image: "./assets/img/explode-spritesheet.png"
}

let steeringAnimation = {
    name: "steering",
    keyframes: [
        {
            time: 0,
            properties:
            {
                frame: 1
            }
        },
        {
            time: 25,
            properties:
            {
                frame: 2
            }
        },
        {
            time: 50,
            properties:
            {
                frame: 3
            }
        },
        {
            time: 75,
            properties:
            {
                frame: 4
            }
        },
        {
            time: 100,
            properties:
            {
                frame: 5
            }
        }
    ],
    duration: 150
}
let shieldAnimation = {
    name: "shield",
    keyframes: [
        {
            time: 10,
            properties:
            {
                frame: 1
            }
        },
        {
            time: 0,
            properties:
            {
                frame: 2
            }
        },
        {
            time: 20,
            properties:
            {
                frame: 3
            }
        },
        {
            time: 30,
            properties:
            {
                frame: 4
            }
        },
        {
            time: 40,
            properties:
            {
                frame: 5
            }
        },
        {
            time: 50,
            properties:
            {
                frame: 6
            }
        },
        {
            time: 60,
            properties:
            {
                frame: 7
            }
        },
        {
            time: 70,
            properties:
            {
                frame: 8
            }
        },
        {
            time: 80,
            properties:
            {
                frame: 9
            }
        },
        {
            time: 100,
            properties:
            {
                frame: 10
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
                frame: 1
            }
        },
        {
            time: 16.6,
            properties:
            {
                frame: 2
            }
        },
        {
            time: 25,
            properties:
            {
                frame: 3
            }
        },
        {
            time: 33.3,
            properties:
            {
                frame: 4
            }
        },
        {
            time: 41.6,
            properties:
            {
                frame: 5
            }
        },
        {
            time: 50,
            properties:
            {
                frame: 6
            }
        },
        {
            time: 58.3,
            properties:
            {
                frame: 7
            }
        },
        {
            time: 66.6,
            properties:
            {
                frame: 8
            }
        },
        {
            time: 75,
            properties:
            {
                frame: 9
            }
        },
        {
            time: 83.3,
            properties:
            {
                frame: 10
            }
        },
        {
            time: 91.6,
            properties:
            {
                frame: 11
            }
        },
        {
            time: 100,
            properties:
            {
                frame: 12
            }
        }
    ],
    duration: 500
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
            time: 20,
            properties:
            {
                translateX: 6
            }
        },
        {
            time: 80,
            properties:
            {
                translateX: -6
            }
        },
        {
            time: 100,
            properties:
            {
                translateX: 0 
            }
        }
    ],
    duration: 80
}
// GAME CLASSES

class GameSprite
{
    constructor({top,left,width,height,colliderPercent=1,image=null,collisionMask=[]})
    {
        this.top = top;
        this.left = left;
        this.width = width;
        this.height = height;

        this.image = image;
        this.colliderPercent = colliderPercent;

        this.layer = "";
        this.id = makeId(5);

        this.timers = [];
        this.children = [];
        this.parent = null;

        gameSprites.push(this);
    }

    getFromRect(attr)
    {
        return   (attr==="top"
                ? this.top
                : attr==="left"
                ? this.left
                : attr==="bottom"
                ? (this.top+this.height)
                : attr==="right"
                ? (this.left+this.width)
                : attr==="midHeight"
                ? (this.top+this.height/2)
                : attr==="midWidth"
                ? (this.top+this.height/2)
                : null);
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
        if(this.parent) this.drawImage(this.parent.left + this.left,this.parent.top + this.top, this.width, this.height);
        else this.drawImage(this.left, this.top, this.width, this.height);
    }

    isColliding(objectX,objectY)
    {
        let colliderX = {
            xMid: objectX.left + objectX.width/2,
            yMid: objectX.top + objectX.height/2,
            width: objectX.width*objectX.colliderPercent,
            height: objectX.height*objectX.colliderPercent
        }

        let colliderY = {
            xMid: objectY.left + objectY.width/2,
            yMid: objectY.top + objectY.height/2,
            width: objectY.width*objectY.colliderPercent,
            height: objectY.height*objectY.colliderPercent
        }

        return (Math.abs(colliderX.xMid-colliderY.xMid)<=(colliderX.width+colliderY.width)/2
             && Math.abs(colliderX.yMid-colliderY.yMid)<=(colliderX.height+colliderY.height)/2);

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
    constructor()
    {
        this.currentAnimation;
        this.animationTimer;
        this.currentKeyframe = 0;
        this.lastKeyframe = 0;
        this.direction = 1;
    }

    play(animation,reversed=false,iteration=0)
    {
        if(this.currentAnimation) this.animationTimer.remove();

        this.currentAnimation = reversed ? this.getReversedAnimation(animation) : animation;

        this.iteration = iteration - 1;

        let t = (this.getKeyframe(this.currentKeyframe).time - this.getKeyframe(this.lastKeyframe).time)/100*this.currentAnimation.duration;
        this.animationTimer = new Timer("timeout",t,this.playKeyframe);

    }

    playKeyframe = () =>
    {
        let properties = this.getKeyframe(this.currentKeyframe).properties;
        for (const property in properties) {
            if (Object.hasOwnProperty.call(properties, property)) {
                const value = properties[property];
                this.setProperty(property,value);

            }
        }

        if((this.direction===1 && this.currentKeyframe + 1 !== this.currentAnimation.keyframes.length))
        {
            this.lastKeyframe = this.currentKeyframe;
            this.currentKeyframe++;
            let t = (this.getKeyframe(this.currentKeyframe).time - this.getKeyframe(this.lastKeyframe).time)/100*this.currentAnimation.duration;
            console.log(t);
            this.animationTimer = new Timer("timeout",t,this.playKeyframe);
        }
        else
        {
            if(this.iteration > 0)
            {
                this.play(this.currentAnimation,this.reversed,this.iteration);
            }

            this.currentKeyframe = this.lastKeyframe = 0;
        }
    }

    getKeyframe(keyframe)
    {
        return this.currentAnimation.keyframes[keyframe];
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
}
class AnimatedGameSprite extends GameSprite
{
    constructor(frameCount,args)
    {
        super(args);
        this.frameCount = frameCount;
        this.frame = 1;

        this.scale = {
            x: 1,
            y: 1
        };
        this.opacity = 1;
        this.translateX = 0;

        this.animationPlayer = new AnimationPlayer();
        this.animationPlayer.setProperty = this.setProperty;

    }

    drawImage(left,top)
    {
        if(this.image)
        {
            let img = new Image(); img.src = this.image;
            let frameOffset = Math.abs(this.width) * (this.frame - 1);

            ctx.scale(this.scale.x,this.scale.y);
            if(this.opacity!==1) ctx.globalAlpha = this.opacity;
            if(this.translateX!==0) ctx.translate(this.translateX, 0);

            let newLeft = this.scale.x * left - this.width * Math.abs(1-this.scale.x)/2;

            ctx.drawImage(img,frameOffset,0,Math.abs(this.width),this.height,newLeft,top,this.width,this.height);
            
            if(this.translateX!==0) ctx.translate(-this.translateX, 0);
            if(this.scale!=={x:1,y:1}) ctx.scale(1/this.scale.x,1/this.scale.y);
            if(this.opacity!==1) ctx.globalAlpha = 1;
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
    constructor(args)
    {
        super(5,args);
        this.speed = speed;
        this.layer = "player";

        this.shield = this.addChild(
            new AnimatedGameSprite(10,shieldTemplate)
        );
        this.shield.setProperty("opacity",0.4);
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
            let bullet = new Bullet({top: this.top,left: this.left+this.width/2-playerBulletTemplate.width/2,...playerBulletTemplate});
            canShoot = false;
            playSound(shootSound);

            new Timer("timeout",500,()=>{canShoot = true});
        }

    }

    setShield(enabled)
    {
        this.shield.animationPlayer.play(shieldAnimation,!enabled);
    }

    onHit()
    {
        if(canTakeDamage)
        {
            canTakeDamage = false;
            this.animationPlayer.play(damagedAnimation,true,4);
            this.setShield(true);
            health--;
            updateHealth();
            
            if(health<=0)
            {
                new Explosion({top: this.top, left: this.left, ...explosionTemplate});
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
    
            new Timer("timeout",5000,()=>{
                canTakeDamage = true;
                this.setShield(false);
            });
        }
    }
}
class BackgroundImage
{
    constructor(top,left,width,height,speed,image)
    {
        this.top = top;
        this.left = left;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.image = image;

        this.layers = [top,top-height];

        
    }

    drawBackground()
    {
        let bgImage = new Image(this.width,this.height); bgImage.src = this.image;

        ctx.drawImage(bgImage,this.left,this.layers[0],canvasWidth,this.height);
        ctx.drawImage(bgImage,this.left,this.layers[1],canvasWidth,this.height);
    }
    moveBackground()
    {
        for (let i = 0; i < this.layers.length; i++)
        {
            let layer = this.layers[i];
            if(layer > this.height - this.speed) this.layers[i] = this.top - this.height + this.speed;
            else this.layers[i] += this.speed;
        }
    }
}
class Enemy extends AnimatedGameSprite
{
    constructor(args)
    {
        super(1,args);

        this.direction = Math.sign(Math.random()-0.5) || 1;

        this.top = Math.random()*canvasHeight/3;
        this.left = this.direction===1 ? -args.width : canvasWidth + args.width;

        this.speed = args.speed;
        this.layer = "enemy";

        this.shootInterval = 1200 + Math.sign(Math.random()-0.5) * Math.random()*200;
        this.shootCycle();
    }
    behaviour()
    {
        this.left += this.direction * this.speed;

        if((this.direction===1 && this.left>canvasWidth)||(this.direction===-1 && this.left + this.width<0))
        {
            this.delete();
        }
    }

    shootCycle()
    {
        this.timers.push(new Timer("interval",this.shootInterval,()=>{this.shoot()}));
    }

    shoot = () =>
    {
        let bullet = new Bullet({top: this.top+this.height,left: this.left+this.width/2-15,...enemyBulletTemplate});
        playSound(enemyShootSound);
    }

    onHit()
    {
        new Explosion({top: this.top-20, left: this.left + this.direction*20, ...explosionTemplate});
        new Timer("timeout",50,()=>{this.delete()});
        playSound(explodeSound);
    }
}
class Bullet extends GameSprite
{
    constructor(args)
    {
        super(args);
        this.velocity = args.velocity;
        this.collisionMask = args.collisionMask;
        this.layer = "bullet";
    }

    behaviour()
    {
        this.top += this.velocity;
        // console.log(this.top);
        let collisions = this.getCollisions();
        if(collisions.length>0)
        {
            for (let i = 0; i < collisions.length; i++)
            {
                const collision = collisions[i];
                collision.onHit && collision.onHit();
                this.delete();

                score++;
                updateScore();
                
            }
        }

        if(this.top > canvasHeight || this.top+this.height < 0)
        {
            // console.log("remove bullet");
            this.delete();
        }
    }

}
class Explosion extends AnimatedGameSprite
{
    constructor(args)
    {
        super(12,args);

        this.animationPlayer.play(explosionAnimation);
        new Timer("timeout",explosionAnimation.duration,()=>{this.delete()});
    }
}
class Timer
{
    constructor(timerType,time,func)
    {
        this.timerType = timerType;
        this.time = time;
        this.func = func;
        this.last = Date.now();
        this.remainder = 0;
        this.paused = false;
        this.id = makeId(5);

        newTimers.push(this);

        return this;
    }

    setTime = (newTime) => {
        this.time = newTime;
    }

    execute = () => {
        // console.log("executing");
        let t = this.remainder===0 ? this.time : this.remainder;
        if(Date.now() >= this.last + t && !this.paused)
        {
            this.func();
            this.last = Date.now();

            if(this.timerType==="timeout")
            {
                this.remove();
                return;
            }
            if(this.remainder!==0)
            {
                this.remainder = 0;
            }
        }
    }

    pause = () => {
        this.paused = true;
        // this.remainder = this.time - (Date.now()-this.last);
        this.remainder = (this.remainder===0 ? this.time : this.remainder) - ((Date.now() - this.last) % this.time)
        // console.log(this.id +": " + this.remainder);
    }

    resume = () => {
        this.last = Date.now();
        this.paused = false;
    }

    remove = () => {
        newTimers = newTimers.filter((timer)=>timer.id!==this.id);
    }
}
function setAllNewTimers(enabled)
{
    if(enabled)
    {
        newTimers.forEach(timer => {
            timer.resume();
        });
    }
    else
    {
        newTimers.forEach(timer => {
            timer.pause();
        });
    }
}

//functions

function playSound(sound,volume=0.5)
{
    let availableAudios = [...(audioContainer.querySelectorAll(`audio[src="${sound}"]`))].filter((audio)=>audio.paused);
    if(availableAudios.length > 0)
    {
        availableAudios[0].play();
        let timerId = availableAudios[0].getAttribute("timer");
        // console.log("removed: " + newTimers.filter((timer)=>timer.id===timerId)[0].id);
        if(timerId) newTimers = newTimers.filter((timer)=>timer.id!==timerId);
    }
    else
    {
        let element = addElement(`<audio autoplay src="${sound}"></audio>`);
        element.volume = volume;
        element.onended = function()
        {
            let audioTimer = new Timer("timeout",5000,()=>{
                if(!element.paused) element.remove();
            });
            element.setAttribute("timer",audioTimer.id);
        };
        audioContainer.appendChild(element);
    }

}
function addElement(html)
{
    let temp = document.createElement('template');
    html = html.trim();
    temp.innerHTML = html;
    return temp.content.firstChild;
}

function setAllTimers(enabled)
{
    if(enabled)
    {
        //console.log("resumed all timers");
        timers.forEach(timer => {
            // if(timer.label) console.log("resumed: " + timer.label);
            if(timer.type==="interval")
            {
                let intervalFunction = function()
                {
                    if(timer.time!==timer.maxTime)
                    {
                        clearInterval(timer.timerId);
                        timer.time = timer.maxTime;
                        timer.timerId = setInterval(intervalFunction,timer.maxTime);
                        //console.log(timers);
                    }

                    timer.func();
                }
                
                timer.timerId = setInterval(() => {
                    intervalFunction();
                }, timer.time);
            }
            else if(timer.type==="timeout")
            {
                let newTimerId = setTimeout(() => {
                    timer.func();
                }, timer.time);
                timer.timerId = newTimerId;
            }
            timer.last = Date.now();
        });
    }
    else
    {
        //console.log("paused all timers");
        timers.forEach(timer => {
            // console.log("cleared: " + timer.id);
            if(timer.type==="interval")
            {
                // console.log("time taken: " + (Date.now() - timer.last));
                clearInterval(timer.timerId);
            }
            else if(timer.type==="timeout")
            {
                clearTimeout(timer.timerId);
            }
            timer.time = timer.time - ((Date.now() - timer.last)%timer.maxTime);
            //console.log(timers);
            //console.log("time remaining for " + timer.label + ": " + timer.time);
        });
    }
}
function addTimer(timerId,timerType,time,timerFunction,timerLabel="")
{
    let newTimer = {
        timerId: timerId,
        id: timerId,
        type: timerType,
        maxTime: time,
        time: time,
        last: Date.now(),
        label: timerLabel,
        func: timerFunction
    };

    timers.push(newTimer);

    return newTimer;
}
function removeTimer(timerId,timerType)
{
    if(timerType==="interval")
    {
        let timerToRemove = timers.filter((timer)=>timer.id===timerId);
        if(timerToRemove.length > 0) clearInterval(timerToRemove[0].timerId);
    }
    timers = timers.filter((timer)=>timer.id!==timerId);
}
function moveBullets()
{
    let bullets = document.querySelectorAll(`.bullet[moving="true"]`);
    bullets.forEach(bullet => {
        bullet.style.top = parseInt(getComputedStyle(bullet).top.slice(0,-2)) + rate * (parseInt(bullet.getAttribute("vector"))) + "px";
        if(getCollisions(bullet.querySelector(".bullet-collider"),bullet.getAttribute("collision")).length>0)
        {
            let enemyCollider = getCollisions(bullet.querySelector(".bullet-collider"),"enemy")[0];
            colliders = colliders.filter((collider)=>collider!==enemyCollider&&collider.element!==bullet);
            let collidingEnemy = enemies.filter((enemyInList)=>enemyInList.element===enemyCollider.element)[0];
            collidingEnemy.destroy();
            // console.log(collidingEnemy);
            bullet.remove();

            
        }
        let sign = Math.sign(parseInt(bullet.getAttribute("vector")));
        if((sign < 0 && bullet.getBoundingClientRect().bottom < gameWindow.getBoundingClientRect().top)
         ||(sign > 0 && bullet.getBoundingClientRect().top > gameWindow.getBoundingClientRect().bottom))
        {
            colliders = colliders.filter((collider)=>collider.element!==bullet);
            bullet.remove();
        }
    });
}
function resetGame()
{
    gameSprites.filter((gameSprite)=>gameSprite!==player).forEach(gameSprite => {
        gameSprite.delete();
    });
    gameSprites = [];

    player = new Player(playerTemplate);
    
    newTimers.forEach(timer => {
        timer.remove();
    });
    newTimers = [];

    score = 0;
    updateScore();

    spawnRate = initialSpawnRate;

    active = true;
    canTakeDamage = true;
    canShoot = true;
    
    start();
}
function setGameWindow(newWindowIndex)
{
    let windowList = ["gameStart","gamePaused","gameOptions","gameOver","none"];
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
        setAllNewTimers(false);
        playSound(uiSound);
    }
    else if(newWindow==="gamePaused"||newWindow==="gameOptions")
    {
        if(currentWindow!=="gameOver" && currentWindow!=="gameStart" && health > 0)
        {
            if(active)
            {
                console.log(newWindow);
                active = false;
                gameOverlay.setAttribute("window",newWindow);
                document.body.setAttribute("active", "false");
                // setAllTimers(false);
                setAllNewTimers(false);
                playSound(uiSound);
            }
        }
    }
    else if(newWindow==="gameStart")
    {
        active = false;
        gameOverlay.setAttribute("window","gameStart");
        document.body.setAttribute("active", "false");
        // setAllTimers(false);
        setAllNewTimers(false);
        playSound(uiSound);
    }
    else if(newWindow==="none")
    {
        playSound(uiSound);
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
                setAllNewTimers(true);
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

function updateScore()
{
    scoreLabel.innerHTML = score;
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
function start()
{
    started = true;

    player.top = canvasHeight*4/5-50; player.left = canvasWidth/2-50;

    initHealth();

    gameOverlay.addEventListener("transitionend", function(){if(gameOverlay.getAttribute("window")==="none")document.activeElement.blur();});

    let startDelay = 2000;
    if(document.body.getAttribute("started")==="false")
    {
        document.body.setAttribute("started","true");
        startDelay = 5000;
    }

    let delayTimerFunction = function()
    {
        let spawnTimer = new Timer("interval",60/spawnRate*1000,()=>{
            let enemy = new Enemy(enemyTemplate);
        });
    
        let updateSpawnRateTimer = new Timer("interval",10*1000,()=>{
            if(spawnRate*1.1<maxSpawnRate)
            {
                spawnRate*= 1.1;
                spawnTimer.setTime(60/spawnRate*1000);
                console.log("updated spawn rate");
            }
        });
    }

    new Timer("timeout",startDelay,delayTimerFunction);


}
function setFPS(fps)
{
    let fpsButtons = document.querySelectorAll(".game-options-fps-button");

    frameRate = fps;
    playerRate = speed*100/frameRate;
    rate = 100/frameRate;

    // player.style.left = playerX * playerRate + "px";
    console.log(playerX);
    playerX = getComputedStyle(player).left.slice(0,-2) / playerRate;

    // gameBackground.style.animationTimingFunction = "steps(" + (1000 * frameRate / 100) + ")";

    console.log(fpsButtons);
    fpsButtons.forEach(b => {
        b.setAttribute("selected",fps===parseInt(b.value) ? "true" : "false");
    });

    console.log("updated frame rate");

    clearInterval(gameLoop);
    gameLoop = setInterval(gameLoopFunction,1000/frameRate);
}
setPlatformControls();
// game loop();


player = new Player(playerTemplate);
gameBackground = new BackgroundImage(0,0,800,2000,10,"./assets/img/bg.png");



function loop()
{
    if(!started)
    {
        gameBackground.drawBackground();
    }
    if(active)
    {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        gameBackground.drawBackground();
        gameBackground.moveBackground();
        
        gameSprites.forEach(gameSprite => {
            gameSprite.update();
        });
    
        newTimers.forEach(timer => {
            timer.execute();
        });
    
        for (const key in controls) {
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

    requestAnimationFrame(loop);
}
loop();
  