const Score = {
    watch: {
        initScript: function () {
            this.initScore();
        }
    },

    methods: {
        initScore() {
            const Score = this.$pc.createScript('score');
            // Setup attributes
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
            Score.prototype.initialize = function () {
                this.entity.collision.on('triggerenter', this.onTriggerEnter, this);
                this.app.on('app:gameOver', this.killBlink, this);
            };

            Score.prototype.onTriggerEnter = function () {
                var m, s, i, self = this;
                if (this.points > 0) this.app.fire('app:score', this.points);
                if (this.freeBall === true) this.app.fire('app:freeBall');

                if (this.scoreIndicator !== undefined) {
                    s = this.scoreIndicator;
                    i = 0;
                    blink();
                }
                function blink() {
                    i++;
                    m = s.model || s.element;
                    m.enabled = (i % 2 === 1);
                    if (i < 7) self.blinkTimeout = setTimeout(blink, 200);
                }
            };

            Score.prototype.killBlink = function () {
                clearTimeout(this.blinkTimeout);
                if (this.scoreIndicator) (this.scoreIndicator.model || this.scoreIndicator.element).enabled = true;
            };
        }
    }
}

export default Score