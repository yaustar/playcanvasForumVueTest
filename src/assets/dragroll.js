const DragRoll = {
    watch: {
      initScript: function () {
        this.initDragRoll();
      }
    },
  
    methods: {
      initDragRoll() {
        const DragRoll = this.$pc.createScript('dragRoll');
        // Setup attributes

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
      }
    }
  }
  
  export default DragRoll