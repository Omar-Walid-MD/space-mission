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
let gameObjects = [];

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
        onUp: function(){player.setProperty("scale",{x:1,y:1});player.animationPlayer.play(steeringAnimation,true);}
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
        // controls[e.which].fired = true;
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

rightButton.onpointerdown = () => {controls[68].pressed=true;}; rightButton.onpointerup = rightButton.onpointerleave = () => {controls[68].pressed=false;};
leftButton.onpointerdown = () => {controls[65].pressed=true;}; leftButton.onpointerup = leftButton.onpointerleave = () => {controls[65].pressed=false;};
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
    duration: 500
}
// GAME CLASSES

class GameObject
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

        gameObjects.push(this);
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
        this.drawImage(this.left, this.top, this.width, this.height);
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
        let collisions = gameObjects.filter((gameObject)=>gameObject!==this && this.collisionMask.includes(gameObject.layer)).filter((gameObject)=>this.isColliding(this,gameObject));
        return collisions;
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
        gameObjects = gameObjects.filter((gameObject)=>gameObject.id!==this.id);
    }

}

class AnimationPlayer
{
    constructor(setProperty)
    {
        this.setProperty = setProperty;
        this.currentAnimation;
        this.animationTimer;
        this.currentKeyframe = 0;
        this.lastKeyframe = 0;
        this.direction = 1;
    }

    play(animation,reversed=false)
    {
        if(this.currentAnimation) this.animationTimer.remove();

        this.currentAnimation = animation;

        this.direction = 1;
        if(reversed)
        {
            this.lastKeyframe = this.currentKeyframe = animation.keyframes.length-1;
            this.direction = -1;
        }

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

        if((this.direction===1 && this.currentKeyframe + 1 !== this.currentAnimation.keyframes.length) || (this.direction===-1 && this.currentKeyframe - 1 !== -1))
        {
            this.lastKeyframe = this.currentKeyframe += this.direction;
            let t = (this.getKeyframe(this.currentKeyframe).time - this.getKeyframe(this.lastKeyframe).time)/100*this.currentAnimation.duration;
            console.log(t);
            this.animationTimer = new Timer("timeout",t,this.playKeyframe);    
        }
        else
        {
            this.currentKeyframe = 0;
            this.lastKeyframe = 0;
        }
    }

    getKeyframe(keyframe)
    {
        return this.currentAnimation.keyframes[keyframe];
    }
}
class AnimatedSprite extends GameObject
{
    constructor(frameCount,args)
    {
        super(args);
        this.frameCount = frameCount;
        this.frame = 1;

        this.scale = {
            x: 1,
            y: 1
        }
    }

    drawImage(left,top)
    {
        if(this.image)
        {
            let img = new Image(); img.src = this.image;
            let frameOffset = Math.abs(this.width) * (this.frame - 1);

            ctx.scale(this.scale.x,this.scale.y);

            let newLeft = this.scale.x * left - this.width * Math.abs(1-this.scale.x)/2;

            ctx.drawImage(img,frameOffset,0,Math.abs(this.width),this.height,newLeft,top,this.width,this.height);
            
            if(this.scale!=={x:1,y:1}) ctx.scale(1/this.scale.x,1/this.scale.y);
        }
    }

