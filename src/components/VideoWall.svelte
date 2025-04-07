<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  // Initial items that show when the application loads
  let videoWallItems = [
    {
      id: 'presentation',
      type: 'presentation',
      stream: null,
      videoElement: null,
      thumbnail: '/thank-you-slide.jpg', // We'll need to ensure this image exists
      content: {
        title: 'Thank You!',
        subtitle: '@company.name     www.company.com     (123) 456-7890'
      },
      position: { x: 0, y: 0 },
      size: { width: 300, height: 200 }
    },
  ];

  let draggedItem = null;
  let resizingItem = null;
  let dragOffset = { x: 0, y: 0 };
  let wallRef;
  let wallHeight = 600; // Default height
  let isResizingWall = false;
  let initialY = 0;
  let initialHeight = 0;

  // Add new functions for button actions
  function handleSelectAll() {
    dispatch('selectAll', { items: videoWallItems });
  }

  async function handleCloseAll() {
    // Stop all video streams before removing (except presentation)
    for (const item of videoWallItems) {
      if (item.type !== 'presentation') {  // Skip presentation items
        if (item.stream) {
          item.stream.getTracks().forEach(track => track.stop());
        }
        if (item.videoElement) {
          item.videoElement.srcObject = null;
        }
      }
    }
    
    // Keep only presentation items
    videoWallItems = videoWallItems.filter(item => item.type === 'presentation');
    dispatch('closeAll');
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  function startDragging(e, item) {
    if (e.target.classList.contains('resize-handle')) return;
    
    draggedItem = item;
    const rect = e.target.getBoundingClientRect();
    dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  // Add helper function to check for collision
  function isColliding(rect1, rect2) {
    return !(rect1.x + rect1.width <= rect2.x ||
             rect1.x >= rect2.x + rect2.width ||
             rect1.y + rect1.height <= rect2.y ||
             rect1.y >= rect2.y + rect2.height);
  }

  // Add function to find nearest valid position
  function findNearestValidPosition(newRect, items, currentItemId) {
    const otherItems = items.filter(item => item.id !== currentItemId);
    
    // If no collision, return original position
    if (!otherItems.some(item => isColliding(newRect, {
      x: item.position.x,
      y: item.position.y,
      width: item.size.width,
      height: item.size.height
    }))) {
      return { x: newRect.x, y: newRect.y };
    }

    // Search for nearest valid position
    const gridSize = 10; // Grid size for position search
    let minDistance = Infinity;
    let bestPosition = { x: newRect.x, y: newRect.y };

    // Search in expanding circles
    for (let radius = gridSize; radius < Math.max(wallRef.clientWidth, wallRef.clientHeight); radius += gridSize) {
      for (let angle = 0; angle < 360; angle += 15) {
        const testX = newRect.x + radius * Math.cos(angle * Math.PI / 180);
        const testY = newRect.y + radius * Math.sin(angle * Math.PI / 180);

        // Ensure position is within wall boundaries
        if (testX < 0 || testY < 0 || 
            testX + newRect.width > wallRef.clientWidth || 
            testY + newRect.height > wallRef.clientHeight) {
          continue;
        }

        const testRect = {
          x: testX,
          y: testY,
          width: newRect.width,
          height: newRect.height
        };

        // Check if this position collides with any other item
        const hasCollision = otherItems.some(item => isColliding(testRect, {
          x: item.position.x,
          y: item.position.y,
          width: item.size.width,
          height: item.size.height
        }));

        if (!hasCollision) {
          const distance = Math.sqrt(
            Math.pow(testX - newRect.x, 2) + 
            Math.pow(testY - newRect.y, 2)
          );

          if (distance < minDistance) {
            minDistance = distance;
            bestPosition = { x: testX, y: testY };
          }
        }
      }

      // If we found a valid position, use it
      if (minDistance !== Infinity) {
        break;
      }
    }

    return bestPosition;
  }

  // Modify handleDrag function
  function handleDrag(e) {
    if (!draggedItem) return;
    
    const wallRect = wallRef.getBoundingClientRect();
    const rawX = e.clientX - wallRect.left - dragOffset.x;
    const rawY = e.clientY - wallRect.top - dragOffset.y;
    
    // Constrain to wall boundaries including current height
    const x = Math.max(0, Math.min(rawX, wallRect.width - draggedItem.size.width));
    const y = Math.max(0, Math.min(rawY, wallHeight - draggedItem.size.height));
    
    // Find nearest valid position
    const newPosition = findNearestValidPosition(
      {
        x,
        y,
        width: draggedItem.size.width,
        height: draggedItem.size.height
      },
      videoWallItems,
      draggedItem.id
    );
    
    videoWallItems = videoWallItems.map(item => 
      item.id === draggedItem.id 
        ? { ...item, position: newPosition }
        : item
    );

    // Log position for debugging
    console.log(`Source "${draggedItem.id}" position:`, newPosition);
  }

  function stopDragging() {
    if (draggedItem) {
      const item = videoWallItems.find(i => i.id === draggedItem.id);
      console.log(`Source "${draggedItem.id}" final position:`, {
        position: item.position,
        size: item.size,
        type: item.type
      });
    }
    draggedItem = null;
  }

  function startResizing(e, item, direction) {
    e.stopPropagation();
    resizingItem = { item, direction };
    dragOffset = {
      x: e.clientX,
      y: e.clientY
    };
    console.log('Started resizing:', { id: item.id, direction });
  }

  function handleResize(e) {
    if (!resizingItem) return;
    
    const dx = e.clientX - dragOffset.x;
    const dy = e.clientY - dragOffset.y;
    dragOffset = { x: e.clientX, y: e.clientY };
    
    const { item, direction } = resizingItem;
    const minSize = 200; // Minimum size for screen share
    const maxSize = {
      width: wallRef.clientWidth,
      height: wallRef.clientHeight
    };
    
    videoWallItems = videoWallItems.map(vItem => {
      if (vItem.id !== item.id) return vItem;
      
      const newSize = { ...vItem.size };
      const newPosition = { ...vItem.position };
      
      // Calculate new dimensions with constraints
      if (direction.includes('e')) {
        newSize.width = Math.min(
          maxSize.width - vItem.position.x,
          Math.max(minSize, vItem.size.width + dx)
        );
      }
      if (direction.includes('w')) {
        const newWidth = Math.min(
          vItem.position.x + vItem.size.width,
          Math.max(minSize, vItem.size.width - dx)
        );
        if (newWidth !== vItem.size.width) {
          newPosition.x = vItem.position.x + (vItem.size.width - newWidth);
          newSize.width = newWidth;
        }
      }
      if (direction.includes('s')) {
        newSize.height = Math.min(
          maxSize.height - vItem.position.y,
          Math.max(minSize, vItem.size.height + dy)
        );
      }
      if (direction.includes('n')) {
        const newHeight = Math.min(
          vItem.position.y + vItem.size.height,
          Math.max(minSize, vItem.size.height - dy)
        );
        if (newHeight !== vItem.size.height) {
          newPosition.y = vItem.position.y + (vItem.size.height - newHeight);
          newSize.height = newHeight;
        }
      }
      
      // Check for collisions with other items
      const newRect = {
        x: newPosition.x,
        y: newPosition.y,
        width: newSize.width,
        height: newSize.height
      };
      
      const hasCollision = videoWallItems.some(other => 
        other.id !== vItem.id && isColliding(newRect, {
          x: other.position.x,
          y: other.position.y,
          width: other.size.width,
          height: other.size.height
        })
      );
      
      // Only apply new size if there's no collision
      if (!hasCollision) {
        console.log('Resizing:', { id: vItem.id, size: newSize, position: newPosition });
        return { ...vItem, size: newSize, position: newPosition };
      }
      
      return vItem;
    });
  }

  function stopResizing() {
    if (resizingItem) {
      console.log('Stopped resizing:', { 
        id: resizingItem.item.id, 
        finalSize: videoWallItems.find(i => i.id === resizingItem.item.id)?.size 
      });
    }
    resizingItem = null;
  }

  // Modify handleDrop function
  async function handleDrop(e) {
    e.preventDefault();
    const sourceType = e.dataTransfer.getData('sourceType');
    const sourceId = e.dataTransfer.getData('sourceId');
    const isScreenShare = e.dataTransfer.getData('isScreenShare') === 'true';

    if (!videoWallItems.find(item => item.id === sourceId)) {
      let stream = null;

      if (sourceType === 'camera') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: true
          });
        } catch(err) {
          console.error('Failed to get camera:', err);
        }
      } else if (sourceType === 'sharepoint' || sourceType === 'screen' || isScreenShare) {
        try {
          // Request screen sharing with audio option
          stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: {
              cursor: "always",
              displaySurface: "monitor"
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            }
          });
          
          // Handle stream ending (user stops sharing)
          stream.getVideoTracks()[0].onended = () => {
            console.log('Screen sharing stopped');
            videoWallItems = videoWallItems.filter(item => item.id !== sourceId);
          };

          // Log active tracks
          console.log('Screen share tracks:', {
            video: stream.getVideoTracks().length,
            audio: stream.getAudioTracks().length
          });
        } catch(err) {
          console.error('Failed to start screen sharing:', err);
        }
      }

      if (stream || sourceType === 'presentation') {
        const wallRect = wallRef.getBoundingClientRect();
        const rawX = e.clientX - wallRect.left;
        const rawY = e.clientY - wallRect.top;
        
        // Make sure the drop position is within the current wall height
        const y = Math.min(rawY, wallHeight - 300); // 300 is minimum item height
        
        const newItemSize = { width: 400, height: 300 };
        
        // Find valid position for new item
        const validPosition = findNearestValidPosition(
          {
            x: rawX,
            y,
            width: newItemSize.width,
            height: newItemSize.height
          },
          videoWallItems,
          sourceId
        );

      const newItem = {
        id: sourceId,
        type: sourceType,
        stream,
        videoElement: null,
          position: validPosition,
          size: newItemSize
        };

        console.log('Adding new item at position:', validPosition);
      videoWallItems = [...videoWallItems, newItem];
        dispatch('sourceAdded', { sourceId, sourceType });
      }
    }
  }

  function handleVideoRef(element, item) {
    if (element && item.stream) {
      console.log('Setting up video element for:', item.id);
      element.srcObject = item.stream;
      element.muted = true; // Mute by default to prevent audio feedback
      
      // Add controls for screen share
      if (item.type === 'sharepoint' || item.type === 'screen') {
        element.controls = true;
      }
      
      element.play().catch(err => console.error('Failed to play video:', err));
    }
  }

  function startWallResize(e) {
    isResizingWall = true;
    initialY = e.clientY;
    initialHeight = wallHeight;
    e.preventDefault();
  }

  function handleWallResize(e) {
    if (!isResizingWall) return;
    
    const dy = e.clientY - initialY;
    const minHeight = 300; // Minimum wall height
    const maxHeight = window.innerHeight - 100; // Maximum wall height (leaving some space)
    
    wallHeight = Math.min(maxHeight, Math.max(minHeight, initialHeight + dy));
    console.log('Video wall height:', wallHeight);
  }

  function stopWallResize() {
    isResizingWall = false;
  }
