
let gameWindow = window.gamewindow;
let gameBackground = window.gamebackground;
let gameOverlay = window.gameoverlay;

let rightButton = window.rightbutton;
let leftButton = window.leftbutton;
let shootButton = window.shootbutton;

let gameStart = window.gamestart;
let gamePaused = window.gamepaused;
let gameOver = window.gameover;
let audioContainer = window.audiocontainer
let scoreLabel = window.scorelabel;
let healthBar = window.healthbar;

let player = window.player;
let playerCollider = player.querySelector(".player-collider");

let playerX = getComputedStyle(player).left.slice(0,-2);
let playerY = getComputedStyle(player).top.slice(0,-2);
let playerW = getComputedStyle(player).width.slice(0,-2);
let playerH = getComputedStyle(player).height.slice(0,-2);
let controls = {
    //87: {pressed: false, func: function(){move("y",-1)}}, //w
    // 37: {pressed: false, func: function(){move("x",-1); player.setAttribute("steer","left");}}, //a
    65: {pressed: false, func: function(){move(-1); player.setAttribute("steer","left");}}, //a
    //83: {pressed: false, func: function(){move("y",1);}}, //s
    // 39: {pressed: false, func: function(){move("x",1); player.setAttribute("steer","right");}}, //d
    68: {pressed: false, func: function(){move(1); player.setAttribute("steer","right");}} //d

};

let active = false;
let canShoot = true;
let canTakeDamage = true;

let fullHealth = 3;
let health = fullHealth;
let score = 0;

let frameRate = 24;
let speed = 5;
let playerRate = speed*1000/frameRate/10;
let rate = 1000/frameRate/10;

let initialSpawnRate = 30; //per minute
let maxSpawnRate = 200;
let spawnRate = initialSpawnRate;

let colliders = [];
let enemies = [];
let timers = [];

let shootSound = "./assets/audio/shoot-sound.mp3";//new Audio("./assets/audio/shoot-sound.mp3");
let enemyShootSound = "./assets/audio/shoot-sound.mp3";//new Audio("./assets/audio/enemy-shoot-sound.wav");
let damageSound = "./assets/audio/hit.wav";
let explodeSound = "./assets/audio/explode.wav";
let uiSound = "./assets/audio/ui.wav";

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

class Enemy
{
    constructor(element,id,dir)
    {
        this.element = element;
        this.id = id;

        this.element.setAttribute("dir",dir);
        this.element.setAttribute("id",id);
        gameWindow.appendChild(this.element);

        this.shootInterval = 1200 + Math.sign(Math.random()-0.5) * Math.random()*200;

        this.startCycle();
        
    }

    enemyCycleFunction = () =>
    {
        // console.log(this);
        
        if(document.body.contains(this.element))
        {
            this.shoot();
        }
        else
        {
            // /console.log("outside function: " + this.enemyCycle);
            removeTimer(this.enemyCycle,"interval");
        }
    }

    startCycle()
    {
        //console.log("started cycle");
        this.enemyCycle = setInterval(() => {
            this.enemyCycleFunction();
        }, this.shootInterval);
        addTimer(this.enemyCycle,"interval",this.shootInterval,this.enemyCycleFunction,"shootCycle");

    }

    shoot = () =>
    {
        if(health>0 && this.element.getBoundingClientRect().left < gameWindow.getBoundingClientRect().right && this.element.getBoundingClientRect().right > gameWindow.getBoundingClientRect().left)
        {
            let bulletHTML = `<div class="enemy-bullet bullet flex-center" moving="true"><div class="bullet-background"></div><div class="bullet-collider collider"></div></div>`;
            let bullet = new Bullet(addElement(bulletHTML),"enemy-bullet",5,"");
    
            bullet.setPosition(this.element.getBoundingClientRect().top + "px", parseInt(getComputedStyle(this.element).left.slice(0,-2)) + parseInt(getComputedStyle(this.element).width.slice(0,-2))/2 - parseInt(getComputedStyle(bullet.element).width.slice(0,-2))/2 + "px");

            let windowMid = gameWindow.getBoundingClientRect().left+gameWindow.getBoundingClientRect().width;
            let enemyMid = this.element.getBoundingClientRect().left+this.element.getBoundingClientRect().width;
            let midPointRatio = 1-Math.abs(windowMid-enemyMid)/windowMid;
            playSound(enemyShootSound,(0.5 * midPointRatio));
            // console.log("shoot");
        }
    }

