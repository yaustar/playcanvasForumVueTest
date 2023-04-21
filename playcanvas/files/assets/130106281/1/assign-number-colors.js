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