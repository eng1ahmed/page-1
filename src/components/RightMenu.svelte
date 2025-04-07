<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { slide } from 'svelte/transition';
  const dispatch = createEventDispatcher();

  // State management
  let activeMenuItem = 'mic';
  let isMicOn = true;
  let isSpeakerOn = true;
  let isVideoOn = true;
  let isScreenSharing = false;
  let isRecording = false;
  let showVolumeSlider = false;
  let volume = 75;

  // Media stream management
  let micStream = null;
  let videoStream = null;
  let screenStream = null;
  let mediaRecorder = null;
  let recordedChunks = [];

  // Device permissions state
  let hasMicPermission = false;
  let hasVideoPermission = false;

  // Initialize volume slider gradient and check permissions
  onMount(async () => {
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      slider.style.setProperty('--volume-percent', `${volume}%`);
    }

    // Check initial permissions
    try {
      const permissions = await navigator.permissions.query({ name: 'microphone' });
      hasMicPermission = permissions.state === 'granted';
    } catch (e) {
      console.log('Microphone permission check failed:', e);
    }

    try {
      const permissions = await navigator.permissions.query({ name: 'camera' });
      hasVideoPermission = permissions.state === 'granted';
    } catch (e) {
      console.log('Camera permission check failed:', e);
    }
  });

  // Cleanup function for media streams
  function stopStream(stream) {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  // Cleanup on component destroy
  onDestroy(() => {
    stopStream(micStream);
    stopStream(videoStream);
    stopStream(screenStream);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  });

  async function startMicrophone() {
    try {
      if (micStream) {
        stopStream(micStream);
      }
      micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      hasMicPermission = true;
      return true;
    } catch (e) {
      console.log('Microphone start failed:', e);
      hasMicPermission = false;
      return false;
    }
  }

  async function startCamera() {
    try {
      if (videoStream) {
        stopStream(videoStream);
      }
      videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      });
      hasVideoPermission = true;
      
      // Update video element with stream
      const videoElement = document.getElementById('camera-feed');
      if (videoElement) {
        videoElement.srcObject = videoStream;
        videoElement.play();
      }
      
      return true;
    } catch (e) {
      console.log('Camera start failed:', e);
      hasVideoPermission = false;
      return false;
    }
  }

  async function startScreenRecording() {
    try {
      // Get screen stream
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });

      // Create MediaRecorder
      mediaRecorder = new MediaRecorder(screenStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
      });

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `recording-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);

        // Reset recording state and dispatch events
        recordedChunks = [];
        stopStream(screenStream);
        screenStream = null;
        mediaRecorder = null;
        isRecording = false;
        dispatch('recordingToggle', { isRecording });
        
        // Dispatch recording stopped event
        window.dispatchEvent(new Event('recordingStopped'));
      };

      // Start recording
      mediaRecorder.start();
      
      // Dispatch recording started event
      window.dispatchEvent(new Event('recordingStarted'));
      
      return true;
    } catch (e) {
      console.error('Screen recording failed:', e);
      return false;
    }
  }

  function stopScreenRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  async function toggleRecording() {
    isRecording = !isRecording;
    dispatch('recordingToggle', { isRecording });
    
    if (isRecording) {
      const success = await startScreenRecording();
      if (!success) {
        isRecording = false;
        dispatch('recordingToggle', { isRecording });
        dispatch('error', { message: 'Failed to start recording' });
      }
    } else {
      stopScreenRecording();
    }
  }

  const menuItems = [
    { 
      id: 'mic',
      icon: (active) => `<svg viewBox="0 0 24 24" fill="currentColor">
        ${active ? 
          `<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
           <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>` :
          `<path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>`
        }
      </svg>`,
      label: 'Microphone',
      action: async () => {
        try {
          if (!isMicOn) {
            const success = await startMicrophone();
            if (!success) {
              dispatch('error', { message: 'Failed to start microphone' });
              return;
            }
          } else {
            stopStream(micStream);
            micStream = null;
          }
          isMicOn = !isMicOn;
          dispatch('micToggle', { 
            active: isMicOn,
            action: isMicOn ? 'unmute' : 'mute',
            stream: isMicOn ? micStream : null
          });
        } catch (e) {
          console.error('Microphone toggle failed:', e);
          dispatch('error', { message: 'Failed to toggle microphone' });
        }
      }
    },
    { 
      id: 'speaker',
      icon: (active) => {
        if (!active) return `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>`;
        
        if (volume === 0) return `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
        </svg>`;
        
        if (volume < 33) return `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 9v6h4l5 5V4l-5 5H7zm8 .83v4.34c.31-.14.59-.31.86-.49v-3.36c-.27-.18-.55-.35-.86-.49z"/>
        </svg>`;
        
        if (volume < 66) return `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 9v6h4l5 5V4l-5 5H7zm8 .83v4.34c.31-.14.59-.31.86-.49v-3.36c-.27-.18-.55-.35-.86-.49z M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>`;
        
        return `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>`;
      },
      label: 'Speaker',
      action: () => {
        if (showVolumeSlider) {
          isSpeakerOn = !isSpeakerOn;
          dispatch('speakerToggle', { active: isSpeakerOn });
        }
        showVolumeSlider = !showVolumeSlider;
      }
    },
    { 
      id: 'video',
      icon: (active) => `<svg viewBox="0 0 24 24" fill="currentColor">
        ${active ?
          `<path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>` :
          `<path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>`
        }
      </svg>`,
      label: 'Video',
      action: async () => {
        try {
          if (!isVideoOn) {
            const success = await startCamera();
            if (!success) {
              dispatch('error', { message: 'Failed to start camera' });
              return;
            }
          } else {
            stopStream(videoStream);
            videoStream = null;
          }
          isVideoOn = !isVideoOn;
          dispatch('videoToggle', { 
            active: isVideoOn,
            action: isVideoOn ? 'startVideo' : 'stopVideo',
            stream: isVideoOn ? videoStream : null
          });
        } catch (e) {
          console.error('Camera toggle failed:', e);
          dispatch('error', { message: 'Failed to toggle camera' });
        }
      }
    },
    { 
      id: 'screen',
      icon: (active) => `<svg viewBox="0 0 24 24" fill="currentColor">
        ${active ?
          `<path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>` :
          `<path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zm-7-3.53v-2.19c-2.78 0-4.61.85-6 2.72.56-2.67 2.11-5.33 6-5.87V7l4 3.73-4 3.74z"/>`
        }
      </svg>`,
      label: 'Screen Share',
      action: async () => {
        try {
          if (!isScreenSharing) {
            await navigator.mediaDevices.getDisplayMedia({ video: true });
            isScreenSharing = true;
            dispatch('screenShare', { 
              active: true,
              action: 'startSharing'
            });
          } else {
            dispatch('screenShare', { 
              active: false,
              action: 'stopSharing'
            });
            isScreenSharing = false;
          }
        } catch (e) {
          console.log('Screen sharing error:', e);
          dispatch('error', { message: 'Screen sharing failed or was denied' });
          isScreenSharing = false;
        }
      }
    },
    { 
      id: 'record',
      icon: (active) => `<svg viewBox="0 0 24 24" fill="currentColor">
        ${active ? 
          `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>` :
          `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-3.5l6-4.5-6-4.5v9z"/>`
        }
      </svg>`,
      label: 'Record',
      action: toggleRecording
    },
    { 
      id: 'share',
      icon: () => `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 8h-3v2h3v11H6V10h3V8H6c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6-5v9.5l3.5-3.5 1.4 1.4L12 15.3l-4.9-4.9 1.4-1.4L12 12.5V3h2z"/>
      </svg>`,
      label: 'Share',
      action: () => {
        dispatch('share');
      }
    }
  ];

  function handleMenuClick(item) {
    item.action();
  }

  function handleVolumeChange(event) {
    volume = event.target.value;
    const slider = event.target;
    slider.style.setProperty('--volume-percent', `${volume}%`);
    dispatch('volumeChange', { volume: parseInt(volume) });
  }

  // Add click handler for closing volume slider when clicking outside
  function handleClickOutside(event) {
    if (showVolumeSlider && !event.target.closest('.menu-item-container')) {
      showVolumeSlider = false;
    }
  }

  $: activeStates = {
    mic: isMicOn,
    speaker: isSpeakerOn,
    video: isVideoOn,
    screen: isScreenSharing,
    record: isRecording
  };
</script>

<svelte:window on:click={handleClickOutside} />

<div class="right-menu">
  {#if isVideoOn && videoStream}
    <div class="camera-feed-container">
      <video 
        id="camera-feed"
        autoplay
        playsinline
        muted
        class="camera-feed"
      ></video>
    </div>
  {/if}
  
  <nav class="menu-items">
    {#each menuItems as item}
      <div class="menu-item-container">
        <button
          class="menu-item"
          class:active={activeStates[item.id]}
          class:record={item.id === 'record'}
          on:click={() => handleMenuClick(item)}
        >
          <span class="icon">
            {@html item.icon(activeStates[item.id])}
          </span>
        </button>
        
        {#if item.id === 'speaker' && showVolumeSlider}
          <div class="volume-slider" 
            on:click|stopPropagation
            transition:slide>
            <input 
              type="range" 
              min="0" 
              max="100" 
              bind:value={volume}
              on:input={handleVolumeChange}
            />
          </div>
        {/if}
      </div>
    {/each}
  </nav>

  <div class="bottom-icons">
    <button class="menu-item" on:click={() => handleMenuClick(menuItems[menuItems.length - 1])}>
      <span class="icon">
        {@html menuItems[menuItems.length - 1].icon()}
      </span>
    </button>
  </div>
</div>

<style>
  .right-menu {
    width: 72px;
    background-color: #000000;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0;
    box-sizing: border-box;
    height: 100vh;
    border-top-left-radius: 50px;
    border-bottom-left-radius: 50px;
    position: relative;
    overflow: hidden;
    border-radius: 20px;
  }

  .right-menu::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.945) 0%, rgb(0, 0, 0));
    border-top-left-radius: 50px;
    border-bottom-left-radius: 50px;
    pointer-events: none;
    border-radius: 50px;
  }

  .menu-items {
    margin-top: 3rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .menu-item-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .menu-item {
    margin-left: 10px;
    width: 50px;
    height: 50px;
    background: transparent;
    border: none;
    color: #4D4D4D;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.2s ease;
    font-family: "Segoe UI Symbol", "Apple Color Emoji", sans-serif;
    border-radius: 50%;
  }

  .menu-item:hover {
    background-color: rgba(255, 255, 255, 0.03);
    color: #808080;
  }

  .menu-item.active {
    color: #4CAF50;
    background-color: rgba(76, 175, 80, 0.08);
  }

  .menu-item.record {
    color: #ff4444;
  }

  .menu-item.record:hover {
    color: #ff6666;
  }

  .bottom-icons {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    margin-bottom: 1rem;
  }

  .icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon svg {
    width: 100%;
    height: 100%;
  }

  .volume-slider {
    position: absolute;
    right: 60px;
    top: 50%;
    transform: translateY(-50%);
    background: #2a2a2a;
    padding: 15px 10px;
    border-radius: 8px;
    height: 120px;
    width: 40px;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .volume-slider::after {
    content: '';
    position: absolute;
    right: -6px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 6px solid #2a2a2a;
  }

  .volume-slider input[type="range"] {
    width: 120px;
    height: 4px;
    background: #4D4D4D;
    border-radius: 2px;
    outline: none;
    -webkit-appearance: none;
    transform: rotate(-90deg);
    transform-origin: center;
  }

  .volume-slider input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: #4CAF50;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .volume-slider input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .volume-slider input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #4CAF50;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }

  .volume-slider input[type="range"]::-moz-range-thumb:hover {
    transform: scale(1.2);
  }

  .volume-slider input[type="range"]::-webkit-slider-runnable-track {
    background: linear-gradient(to right, #4CAF50 0%, #4CAF50 var(--volume-percent, 50%), #4D4D4D var(--volume-percent, 50%), #4D4D4D 100%);
    border-radius: 2px;
    height: 4px;
  }

  .volume-slider input[type="range"]::-moz-range-track {
    background: linear-gradient(to right, #4CAF50 0%, #4CAF50 var(--volume-percent, 50%), #4D4D4D var(--volume-percent, 50%), #4D4D4D 100%);
    border-radius: 2px;
    height: 4px;
  }

  .camera-feed-container {
    position: fixed;
    top: 0;
    right: 72px;
    width: 320px;
    height: 240px;
    background: #000;
    z-index: 1000;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .camera-feed {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1); /* Mirror the video */
  }
</style> 