// Rotate Mixin
const Boot = {
    watch: {
      initScript: function () {
        this.initBoot();
      }
    },
  
    methods: {
        
      initBoot() {
        const Boot = this.$pc.createScript('boot');
        // Setup attributes
        Boot.attributes.add('x', { type: 'number', description: 'The entity to be spawned after clicking.' });
        Boot.attributes.add('y', { type: 'number', description: 'The main camera entity in the scene.' });
        Boot.attributes.add('z', { type: 'number', description: 'The main camera entity in the scene.' });
  
        Boot.prototype.update = function (dt) {
          this.entity.rotate(this.x * dt, this.y * dt, this.z * dt);
        };
      
      Boot.prototype.initialize = function() {
    
        if(window.MobileFuse === undefined && (window.location.hostname == 'playcanv.as' || window.location.hostname === 'launch.playcanvas.com')){
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
   },
   
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
}
    }
  }
  
  export default Boot