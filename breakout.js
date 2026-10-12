var spill,padde,
  baller = [],
  platformer = [],
  intervallID,
  score = 0,
  liv = 2;
var scoreTab = [];

//lyd elementer
var treff = document.getElementById("treff");
var gameover = document.getElementById("gameover");
var spreng = document.getElementById("spreng");
var nyttspill = document.getElementById("nyttspill");
nyttspill.volume = 0.3;
var nestelevel = document.getElementById("nestelevel");
var bakgrunn = document.getElementById("bakgrunn");
var bakgrunn2 = document.getElementById("bakgrunn2");
var bakgrunn3 = document.getElementById("bakgrunn3");
bakgrunn.volume = 0.2;

var spillNr = 1;
var nivaa = 0;

class Spill {
  constructor(fart) {
    this.fart = fart;
    this.hoyde = 650; //høyde - spillebrett, se css
    this.bredde = 1200; // bredde - spillebrett, se css
    this.element = document.getElementById("spillebrett"); //henter spillebrett
  }

  start() {
    //sletter baller og platformer fra eventuelt forrige spill
    if (platformer != null) {
      for (let i = 0; i < platformer.length; i++) {
        platformer[i].element.remove();
      }
    }
    if (baller != null) {
      for (let i = 0; i < baller.length; i++) {
        baller[i].element.remove();
      }
    }
    //tar hensyn til nivå, for bakgrunnsmusikk og score-reset på nivå 1
    if (spillNr == 1) {
      score = 0;
      liv = 2; // 2, fordi vi teller ned til 0. Så er fortsatt 3 liv
      bakgrunn.play();
      nivaa = 0;
    }
    if (spillNr == 2) {
      bakgrunn.pause();
      bakgrunn2.play();
    }
    if (spillNr == 3) {
      bakgrunn2.pause();
      bakgrunn3.play();
    }

    nivaa += 1;

    padde = new Padde();
    baller = [];
    platformer = [];

    spill.leggTilBall();
    spill.leggTilPlatform();
    spill.scoreboard();
    spill.liv();
    spill.nivaa();

    nyttspill.play();

    //start spilloppdatering for å flytte ballene
    intervallID = setInterval(this.sjekkKollisjon, this.fart);
  }

  sjekkKollisjon() {
    for (var i = 0; i < baller.length; i++) {
      baller[i].x += baller[i].speedX;
      baller[i].y += baller[i].speedY;

      //kollisjon, padde og ball
      if (
        baller[i].y + baller[i].element.offsetHeight >= padde.element.offsetTop &&
        baller[i].x >= padde.element.offsetLeft &&
        baller[i].x <= padde.element.offsetLeft + padde.element.offsetWidth
      ) {
        //endrer retning siden padden er truffet
        baller[i].speedY = -baller[i].speedY;
        treff.play(); //lyd
      } else if (baller[i].x + baller[i].element.offsetWidth >= spill.bredde || baller[i].x <= 0) {
        //Endre retning på ballen når den treffer en av sidene
        baller[i].speedX = -baller[i].speedX;
      } else if (baller[i].y <= 0) {
        //Snu ballen når den treffer toppen
        baller[i].speedY = -baller[i].speedY;
      } else if (baller[i].y + baller[i].element.offsetHeight > spill.hoyde) {
        //Spillet avsluttes siden en ball har gått utenfor kanten av spillet
        //tilpasser etter hvor mange liv spiller har
        if (liv > 0) {
          liv -= 1;
          if (baller != null) {
            for (let i = 0; i < baller.length; i++) {
              baller[i].element.remove();
              baller = [];
            }
          }
          //legger til ny ball etter forrige er slettet , oppdater antall liv
          padde = new Padde();
          spill.leggTilBall();
          spill.liv();
        } else {
          spill.gameover();
          //gameover
        }
      }
      //sjekker kollisjon mellom platform og ball
      for (var j = 0; j < platformer.length; j++) {
        if (
          baller[i].x + baller[i].element.offsetWidth >= platformer[j].x &&
          baller[i].x <= platformer[j].x + platformer[j].element.offsetWidth &&
          baller[i].y + baller[i].element.offsetHeight >= platformer[j].y &&
          baller[i].y <= platformer[j].y + platformer[j].element.offsetHeight
        ) {
          //fjerner truffet platform fra DOM og array
          platformer[j].element.remove();
          platformer.splice(j, 1);
          //endrer scoreboard
          score++;
          spill.scoreboard();
          // Endrer retning på ball
          baller[i].speedY = -baller[i].speedY;
          spreng.play(); //lyd ved kollisjon

          //starter nytt nivå når alle platformer er fjernet, alltid 44 platformer i et nivå
          if (score % 44 == 0) {
            clearInterval(intervallID);
            spillNr++;
            spill.start();
          }
        }
      }
      baller[i].element.style.left = baller[i].x + "px";
      baller[i].element.style.top = baller[i].y + "px";
    }
  }
  gameover() {
    clearInterval(intervallID);
    gameover.play(); //lyd
    document.getElementById("liv").innerHTML = "Liv: " + liv; //oppdaterer liv til 0

    //pusher score i en lokal top 10, ikke nok tid til php
    scoreTab.push(score);
    scoreTab.sort((a, b) => b - a); //synkende rekkefølge
    if (scoreTab > 10) {
      scoreTab.slice(0, 10); //beholder bare top 10
    }
    if (typeof Storage !== "undefined") {
      localStorage.setItem("score", JSON.stringify(scoreTab));
    }
    //oppdater scoreboard
    body_onload();
  }
  leggTilBall() {
    //lar ballen komme ut fra samme sted hver gang
    let x = 70;
    let y = 400;
    let speed = 0;
    //justerer fart etter hver level
    if (spillNr == 1) {
      speed = 2;
    } else if (spillNr == 2) {
      speed = 3;
    } else if (spillNr == 3) {
      speed = 4;
    } else {
      speed = 4 + (spillNr - 3); // Nye levler om nødvendig
    }
    baller.push(new Ball(x, y, speed));
  }
  leggTilPlatform() {
    //lager platformer i et grid system. Fyller opp rad på y-akse, så på neste rad
    let x = 0;
    let y = 60;
    // 48 platformer
    for (let i = 1; i <= 48; i++) {
      if (i % 12 == 0) {
        //12 platformer i hver rad
        y += 60;
        x = 0;
      } else {
        platformer.push(new Platform(x, y));
        x += 110;
      }
    }
  }
  //oppdater scoreboard, nivå og antall liv
  scoreboard() {
    document.getElementById("scoreboard").innerHTML = "Score: " + score;
  }
  nivaa() {
    document.getElementById("nivaa").innerHTML = "Nivå: " + nivaa;
  }
  liv() {
    document.getElementById("liv").innerHTML = "Liv: " + (liv + 1);
  }
}

