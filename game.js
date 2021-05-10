// Select CVS
const cvs = document.getElementById("game-canvas");
const ctx = cvs.getContext("2d");

const isMobile = /Android|webOS|iPhone|iPad|Mac|Macintosh|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
);

let viewRatio = (isMobile ? window.screen.height : window.innerHeight) / 512;

// game var
let frames = 0;
let pause = false;
const DEGREE = Math.PI / 180;
// GAME CONTROL
const state = {
  current: 0,
  menu: 0,
  ready: 1,
  game: 2,
  pause: 3,
  over: 4,
  score: 5,
};

// set sprite
let sprite = new Image();
sprite.src = "./img/sprite.png";

// set sound effect
const sfxDie = new Audio();
sfxDie.src = "./audio/sfx_die.wav";

const sfxFlap = new Audio();
sfxFlap.src = "./audio/sfx_flap.wav";

const sfxHit = new Audio();
sfxHit.src = "./audio/sfx_hit.wav";

const sfxPoint = new Audio();
sfxPoint.src = "./audio/sfx_point.wav";

const sfxSwooshing = new Audio();
sfxSwooshing.src = "./audio/sfx_swooshing.wav";

// BACKGROUND
const bg = {
  sX: 0,
  sY: 308,
  w: 288,
  h: 204,
  x: 0,
  y: cvs.height - 204,

  draw: function () {
    ctx.drawImage(
      sprite,
      this.sX,
      this.sY,
      this.w,
      this.h,
      this.x,
      this.y,
      this.w,
      this.h
    );
  },
};
// FOREGROUND
const fg = {
  sX: 292,
  sY: 0,
  w: 308,
  h: 110,
  x: 0,
  y: cvs.height - 110,
  dx: 2,

  draw: function () {
    // draw fg 2 times
    ctx.drawImage(
      sprite,
      this.sX,
      this.sY,
      this.w,
      this.h,
      this.x,
      this.y,
      this.w,
      this.h
    );
    ctx.drawImage(
      sprite,
      this.sX,
      this.sY,
      this.w,
      this.h,
      this.x + this.w,
      this.y,
      this.w,
      this.h
    );
  },
  update: function () {
    // move fg 's x by w -> return
    if (state.current == state.game) {
      this.x = (this.x - this.dx) % this.w;
    }
  },
};
// BIRD
const bird = {
  animation: [
    { sX: 528, sY: 128 },
    { sX: 528, sY: 180 },
    { sX: 528, sY: 220 },
    { sX: 528, sY: 128 },
  ],
  w: 34,
  h: 24,
  x: 40,
  y: 200,
  // radius to check collision
  radius: 13,
  // bird's frames, period to make flapping animation
  frames: 0,
  period: {
    0: 10,
    1: 10,
    2: 4,
    3: 0,
    4: 0,
    5: 0,
  },
  // control bird's movements
  speed: 0,
  gravity: 0.25,
  jump: 5.2,
  // control bird's rotation
  rotation: 0,
  draw: function () {
    // rotate canvas -> draw bird -> restore canvas
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * DEGREE);
    ctx.drawImage(
      sprite,
      this.animation[this.frames].sX,
      this.animation[this.frames].sY,
      this.w,
      this.h,
      -this.w / 2,
      -this.h / 2,
      this.w,
      this.h
    );
    ctx.restore();
  },
  update: function () {
    // make bird flapping animation
    if (frames % this.period[state.current] == 0) {
      this.frames = (this.frames + 1) % 4;
    }
    // change rotation
    if (this.speed == -this.jump) {
      this.rotation = -20;
    } else if (this.speed >= 3) {
      this.rotation = 90;
      this.frames = 1;
    } else {
      this.rotation = this.rotation + (this.speed + 5) / 2;
    }
    // get current pipe position
    let { pX, pY } = pipes.position[0];
    // speed handle
    switch (state.current) {
      case state.game:
        // change speed
        this.speed += this.gravity;
        this.y += this.speed;
        // collision detect
        // case 1: hit the ground
        if (this.y + this.radius >= fg.y) {
          state.current = state.over;
          // die sfx
          sfxDie.play();
        }
        // case 2: hit the pipe
        if (
          // check x (pipe's left && right side)
          this.x + this.radius >= pX &&
          this.x - this.radius <= pX + 52 &&
          // check y (bot || top)
          (this.y + this.radius >= pY + 355 || this.y - this.radius <= pY + 270)
        ) {
          state.current = state.over;
          // hit sfx
          sfxHit.play();
        }

        // score
        if (this.x == pX + 26) {
          score.value++;
          if (score.best < score.value) {
            score.best++;
            localStorage.setItem("flappy-bird-best", String(score.best));
          }
          // score sfx
          sfxPoint.play();
        }
        break;
      case state.over:
        // movement after collision
        if (this.y + this.radius < fg.y) {
          this.speed += this.gravity;
          this.y += this.speed;
        }
        break;
      case state.pause:
        // no movement in pause
        break;
      default:
        // fixed position in menu, score
        this.y = 200;
        this.rotation = 0;
        break;
    }
  },
  flap: function () {
    // bird fly up when click
    this.speed = -this.jump;
    this.rotation = -25;
    // flap sfx
    sfxFlap.currentTime = 0;
    sfxFlap.play();
  },
};
// PIPES
const pipes = {
  // top pipe source position
  top: {
    sX: 604,
    sY: 0,
  },
  // bottom pipe source position
  bot: {
    sX: 660,
    sY: 0,
  },
  w: 52,
  h: 270,
  // gap btw top & bot
  gap: 85,
  // store position of pipes
  position: [
    {
      pX: 288,
      pY: -100,
    },
  ],
  // pipe movement
  dX: 2,
  draw: function () {
    this.position.map((pipe) => {
      // top pipe
      ctx.drawImage(
        sprite,
        this.top.sX,
        this.top.sY,
        this.w,
        this.h,
        pipe.pX,
        pipe.pY,
        this.w,
        this.h
      );
      // bottom pipe
      ctx.drawImage(
        sprite,
        this.bot.sX,
        this.bot.sY,
        this.w,
        this.h,
        pipe.pX,
        pipe.pY + this.h + this.gap,
        this.w,
        this.h
      );
    });
  },
  update: function () {
    if (state.current == state.game) {
      // loop pipes 's storage
      this.position.map((pipe) => {
        // pipe move
        pipe.pX -= this.dX;
        // when pipe's X == 130 -> add new pipe
        if (pipe.pX == 130) {
          this.position.push({
            pX: 288,
            pY: Math.floor(Math.random() * -200),
          });
        }
      });
      // delete old pipes
      if (this.position[0].pX == -52) {
        this.position.shift();
      }
    }
  },
  reset: function () {
    this.position = [
      {
        pX: 288,
        pY: -100,
      },
    ];
  },
};
// SCORE
const score = {
  value: 0,
  best: parseInt(localStorage.getItem("flappy-bird-best")) || 0,
  draw: function () {
    ctx.fillStyle = "#f0f5e5";
    ctx.strokeStyle = "#513948";

    switch (state.current) {
      case state.game:
        ctx.lineWidth = 3;
        ctx.font = "30px Bungee";
        ctx.textAlign = "center";
        ctx.fillText(this.value, 144, 60);
        ctx.strokeText(this.value, 144, 60);
        break;
      case state.over:
        ctx.lineWidth = 2;
        ctx.font = "20px Bungee";
        ctx.textAlign = "end";
        // draw score
        ctx.fillText(this.value, 233, 236);
        ctx.strokeText(this.value, 233, 236);
        // draw best
        ctx.fillText(this.best, 233, 277);
        ctx.strokeText(this.best, 233, 277);
        break;
      case state.score:
        ctx.lineWidth = 2;
        ctx.textAlign = "end";
        ctx.font = "30px Bungee";
        ctx.fillText(this.best, 237, 250);
        ctx.strokeText(this.best, 237, 250);
        break;
    }
  },
};
// MEDAL
let medal = {
  sX: {
    iron: 524,
    bronze: 572,
    silver: 619,
    gold: 666,
  },
  sY: 281,
  w: 44,
  h: 44,
  draw() {
    if (state.current !== state.over && state.current !== state.score) return;
    // get current medal from best
    let sXBest;
    if (score.best >= 100) {
      sXBest = this.sX.gold;
    } else if (score.best >= 50) {
      sXBest = this.sX.silver;
    } else if (score.best >= 20) {
      sXBest = this.sX.bronze;
    } else if (score.best >= 10) {
      sXBest = this.sX.iron;
    }
    // draw medal
    if (sXBest != undefined) {
      ctx.drawImage(
        sprite,
        sXBest,
        this.sY,
        this.w,
        this.h,
        57,
        229,
        this.w,
        this.h
      );
    }
  },
};

