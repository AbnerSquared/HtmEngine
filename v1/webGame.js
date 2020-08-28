/*
    HtmEngine v1.0 
    Abner Martinez [2018]
*/

// Configuration //

// Pixel Grid Sizing //
var PPUScale = 2.0; // Use to scale the size of the units.
var pixelsPerUnit = 16; // Used to reference the size of a tile. (Use art size)
var tile = PPUScale * pixelsPerUnit;

// Window Size //
var wWidth = 320; // Sets the window width.
var wHeight = wWidth * 0.75; // Sets the window height.
var fps = 60; // Sets the refresh rate of the game.

// Game Core Config //
var spriteImage = "ginIdle.png"; // Used to change what image the sprite uses.
var showHitbox = true; // Used to determine if the game should show hitboxes.
var speedMultiplier = 0.5; // A multiplier for the base speed.
var jumpPower = 10.0; // The power of a jump.
var movementAmount = speedMultiplier * PPUScale; // The velocity of a sprite.

// Game Engine Requirements //

var pressedSpace = false;
var launchedGame = false;

var startButton = document.getElementById("startButton");
var gameWindow = document.getElementById("gameWindow");

function HideStartButton()
{
    with (startButton.style) {
        transitionDuration = "0.5s";
        fontSize = "0";
        opacity = "0";
        padding = "0";
        margin = "0";
        border = "0";  
    }
    setTimeout(function() {
        startButton.style.display = "none";
    }, 750);
}

function LoadGameWindow()
{
    with (gameWindow.style)
        {
            display = "block";
            border = "8px solid rgba(124, 191, 149, 1)";
            margin = "8px 8px";
            padding = "8px 8px";
            width = wWidth;
            overflow = "hidden";
            marginLeft = "auto";
            marginRight = "auto";
            textAlign = "center";
        }
}

function StartGame()
{
    var screenCollider = new StaticCollider(wWidth, wHeight, 0, 0); // This sets the window collision.
    var box = new StaticCollider(48, 48, 96, wHeight - 96);

    // Graphical Display [Gin]
    var gin = new Sprite(tile, tile, 0, 0, spriteImage, "Player");
    var staticColliders = [box];
    var staticHitboxes = [box, screenCollider]; // This holds the list of static hitboxes that the sprite will interact with.

    var ginCollider = new DynamicCollider(gin, screenCollider, staticColliders);

    // Used to create and declare sprites for the game window.
    if (!launchedGame) {
        launchedGame = true;
        HideStartButton();
        scene.set(gin, ginCollider, staticHitboxes);
    }
}

// Used for displaying the window on a set.
var scene =
{
    win: document.createElement('canvas'),
    div: document.getElementById('gameWindow'),
    set: function(sprite, spriteCollider, staticHitboxes)
    {
        LoadGameWindow();

        with (this.win.style)
        {
            marginLeft = "auto";
            marginRight = "auto";
            transition = "0.5s";
        }

        this.win.width = wWidth;
        this.win.height = wHeight;

        this.ctx = this.win.getContext("2d");
        this.div.insertBefore(this.win, this.div.childNodes[0]);
        gameWindow.style.maxHeight = wHeight;
        gameWindow.style.transition = "max-height 0.25s ease-in-out";
        this.interval = setInterval(function()
        {
            RefreshWindow(sprite, spriteCollider, staticHitboxes);
        }, 1000/fps);
        window.addEventListener('keydown', function(ref)
        {
            scene.key = ref.keyCode;
        });
        window.addEventListener('keyup', function(ref)
        {
            if (ref.keyCode == 32)
            {
                pressedSpace = false;
            }
            if (ref.keyCode == 37 || ref.keyCode == 39)
            {
                sprite.speedX = 0;
            }
            scene.key = false;
        });
    },
    clear: function()
    {
        this.ctx.clearRect(0, 0, this.win.width, this.win.height);
    }
}

var keyMap = {};

// Used to create game components using images.
function Point(x, y)
{
    this.x = x;
    this.y = y;
}

function Line(point1, point2)
{
    this.point1 = point1;
    this.point2 = point2;
}

