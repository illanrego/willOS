const display = document.getElementById('display');
const startStopButton = document.getElementById('startStopButton');
const resetButton = document.getElementById('resetButton');

let startTime = null;
let elapsedTime = 0;
let intervalId = null;
let running = false;

function updateDisplay() {
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    display.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startStopwatch() {
    if (!running) {
        if (!startTime) {
            startTime = Date.now() - elapsedTime;
        } else {
            startTime = Date.now() - elapsedTime;
        }
        intervalId = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            updateDisplay();
        }, 1000);
        running = true;
        startStopButton.textContent = 'Stop';
        localStorage.setItem('stopwatchStartTime', startTime);
    } else {
        clearInterval(intervalId);
        running = false;
        startStopButton.textContent = 'Start';
    }
}

function resetStopwatch() {
    clearInterval(intervalId);
    startTime = null;
    elapsedTime = 0;
    running = false;
    startStopButton.textContent = 'Start';
    updateDisplay();
    localStorage.removeItem('stopwatchStartTime');
}

startStopButton.addEventListener('click', startStopwatch);
resetButton.addEventListener('click', resetStopwatch);

window.addEventListener('load', () => {
    const storedStartTime = localStorage.getItem('stopwatchStartTime');
    if (storedStartTime) {
        startTime = parseInt(storedStartTime, 10);
        elapsedTime = Date.now() - startTime;
        updateDisplay();
        startStopwatch();
    }
});