    setProperty = (property,value) =>
    {
        if(this[property])
        {
            this[property] = value;
        }
    }

}
class Player extends AnimatedSprite
{
    constructor(args)
    {
        super(5,args);
        this.speed = speed;
        this.layer = "player";
        this.animationPlayer = new AnimationPlayer(this.setProperty);

        console.log(this.speed);
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

            new Timer("timeout",500,()=>{canShoot = true});
        }
    }

    onHit()
    {
        if(canTakeDamage)
        {
            canTakeDamage = false;
            health--;
            updateHealth();
            
            if(health<=0)
            {
                player.image = "";
                // playSound(explodeSound);
                setTimeout(() => {
                    setGameWindow(3);
                }, 3000);
                return;
            }
            else
            {
                // playSound(damageSound);
                // player.image = "./assets/img/spaceship-damaged.png";
    
            }
    
            new Timer("timeout",5000,()=>{
                canTakeDamage = true;
                // player.image = "./assets/img/spaceship.png";
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
// class Enemy(0,0,100,100,)/ {
//     constructor(element,id,dir)
//     {
//         this.element = element;
//         this.id = id;

//         this.element.setAttribute("dir",dir);
//         this.element.setAttribute("id",id);
//         gameWindow.appendChild(this.element);

//         this.shootInterval = 1200 + Math.sign(Math.random()-0.5) * Math.random()*200;

//         this.startCycle();
        
//     }

//     enemyCycleFunction = () =>
//     {
//         // console.log(this);
        
//         if(document.body.contains(this.element))
//         {
//             this.shoot();
//         }
//         else
//         {
//             // /console.log("outside function: " + this.enemyCycle);
//             // removeTimer(this.enemyCycle,"interval");
//             this.timer.remove();
//         }
//     }

//     startCycle()
//     {
//         this.timer = new Timer("interval",this.shootInterval,this.enemyCycleFunction);
//         //console.log("started cycle");
//         // this.enemyCycle = setInterval(() => {
//         //     this.enemyCycleFunction();
//         // }, this.shootInterval);
//         // addTimer(this.enemyCycle,"interval",this.shootInterval,this.enemyCycleFunction,"shootCycle");

//     }

//     shoot = () =>
//     {
//         if(health>0 && this.element.getBoundingClientRect().left < gameWindow.getBoundingClientRect().right && this.element.getBoundingClientRect().right > gameWindow.getBoundingClientRect().left)
//         {
//             let bulletHTML = `<div class="enemy-bullet bullet flex-center" moving="true"><div class="bullet-background"></div><div class="bullet-collider collider"></div></div>`;
//             let bullet = new Bullet(addElement(bulletHTML),"enemy-bullet",5,"");
    
//             bullet.setPosition(this.element.getBoundingClientRect().top + "px", parseInt(getComputedStyle(this.element).left.slice(0,-2)) + parseInt(getComputedStyle(this.element).width.slice(0,-2))/2 - parseInt(getComputedStyle(bullet.element).width.slice(0,-2))/2 + "px");

//             let windowMid = gameWindow.getBoundingClientRect().left+gameWindow.getBoundingClientRect().width;
//             let enemyMid = this.element.getBoundingClientRect().left+this.element.getBoundingClientRect().width;
//             let midPointRatio = 1-Math.abs(windowMid-enemyMid)/windowMid;
            // playSound(enemyShootSound,(0.5 * midPointRatio));
//             // console.log("shoot");
//         }
//     }

//     destroy()
//     {
//         this.element.setAttribute("destroyed","true");
        // playSound(explodeSound);

//         this.timer.remove();

//         new Timer("timeout",1000,() => {
//             this.element.remove();
//             enemies = enemies.filter((enemyInList)=>enemyInList!==this);
//             // console.log("destroyed");
//         });

//         // removeTimer(this.enemyCycle,"interval");

//         // let timerId;
//         // let timerFunction = () => {

//         //     this.element.remove();
//         //     enemies = enemies.filter((enemyInList)=>enemyInList!==this);
//         //     console.log("destroyed");
//         //     removeTimer(timerId,"timeout");
//         // }
//         // timerId = setTimeout(() => {
//         //     timerFunction();
//         // }, 1000);

//         // addTimer(timerId,"timeout",1000,timerFunction);
        
//     }
// }
class Enemy extends AnimatedSprite
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
        // console.log("enemy shoot");
        let bullet = new Bullet({top: this.top+this.height,left: this.left+this.width/2-15,...enemyBulletTemplate});
        // playSound(enemyShootSound);
    }

    onHit()
    {
        this.delete();
    }
}
class Bullet extends GameObject
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
                
            }
        }

        if(this.top > canvasHeight || this.top+this.height < 0)
        {
            // console.log("remove bullet");
            this.delete();
        }
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
function move(direction)
{
 
    if(direction===1 && player.getBoundingClientRect().right <= gameWindow.getBoundingClientRect().right)
        player.style.left = ++playerX * playerRate + "px";
    
    else if(direction===-1 && player.getBoundingClientRect().left > gameWindow.getBoundingClientRect().left)
        player.style.left = --playerX * playerRate + "px";
    
}
function takeDamage()
{
    canTakeDamage = false;
    health--;
    updateHealth();
    
    if(health<=0)
    {
        player.setAttribute("destroyed","true");
        // playSound(explodeSound);
        setTimeout(() => {
            setGameWindow(3);
        }, 3000);
        return;
    }
    else
    {
        // playSound(damageSound);
        player.setAttribute("damaged","true");

    }

    // let timerId;
    // let timerFunction = function()
    // {
        
    //     removeTimer(timerId,"timeout");
    // }
    // timerId = setTimeout(() => {
    //     timerFunction();
    // }, 5000);

    // addTimer(timerId,"timeout",5000,timerFunction);

    new Timer("timeout",5000,()=>{
        player.setAttribute("damaged","false");
        canTakeDamage = true;
    })
}