function Sprite(width, height, x, y, file, tag)
{
    this.location = scene;
    this.tag = tag;
    this.image = new Image();
    this.image.src = file;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.speedX = 0;
    this.speedY = 0;
    this.gravity = (1 * PPUScale);
    this.airTimer = 0;
    this.displayX = (Math.round(this.x * pixelsPerUnit) / pixelsPerUnit);
    this.displayY = (Math.round(this.y * pixelsPerUnit) / pixelsPerUnit);
    this.grounded = false;
    this.jumping = false;
    this.collidedLeftBound = false;
    this.collidedRightBound = false;
    this.collidedTopBound = false;
    this.Update = function()
    {
        ctx = scene.ctx;
        ctx.drawImage(this.image, this.displayX, this.displayY, this.width, this.height);
    }
    this.SetPosition = function()
    {
        this.x += this.speedX;
        this.gravity = (1 * PPUScale) * this.airTimer;
        
        if (this.jumping && this.grounded)
        {
            this.grounded = false;
        }

        if (this.jumping)
        {
            this.speedY = -1 * 15;
            if(!this.collidedTopBound) {this.y += this.speedY;}
        }
        else
        {
            this.speedY = 0;
        }

        if (this.grounded)
        {
            this.airTimer = 0;
            this.collidedTopBound = false;
        }
        else
        {
            this.airTimer += 0.5;
            this.y += this.gravity;
        }

        this.displayX = Math.round(this.x * tile)/ tile;
        this.displayY = Math.round(this.y * tile)/ tile; 

    }
}

