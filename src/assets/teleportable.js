const Teleportable = {
    watch: {
        initScript: function () {
            this.initTeleportable();
        }
    },

    methods: {
        initTeleportable() {
            const Teleportable = this.$pc.createScript('teleportable');

            // initialize code called once per entity
            Teleportable.prototype.initialize = function () {
                this.lastTeleportFrom = null;
                this.lastTeleportTo = null;
                this.lastTeleport = Date.now();
                this.startPosition = this.entity.getPosition().clone();
                this.app.on('app:teleportRequest', this.teleportRequestReceivedHandler, this);
            };

            // update code called every frame
            Teleportable.prototype.update = function (dt) {
                if (this.entity.getPosition().y < 1) {
                    this.teleport(this.lastTeleportFrom, this.lastTeleportTo, true);
                }
            };

            Teleportable.prototype.teleportRequestReceivedHandler = function (t) {
                if (t !== this.entity) return;
                this.teleport(this.lastTeleportFrom, this.lastTeleportTo);
            };

            Teleportable.prototype.teleport = function (from, to, randomizeX) {
                var position = new pc.Vec3();
                if (from && (Date.now() - this.lastTeleport) < 500) return;
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

                if (randomizeX === true) {
                    var r = Math.random() * 0.3;
                    position.x += (Math.random() > 0.5 ? -r : r);
                }

                this.entity.rigidbody.teleport(position);
                this.entity.rigidbody.linearVelocity = this.entity.rigidbody.angularVelocity = pc.Vec3.ZERO;
                this.entity.fire('teleportable:reposition');
            };

        }
    }
}

export default Teleportable