const Clickable = {
    watch: {
        initScript: function () {
            this.initClickable();
        }
    },

    methods: {
        initClickable() {
            const Clickable = this.$pc.createScript('clickable');
            // Setup attributes
            Clickable.attributes.add("cameraEntity", { type: "entity", title: "Camera Entity" });

            // initialize code called once per entity
            Clickable.prototype.initialize = function () {
                if (this.app.touch) {
                    this.app.touch.on(pc.EVENT_TOUCHSTART, this.clickHandler, this);
                } else if (this.app.mouse) {
                    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.clickHandler, this);
                }
            };

            Clickable.prototype.clickHandler = function (e) {
                this.doRayCast(e.changedTouches ? e.changedTouches[0] : e);
            };

            Clickable.prototype.doRayCast = function (screenPosition) {
                var to = this.cameraEntity.camera.screenToWorld(screenPosition.x, screenPosition.y, this.cameraEntity.camera.farClip);
                var result = this.app.systems.rigidbody.raycastFirst(this.cameraEntity.getPosition(), to);

                if (result && result.entity.name === this.entity.name) {
                    window.MobileFuse.sendMessage(result.entity.name + 'Tap');
                }
            };
        }
    }
}


export default Clickable