    destroy()
    {
        this.element.setAttribute("destroyed","true");
        playSound(explodeSound);
        removeTimer(this.enemyCycle,"interval");

        let timerId;
        let timerFunction = () => {

            this.element.remove();
            enemies = enemies.filter((enemyInList)=>enemyInList!==this);
            console.log("destroyed");
            removeTimer(timerId,"timeout");
        }
        timerId = setTimeout(() => {
            timerFunction();
        }, 1000);

        addTimer(timerId,"timeout",1000,timerFunction);
        
    }
}
class Bullet
{
    constructor(element,className,vector,colliisionClass)
    {
        this.element = element;
        this.vector = vector;

        gameWindow.appendChild(element);
        element.setAttribute("vector",vector);
        element.setAttribute("collision",colliisionClass);
        colliders.push({element: element, type: className});
    }

    setPosition(top,left)
    {
        this.element.style.top = top;
        this.element.style.left = left;
    }
}

document.body.onkeydown = function(e)
{
    if(controls[e.which]) controls[e.which].pressed = true;
    //console.log(e.which);

    if(active)
    {
        if(e.which===32) shoot();
        if(e.which===27) setGamePausedWindow(true);
        if(e.which===69) playSound("./assets/audio/shoot-sound.mp3");
    }
    else
    {
        if(e.which===27) setGamePausedWindow(false);
    }
}
document.body.onkeyup = function(e)
{
    if(controls[e.which]) controls[e.which].pressed = false;

    if(e.which===65 || e.which===68) player.setAttribute("steer","none");
}
rightButton.onpointerdown = () => {controls[68].pressed=true; player.setAttribute("steer","right");}; rightButton.onpointerup = rightButton.onpointerleave = () => {controls[68].pressed=false; player.setAttribute("steer","none");};
leftButton.onpointerdown = () => {controls[65].pressed=true; player.setAttribute("steer","left");}; leftButton.onpointerup = leftButton.onpointerleave = () => {controls[65].pressed=false; player.setAttribute("steer","none");};
shootButton.onpointerdown = () => {shoot()};

