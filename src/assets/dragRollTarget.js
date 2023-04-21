// initialize code called once per entity
const DragRollTarget = {
    watch: {
      initScript: function () {
        this.initDragRollTarget();
      }
    },
  
    methods: {
        initDragRollTarget() {
        const DragRollTarget = this.$pc.createScript('dragRollTarget');
        // Setup attributes
        DragRollTarget.prototype.initialize = function() {
            this.entity.dragRollTarget = true;
        };
        
        // update code called every frame
        DragRollTarget.prototype.update = function(dt) {
            
        };
      }
    }
  }
  
  export default DragRollTarget