//klasse for padde, hentet fra html element
class Padde {
  constructor() {
    this.flyttLengde = 12;
    this.element = document.getElementById("padde");
    this.element.style.left = 200 + "px";
  }
}

// Klassen Ball
class Ball {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.speedX = speed; //-2 + Math.random() * 4;
    this.speedY = speed; // -2 + Math.random() * -4;
    this.element = document.createElement("div");
    this.element.className = "ball";
    this.element.style.top = this.y + "px";
    this.element.style.left = this.x + "px";
    spill.element.appendChild(this.element);
  }
}
class Platform {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.element = document.createElement("div");
    this.element.className = "platform";
    this.element.style.backgroundColor = this.getRandomColor();
    this.element.style.left = this.x + "px"; // Set left position with x coordinate
    this.element.style.top = this.y + "px"; // Set top position with y coordinate
    spill.element.appendChild(this.element);
  }
  getRandomColor() {
    var min = 50; // Minimumsverdi for hver fargekanal slik at fargen ikke blir svart eller hvit
    var red = Math.floor(Math.random() * (255 - min) + min);
    var green = Math.floor(Math.random() * (255 - min) + min);
    var blue = Math.floor(Math.random() * (255 - min) + min);
    return "rgb(" + red + ", " + green + ", " + blue + ")";
  }
}

// Start spillet
function startSpill() {
  if (intervallID) {
    clearInterval(intervallID);
  }
  spill = new Spill(7);
  spill.start();
}

//paddens bevegelse
let leftMove = false;
let rightMove = false;
function movePaddle() {
  // beveg padde til venstre hvis den er innenfor brettet 
  if (leftMove && padde.element.offsetLeft > 0) {
    padde.element.style.left = padde.element.offsetLeft - padde.flyttLengde + "px";
  }
    // beveg padde til høyre hvis den er innenfor brettet 
  if (rightMove && padde.element.offsetLeft + padde.element.offsetWidth < spill.bredde) {
    padde.element.style.left = padde.element.offsetLeft + padde.flyttLengde + "px";
  }

  requestAnimationFrame(movePaddle);
}
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

// Function to handle keydown events
function keyDownHandler(e) {
  if (e.key === "ArrowLeft") {
    leftMove = true;
  } else if (e.key === "ArrowRight") {
    rightMove = true;
  }
}

// Function to handle keyup events
function keyUpHandler(e) {
  if (e.key === "ArrowLeft") {
    leftMove = false;
  } else if (e.key === "ArrowRight") {
    rightMove = false;
  }
}

// Start paddle movement loop
movePaddle();

//funksjon for pause og play i spillet
function pauseSpill() {
  clearInterval(intervallID);
  document.getElementById("pause").style.backgroundColor = "rgb(209,2,2)";
  document.getElementById("play").style.backgroundColor = "green";
}
function playSpill() {
  if (intervallID) {
    clearInterval(intervallID);
  }
  intervallID = setInterval(spill.sjekkKollisjon, spill.fart);
  document.getElementById("play").style.backgroundColor = "rgb(2,88,2)";
  document.getElementById("pause").style.backgroundColor = "red";
}

//funksjon for å skru av og på musikken
var flagg = false;
function pausemusikk() {
  if (flagg == false) {
    bakgrunn.pause();
    flagg = true;
    document.getElementById("pausemusikk").style.backgroundColor = "black";
    document.getElementById("pausemusikk").style.color = "white";
  } else {
    bakgrunn.play();
    flagg = false;
    document.getElementById("pausemusikk").style.backgroundColor = "snow";
    document.getElementById("pausemusikk").style.color = "black";
  }
}

function body_onload() {
  //henter top 10 fra localstorage
  let top10 = JSON.parse(localStorage.getItem("score")) || [];
  scoreTab = top10;

  visScore(top10);
}
function visScore(top10) {
  //får top 10 lista inn på html
  document.getElementById("scoreboardet").innerHTML = "<th>Nr</th><th>Score</th>";
  for (let i = 0; i < 10; i++) {
    if (top10[i] != undefined) {
      document.getElementById("scoreboardet").innerHTML +=
        "<tr><td>" + (i + 1) + ".</td><td>" + top10[i] + "</td></tr>";
    }
  }
}

document.getElementById("btnStart").addEventListener("click", startSpill);
document.getElementById("pause").addEventListener("click", pauseSpill);
document.getElementById("play").addEventListener("click", playSpill);
document.getElementById("pausemusikk").addEventListener("click", pausemusikk);
