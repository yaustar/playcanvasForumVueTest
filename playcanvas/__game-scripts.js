// follow.js
var Follow = pc.createScript('follow');

Follow.attributes.add('target', {
    type: 'entity',
    title: 'Target',
    description: 'The Entity to follow'
});

Follow.attributes.add('distance', {
    type: 'number',
    default: 4,
    title: 'Distance',
    description: 'How far from the Entity should the follower be'
});

// initialize code called once per entity
Follow.prototype.initialize = function() {
    var initPos = this.entity.getPosition();
    this.vec = new pc.Vec3(initPos.x, initPos.y, initPos.z);
};

// update code called every frame
Follow.prototype.update = function(dt) {
    if (!this.target) return;

    var pos = this.target.getPosition();
    pos.z = Math.max(2, pos.z + 0.75 * this.distance);
    pos.x = 0;
    pos.y = 3;


        this.vec.lerp(this.vec, pos, 0.1);
        this.entity.setPosition(this.vec);

};


// teleportable.js
var Teleportable = pc.createScript('teleportable');

// initialize code called once per entity
Teleportable.prototype.initialize = function() {
    this.lastTeleportFrom = null;
    this.lastTeleportTo = null;
    this.lastTeleport = Date.now();
    this.startPosition = this.entity.getPosition().clone();
    this.app.on('app:teleportRequest', this.teleportRequestReceivedHandler, this);
};

// update code called every frame
Teleportable.prototype.update = function(dt) {
    if (this.entity.getPosition().y < 1) {
        this.teleport(this.lastTeleportFrom, this.lastTeleportTo, true);
    }
};

Teleportable.prototype.teleportRequestReceivedHandler = function(t){
    if(t !== this.entity)return;
    this.teleport(this.lastTeleportFrom, this.lastTeleportTo);
};

Teleportable.prototype.teleport = function(from, to, randomizeX) {
    var position = new pc.Vec3();
    if (from && (Date.now() - this.lastTeleport) < 500)return;
    this.lastTeleport = Date.now();
    this.lastTeleportFrom = from;
    this.lastTeleportTo = to;
    if (to) {
        position = to.getPosition();
        position.y += 0.5;
    } else {
        position.x = this.startPosition.x;
        position.y = this.startPosition.y;
        position.z = this.startPosition.z;
    }

    if(randomizeX === true){
        var r = Math.random() * 0.3;
        position.x += (Math.random() > 0.5? -r : r);
    }

    this.entity.rigidbody.teleport(position);
    this.entity.rigidbody.linearVelocity = this.entity.rigidbody.angularVelocity = pc.Vec3.ZERO;
    this.entity.fire('teleportable:reposition');
};


// teleport.js
var Teleport = pc.createScript('teleport');

Teleport.attributes.add('target', {
    type: 'entity',
    title: 'Target Entity',
    description: 'The target entity where we are going to teleport'
});

// initialize code called once per entity
Teleport.prototype.initialize = function() {
    this.entity.collision.on('triggerenter', this.onTriggerEnter, this);
};

Teleport.prototype.onTriggerEnter = function (otherEntity) {
    this.app.fire('app:teleportRequest', otherEntity);
};


// score-sensor.js
var Score = pc.createScript('score');

Score.attributes.add('points', {
    type: 'number',
    title: 'Points Value',
    description: 'Number of points that collision with this entitiy is worth',
    default: 0
});

Score.attributes.add('freeBall', {
    type: 'boolean',
    title: 'Free Ball',
    description: 'Is a Free Ball awarded?',
    default: false
});

Score.attributes.add('scoreIndicator', {
    type: 'entity',
    title: 'Score Indicator',
    description: 'Score Indicator Entity, blinks when triggered',
});

// initialize code called once per entity
Score.prototype.initialize = function() {
    this.entity.collision.on('triggerenter', this.onTriggerEnter, this);
    this.app.on('app:gameOver', this.killBlink, this);
};