</script>

<div class="video-wall-container">
  <div class="header">
    <div class="left">
      <div class="buttons">
        <button class="control-btn power-btn" on:click={handleCloseAll}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
          </svg>
        </button>
        <button class="control-btn success-btn" on:click={handleSelectAll}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="right">
      <span class="drag-text">Video Wall</span>
      <span class="subtitle">Drag from sources</span>
    </div>
  </div>

  <div 
    class="video-wall" 
    bind:this={wallRef}
    on:dragover={handleDragOver} 
    on:drop={handleDrop}
    on:mousemove={handleDrag}
    on:mousemove={handleResize}
    on:mouseup={() => {
      stopDragging();
      stopResizing();
    }}
  >
    {#each videoWallItems as item (item.id)}
      <div
        class="video-item"
        style="
          position: absolute;
          left: {item.position.x}px;
          top: {item.position.y}px;
          width: {item.size.width}px;
          height: {item.size.height}px;
        "
        on:mousedown={(e) => startDragging(e, item)}
      >
        {#if item.type === 'camera' || item.type === 'screen' || item.type === 'sharepoint'}
          <div class="video-container">
            <video 
              autoplay 
              playsinline
              muted={item.type !== 'sharepoint'} 
              bind:this={item.videoElement}
              use:handleVideoRef={item}
              class="video-element"
            ></video>
            {#if item.type === 'sharepoint' || item.type === 'screen'}
              <div class="screen-share-overlay">
                <span class="screen-share-label">Screen Share</span>
                <button 
                  class="audio-toggle"
                  on:click={() => {
                    if (item.videoElement) {
                      item.videoElement.muted = !item.videoElement.muted;
                    }
                  }}
                >
                  {item.videoElement?.muted ? '🔇' : '🔊'}
                </button>
              </div>
            {/if}
            <!-- Resize handles -->
            <div class="resize-handle nw" on:mousedown={(e) => startResizing(e, item, 'nw')}></div>
            <div class="resize-handle n" on:mousedown={(e) => startResizing(e, item, 'n')}></div>
            <div class="resize-handle ne" on:mousedown={(e) => startResizing(e, item, 'ne')}></div>
            <div class="resize-handle e" on:mousedown={(e) => startResizing(e, item, 'e')}></div>
            <div class="resize-handle se" on:mousedown={(e) => startResizing(e, item, 'se')}></div>
            <div class="resize-handle s" on:mousedown={(e) => startResizing(e, item, 's')}></div>
            <div class="resize-handle sw" on:mousedown={(e) => startResizing(e, item, 'sw')}></div>
            <div class="resize-handle w" on:mousedown={(e) => startResizing(e, item, 'w')}></div>
          </div>
        {:else if item.type === 'presentation'}
          <div class="presentation">
            <div class="thank-you-slide">
              <div class="thank-you-content">
                <h1 class="thank-you-title">Thank You!</h1>
                <div class="decorative-line"></div>
                <div class="company-info">
                  <div class="info-row">
                    <span class="text">www.company.com</span>
                  </div>
                  <div class="info-row">
                    <span class="text">contact@company.com</span>
                  </div>
                  <div class="info-row">
                    <span class="text">(123) 456-7890</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- Add resize handles for presentation -->
            <div class="resize-handle nw" on:mousedown={(e) => startResizing(e, item, 'nw')}></div>
            <div class="resize-handle n" on:mousedown={(e) => startResizing(e, item, 'n')}></div>
            <div class="resize-handle ne" on:mousedown={(e) => startResizing(e, item, 'ne')}></div>
            <div class="resize-handle e" on:mousedown={(e) => startResizing(e, item, 'e')}></div>
            <div class="resize-handle se" on:mousedown={(e) => startResizing(e, item, 'se')}></div>
            <div class="resize-handle s" on:mousedown={(e) => startResizing(e, item, 's')}></div>
            <div class="resize-handle sw" on:mousedown={(e) => startResizing(e, item, 'sw')}></div>
            <div class="resize-handle w" on:mousedown={(e) => startResizing(e, item, 'w')}></div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .video-wall-container {
    width: 100%;
    height: 100%;
    background-color: white;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: white;
    border-bottom: 1px solid #eee;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #333;
    font-weight: 500;
  }

  .buttons {
    display: flex;
    gap: 0.5rem;
  }

  .control-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: #666;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .control-btn:hover {
    background-color: #f5f5f5;
  }

  .power-btn {
    color: #ff3e3e;
  }

  .power-btn:hover {
    background-color: rgba(255, 62, 62, 0.1);
    color: #ff3e3e;
  }

  .success-btn {
    color: #4CAF50;
  }

  .success-btn:hover {
    background-color: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .drag-text {
    color: #333;
    font-size: 1rem;
    font-weight: 500;
  }

  .subtitle {
    color: #999;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  .video-wall {
    position: relative;
    flex: 1;
    padding: 1rem;
    background-color: white;
    overflow: hidden;
  }

  .video-item {
    position: absolute;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    cursor: move;
    max-height: calc(100% - 2rem); /* Account for padding */
    max-width: calc(100% - 2rem);
  }

  .video-item video,
  .video-item .presentation {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .resize-handle {
    position: absolute;
    background: rgba(255, 255, 255, 0.2);
    z-index: 10;
  }

  .resize-handle:hover {
    background: rgba(255, 255, 255, 0.4);
  }

  .resize-handle.n {
    top: 0;
    left: 8px;
    right: 8px;
    height: 8px;
    cursor: n-resize;
  }

  .resize-handle.e {
    top: 8px;
    right: 0;
    bottom: 8px;
    width: 8px;
    cursor: e-resize;
  }

  .resize-handle.s {
    bottom: 0;
    left: 8px;
    right: 8px;
    height: 8px;
    cursor: s-resize;
  }

  .resize-handle.w {
    top: 8px;
    left: 0;
    bottom: 8px;
    width: 8px;
    cursor: w-resize;
  }

  .resize-handle.nw,
  .resize-handle.ne,
  .resize-handle.se,
  .resize-handle.sw {
    width: 12px;
    height: 12px;
  }

  .resize-handle.nw {
    top: 0;
    left: 0;
    cursor: nw-resize;
  }

  .resize-handle.ne {
    top: 0;
    right: 0;
    cursor: ne-resize;
  }

  .resize-handle.se {
    bottom: 0;
    right: 0;
    cursor: se-resize;
  }

  .resize-handle.sw {
    bottom: 0;
    left: 0;
    cursor: sw-resize;
  }

  .screen-share-overlay {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    padding: 8px 12px;
    border-radius: 6px;
    transition: opacity 0.3s;
  }

  .video-container:not(:hover) .screen-share-overlay {
    opacity: 0;
  }

  .screen-share-label {
    color: white;
    font-size: 14px;
    font-weight: 500;
  }

  .audio-toggle {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .audio-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .presentation {
    position: relative; /* Add this to make resize handles position correctly */
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000000;
    width: 100%;
    height: 100%;
    color: white;
    overflow: hidden;
  }

  .thank-you-slide {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5%;
  }

  .thank-you-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2rem;
  }

  .thank-you-title {
    font-size: clamp(24px, calc(100vw * 0.05), 120px);
    margin-bottom: 1rem;
  }

  .decorative-line {
    width: clamp(40px, 15%, 100px);
    height: clamp(1px, 0.3vh, 3px);
    background: white;
    margin: clamp(10px, 3vh, 30px) auto;
  }

  .company-info {
    margin-top: 2rem;
    width: 100%;
    text-align: center;
  }

  .info-row {
    font-size: clamp(12px, calc(100vw * 0.02), 36px);
    margin: 0.5rem 0;
  }

  .text {
    font-family: 'Segoe UI', system-ui, sans-serif;
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @container (max-aspect-ratio: 1/1) {
    .thank-you-content {
      gap: 2vh;
    }

    .thank-you-title {
      font-size: clamp(20px, calc(100vw * 0.06), 80px);
    }

    .info-row {
      font-size: clamp(10px, calc(100vw * 0.025), 24px);
    }
  }

  @container (min-aspect-ratio: 2/1) {
    .thank-you-content {
      gap: 1vh;
    }

    .thank-you-title {
      font-size: clamp(20px, calc(100vh * 0.15), 80px);
    }

    .info-row {
      font-size: clamp(10px, calc(100vh * 0.05), 24px);
    }
  }

  .conference-grid {
    width: 100%;
    height: 100%;
    background-color: #1a1a1a;
    padding: 0.5rem;
  }

  .participants-grid {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .participant-cell {
    background-color: #2a2a2a;
    border-radius: 4px;
    width: 100%;
    height: 100%;
  }

  .dashboard {
    width: 100%;
    height: 100%;
    background-color: white;
    padding: 1rem;
  }

  .dashboard img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .sharepoint-item {
    width: 100%;
    height: 100%;
    background-color: white;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #eee;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .sharepoint-item:hover {
    border-color: #0078d4;
    box-shadow: 0 2px 8px rgba(0, 120, 212, 0.1);
  }

  .document-preview, .folder-preview {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .document-icon, .folder-icon {
    color: #0078d4;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .folder-icon {
    color: #ffd700;
  }

  .document-info, .folder-info {
    text-align: center;
  }

  .document-info h3, .folder-info h3 {
    margin: 0;
    font-size: 1rem;
    color: #333;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .document-info p, .folder-info p {
    margin: 0;
    font-size: 0.875rem;
    color: #666;
  }

  .file-type {
    display: inline-block;
    padding: 2px 6px;
    background-color: #f0f0f0;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #666;
    margin-top: 0.5rem;
  }

  .document-icon svg {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .video-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
  }

  .video-element {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }

  /* Make resize handles more visible on hover */
  .video-container:hover .resize-handle {
    opacity: 1;
  }

  .video-container:not(:hover) .resize-handle {
    opacity: 0;
  }

  .wall-resize-handle {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 12px;
    background: transparent;
    cursor: ns-resize;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    transition: background-color 0.2s;
  }

  .wall-resize-handle:hover,
  .wall-resize-handle:active {
    background: rgba(0, 0, 0, 0.05);
  }

  .resize-indicator {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .resize-dots {
    display: flex;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .resize-dots span {
    width: 4px;
    height: 4px;
    background-color: #666;
    border-radius: 50%;
    opacity: 0.5;
  }

  .wall-resize-handle:hover .resize-dots span {
    opacity: 0.8;
  }

  /* Make resize handle more visible on dark backgrounds */
  .wall-resize-handle::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
    bottom: 0;
  }

  /* Add a subtle highlight effect when resizing */
  .video-wall-container.resizing {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Show resize handles on hover */
  .presentation:hover .resize-handle {
    opacity: 1;
  }

  .presentation:not(:hover) .resize-handle {
    opacity: 0;
  }
</style> 