class Component {
  constructor(sX, sY, width, height, x, y, ...drawStates) {
    this.sX = sX;
    this.sY = sY;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.drawStates = drawStates;
  }

  draw() {
    if (
      this.drawStates.length &&
      !this.drawStates.some((sts) => sts === state.current)
    )
      return;
    ctx.drawImage(
      sprite,
      this.sX,
      this.sY,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

const logo = new Component(0, 0, 190, 44, 49, 120, state.menu, state.score);
const menuBtn = new Component(291, 380, 171, 28, 59, 300, state.menu);
const playBtn = new Component(292, 413, 26, 28, 10, 10, state.game);
const pauseBtn = new Component(324, 413, 26, 28, 10, 10, state.pause);
const scoreBoard = new Component(485, 336, 226, 155, 31, 187, state.score);
const readyMessage = new Component(57, 84, 174, 160, 57, 135, state.ready);
const gameOver = new Component(293, 114, 226, 212, 31, 135, state.over);

let game = {
  draw: function () {
    ctx.clearRect(0, 0, 288, 512);
    ctx.fillStyle = "#73b7c4";
    ctx.fillRect(0, 0, 288, 512);
    // draw elements
    bg.draw();
    pipes.draw();
    fg.draw();
    bird.draw();
    playBtn.draw();
    pauseBtn.draw();
    readyMessage.draw();
    gameOver.draw();
    logo.draw();
    menuBtn.draw();
    scoreBoard.draw();
    score.draw();
    medal.draw();
  },
  update: function () {
    // update elements
    fg.update();
    pipes.update();
    bird.update();
  },
};
// GAME LOOP
function loop() {
  game.update();
  game.draw();
  frames++;
  if (!pause && state.current != state.pause) {
    requestAnimationFrame(loop);
  }
}
loop();

// BUTTON CLICK HANLDER
const btnClickHandler = {
  _isBtnClicked: function (clickX, clickY, left, right, top, bottom) {
    return (
      clickX >= left * viewRatio &&
      clickX <= right * viewRatio &&
      clickY >= top * viewRatio &&
      clickY <= bottom * viewRatio
    );
  },
  start: function (clickX, clickY) {
    if (this._isBtnClicked(clickX, clickY, 59.7, 138.8, 285, 327)) {
      state.current = state.ready;
      bird.y = 200;
      pipes.reset();
      score.value = 0;
      sfxSwooshing.play();
    }
  },
  score: function (clickX, clickY) {
    if (this._isBtnClicked(clickX, clickY, 149.7, 228.8, 285, 327)) {
      state.current = state.score;
      sfxSwooshing.play();
    }
  },
  closeScore: function (clickX, clickY) {
    if (this._isBtnClicked(clickX, clickY, 103.1, 183.1, 300, 341)) {
      state.current = state.menu;
      sfxSwooshing.play();
    }
  },
  pause: function (clickX, clickY) {
    if (this._isBtnClicked(clickX, clickY, 9.7, 34.8, 5, 37)) {
      state.current = state.pause;
      sfxSwooshing.play();
    } else {
      bird.flap();
    }
  },
  resume: function (clickX, clickY) {
    if (this._isBtnClicked(clickX, clickY, 9.7, 34.8, 5, 37)) {
      state.current = state.game;
      sfxSwooshing.play();
      loop();
    }
  },
  gameOverToReady: function (clickX, clickY) {
    if (this._isBtnClicked(clickX, clickY, 57, 136, 300, 345)) {
      state.current = state.ready;
      this._gameOverReset();
    }
  },
  gameOverToMenu: function (clickX, clickY) {
    if (this._isBtnClicked(clickX, clickY, 148, 228, 300, 345)) {
      state.current = state.menu;
      this._gameOverReset();
    }
  },
  _gameOverReset: function () {
    sfxSwooshing.play();
    bird.y = 200;
    pipes.reset();
    score.value = 0;
  },
};

function handleGameEvents(clientX, clientY) {
  // get click location
  let bd = cvs.getBoundingClientRect();
  let clickX = clientX - bd.x;
  let clickY = clientY - bd.y;

  // current state -> action
  switch (state.current) {
    // MENU STATE
    case state.menu:
      btnClickHandler.score(clickX, clickY);
      btnClickHandler.start(clickX, clickY);
      break;
    // READY STATE
    case state.ready:
      state.current = state.game;
      bird.flap();
      break;
    // SCORE BOARD STATE
    case state.score:
      btnClickHandler.closeScore(clickX, clickY);
      break;
    // GAME PLAYING STATE
    case state.game:
      btnClickHandler.pause(clickX, clickY);
      break;
    // GAME PAUSE STATE
    case state.pause:
      btnClickHandler.resume(clickX, clickY);
      break;
    // GAME OVER STATE
    case state.over:
      btnClickHandler.gameOverToReady(clickX, clickY);
      btnClickHandler.gameOverToMenu(clickX, clickY);
  }
}

// GAME EVENT LISTENER
cvs.addEventListener("mousedown", (e) => {
  handleGameEvents(e.clientX, e.clientY);
});