Score.prototype.onTriggerEnter = function() {
    var m, s, i, self = this;
    if(this.points > 0)this.app.fire('app:score', this.points);
    if(this.freeBall === true)this.app.fire('app:freeBall');

    if(this.scoreIndicator !== undefined){
        s = this.scoreIndicator;
        i = 0;
        blink();
    }
    function blink(){
        i++;
        m = s.model || s.element;
        m.enabled =  (i % 2 === 1);
        if(i < 7)self.blinkTimeout = setTimeout(blink, 200);
    }
};

Score.prototype.killBlink = function(){
    clearTimeout(this.blinkTimeout);
    if(this.scoreIndicator)(this.scoreIndicator.model || this.scoreIndicator.element).enabled = true;
};

// main.js
var Main = pc.createScript('main');

Main.attributes.add('totalBalls', {
    type: 'number',
    title: 'Total Balls',
    description: 'Number of balls thrown in a game',
    default: 0
});

Main.attributes.add('scoreEntity', {
    type: 'entity',
    title: 'Score-Keeping Text Entity',
});

Main.attributes.add('ballCountEntity', {
    type: 'entity',
    title: 'Ball-Counting Text Entity',
});

Main.attributes.add('messageEntity', {
    type: 'entity',
    title: 'Message Text Entity',
});

Main.prototype.initialize = function() {
    if(window.totalBalls !== undefined)this.totalBalls = window.totalBalls;
    this.score = 0;
    this.initGame = true;
    this.totalBalls +=1;

    //this.hideScore = this.hideScore.bind(this);
    this.checkGameOver = this.checkGameOver.bind(this);
    this.alertRestart = this.alertRestart.bind(this);
    this.showMessage = this.showMessage.bind(this);
    this.hideMessage = this.hideMessage.bind(this);
    this.restartGame = this.restartGame.bind(this);
    window.restartGame = this.restartGame;

    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.resetPosition, this);
    this.app.on('app:score', this.scoreReceivedHandler, this);
    this.app.on('app:ballReturned', this.countBall, this);
    this.app.on('app:freeBall', this.receiveFreeBallHandler, this);

    this.restartGame();
    this.setBallCount(this.totalBalls);
    this.initGame = false;
};

Main.prototype.resetPosition = function(e){
    if (this.gameOver === true && e.key === pc.KEY_R )this.restartGame();
    e.event.preventDefault();
};

Main.prototype.restartGame = function(e){
    this.gameOver = false;
    this.setBallCount(this.initGame? this.totalBalls + 1 : this.totalBalls - 1);
    this.setScore(0);
    this.hideMessage();
    this.recordedRollsArray = [];

    setTimeout(this.alertRestart, 10);
};

Main.prototype.alertRestart = function(){
    this.app.fire('app:restartGame');
};

Main.prototype.receiveFreeBallHandler = function(){
    this.showMessage('+1XTRA');
    this.changeBallCount(1);
};

Main.prototype.countBall = function(e){
    var i = (this.totalBalls - this.ballsLeft);

    if(this.recordedRollsArray[i] !== true && this.ballsLeft < this.totalBalls){
        window.MobileFuse.sendMessage('roll' + i);
    }

    this.recordedRollsArray[i] = true;

    this.changeBallCount(-1);
    setTimeout(this.checkGameOver, 200);
};

Main.prototype.changeBallCount = function(i){
    this.ballsLeft = Math.max(0, this.ballsLeft + i);
    if(this.ballsLeft === 1)this.blink(this.ballCountEntity);
    this.setBallCount(this.ballsLeft);
};

Main.prototype.setBallCount = function(i){
    this.ballsLeft = i;
    var s = (window.MobileFuse.PC_CONFIG.spanish === true)? 'PELOTA' : 'BALL';
    if(this.ballCountEntity)this.ballCountEntity.element.text = (this.ballsLeft) + ' '+ s + (this.ballsLeft !== 1? 'S' : '');
};

Main.prototype.checkGameOver = function(i){
    if(this.ballsLeft === 0 && this.gameOver === false){
        this.gameOver = true;
        this.app.fire('app:gameOver');
        this.blink(this.scoreEntity);
        this.blink(this.ballCountEntity);
        window.MobileFuse.sendMessage('gameOver');

        var s = window.MobileFuse.PC_CONFIG.spanish === true? 'FIN DE LA\nPARTIDA': 'GAME\nOVER';
        this.gameOverMessage = this.showMessage(s, -1);
    }
};