function DynamicCollider(sprite, screen, colliders)
{
    this.sprite = sprite;
    this.screen = screen;
    this.colliders = colliders;
    this.width = this.sprite.width;
    this.height = this.sprite.height;
    this.boundExtensionLimit = this.width / (2 * PPUScale);
    this.x = this.sprite.x + this.boundExtensionLimit;
    this.y = this.sprite.y;
    this.topLeftBound = new Point(this.x, this.y);
    this.bottomLeftBound = new Point(this.x, this.y + this.height);
    this.topRightBound = new Point(this.x + (this.width / 2), this.y);
    this.bottomRightBound = new Point(this.x + (this.width / 2), this.y + this.height);
    this.UpdatePosition = function()
    {
        this.x = this.sprite.x + this.boundExtensionLimit;
        this.y = this.sprite.y;
        this.topLeftBound.x = this.x;
        this.topLeftBound.y = this.y;
        this.bottomLeftBound.x = this.x;
        this.bottomLeftBound.y = this.y + this.height;
        this.topRightBound.x = this.x + (this.width / 2);
        this.topRightBound.y = this.y;
        this.bottomRightBound.x = this.x + (this.width / 2);
        this.bottomRightBound.y = this.y + this.height;
    }
    this.CheckCollisions = function()
    {
        if (this.topLeftBound.x <= this.screen.topLeftBound.x)
        {
            this.sprite.collidedLeftBound = true;
        }

        if (this.topRightBound.x >= this.screen.topRightBound.x)
        {
            this.sprite.collidedRightBound = true;
        }

        if (this.topLeftBound.x > this.screen.topLeftBound.x && this.topRightBound.x < this.screen.topRightBound.x)
        {
            this.sprite.collidedLeftBound = false;
            this.sprite.collidedRightBound = false;
        }

        if (this.bottomLeftBound.y >= this.screen.bottomLeftBound.y)
        {
            this.sprite.y = this.screen.bottomLeftBound.y - this.height;
            this.sprite.grounded = true;
            if (this.sprite.jumping)
            {
                this.sprite.jumping = false;
            }
        }

        if (this.bottomLeftBound.y < this.screen.bottomLeftBound.y)
        {
            this.sprite.grounded = false;
        }

        this.colliders.forEach(collider =>
        {
            this.collider = collider;

            // Player bounds
            this.leftBoundPlayer = new Line(this.topLeftBound, this.bottomLeftBound);
            this.rightBoundPlayer = new Line(this.topRightBound, this.bottomRightBound);
            this.topBoundPlayer = new Line(this.topLeftBound, this.topRightBound);
            this.bottomBoundPlayer = new Line(this.bottomLeftBound, this.bottomRightBound);

            // Collider bounds
            this.leftBoundCollider = new Line(this.collider.topLeftBound, this.collider.bottomLeftBound);
            this.rightBoundCollider = new Line(this.collider.topRightBound, this.collider.bottomRightBound);
            this.topBoundCollider = new Line(this.collider.topLeftBound, this.collider.topRightBound);
            this.bottomBoundCollider = new Line(this.collider.bottomLeftBound, this.collider.bottomRightBound);

            // Left Bound
            //                              ----
            // / This is the left bound. / |    |
            //                             |    |
            //                              ---- 
            for (this.leftPoint = this.leftBoundPlayer.point1.y; this.leftPoint <= this.leftBoundPlayer.point2.y; this.leftPoint++)
            {
                this.leftBoundPlayerX = this.leftBoundPlayer.point1.x;
                this.rightBoundPlayerX = this.rightBoundPlayer.point1.x;
                this.rightBoundColliderX = this.rightBoundCollider.point1.x;
                this.topBoundColliderY = this.topBoundCollider.point1.y;
                this.bottomBoundColliderY = this.bottomBoundCollider.point1.y;
                
                if ((this.leftBoundPlayerX <= this.rightBoundColliderX) &&
                    (this.rightBoundPlayerX > this.rightBoundColliderX))
                {
                    if ((this.topBoundColliderY < this.leftPoint) &&
                       (this.bottomBoundColliderY > this.leftPoint))
                    {
                        this.sprite.collidedLeftBound = true;
                    }
                }
            }

            // Right Bound
            //  ----
            // |    | / This is the right bound. /
            // |    |
            //  ---- 
            for (this.rightPoint = this.rightBoundPlayer.point1.y; this.rightPoint <= this.rightBoundPlayer.point2.y; this.rightPoint++)
            {
                this.leftBoundPlayerX = this.leftBoundPlayer.point1.x;
                this.rightBoundPlayerX = this.rightBoundPlayer.point1.x;
                this.leftBoundColliderX = this.leftBoundCollider.point1.x;
                this.topBoundColliderY = this.topBoundCollider.point1.y;
                this.bottomBoundColliderY = this.bottomBoundCollider.point1.y;

                if ((this.rightBoundPlayerX >= this.leftBoundColliderX) &&
                    (this.leftBoundPlayerX < this.leftBoundColliderX))
                {
                    if ((this.topBoundColliderY < this.rightPoint) &&
                       (this.bottomBoundColliderY > this.rightPoint))
                    {
                        this.sprite.collidedRightBound = true;
                    }
                }
            }

            // Top Bound
            //  ----  / This is the top bound. /
            // |    |
            // |    |
            //  ----  
            for (this.topPoint = this.topBoundPlayer.point1.x; this.topPoint <= this.topBoundPlayer.point2.x; this.topPoint++)
            {
                this.bottomBoundPlayerY = this.bottomBoundPlayer.point1.y;
                this.topBoundPlayerY = this.topBoundPlayer.point1.y;
                this.bottomBoundColliderY = this.bottomBoundCollider.point1.y;
                this.leftBoundColliderX = this.leftBoundCollider.point1.x;
                this.rightBoundColliderX = this.rightBoundCollider.point1.x;

                if ((this.topBoundPlayerY <= this.bottomBoundColliderY) &&
                    (this.bottomBoundPlayerY > this.bottomBoundColliderY))
                {
                    if ((this.leftBoundColliderX < this.topPoint) &&
                       (this.rightBoundColliderX > this.topPoint))
                    {
			            this.sprite.y = this.bottomBoundColliderY;
                        this.sprite.collidedTopBound = true;
                    }
                }

            }

            // Bottom Bound
            //  ----
            // |    |
            // |    |
            //  ---- / This is the bottom bound. /
            for (this.bottomPoint = this.bottomBoundPlayer.point1.x; this.bottomPoint <= this.bottomBoundPlayer.point2.x; this.bottomPoint++)
            {
                this.bottomBoundPlayerY = this.bottomBoundPlayer.point1.y;
                this.topBoundPlayerY = this.topBoundPlayer.point1.y;

                this.topBoundColliderY = this.topBoundCollider.point1.y;
                
                this.leftBoundColliderX = this.leftBoundCollider.point2.x;
                this.rightBoundColliderX = this.rightBoundCollider.point2.x;

                if ((this.bottomBoundPlayerY >= this.topBoundColliderY) &&
                    (this.topBoundPlayerY < this.topBoundColliderY))
                { 
                    if ((!this.sprite.grounded) && (!this.sprite.collidedTopBound) &&
                        (this.leftBoundColliderX < this.bottomPoint) &&
                        (this.rightBoundColliderX > this.bottomPoint))
                    {
                        this.sprite.y = this.topBoundCollider.point1.y - this.height;
                        this.sprite.grounded = true;
                        if (this.sprite.jumping)
                        {
                            this.sprite.jumping = false;
                        }
                    }
                }
            }
        });
    }

    this.DisplayHitbox = function()
    {
        if (showHitbox)
        {
            ctx = scene.ctx;
            ctx.beginPath();
            ctx.lineWidth = "1";
            ctx.strokeStyle = "rgba(124, 191, 149, 1)";
            ctx.rect(this.x, this.y, this.topRightBound.x - this.topLeftBound.x, this.height);
            ctx.stroke();
            ctx.closePath();
        }
    }
}

