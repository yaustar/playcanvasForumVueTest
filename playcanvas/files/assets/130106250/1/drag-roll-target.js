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