Main.prototype.scoreReceivedHandler = function(points){
   this.setScore(this.score + points);
};

Main.prototype.setScore = function(points) {
    this.score = points;

    if(this.scoreEntity)this.scoreEntity.element.text = this.score + 'X';
};

Main.prototype.showMessage = function(str, duration) {
    if(duration === undefined)duration = 1.5;
    if(this.messageEntity){
        this.messageEntity.element.text = str;
        this.messageEntity.enabled = true;
        if(duration > 0)setTimeout(this.hideMessage, duration * 1000);
    }
};

Main.prototype.hideMessage = function() {
    if(this.messageEntity){
        this.messageEntity.enabled = false;
    }
};

Main.prototype.blink = function(s){
    var i = 0;
    toggle();
    function toggle(){
        i++;
        m = s.model || s.element;
        m.enabled =  (i % 2 === 1);
        if(i < 9)setTimeout(toggle, 250);
    }
};

// drag-roll.js
var DragRoll = pc.createScript('dragRoll');

DragRoll.attributes.add("cameraEntity", {type: "entity", title: "Camera Entity"});

DragRoll.attributes.add("floorEntity", {type: "entity", title: "Floor Entity"});

DragRoll.attributes.add("arrowEntity", {type: "entity", title: "Arrow Entity"});

DragRoll.attributes.add('maxForce', {
    type: 'number',
    title: 'Max Force',
    description: 'Maximum clamp value for ball force',
    default: 10
});

DragRoll.attributes.add('minForce', {
    type: 'number',
    title: 'Min Force',
    description: 'Minimum clamp value for ball force',
    default: 3.5
});

DragRoll.attributes.add('dragVelXMultiplier', {
    type: 'number',
    title: 'Drag Vel X Multiplier',
    description: 'Drag velocity factor - x axis',
    default: 0.05
});

DragRoll.attributes.add('dragVelZMultiplier', {
    type: 'number',
    title: 'Drag Vel Z Multiplier',
    description: 'Drag velocity factor - z axis',
    default: 0.1
});


DragRoll.prototype.initialize = function () {
    this.ray = new pc.Ray();
    this.dragging = this.rolling = false;
    this.enabled = true;
    this.resetArrow = this.resetArrow.bind(this);

    if (this.app.touch) {
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.touchStartHandler, this);
        this.app.touch.on(pc.EVENT_TOUCHEND, this.touchEndHandler, this);
    }else if (this.app.mouse) {
        this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.mouseDownHandler, this);
        this.app.mouse.on(pc.EVENT_MOUSEUP, this.mouseUpHandler, this);
    }

    this.app.mouse.disableContextMenu();
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.resetPosition, this);
    this.entity.on('teleportable:reposition', this.repositionHandler, this);
    this.app.on('app:gameOver', this.gameOverHandler, this);
    this.app.on('app:restartGame', this.gameRestartHandler, this);
    this.repositionHandler();
};

DragRoll.prototype.update = function(){
    if(this.rolling === true && this.entity.rigidbody.linearVelocity.z === 0){
         this.entity.rigidbody.applyImpulse(new pc.Vec3(-0.5, -10, -0.5));
    }
};

DragRoll.prototype.resetPosition = function(e){
    if(this.enabled === true && e.key === pc.KEY_R ){
        this.entity.setPosition(0,0,0);  //drop to origin, so it will fall below floor and teleport
    }
    e.event.preventDefault();
};

DragRoll.prototype.repositionHandler = function(e){
    var entityPos = this.entity.getPosition();
    this.cursorVelArray = [];
    this.side0 = this.side1 = 0;
    this.app.fire('app:ballReturned');
    this.arrowEntity.setPosition(entityPos.x, this.arrowEntity.getPosition().y, entityPos.z);
    this.rolling = false;
};

