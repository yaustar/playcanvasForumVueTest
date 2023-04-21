const Main = {
    watch: {
        initScript: function () {
            this.initMain();
        }
    },

    methods: {
        initMain() {
            const Main = this.$pc.createScript('main');
            // Setup attributes


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

            Main.prototype.initialize = function () {
                if (window.totalBalls !== undefined) this.totalBalls = window.totalBalls;
                this.score = 0;
                this.initGame = true;
                this.totalBalls += 1;

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

            Main.prototype.resetPosition = function (e) {
                if (this.gameOver === true && e.key === pc.KEY_R) this.restartGame();
                e.event.preventDefault();
            };

            Main.prototype.restartGame = function (e) {
                this.gameOver = false;
                this.setBallCount(this.initGame ? this.totalBalls + 1 : this.totalBalls - 1);
                this.setScore(0);
                this.hideMessage();
                this.recordedRollsArray = [];

                setTimeout(this.alertRestart, 10);
            };

            Main.prototype.alertRestart = function () {
                this.app.fire('app:restartGame');
            };

            Main.prototype.receiveFreeBallHandler = function () {
                this.showMessage('+1XTRA');
                this.changeBallCount(1);
            };

            Main.prototype.countBall = function (e) {
                var i = (this.totalBalls - this.ballsLeft);

                if (this.recordedRollsArray[i] !== true && this.ballsLeft < this.totalBalls) {
                    window.MobileFuse.sendMessage('roll' + i);
                }

                this.recordedRollsArray[i] = true;

                this.changeBallCount(-1);
                setTimeout(this.checkGameOver, 200);
            };

            Main.prototype.changeBallCount = function (i) {
                this.ballsLeft = Math.max(0, this.ballsLeft + i);
                if (this.ballsLeft === 1) this.blink(this.ballCountEntity);
                this.setBallCount(this.ballsLeft);
            };

            Main.prototype.setBallCount = function (i) {
                this.ballsLeft = i;
                var s = (window.MobileFuse.PC_CONFIG.spanish === true) ? 'PELOTA' : 'BALL';
                if (this.ballCountEntity) this.ballCountEntity.element.text = (this.ballsLeft) + ' ' + s + (this.ballsLeft !== 1 ? 'S' : '');
            };

            Main.prototype.checkGameOver = function (i) {
                if (this.ballsLeft === 0 && this.gameOver === false) {
                    this.gameOver = true;
                    this.app.fire('app:gameOver');
                    this.blink(this.scoreEntity);
                    this.blink(this.ballCountEntity);
                    window.MobileFuse.sendMessage('gameOver');

                    var s = window.MobileFuse.PC_CONFIG.spanish === true ? 'FIN DE LA\nPARTIDA' : 'GAME\nOVER';
                    this.gameOverMessage = this.showMessage(s, -1);
                }
            };

            Main.prototype.scoreReceivedHandler = function (points) {
                this.setScore(this.score + points);
            };

            Main.prototype.setScore = function (points) {
                this.score = points;

                if (this.scoreEntity) this.scoreEntity.element.text = this.score + 'X';
            };

            Main.prototype.showMessage = function (str, duration) {
                if (duration === undefined) duration = 1.5;
                if (this.messageEntity) {
                    this.messageEntity.element.text = str;
                    this.messageEntity.enabled = true;
                    if (duration > 0) setTimeout(this.hideMessage, duration * 1000);
                }
            };

            Main.prototype.hideMessage = function () {
                if (this.messageEntity) {
                    this.messageEntity.enabled = false;
                }
            };

            Main.prototype.blink = function (s) {
                var i = 0;
                toggle();
                function toggle() {
                    i++;
                    m = s.model || s.element;
                    m.enabled = (i % 2 === 1);
                    if (i < 9) setTimeout(toggle, 250);
                }
            };
        }
    }
}

export default Main