function playSound(sound,volume=0.5)
{
    let element = addElement(`<audio autoplay src="${sound}"></audio>`);
    element.volume = volume;
    element.onended = function(){element.remove()};
    audioContainer.appendChild(element);
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

            score++;
            updateScore();
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
    gameObjects.filter((gameObject)=>gameObject!==player).forEach(gameObject => {
        gameObject.delete();
    });
    gameObjects = [player];

    // timers.forEach(timer => {
    //     removeTimer(timer.timerId);
    // });
    // timers = [];
    newTimers.forEach(timer => {
        timer.remove();
    });
    newTimers = [];

    score = 0;
    updateScore();

    spawnRate = initialSpawnRate;

    // gameBackground.style.animationDuration = "10s";


    active = true;
    canTakeDamage = true;
    canShoot = true;
    // player.setAttribute("damaged","false");
    // player.setAttribute("destroyed","false");
    
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
        // playSound(uiSound);
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
                // playSound(uiSound);
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
        // playSound(uiSound);
    }
    else if(newWindow==="none")
    {
        // playSound(uiSound);
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

// function start()
// {
    // initHealth();

    // player.style.left = playerX * playerRate + "px";
    // player.style.top = playerY * playerRate + "px";

    // gameOverlay.addEventListener("transitionend", function(){if(gameOverlay.getAttribute("window")==="none")document.activeElement.blur();}); 

    // let startDelay = 2000;
    // if(document.body.getAttribute("started")==="false")
    // {
    //     document.body.setAttribute("started","true");
    //     startDelay = 5000;
    // }

    // let delayTimer;
    // let delayTimerFunction = () => {

        // let timerObject;
        // let spawnTimerFunction = () => {
        //     spawnEnemy();
        //     if(timerObject && 60.0/spawnRate*1000!==timerObject.maxTime)
        //     {
        //         clearInterval(timerObject.timerId);
        //         timerObject.maxTime = 60.0/spawnRate*1000;
        //         timerObject.timerId = setInterval(() => {
        //             timerObject.func();
        //         },timerObject.maxTime);
        //     }
        // }
        // let spawnTimer = setInterval(function()
        // {
        //     spawnTimerFunction();
        // }, 60.0/spawnRate*1000);
    
        // timerObject = addTimer(spawnTimer,"interval",60.0/spawnRate*1000,spawnTimerFunction);
        // let spawnTimer;
        // spawnTimer = new Timer("interval",60.0/spawnRate*1000,()=>{
        //     spawnEnemy();
        //     spawnTimer.setTime(60.0/spawnRate*1000);
        //     console.log(spawnTimer.time);
            // if(rateChangeTimer && 60.0/spawnRate*1000!==rateChangeTimer.time)
            // {
            //     clearInterval(timerObject.timerId);
            //     timerObject.maxTime = 60.0/spawnRate*1000;
            //     timerObject.timerId = setInterval(() => {
            //         timerObject.func();
            //     },timerObject.maxTime);
            // }
        // });

        // let updateRateFunction = () => {
            
        // }
        // let updateRate = setInterval(() => {
        //     updateRateFunction();
        // }, 10*1000);
    
        // addTimer(updateRate,"interval",10*1000,updateRateFunction);
        // removeTimer(delayTimer,"timeout");   
        // console.log("started");

    //     new Timer("interval",10*1000,()=>{
    //         if(spawnRate*1.1<maxSpawnRate)
    //         {
    //             spawnRate*= 1.1;
    //             console.log("spawnrate: "+spawnRate);
    //         }
    //         if(parseFloat(getComputedStyle(gameBackground).animationDuration.slice(0,-1)*0.9>5))
    //         {
    //             gameBackground.style.animationDuration = parseFloat(getComputedStyle(gameBackground).animationDuration.slice(0,-1))*0.9 + "s";
    //         }
    //     });
    // }

    // delayTimer = setTimeout(() => {
    //     delayTimerFunction();
    // }, startDelay);

    // addTimer(delayTimer,"timeout",startDelay,delayTimerFunction);
    // console.log("starting in 5 seconds");

    // new Timer("timeout",startDelay,delayTimerFunction);


// };
function start()
{
    player.top = canvasHeight*4/5-50; player.left = canvasWidth/2-50;

    initHealth();

    function spawnEnemy()
    {
        let enemy = new Enemy(enemyTemplate);
    }
    let spawnTimer = new Timer("interval",1000,spawnEnemy);

    started = true;

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
        
        gameObjects.forEach(gameObject => {
            gameObject.update();
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
  