DragRoll.prototype.touchStartHandler = function (e) {
    if(this.enabled === false)return;
    this.app.touch.on(pc.EVENT_TOUCHMOVE, this.cursorMoveHandler, this);
    this.cursorMoveHandler(e.touches[0]);
    e.event.preventDefault();
};

DragRoll.prototype.mouseDownHandler = function (e) {
    if(this.enabled === false)return;
    if(e.button !== pc.MOUSEBUTTON_LEFT)return;
    this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.cursorMoveHandler, this);
    this.cursorMoveHandler(e);
};

DragRoll.prototype.touchEndHandler = function (e) {
    this.app.touch.off(pc.EVENT_TOUCHMOVE, this.cursorMoveHandler, this);
    this.endDrag(e.changedTouches[0].x, e.changedTouches[0].y);
    e.event.preventDefault();
};

DragRoll.prototype.mouseUpHandler = function (e) {
    if (e.button === pc.MOUSEBUTTON_LEFT){
        this.app.mouse.off(pc.EVENT_MOUSEMOVE, this.cursorMoveHandler, this);
        this.endDrag(e.x, e.y);
    }
};

DragRoll.prototype.cursorMoveHandler = function(e){
    if(this.app.touch){
        this.doRayCast(e.changedTouches? e.changedTouches[0] : e);
    }else{
        this.doRayCast(e);
    }

    this.dragging = true;
};

DragRoll.prototype.doRayCast = function (screenPosition) {
    if(this.rolling === true || this.enabled === false)return;
    var to = this.cameraEntity.camera.screenToWorld(screenPosition.x, screenPosition.y, this.cameraEntity.camera.farClip);
    var result = this.app.systems.rigidbody.raycastFirst(this.cameraEntity.getPosition(), to);

    if (result && result.entity.dragRollTarget === true){//} && result.entity.name === this.floorEntity.name) {
        var resultPos = result.point;
        var arrowPos = this.arrowEntity.getPosition();
        this.side0 = resultPos.x - arrowPos.x;
        this.side1 = resultPos.z - arrowPos.z;
        var hyp =  arrowPos.distance(resultPos);
        var angle = (90 + (Math.asin(this.side1 / hyp) * 180/Math.PI)) * (resultPos.x > arrowPos.x? -1 : 1);
        if(angle >= -25 && angle <= 25){
            this.arrowEntity.setLocalScale(hyp * 0.75, 1, hyp * 1.8);
            this.arrowEntity.setLocalEulerAngles(0,angle,0);
        }
    }
};

DragRoll.prototype.endDrag = function (x, y) {
    if(this.dragging === false || this.rolling === true || this.enabled === false || (this.side0 === 0 && this.side1 === 0))return;
    this.entity.rigidbody.applyImpulse(new pc.Vec3(this.side0 * this.dragVelXMultiplier, 0, pc.math.clamp(this.side1 * this.dragVelZMultiplier, -this.maxForce, -this.minForce)));
    setTimeout(this.resetArrow, 1000);
    this.rolling = true;
    this.dragging = false;
};

DragRoll.prototype.resetArrow = function(){
    this.arrowEntity.setLocalScale(1, 1, 1);
    this.arrowEntity.setLocalEulerAngles(0,0,0);
};

DragRoll.prototype.gameOverHandler = function(){
    this.enabled = this.arrowEntity.enabled = false;
    this.entity.model.hide();
};

DragRoll.prototype.gameRestartHandler = function(){
    this.enabled = this.arrowEntity.enabled = true;
    this.entity.model.show();
};

// drag-roll-target.js
var DragRollTarget = pc.createScript('dragRollTarget');

// initialize code called once per entity
DragRollTarget.prototype.initialize = function() {
    this.entity.dragRollTarget = true;
};

// update code called every frame
DragRollTarget.prototype.update = function(dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// DragRollTarget.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/

// clickable.js
var Clickable = pc.createScript('clickable');

Clickable.attributes.add("cameraEntity", {type: "entity", title: "Camera Entity"});

// initialize code called once per entity
Clickable.prototype.initialize = function() {
    if (this.app.touch) {
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.clickHandler, this);
    }else if (this.app.mouse) {
        this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.clickHandler, this);
    }
};