function StaticCollider(width, height, x, y)
{
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;

    this.topLeftBound = new Point(this.x, this.y);
    this.bottomLeftBound = new Point(this.x, this.y + this.height);
    this.topRightBound = new Point(this.x + this.width, this.y);
    this.bottomRightBound = new Point(this.x + this.width, this.y + this.height);

    this.DisplayHitbox = function()
    {
        if (showHitbox)
        {
            ctx = scene.ctx;
            ctx.beginPath();
            ctx.lineWidth = "1";
            ctx.strokeStyle = "rgba(124, 191, 149, 1)";
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.stroke();
            ctx.closePath();
        }
    }
}

function RefreshHitboxes(hitboxes)
{
    hitboxes.forEach(hitbox =>
    {
        this.hitbox = hitbox;
        this.hitbox.DisplayHitbox();
    });
}

function Spacebar(sprite)
{
    if (!pressedSpace)
    {
        pressedSpace = true;
        sprite.jumping = true;
    }
}

function MoveLeft(sprite)
{
    if (!sprite.collidedLeftBound)
    {
        sprite.speedX = -movementAmount;
    }
}

function MoveRight(sprite)
{
    if (!sprite.collidedRightBound)
    {
        sprite.speedX = movementAmount;
    }
}

function CheckControls(sprite)
{
    jumpButton = document.getElementById("jumpButton");
    leftArrowButton = document.getElementById("leftButton");
    rightArrowButton = document.getElementById("rightButton");

    jumpButton.addEventListener("mousedown", function() {
        Spacebar(sprite);
    });
    jumpButton.addEventListener("mouseup", function() {
        pressedSpace = false;
    });

    leftArrowButton.addEventListener("touchstart", function() {
        MoveLeft(sprite);
    });
    leftArrowButton.addEventListener("mousedown", function() {
        MoveLeft(sprite);
    });
    leftArrowButton.addEventListener("touchend", function() {
        sprite.speedX = 0;
    });
    leftArrowButton.addEventListener("mouseup", function() {
        sprite.speedX = 0;
    });
    leftArrowButton.addEventListener("onmouseleave", function() {
        sprite.speedX = 0;
    });

    rightArrowButton.addEventListener("touchstart", function() {
        MoveRight(sprite);
    });
    rightArrowButton.addEventListener("mousedown", function() {
        MoveRight(sprite);
    });
    rightArrowButton.addEventListener("touchend", function() {
        sprite.speedX = 0;
    });
    rightArrowButton.addEventListener("mouseup", function() {
        sprite.speedX = 0;
    });
    rightArrowButton.addEventListener("onmouseleave", function() {
        sprite.speedX = 0;
    });

    /*Key Events*/
    onkeydown = onkeyup = function(ref)
    {
        ref = ref || event;
        keyMap[ref.keyCode] = ref.type == 'keydown';

        if (keyMap[32])
        {
            Spacebar(sprite);
        }
    }

    // Left Arrow
    if (scene.key && scene.key == 37) {
        MoveLeft(sprite);
    }

    // Right Arrow
    if (scene.key && scene.key == 39) {
        MoveRight(sprite);
    }
}

// Used to refresh and update all current variables.
function RefreshWindow(sprite, spriteCollider, staticHitboxes)
{
    scene.clear();
    sprite.speedY = 0;

    CheckControls(sprite);

    sprite.SetPosition();
    spriteCollider.UpdatePosition();
    spriteCollider.CheckCollisions();
    spriteCollider.DisplayHitbox();
    RefreshHitboxes(staticHitboxes);
    sprite.Update();
}
