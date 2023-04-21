const Follow = {
    watch: {
        initScript: function () {
            this.initFollow();
        }
    },

    methods: {
        initFollow() {
            const Follow = this.$pc.createScript('follow');

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
            Follow.prototype.initialize = function () {
                var initPos = this.entity.getPosition();
                this.vec = new pc.Vec3(initPos.x, initPos.y, initPos.z);
            };

            // update code called every frame
            Follow.prototype.update = function (dt) {
                if (!this.target) return;

                var pos = this.target.getPosition();
                pos.z = Math.max(2, pos.z + 0.75 * this.distance);
                pos.x = 0;
                pos.y = 3;


                this.vec.lerp(this.vec, pos, 0.1);
                this.entity.setPosition(this.vec);

            };

        }
    }
}

export default Follow