Clickable.prototype.clickHandler = function(e) {
    this.doRayCast(e.changedTouches? e.changedTouches[0] : e);
};

Clickable.prototype.doRayCast = function (screenPosition) {
    var to = this.cameraEntity.camera.screenToWorld(screenPosition.x, screenPosition.y, this.cameraEntity.camera.farClip);
    var result = this.app.systems.rigidbody.raycastFirst(this.cameraEntity.getPosition(), to);

    if (result && result.entity.name === this.entity.name) {
        window.MobileFuse.sendMessage(result.entity.name +'Tap');
    }
};


// switching-textures.js
var SwitchingTextures = pc.createScript('switchingTextures');

// Reference a list of textures that we can cycle through
SwitchingTextures.attributes.add("textures", {type: "asset", assetType: "texture", array: true, title: "Textures"});
SwitchingTextures.attributes.add('changeOnSpin', {type: 'boolean', default: false, title: 'Change On Spin', description: 'Whether textures should be re-assigned as the entity spins'});
SwitchingTextures.attributes.add('emissive', { type: 'boolean',  default: false,  title: 'Emissive?',  description: 'Whether the textures should be assigned as emissive'});
SwitchingTextures.attributes.add("textureIndex", {type: "number", default: 0, title: "Texture Index"});

// initialize code called once per entity
SwitchingTextures.prototype.initialize = function() {
    this.setInitialTextures = this.setInitialTextures.bind(this);
    this.initializeTextureAssignment = this.initializeTextureAssignment.bind(this);

    setTimeout(this.initializeTextureAssignment, 50);
};

SwitchingTextures.prototype.initializeTextureAssignment = function(){
    try{
        // check for JustAd config texture data
        this.configTextureData = window.MobileFuse.PC_CONFIG.textures;
        this.app.loader.getHandler("texture").crossOrigin = "anonymous";
        this.changeOnSpin = (this.configTextureData.changeOnSpin === true);
        this.loadedTextures = 0;
        this.texturesArray = [];
        this.entity.texturesLoaded = false;
        this.emissive = (this.configTextureData.emissive === true);

        this.alertReady = this.alertReady.bind(this);

        if(Array.isArray(this.configTextureData.imageNames[0])){
            this.imageNamesArray = this.configTextureData.imageNames[this.entity.baseEntityIndex].slice();
        }else{
            this.imageNamesArray = this.configTextureData.imageNames.slice();
        }

        for(var i = 0; i < this.imageNamesArray.length; i++){
            console.log(this.textureIndex || i, this.textureIndex, i);
            var asset = new pc.Asset("texture_"+(this.entity.baseEntityIndex || 0)+'-'+ (this.textureIndex || i), "texture", { url: this.configTextureData.imageFolder + this.imageNamesArray[this.textureIndex || i] });
            this.app.assets.add(asset);
            asset.on("load", this.externalImageLoadCompleteHandler, this);
            asset.on("error", this.externalImageLoadErrorHandler, this);
            this.app.assets.load(asset);
        }
    } catch(e){
        //If MobileFuse.PC_CONFIG config data is not present.
        //Make a copy of textures, which will be rotated, if the number of textures is greater than the number of panels
        this.texturesArray = this.textures.slice();
        setTimeout(this.setInitialTextures, 50);
    }
};

SwitchingTextures.prototype.externalImageLoadCompleteHandler = function(texture){
    var i = Number(texture.name.split('-')[1]);
    this.texturesArray[i] = this.textures[i] = texture;
    this.loadedTextures ++;

    if(this.loadedTextures == this.imageNamesArray.length){
        this.setInitialTextures();
    }
};

SwitchingTextures.prototype.externalImageLoadErrorHandler = function(err){
    console.log(err);
};

