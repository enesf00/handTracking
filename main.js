const video = document.getElementsByClassName("input_video")[0];
const out = document.getElementsByClassName("output")[0];
const sumDiv = document.getElementById('sum');
const canvasCtx = out.getContext("2d");
const CONFIDENCE_THRESHOLD = 0.9;
const level1 = document.getElementById('level1');
const level2 = document.getElementById('level2');
const level3 = document.getElementById('level3');
const targetDisplay = document.getElementById('targetDisplay');
let targetNumber;
let binaryNumbers = [];
let currentLevel = 0;
const boxes = document.getElementById('fingerBoxes');
const popup1 = document.getElementById('popup1');


window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
  const canvas = document.getElementById('outputCanvas');
  const aspectRatio = canvas.width / canvas.height;

  canvas.style.width = '50vw';
  canvas.style.height = (window.innerWidth * 0.5 / aspectRatio) + 'px';
}

resizeCanvas();

document.getElementById('infoButton').addEventListener('click', function () {
  document.getElementById('popup').style.display = 'block';
});

document.getElementById('closeButton').addEventListener('click', function () {
  document.getElementById('popup').style.display = 'none';
});

document.getElementById('closeButton1').addEventListener('click', function () {
  document.getElementById('popup1').style.display = 'none';
});

function generateTargetNumber() {
  return Math.floor(Math.random() * 1023 + 1);
}

let score = 0; 
const scoreDisplay = document.getElementById('scoreDisplay');
 
let intervalId;
function startGame() {
  targetNumber = generateTargetNumber();
  targetDisplay.textContent = targetNumber;
  targetDisplay.style.display = 'block';
  scoreDisplay.style.display = 'block';

  intervalId = setInterval(() => {
    const userNumber = binaryNumbers.reduce((a, b) => a + b, 0);
    if (userNumber === targetNumber) {
      targetNumber = generateTargetNumber(); 
      targetDisplay.textContent = targetNumber;
      score++;
      scoreDisplay.textContent = score;
    }
  }, 1000 / 24); 
}

function stopGame() {
  clearInterval(intervalId);
}

function setLevel(level) {
  currentLevel = level;
}

let timerId = null;
let timeRemaining = 60;
let scoreDisplay1 = document.getElementById('scoreDisplay1'); 
let highScoreDisplay1 = document.getElementById('highScoreDisplay1');
let levelScore = document.getElementById('levelScore');
let score1, highScore1, levelScore1;

function startTimer(level) {
  document.getElementById('timerDisplay').textContent = timeRemaining;

  timerId = setInterval(function () {
    timeRemaining -= 1;

    document.getElementById('timerDisplay').textContent = timeRemaining;

    if (timeRemaining <= 0) {
      clearInterval(timerId);
      timerId = null;
      timeRemaining = 60;
      enableButtons();

      const highScore = getHighScore(level);
      if (score > highScore) {
        setHighScore(currentLevel, score);
        updateHighScoreDisplay(currentLevel); 
      }
      score1 = score;
      score = 0; 
      targetDisplay.textContent = 0;
      highScore1 = getHighScore(currentLevel);
      levelScore1 = currentLevel;
      document.getElementById('highScoreDisplay').textContent = 0;
      boxes.style.visibility = 'visible';
      currentLevel = 0;
      targetNumber = 0;
      document.getElementById('targetDisplay').textContent = 0;
      document.getElementById('scoreDisplay').textContent = 0;
      popup1.style.display = 'block';
      scoreDisplay1.textContent = score1;
      highScoreDisplay1.textContent = highScore1;
      levelScore.textContent = levelScore1;
      stopGame();

    }
  }, 1000);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    timeRemaining = 60; 
    document.getElementById('timerDisplay').textContent = '60';
  }
}

function getHighScore(level) {
  return localStorage.getItem('highScoreLevel' + level) || 0;
}

function setHighScore(level, score) {
  localStorage.setItem('highScoreLevel' + level, score);
}

function updateHighScoreDisplay(level) {
  document.getElementById('highScoreDisplay').textContent = getHighScore(level);
}

function disableButtons(level) {
  document.querySelectorAll('button').forEach(button => {
    button.disabled = true;
    button.style.cursor = 'default';
    button.style.opacity = 0.5;
    button.classList.add("noHover");

  });
  switch (level) {
    case 1: level1.style.cursor = 'pointer'; level1.style.opacity = 1; break;
    case 2: level2.style.cursor = 'pointer'; level2.style.opacity = 1; break;
    case 3: level3.style.cursor = 'pointer'; level3.style.opacity = 1; break;
  }
}

