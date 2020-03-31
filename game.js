/* jshint esversion: 6 */
// Select CVS
const cvs = document.getElementById("game-canvas");
const ctx = cvs.getContext("2d");
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
  score: 5
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

  draw: function() {
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
  }
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

  draw: function() {
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
  update: function() {
    // move fg 's x by w -> return
    if (state.current == state.game) {
      this.x = (this.x - this.dx) % this.w;
    }
  }
};
// BIRD
const bird = {
  animation: [
    { sX: 528, sY: 128 },
    { sX: 528, sY: 180 },
    { sX: 528, sY: 220 },
    { sX: 528, sY: 128 }
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
    5: 0
  },
  // control bird's movements
  speed: 0,
  gravity: 0.25,
  jump: 5.2,
  // control bird's rotation
  rotation: 0,
  draw: function() {
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
  update: function() {
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
  flap: function() {
    // bird fly up when click
    this.speed = -this.jump;
    this.rotation = -25;
    // flap sfx
    sfxFlap.currentTime = 0;
    sfxFlap.play();
  }
};
// PIPES
const pipes = {
  // top pipe source position
  top: {
    sX: 604,
    sY: 0
  },
  // bottom pipe source position
  bot: {
    sX: 660,
    sY: 0
  },
  w: 52,
  h: 270,
  // gap btw top & bot
  gap: 85,
  // store position of pipes
  position: [
    {
      pX: 288,
      pY: -100
    }
  ],
  // pipe movement
  dX: 2,
  draw: function() {
    this.position.map(pipe => {
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
  update: function() {
    if (state.current == state.game) {
      // loop pipes 's storage
      this.position.map(pipe => {
        // pipe move
        pipe.pX -= this.dX;
        // when pipe's X == 130 -> add new pipe
        if (pipe.pX == 130) {
          this.position.push({
            pX: 288,
            pY: Math.floor(Math.random() * -200)
          });
        }
      });
      // delete old pipes
      if (this.position[0].pX == -52) {
        this.position.shift();
      }
    }
  },
  reset: function() {
    this.position = [
      {
        pX: 288,
        pY: -100
      }
    ];
  }
};
// SCORE
const score = {
  value: 0,
  best: parseInt(localStorage.getItem("flappy-bird-best")) || 0,
  draw: function() {
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
  }
};
// MEDAL
let medal = {
  sX: {
    iron: 524,
    bronze: 572,
    silver: 619,
    gold: 666
  },
  sY: 281,
  w: 44,
  h: 44,
  draw() {
    if (state.current == state.over || state.current == state.score) {
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
    }
  }
};
// MENU (flappy bird title)
const menu = {
  sX: 0,
  sY: 0,
  w: 190,
  h: 44,
  x: 49,
  y: 120,
  draw: function() {
    if (state.current == state.menu || state.current == state.score) {
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
    }
  }
};
// MENU BTN
const menuBtn = {
  sX: 291,
  sY: 380,
  w: 171,
  h: 28,
  x: 59,
  y: 300,
  draw: function() {
    if (state.current == state.menu) {
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
    }
  }
};
// PLAY & PAUSE BUTTON
const playPause = {
  sX: {
    play: 291,
    pause: 324
  },
  sY: 413,
  w: 26,
  h: 28,
  x: 10,
  y: 10,
  draw: function() {
    // playing -> draw pause btn
    if (state.current == state.game) {
      ctx.drawImage(
        sprite,
        this.sX.pause,
        this.sY,
        this.w,
        this.h,
        this.x,
        this.y,
        this.w,
        this.h
      );
    }
    // pause -> draw play btn
    if (state.current == state.pause) {
      ctx.drawImage(
        sprite,
        this.sX.play,
        this.sY,
        this.w,
        this.h,
        this.x,
        this.y,
        this.w,
        this.h
      );
    }
  }
};
// MENU's SCORE BOARD
const scoreBoard = {
  sX: 485,
  sY: 336,
  w: 226,
  h: 155,
  x: 31,
  y: 187,
  draw: function() {
    if (state.current == state.score) {
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
    }
  }
};
// READY MESSAGE
const ready = {
  sX: 57,
  sY: 84,
  w: 174,
  h: 160,
  x: 57,
  y: 135,
  draw: function() {
    if (state.current == state.ready) {
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
    }
  }
};
// GAME OVER
const gameOver = {
  sX: 293,
  sY: 114,
  w: 226,
  h: 212,
  x: 31,
  y: 135,
  draw: function() {
    if (state.current == state.over) {
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
    }
  }
};
// MAIN CONTROL
let game = {
  draw: function() {
    ctx.fillStyle = "#73b7c4";
    ctx.fillRect(0, 0, 288, 512);
    // draw elements
    bg.draw();
    pipes.draw();
    fg.draw();
    bird.draw();
    playPause.draw();
    ready.draw();
    gameOver.draw();
    menu.draw();
    menuBtn.draw();
    scoreBoard.draw();
    score.draw();
    medal.draw();
  },
  update: function() {
    // update elements
    fg.update();
    pipes.update();
    bird.update();
  }
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
// GAME EVENT LISTENER
cvs.addEventListener("click", e => {
  // get click location
  let bd = cvs.getBoundingClientRect();
  let clickX = e.x - bd.x;
  let clickY = e.y - bd.y;
  // current state -> action
  switch (state.current) {
    // MENU STATE
    case state.menu:
      // start btn
      if (clickX >= 59.7 && clickX <= 138.8 && clickY >= 301 && clickY <= 325) {
        state.current = state.ready;
        bird.y = 200;
        pipes.reset();
        score.value = 0;
        sfxSwooshing.play();
      }
      // score btn
      if (
        clickX >= 149.7 &&
        clickX <= 228.8 &&
        clickY >= 300 &&
        clickY <= 327
      ) {
        state.current = state.score;
        sfxSwooshing.play();
      }
      break;
    // READY STATE
    case state.ready:
      state.current = state.game;
      bird.flap();
      break;
    // SCORE BOARD STATE
    case state.score:
      if (
        clickX >= 103.1 &&
        clickX <= 183.1 &&
        clickY >= 314 &&
        clickY <= 341
      ) {
        state.current = state.menu;
        sfxSwooshing.play();
      }
      break;
    // GAME PLAYING STATE
    case state.game:
      if (clickX >= 9.7 && clickX <= 34.8 && clickY >= 10 && clickY <= 37) {
        state.current = state.pause;
        sfxSwooshing.play();
      } else {
        bird.flap();
      }
      break;
    // GAME PAUSE STATE
    case state.pause:
      if (clickX >= 9.7 && clickX <= 34.8 && clickY >= 10 && clickY <= 37) {
        state.current = state.game;
        sfxSwooshing.play();
        loop();
      }
      break;
    // GAME OVER STATE
    case state.over:
      if (clickX >= 57 && clickX <= 136 && clickY >= 316 && clickY <= 342) {
        state.current = state.ready;
        sfxSwooshing.play();
        bird.y = 200;
        pipes.reset();
        score.value = 0;
      }
      if (clickX >= 148 && clickX <= 228 && clickY >= 316 && clickY <= 342) {
        state.current = state.menu;
        sfxSwooshing.play();
        bird.y = 200;
        pipes.reset();
        score.value = 0;
      }
  }
});