//functions
function move(direction)
{
 
    if(direction===1 && player.getBoundingClientRect().right <= gameWindow.getBoundingClientRect().right)
        player.style.left = ++playerX * playerRate + "px";
    
    else if(direction===-1 && player.getBoundingClientRect().left > gameWindow.getBoundingClientRect().left)
        player.style.left = --playerX * playerRate + "px";
    
}
function shoot()
{
    if(canShoot && health > 0)
    {

        let bulletHTML = `<div class="bullet flex-center" moving="false" vector=""><div class="bullet-background"></div><div class="bullet-collider collider"></div></div>`;
        let bullet = new Bullet(addElement(bulletHTML),"bullet",-10,"enemy");

        bullet.setPosition(parseInt(getComputedStyle(player).top.slice(0,-2)) + "px",parseInt(getComputedStyle(player).left.slice(0,-2)) + parseInt(getComputedStyle(player).width.slice(0,-2))/2 - parseInt(getComputedStyle(bullet.element).width.slice(0,-2))/2 + "px");
    
        setTimeout(() => {
            bullet.element.setAttribute("moving","true");
        }, 100);

        canShoot = false;
        let timerFunction = () => {

            canShoot = true;
            //console.log("can shoot now");
            removeTimer(timerId,"timeout");
        }
        let timerId = setTimeout(() => {
            timerFunction();
        }, 500);
        addTimer(timerId,"timeout",500,timerFunction);
        playSound(shootSound);
    }
}
function takeDamage()
{
    canTakeDamage = false;
    health--;
    updateHealth();
    
    if(health<=0)
    {
        player.setAttribute("destroyed","true");
        playSound(explodeSound);
        setTimeout(() => {
            setGameOverWindow(true);
        }, 3000);
        return;
    }
    else
    {
        playSound(damageSound);
        player.setAttribute("damaged","true");

    }

    let timerId;
    let timerFunction = function()
    {
        player.setAttribute("damaged","false");
        canTakeDamage = true;
        removeTimer(timerId,"timeout");
    }
    timerId = setTimeout(() => {
        timerFunction();
    }, 5000);

    addTimer(timerId,"timeout",5000,timerFunction);
}
function getCollisions(subject,colliisionClass)
{
    let trueColliders = [];
    let pr = subject.getBoundingClientRect();
    let targetColliders = colliders.filter((collider)=>collider.type===colliisionClass);
    for (let i = 0; i < targetColliders.length; i++) {
        const collider = targetColliders[i];
        
        let cr = collider.element.querySelector(".collider").getBoundingClientRect();
        
        if(((pr.bottom > cr.top && pr.bottom < cr.bottom) || (pr.top < cr.bottom && pr.top > cr.top) || (pr.top < cr.top && pr.bottom > cr.bottom) || (pr.top > cr.top && pr.bottom < cr.bottom)) && ((pr.right > cr.left && pr.right < cr.right) || (pr.left < cr.right && pr.left > cr.left) || (pr.left < cr.left && pr.right > cr.right) || (pr.left > cr.left && pr.right < cr.right)))
        {
            trueColliders.push(collider)
        }
    };
    return trueColliders;
}
function addElement(html)
{
    let temp = document.createElement('template');
    html = html.trim();
    temp.innerHTML = html;
    return temp.content.firstChild;
}
function playSound(sound,volume=0.5)
{
    let element = addElement(`<audio autoplay src="${sound}"></audio>`);
    element.volume = volume;
    element.onended = function(){element.remove()};
    audioContainer.appendChild(element);
}
function spawnEnemy()
{
    let enemyHTML = `<div class="enemy flex-center">
                        <div class="enemy-background"></div>
                        <div class="enemy-explode"></div>
                        <div class="enemy-collider collider"></div>
                    </div>`;
    let direction = Math.random() > 0.5;
    let enemy = new Enemy(addElement(enemyHTML),makeId(5),direction);
      

    colliders.push({element: enemy.element, type: "enemy"});
    enemies.push(enemy);

    enemy.element.style.top = gameWindow.getBoundingClientRect().top + gameWindow.getBoundingClientRect().height/10 + Math.floor(Math.random()*3)*(gameWindow.getBoundingClientRect().height/10) - enemy.element.getBoundingClientRect().width + "px";
    enemy.element.style.left = (direction ? (gameWindow.getBoundingClientRect().width + enemy.element.getBoundingClientRect().width) : (-enemy.element.getBoundingClientRect().width)) + "px";
    //console.log(gameWindow.getBoundingClientRect().right);

    console.log("spawned");
    
}
function moveEnemies()
{
    let enemyElements = document.querySelectorAll(".enemy");
    enemyElements.forEach(enemy => {
        enemy.style.left = parseInt(getComputedStyle(enemy).left.slice(0,-2)) + rate * (enemy.getAttribute("dir")==="true" ? -1 : 1) * 2 + "px";
        if((enemy.getAttribute("dir")==="true" && enemy.getBoundingClientRect().right < gameWindow.getBoundingClientRect().left)
          || (enemy.getAttribute("dir")==="false" && enemy.getBoundingClientRect().left > gameWindow.getBoundingClientRect().right))
        {
            colliders = colliders.filter((collider)=>collider.element!==enemy);
            enemies = enemies.filter((enemyInList)=>enemyInList.element!==enemy);
            enemy.remove();
        }
    });
}
// function setEnemiesActive(enabled)
// {
//     enemies.forEach(enemy => {
//         enabled ? enemy.startCycle() : enemy.pauseCycle();
//     });
//     console.log(enemies);
// }
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
    colliders.forEach(collider => {
        collider.element.remove();
    });
    colliders = [];

    enemies.forEach(enemy => {
        enemy.element.remove();
    });
    enemies = [];

    timers.forEach(timer => {
        removeTimer(timer.timerId);
    });
    timers = [];

    score = 0;
    updateScore();

    spawnRate = initialSpawnRate;

    gameBackground.style.animationDuration = "10s";


    active = true;
    canTakeDamage = true;
    canShoot = true;
    player.setAttribute("damaged","false");
    player.setAttribute("destroyed","false");
    
    start();
}
function setGameStartWindow(enabled)
{
    if(enabled)
    {
        active = false;
        gameOverlay.setAttribute("window","gameStart");
        document.body.setAttribute("active", "false");
        setAllTimers(!enabled);
    }
    else
    {
        active = true;
        gameOverlay.setAttribute("window","none");
        document.body.setAttribute("active","true");
        playSound(uiSound);
        start();
    }   
}
function setGameOverWindow(enabled)
{
    let lastHighscore = localStorage.getItem("spaceGameHighscore");
    let gameOverScoreLabel = gameWindow.querySelector(".game-over-score-label");
    let gameOverHighscoreLabel = gameWindow.querySelector(".game-over-highscore-label");

    if(enabled)
    {
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
        setAllTimers(false);
    }
    else
    {
        gameOverlay.setAttribute("window","none");
        document.body.setAttribute("active","true");
        resetGame();
    }
    playSound(uiSound);
    // console.log("played sound");
    
}
function setGamePausedWindow(enabled)
{
    if(gameOverlay.getAttribute("window")!=="gameOver" && gameOverlay.getAttribute("window")!=="gameStart" && health > 0)
    {
        if(enabled&&active)
        {
            //console.log("paused");
            active = false;
            gameOverlay.setAttribute("window","gamePaused");
            document.body.setAttribute("active", "false");
            setAllTimers(!enabled);
            playSound(uiSound);
        }
        else if(!enabled&&!active)
        {
            active = true;
            gameOverlay.setAttribute("window","none");
            document.body.setAttribute("active","true");
            setAllTimers(!enabled);
            playSound(uiSound);
        }
        
        // console.log("played sound");
        
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
    playerX = gameWindow.getBoundingClientRect().width/playerRate/2.4 - player.getBoundingClientRect().width/playerRate/2.4;
    playerY = gameWindow.getBoundingClientRect().height*(2/3)/playerRate;

    initHealth();

    player.style.left = playerX * playerRate + "px";
    player.style.top = playerY * playerRate + "px";

    gameOverlay.addEventListener("transitionend", function(){if(gameOverlay.getAttribute("window")==="none")document.activeElement.blur();}); 

    let startDelay = 2000;
    if(document.body.getAttribute("started")==="false")
    {
        document.body.setAttribute("started","true");
        startDelay = 5000;
    }

    let delayTimer;
    let delayTimerFunction = () => {

        let timerObject;
        let spawnTimerFunction = () => {
            spawnEnemy();
            if(timerObject && 60.0/spawnRate*1000!==timerObject.maxTime)
            {
                clearInterval(timerObject.timerId);
                timerObject.maxTime = 60.0/spawnRate*1000;
                timerObject.timerId = setInterval(() => {
                    timerObject.func();
                },timerObject.maxTime);
            }
        }
        let spawnTimer = setInterval(function()
        {
            spawnTimerFunction();
        }, 60.0/spawnRate*1000);
    
        timerObject = addTimer(spawnTimer,"interval",60.0/spawnRate*1000,spawnTimerFunction);

        let updateRateFunction = () => {
            if(spawnRate*1.1<maxSpawnRate)
            {
                spawnRate*= 1.1;
            }
            if(parseFloat(getComputedStyle(gameBackground).animationDuration.slice(0,-1)*0.9>5))
            {
                gameBackground.style.animationDuration = parseFloat(getComputedStyle(gameBackground).animationDuration.slice(0,-1))*0.9 + "s";
            }
        }
        let updateRate = setInterval(() => {
            updateRateFunction();
        }, 10*1000);
    
        addTimer(updateRate,"interval",10*1000,updateRateFunction);
        removeTimer(delayTimer,"timeout");   
        console.log("started"); 
    }

    delayTimer = setTimeout(() => {
        delayTimerFunction();
    }, startDelay);

    addTimer(delayTimer,"timeout",startDelay,delayTimerFunction);
    console.log("starting in 5 seconds");


};


setPlatformControls();
// game loop();
setInterval(function(){

    if(active)
    {
        if(health > 0)
        {
            for (const key in controls) {
                if (Object.hasOwnProperty.call(controls, key)) {
                    const element = controls[key];
        
                    element.pressed && element.func();
                }
            }
        }
    
        if(getCollisions(playerCollider,"enemy").length>0||getCollisions(playerCollider,"enemy-bullet").length>0)
        {
            if(canTakeDamage)
            {
                takeDamage();
            }
        }
    
        moveEnemies();
        moveBullets();
    }

},1000/frameRate);