function enableButtons() {
  document.querySelectorAll('button').forEach(button => {
    button.disabled = false;
    button.style.cursor = 'pointer';
    button.style.opacity = 1;
    button.classList.remove("noHover");
  });
}

level1.addEventListener('click', function () {
  startGame();
  setLevel(1);
  stopTimer();
  startTimer(1);
  disableButtons(1);
  updateHighScoreDisplay(1);
});

level2.addEventListener('click', function () {
  startGame();
  setLevel(2);
  stopTimer();
  startTimer(2); 
  disableButtons(2);
  updateHighScoreDisplay(2);
});

level3.addEventListener('click', function () {
  startGame();
  setLevel(3);
  boxes.style.visibility = 'hidden';
  stopTimer();
  startTimer(3);
  disableButtons(3);
  updateHighScoreDisplay(3);
});


function updateFingerBox(boxId, isVisible) {
  document.getElementById(boxId).innerText = isVisible ? '1' : '0';
}

function onResultsHands(results) {
  document.body.classList.add("loaded");

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, out.width, out.height);

  canvasCtx.drawImage(results.image, 0, 0, out.width, out.height);
  binaryNumbers = [];

  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let index = 0; index < results.multiHandLandmarks.length; index++) {
      const classification = results.multiHandedness[index];
      const isRightHand = classification.label === "Right";
      const landmarks = results.multiHandLandmarks[index];

      const fingerMappingRight = {
        4: 16,
        8: 8,
        12: 4,
        16: 2,
        20: 1
      };

      const fingerMappingRightR = {
        4: 1,
        8: 2,
        12: 4,
        16: 8,
        20: 16
      };

      const fingerMappingLeft = {
        4: 32,
        8: 64,
        12: 128,
        16: 256,
        20: 512
      };

      const fingerMappingLeftR = {
        4: 512,
        8: 256,
        12: 128,
        16: 64,
        20: 32
      };

      const wrist = landmarks[0];
      const thumbTip = landmarks[4];
      const slope = (thumbTip.y - wrist.y) / (thumbTip.x - wrist.x);
      let binary;

      let orientation;
      if (slope > 0) {
        orientation = 'Right';
      } else {
        orientation = 'Left';
      }

      for (let i = 4; i <= 20; i += 4) {
        const distanceTipMidpoint = Math.sqrt(Math.pow(landmarks[i - 3].x - landmarks[i].x, 2) + Math.pow(landmarks[i - 3].y - landmarks[i].y, 2));
        const distanceMidpointBase = Math.sqrt(Math.pow(landmarks[i - 3].x - landmarks[i - 2].x, 2) + Math.pow(landmarks[i - 3].y - landmarks[i - 2].y, 2));
        let distance = (distanceTipMidpoint + distanceMidpointBase) / 2;

        const THUMB_STRETCH_THRESHOLD = 0.15; 

        if (i === 4) { 
          const thumbBase = landmarks[17];
          const thumbTip = landmarks[4];
          const thumbDistance = Math.sqrt(Math.pow(thumbBase.x - thumbTip.x, 2) + Math.pow(thumbBase.y - thumbTip.y, 2));

          if (thumbDistance > THUMB_STRETCH_THRESHOLD) {
            distance = thumbDistance;
          } else {
            distance = 0;
          }
        } else {
          distance = Math.sqrt(Math.pow(landmarks[i - 3].x - landmarks[i].x, 2) + Math.pow(landmarks[i - 3].y - landmarks[i].y, 2));
        }

        const threshold = 0.1;
        binary = isRightHand ? (orientation === 'Right' ? fingerMappingRight[i].toString() : fingerMappingRightR[i].toString()) : (orientation === 'Right' ? fingerMappingLeftR[i].toString() : fingerMappingLeft[i].toString());
        let fingerName;


        if (distance > threshold) {
          let x = landmarks[i].x * out.width - 10;
          let y = landmarks[i].y * out.height - 6;
          canvasCtx.font = "20px Arial";

          switch (true) {
            case ((binary === '1') && (orientation === 'Left')): fingerName = 'Pinky'; break;
            case ((binary === '1') && (orientation === 'Right')): fingerName = 'Pinky'; break;
            case ((binary === '2') && (orientation === 'Left')): fingerName = 'Ring'; break;
            case ((binary === '2') && (orientation === 'Right')): fingerName = 'Ring'; break;
            case ((binary === '4')): fingerName = 'Middle'; break;
            case ((binary === '8') && (orientation === 'Left')): fingerName = 'Index'; break;
            case ((binary === '8') && (orientation === 'Right')): fingerName = 'Index'; break;
            case ((binary === '16') && (orientation === 'Left')): fingerName = 'Thumb'; break;
            case ((binary === '16') && (orientation === 'Right')): fingerName = 'Thumb'; break;
            case ((binary === '32') && (orientation === 'Left')): fingerName = 'Pinky'; break;
            case ((binary === '32') && (orientation === 'Right')): fingerName = 'Pinky'; break;
            case ((binary === '64') && (orientation === 'Left')): fingerName = 'Ring'; break;
            case ((binary === '64') && (orientation === 'Right')): fingerName = 'Ring'; break;
            case ((binary === '128')): fingerName = 'Middle'; break;
            case ((binary === '256') && (orientation === 'Left')): fingerName = 'Index'; break;
            case ((binary === '256') && (orientation === 'Right')): fingerName = 'Index'; break;
            case ((binary === '512') && (orientation === 'Left')): fingerName = 'Thumb'; break;
            case ((binary === '512') && (orientation === 'Right')): fingerName = 'Thumb'; break;
          }
          const boxId = (isRightHand ? 'right' : 'left') + fingerName;
          updateFingerBox(boxId, true);


          if (currentLevel === 1 || currentLevel === 0) {
            canvasCtx.strokeStyle = "black";
            canvasCtx.strokeText(binary, x, y);
            canvasCtx.fillStyle = isRightHand ? "red" : "white";
            canvasCtx.fillText(binary, x, y);
          }

          binaryNumbers.push(parseInt(binary));
          let sum = binaryNumbers.reduce((a, b) => a + b);
          sumDiv.textContent = sum;


        }
        else if (distance <= threshold || distance === 0 || distance === undefined) {
          switch (true) {
            case ((binary === '1') && (orientation === 'Left')): fingerName = 'Pinky'; break;
            case ((binary === '1') && (orientation === 'Right')): fingerName = 'Pinky'; break;
            case ((binary === '2') && (orientation === 'Left')): fingerName = 'Ring'; break;
            case ((binary === '2') && (orientation === 'Right')): fingerName = 'Ring'; break;
            case ((binary === '4')): fingerName = 'Middle'; break;
            case ((binary === '8') && (orientation === 'Left')): fingerName = 'Index'; break;
            case ((binary === '8') && (orientation === 'Right')): fingerName = 'Index'; break;
            case ((binary === '16') && (orientation === 'Left')): fingerName = 'Thumb'; break;
            case ((binary === '16') && (orientation === 'Right')): fingerName = 'Thumb'; break;
            case ((binary === '32') && (orientation === 'Left')): fingerName = 'Pinky'; break;
            case ((binary === '32') && (orientation === 'Right')): fingerName = 'Pinky'; break;
            case ((binary === '64') && (orientation === 'Left')): fingerName = 'Ring'; break;
            case ((binary === '64') && (orientation === 'Right')): fingerName = 'Ring'; break;
            case ((binary === '128')): fingerName = 'Middle'; break;
            case ((binary === '256') && (orientation === 'Left')): fingerName = 'Index'; break;
            case ((binary === '256') && (orientation === 'Right')): fingerName = 'Index'; break;
            case ((binary === '512') && (orientation === 'Left')): fingerName = 'Thumb'; break;
            case ((binary === '512') && (orientation === 'Right')): fingerName = 'Thumb'; break;
          }
          const boxId = (isRightHand ? 'right' : 'left') + fingerName;
          updateFingerBox(boxId, false);
        }
      }

    }
  }
  if (!results.multiHandLandmarks || !results.multiHandedness) {
    sumDiv.textContent = 0;
    const fingers = ['Pinky', 'Ring', 'Middle', 'Index', 'Thumb'];
    const hands = ['right', 'left'];
    for (let hand of hands) {
      for (let finger of fingers) {
        updateFingerBox(hand + finger, false);
      }
    }
  }
  canvasCtx.restore();
}

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.1/${file}`;
  },
});
hands.onResults(onResultsHands);


const videoElement = document.querySelector('.input_video');
const canvas = document.createElement('canvas');
canvas.width = 600;
canvas.height = 480;

const ctx = canvas.getContext('2d');
ctx.translate(canvas.width, 0);
ctx.scale(-1, 1);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    await hands.send({ image: imageData });
  },
  width: 600,
  height: 480,
});
camera.start();

video.style.display = "none";