SwitchingTextures.prototype.setInitialTextures = function() {
    //Limit the loop to the lesser of the number of planes or textures.
    //

    if(this.entity._children[0].model){
        var len = Math.min(this.texturesArray.length, this.entity._children.length);

        for(var i = 0; i < len; i++) {
            var plane = this.entity._children[i];
            plane.model.material = plane.model.material.clone();
            plane.model.material.ambientTint = false;
            this.setFaceTexture(i);
        }
    } else {
        this.entity.model.material = this.entity.model.material.clone();
        this.entity.model.material.ambientTint = false;
        var mapType = (this.emissive === true)? 'emissiveMap' : 'diffuseMap';
        var imageName = this.imageNamesArray[0];

        console.log(this.texturesArray);

        this.entity.model.material[mapType] = this.texturesArray[this.textureIndex || 0].resource;
        this.entity.model.material[mapType].anisotropy = 7;

        if(imageName.indexOf('.png') === imageName.length - 4){
            this.entity.model.material.opacityMap = this.texturesArray[textureIndex].resource;
            this.entity.model.material.opacityMapChannel = 'a';
            this.entity.model.material.blendType = pc.BLEND_NORMAL;
        }

       // console.log(this.entity.model.material);

        this.entity.model.material.update();
    }

    this.addRotationListeners();
    this.entity.texturesLoaded = true;
    setTimeout(this.alertReady, 100);
};

SwitchingTextures.prototype.alertReady = function() {
    this.app.fire('textures:ready');
};

SwitchingTextures.prototype.setFaceTexture = function(planeIndex, textureIndex) {
    if(textureIndex === undefined)textureIndex = planeIndex;
    var plane = this.entity._children[planeIndex];
    var mapType = (this.emissive === true)? 'emissiveMap' : 'diffuseMap';
    var imageName = this.imageNamesArray[textureIndex];

    plane.model.material[mapType] = this.texturesArray[textureIndex].resource;

    if(imageName.indexOf('.png') === imageName.length - 4){
        plane.model.material.opacityMap = this.texturesArray[textureIndex].resource;
        plane.model.material.opacityMapChannel = 'a';
        plane.model.material.blendType = pc.BLEND_NORMAL;
    }

    plane.model.material.update();

    if(this.texturesArray.length > this.entity._children.length){
        //Check the assigned texture against its initial index to determine what clickID should be received by entityManager.
        plane.model.entity.clickID = 'Plane_'+ this.entity.baseEntityIndex +'-'+ this.textures.indexOf(this.texturesArray[textureIndex]);
    }
};

//--------------------- Only used if rotationCounter is added to entity ---------------------//

SwitchingTextures.prototype.addRotationListeners = function(){
    //  If the entity has a rotationTracker script added and there are more textures than planes,
    //  listen for rotation changes to re-assign textures.
    if(this.changeOnSpin && this.entity._children.length < this.texturesArray.length && this.entity.script.rotationTracker){
        this.frontPlaneIndex = 0;
        this.app.on('rotationTracker:forward', this.forwardRotationHandler, this);
        this.app.on('rotationTracker:backward', this.backwardRotationHandler, this);
    }
};

SwitchingTextures.prototype.forwardRotationHandler = function(e){
    //rotate textures array forward one index
    if(e.entity.name === this.entity.name){
        this.texturesArray.push(this.texturesArray.shift());
        this.updateTexturesOnRotation();
    }
};

SwitchingTextures.prototype.backwardRotationHandler = function(e){
    //rotate textures array backward one index
    if(e.entity.name === this.entity.name){
        this.texturesArray.unshift(this.texturesArray.pop());
        this.updateTexturesOnRotation();
    }
};

SwitchingTextures.prototype.updateTexturesOnRotation = function(){
    //Assign new textures to the planes.
    this.setFaceTexture(this.frontPlaneIndex, 1);
    this.frontPlaneIndex = (this.frontPlaneIndex === 1)? 0 : 1;
    this.setFaceTexture(this.frontPlaneIndex, 0);
};

// boot.js
var Boot = pc.createScript('boot');

