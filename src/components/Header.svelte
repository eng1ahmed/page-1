<script>
  import { onDestroy } from 'svelte';

  let seconds = 0;
  let minutes = 0;
  let timerInterval;
  export let isRecording = false;

  function formatTime(num) {
    return num.toString().padStart(2, '0');
  }

  $: time = `${formatTime(minutes)}:${formatTime(seconds)}`;

  // Listen for recording events
  window.addEventListener('recordingStarted', () => {
    startTimer();
  });

  window.addEventListener('recordingStopped', () => {
    stopTimer();
  });

  function startTimer() {
    if (!timerInterval) {
      timerInterval = setInterval(() => {
        seconds += 1;
        if (seconds >= 60) {
          minutes += 1;
          seconds = 0;
        }
      }, 1000);
    }
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      seconds = 0;
      minutes = 0;
    }
  }

  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    // Clean up event listeners
    window.removeEventListener('recordingStarted', startTimer);
    window.removeEventListener('recordingStopped', stopTimer);
  });
</script>

<div class="header">
  <div class="left">
    <h2>Displays</h2>
  </div>
  <div class="right">
    <div class="recording-status">
      <span class="rec-dot" class:active={isRecording}></span>
      <span>Rec</span>
    </div>
    <div class="timer">{time}</div>
  </div>
</div>

<style>
  .header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
  }

  .left h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .recording-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #ff0000;
  }

  .rec-dot {
    width: 8px;
    height: 8px;
    background-color: #ff0000;
    border-radius: 50%;
    opacity: 0.5;
    transition: opacity 0.3s ease;
  }

  .rec-dot.active {
    opacity: 1;
  }

  .timer {
    color: #333;
    min-width: 55px;
  }
</style> 