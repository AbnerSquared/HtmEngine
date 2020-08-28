// Default constant values if none is specified.
var DEFAULT_PPU = 16;
var DEFAULT_SCALE = 1;
var DEFAULT_UNIT = DEFAULT_PPU * DEFAULT_SCALE;
var DEFAULT_WIDTH = DEFAULT_UNIT * 10;
var DEFAULT_HEIGHT = DEFAULT_UNIT * 8;
var DEFAULT_FPS = 30;

function Sprite(file)
{
    image = new Image();
    image.src = file;

    Log('sprite built.');

    return image;
    
}

class Timer
{
    constructor()
    {
        this.millisecondsElapsed = 0;
        this.secondsElapsed = this.millisecondsElapsed / 1000;
        this.countTime = false;
    }

    Start()
    {
        this.countTime = true;
        this.Count();
    }

    Stop()
    {
        this.countTime = false;
        clearInterval(this.interval);
    }

    Count()
    {
        if (this.countTime == true)
        {
            this.interval = setInterval(this.millisecondsElapsed += 1, 1);
        }
    }

    Reset()
    {
        this.timeElapsed = 0;
    }
}

class Point
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }
}

class Unit
{
    constructor(pixelsPerUnit = DEFAULT_PPU, pixelScale = DEFAULT_SCALE)   
    {
        this.pixelsPerUnit = pixelsPerUnit;
        this.pixelScale = pixelScale;
    }

    Size()
    {
        return this.pixelsPerUnit * this.pixelScale;
    }

    Spacer()
    {
        return (this.pixelsPerUnit / this.pixelScale);
    }

    Pixel()
    {
        return (1 / (this.pixelsPerUnit / this.pixelScale));
    }


}


class ObjectAnimation
{
    constructor(name, ...frames)
    {
        this.name = name;
        this.frames = frames;

        Log('Animation built.');
    }

    Add(frame)
    {
        this.frames.push(frame);
    }

    Count()
    {
        return this.frames.length;
    }

    Frame(position)
    {
        this.min = 0;

        if (position < this.min)
        {
            position = this.min;
        }
        if (position > this.Count() - 1)
        {
            position = this.Count() - 1;
        }

        return this.frames[position];
    }

    Name()
    {
        return this.name;
    }
}

//environment = null, props = null, entities = null, player = null
class Window
{
    constructor(fps = DEFAULT_FPS, scene = null)
    {
        this.window = document.createElement('canvas');
        this.div = document.getElementById('siteGame');
        this.ctx = this.window.getContext('2d');
        this.fps = fps;
        this.scene = scene;
        this.interval = null;
    }

    Build(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT)
    {
        this.window.width = width;
        this.window.height = height;


        this.div.insertBefore(this.window, this.div.childNodes[0]);
    }

    SetScene(scene)
    {
    	this.scene = scene;
        if (this.interval != null)
        {
            clearInterval(this.interval);        
        }

        this.interval = setInterval(function()
        {
            this.scene.Update();
        }, 1000/this.fps);
    }
    
    Update()
    {
    	
    }

    Clear()
    {
        this.ctx.clearRect(0,0, this.window.width, this.window.height);
    }
}

class Scene
{
    constructor(window, environment = null, props = null, entities = null, player = null, unit = null)
    {
        this.window = window;
        this.environment = environment;
        this.props = props;
        this.entities = entities;
        this.player = player;
        this.unit = unit;
    }

    Update()
    {
        this.window.Clear();
        this.ctx = this.window.ctx;
        this.position = LockPositionToGrid(this.player.x, this.player.y, this.unit);
        if (this.player.animator != null)
        {
            this.player.animator.start = true;
            
            Log('animating?');
            this.player.Update();
            this.player.animator.next = false;
            this.ctx.drawImage(this.player.image, this.position.x, this.position.y, this.player.width, this.player.height);
            this.player.animator.next = true;

            this.environment.colliders.forEach(collider =>
                {
                    this.position = LockPositionToGrid(collider.x, collider.y, this.unit);
                    this.ctx.drawImage(collider.image, this.position.x, this.position.y, collider.width, collider.height);
                });
            
        }
        this.player.x += 0.1;
    }
}

function LockPositionToGrid(x, y, unit)
{
	point = new Point(x, y);
	point.x = Math.round(x * unit.Spacer()) / unit.Spacer();
	point.y = Math.round(y * unit.Spacer()) / unit.Spacer();
	return point;
}

function Log(string)
{
    console.log(string);
}


class Environment
{
    constructor(...objects)
    {
        this.colliders = objects;
        Log('environment built');
    }

    Add(object)
    {
        this.colliders.push(object);
    }

    Update()
    {
        this.colliders.forEach(object =>
            {

            });
    }
}