// initialize code called once per entity
Boot.prototype.initialize = function() {

     if(window.MobileFuse === undefined/* && (window.location.hostname == 'playcanv.as' || window.location.hostname === 'launch.playcanvas.com')*/){
        window.MobileFuse = {
            PC_CONFIG:  {
                testing: true,
                spanish: true,
                textures: {
                    imageFolder: 'https://d3tj5wcy4685ia.cloudfront.net/FLLottery_SkeeBall/',
                    imageNames: ['screen_v2.jpg', 'bg_v2.jpg'],
                    changeOnSpin: false,     //Only affects HyperPlane
                    emissive:false
                },
                numberColors:[
                    [0,0,0,1],
                    [255,255,255,1],
                    [0,0,0,1],
                    [255,255,255,1],
                    [0,0,0,1]
                ]
            },
            sendMessage: function(label) {
                console.log('SEND:', label);
            }
        };
    }
    console.log('Config Data:', window.MobileFuse);

    this.MODEL_TAGS = ['HyperCube', 'HyperPlane', 'OrientationCylinder', 'screenPlane', 'bg_plane'];

    this.baseEntityTexturesLoaded = 0;
    this.canvasFound = false;
    this.checkForCanvas = this.checkForCanvas.bind(this);

    this.app.on('textures:ready', this.texturesReadyHandler, this);

    this.findBaseEntities();
    this.buildStyles();
    this.checkForCanvas();
};

Boot.prototype.findBaseEntities = function(){
    this.baseEntitiesArray = [];
    for(var i = 0; i < this.MODEL_TAGS.length; i++){
        this.baseEntitiesArray = this.baseEntitiesArray.concat(this.app.root.findByTag(this.MODEL_TAGS[i]));
    }

    console.log(this.baseEntitiesArray);
};


Boot.prototype.checkForCanvas = function(){
    try{
        this.canvas = document.getElementsByTagName('canvas')[0];
        this.canvas.classList.add('app-canvas');
        this.canvasFound = true;
        this.checkReady();
    }catch(e){
        setTimeout(this.checkForCanvas, 100);
    }
};

Boot.prototype.texturesReadyHandler = function(){
    this.baseEntityTexturesLoaded ++;
    window.MobileFuse.PC_BOOT = true;
    this.checkReady();
};

Boot.prototype.checkReady = function(){
    if(this.canvasFound === true && this.baseEntityTexturesLoaded === this.baseEntitiesArray.length ){
        this.alertReady();
    }
};

Boot.prototype.alertReady = function(){
    this.canvas.classList.add('visible');
    this.app.fire('Boot:ready', this);
    for(var i = 0; i < this.baseEntitiesArray.length; i++){
        var animate = true;
        var t = this.baseEntitiesArray[i];

        try{
            animate = (window.MobileFuse.PC_CONFIG.animation !== undefined && window.MobileFuse.PC_CONFIG.animation.loops > 0);
        }catch(e){}

        if(animate && t.openingAnimation !== undefined){
            setTimeout(t.openingAnimation.bind(t), 600);
        }
    }
};

Boot.prototype.buildStyles = function() {
    var style = document.createElement('style');
    var css = [
        '.app-canvas {',
        '    opacity: 0;',
        '}',
        '.app-canvas.visible {',
        '     opacity: 1;',
        '    -webkit-transition: opacity .5s;',
        '    -moz-transition: opacity .5s;',
        '    -ms-transition: opacity .5s;',
        '    -o-transition: opacity .5s;',
        '    transition: opacity .5s;',
        '}'
    ].join("\n");

    style.type = 'text/css';

    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    document.head.appendChild(style);
};

// assign-number-colors.js
var AssignNumberColors = pc.createScript('assignNumberColors');
AssignNumberColors.attributes.add("colorValueIndex", {type: "number"});

// initialize code called once per entity
AssignNumberColors.prototype.initialize = function() {
 /*   var a = window.MobileFuse.PC_CONFIG.numberColors[this.colorValueIndex];
    this.entity.element.color = new pc.Color(a[0],a[1],a[2],a[3]);
    this.entity.element.outlineColor = new pc.Color(0,0,0,1);
    console.log(this.entity.element);
*/
};

// update code called every frame
AssignNumberColors.prototype.update = function(dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// AssignNumberColors.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/

