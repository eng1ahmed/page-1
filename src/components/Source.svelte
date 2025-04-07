<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  const sources = [
    {
      id: 'camera',
      type: 'camera',
      title: 'Camera',
      thumbnail: '/path-to-camera-thumbnail.jpg'
    },
    {
      id: 'presentation',
      type: 'presentation',
      title: 'Presentation',
      thumbnail: '/path-to-presentation-thumbnail.jpg'
    }
  ];

  function handleDragStart(e, source) {
    e.dataTransfer.setData('sourceType', source.type);
    e.dataTransfer.setData('sourceId', source.id);
    e.dataTransfer.effectAllowed = 'copy';
    dispatch('sourceDrag', { source });
  }
</script>

<div class="source-panel" style="border-radius: 20px;">
  <div class="search-bar">
    <input type="text" placeholder="Search" />
  </div>
  
  <div class="sources-list">
    {#each sources as source}
      <div 
        class="source-item"
        draggable="true"
        on:dragstart={(e) => handleDragStart(e, source)}
      >
        <div class="thumbnail">
          {#if source.type === 'camera'}
            <div class="camera-preview">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </div>
          {:else}
            <div class="presentation-preview">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                <path d="M13.5 13h-6v-2h6v2zm3-4h-9V7h9v2z"/>
              </svg>
            </div>
          {/if}
        </div>
        <div class="title">{source.title}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .source-panel {
    background-color: #1a1a1a;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    border-radius: 20px;
  }

  .search-bar {
    margin-bottom: 1rem;
  }

  .search-bar input {
    width: 100%;
    padding: 0.5rem;
    background-color: #333;
    border: none;
    border-radius: 4px;
    color: white;
  }

  .search-bar input::placeholder {
    color: #666;
  }

  .sources-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .source-item {
    background-color: #2a2a2a;
    border-radius: 8px;
    padding: 0.5rem;
    cursor: move;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: background-color 0.2s;
  }

  .source-item:hover {
    background-color: #333;
  }

  .thumbnail {
    aspect-ratio: 16/9;
    background-color: #333;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
  }

  .camera-preview svg,
  .presentation-preview svg {
    width: 32px;
    height: 32px;
  }

  .title {
    font-size: 0.9rem;
    color: #fff;
    text-align: center;
  }
</style> 