class Animator
{
    constructor(...animations)
    {
        this.animationList = animations;
        this.cancelAnimation = false;
        this.animationComplete = false;
        this.animationCalled = false;
        this.next = false;
        this.start = false;
        this.parent = null;
        this.index = 0;
    }

    Add(animation)
    {
        this.animationList.push(animation);
    }

    Parent(object)
    {
        this.parent = object;
    }

    GetAnimation(name)
    {
        Log('getting animation.');
        return this.animationList.find(animation => {return animation.name = name;});
    }

    Animate(search)
    {
        this.animation = this.GetAnimation(search);


        this.frameCount = this.animation.Count() - 1;

        if (this.next == true)
        {
            this.index += 1;
            if (this.index > this.frameCount)
            {
                this.animationComplete = true;
                this.animationCalled = false;
                this.SetSprite(this.parent.base);
                this.index = -1;
                return;
            }
        }

        this.frame = this.animation.Frame(this.index);
        this.SetSprite(this.frame);
    }

    SetSprite(frame)
    {
        this.parent.image = frame;
    }
}

class Collider
{
    constructor(type = 0, width, height, x, y)
    {
        this.airTime = new Timer();
        this.type = DeclareCollider(type);
    }

    SetType(type)
    {
        this.type = DeclareCollider(type);
    }
}

function DeclareCollider(type)
{
    var colliderEnum = { Static : 0, Trigger : 1, Hallow : 2 };
    colliderEnum.forEach(colliderType =>
    {
        if (type == colliderType)
        {
            return colliderType;
        }
    });
    return colliderEnum.Static;
}

class Rigidbody
{
    constructor(width, height, x, y, gravityScale, velocity, mass)
    {
    	this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.gravityScale = gravityScale;
        this.mass = mass;
        this.maxVelocity = velocity;
        this.airTime = new Timer();
        this.parent = null;
    }

    Parent(object)
    {
        this.parent = object;
    }
    
    SetMaxVelocity(velocity)
    {
    	this.maxVelocity = velocity;
    }

    SetGravity(gravity)
    {
    	this.gravityScale = gravity;
    }

    SetVelocity(velocity)
    {
    	this.velocity = velocity;

    }
}

var DEFAULT_TILE = Sprite('DEFAULT_TILE.png');






class GameObject
{
    constructor(width, height, x = 0, y = 0, sprite = DEFAULT_TILE)
    {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.image = sprite;
        this.base = sprite;

        this.collider = null;
        this.animator = null;
        this.rigidbody = null;
    }
    
    BuildRigidbody(gravityScale, velocity, mass)
    {
        if (this.rigidbody != null)
        {
            this.rigidbody.gravityScale = gravityScale;
            this.rigidbody.velocity = velocity;
            this.rigidbody.mass = mass;
        }
        else
        {
    	    this.rigidbody = new Rigidbody(this.width, this.height, this.x, this.y, gravityScale, velocity, mass);
        }
    }

    BuildCollider(type)
    {
        if (this.collider != null)
        {
            this.collider.type = type;
        }
        else
        {
            this.collider = new Collider(this.width, this.height, this.x, this.y);
        }
    }

    SetRigidbody(rigidbody)
    {
        this.rigidbody = rigidbody;
    }

    SetCollider(collider)
    {
        this.collider = collider;
    }

    SetAnimator(animator)
    {
        this.animator = animator;
    }

    RemoveRigidbody()
    {
        if (this.rigidbody != null)
        {
            this.rigidbody = null;
        }
    }

    RemoveCollider()
    {
        if (this.collider != null)
        {
            this.collider = null;
        }
    }

    RemoveAnimator()
    {
        if (this.animator != null)
        {
            this.animator = null;
        }
    }


    Update()
    {
        if (this.animator != null)
        {
            if(this.animator.start)
            {
                this.animator.Animate('walk');
            }
        }
    }
}


//______________________________________________________________________________________________________


var win = new Window(30);
var unit = new Unit(16, 2.0);

var player = new GameObject((unit.Size() * 1), (unit.Size() * 1), 0, 0);
player.BuildRigidbody(9.8, (unit.Pixel() * 1), 1);


var frame1 = Sprite('frame1.png');
var frame2 = Sprite('frame2.png');
var walkAnim = new ObjectAnimation('walk');
walkAnim.Add(frame1);
walkAnim.Add(frame2);

Log(walkAnim.Name());
var anim = new Animator();
anim.Add(walkAnim);


var player2 = new GameObject((unit.Size() * 1), (unit.Size() * 1), 0, 0, walkAnim.Frame(0));
anim.Parent(player2);
player2.SetAnimator(anim);


var floor = new GameObject((unit.Size() * 10), (unit.Size() * 1), 0, (win.height - (unit.Size() * 1)));

var env = new Environment();
env.Add(floor);


var scene = new Scene(win, env, null, null, player2, unit);


win.Build();
win.SetScene(scene);