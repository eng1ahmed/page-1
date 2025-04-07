<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  // Active menu item tracking
  let activeMenuItem = 'display';
  let activeSourceItem = 'camera';
  let searchQuery = '';
  
  const menuItems = [
    { id: 'home', icon: '⌂', label: 'Home' },
    { id: 'display', icon: '▤', label: 'Display' },
    { id: 'monitor', icon: '⚏', label: 'Monitor' },
    { id: 'camera', icon: '◨', label: 'Camera' },
    { id: 'light', icon: '◈', label: 'Light' },
    { id: 'settings', icon: '⚡', label: 'Settings' }
  ];

  const sourceItems = [
    { 
      id: 'camera', 
      label: 'Camera',
      thumbnail: 'https://cdn.prod.website-files.com/61120cb2509e012d40f0b214/66ab37833d8f95c6d57341c2_66ab3698545fb12226f9da2c_How%2520to%2520Share%2520Sound%2520on%2520Zoom%2520Meetings.png',
      preview: 'A conference room with people seated around a table'
    },
    { 
      id: 'presentation', 
      label: 'Thank You!',
      thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPKy78AHsIfSkQV_mPCPN-9uLh6l2pORZPYw&s',
      preview: 'A dark presentation slide with Thank You! text'
    },
    { 
      id: 'conference', 
      label: 'Conference',
      thumbnail: 'https://cdn.prod.website-files.com/61120cb2509e012d40f0b214/66ab37833d8f95c6d57341c2_66ab3698545fb12226f9da2c_How%2520to%2520Share%2520Sound%2520on%2520Zoom%2520Meetings.png',
      preview: 'A grid of video call participants'
    },
    { 
      id: 'sharepoint', 
      label: 'Share Screen',
      thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSp8eSku8I6BZwOeEi96c3B0-xTKHdZkCAibXHvvlLulP6moTfpShogHEpMhXr24LH0AsA&usqp=CAU',
      preview: 'Share your screen',
      isScreenShare: true
    },
    { 
      id: 'dashboard', 
      label: 'Dashboard',
      thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-idC4P_Is8-bn1i3nWJL-yJeTvT4zA1ibAw&s',
      preview: 'A dashboard with graphs and charts'
    }
  ];

  $: filteredSourceItems = searchQuery
    ? sourceItems.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.preview.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sourceItems;

  function handleMenuClick(id) {
    activeMenuItem = id;
    dispatch('menuSelect', { id });
  }

  async function handleSourceClick(id) {
    activeSourceItem = id;
    const item = sourceItems.find(item => item.id === id);
    
    if (item?.isScreenShare) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always"
          },
          audio: false
        });
        dispatch('screenShareStart', { stream });
      } catch (err) {
        console.error('Error accessing screen share:', err);
      }
    } else {
      dispatch('sourceSelect', { id });
    }
  }

  function handleDragStart(e, item) {
    e.dataTransfer.setData('sourceType', item.id);
    e.dataTransfer.setData('sourceId', item.id);
    if (item.isScreenShare) {
      e.dataTransfer.setData('isScreenShare', 'true');
    }
    e.dataTransfer.effectAllowed = 'copy';
  }
</script>
<div class="sidebar-container">
<div class="layout">
  <!-- Left Icon Menu -->
  <div class="icon-menu">
    <div class="logo">
      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTj-AXmtU9GgjOJDLnODhTHuT7JjXBBQ-v6Mw&s" alt="Moktapi Tech" />
    </div>

    <nav class="menu-items">
      {#each menuItems as item}
        <button
          class="menu-item"
          class:active={activeMenuItem === item.id}
          on:click={() => handleMenuClick(item.id)}
        >
          <span class="icon">{item.icon}</span>
        </button>
      {/each}
    </nav>

    <div class="bottom-icons">
      <button class="menu-item">
        <span class="icon">◎</span>
      </button>
      <button class="menu-item exit">
        <span class="icon">⮐</span>
      </button>
    </div>
  </div>

  <!-- Source Panel -->
  <div class="source-panel">
    <h3 class="section-title">Source</h3>
    <div class="search-container">
      <input 
        type="text" 
        placeholder="Search" 
        bind:value={searchQuery}
        class="search-input"
      />
    </div>

    <div class="source-section">
      <div class="source-items">
        {#each sourceItems as item}
          <button
            class="source-item"
            class:active={activeSourceItem === item.id}
            on:click={() => handleSourceClick(item.id)}
            draggable="true"
            on:dragstart={(e) => handleDragStart(e, item)}
          >
            <div class="thumbnail">
              <img 
                src={item.thumbnail} 
                alt={item.preview}
                class="thumbnail-img"
              />
            </div>
            <div class="item-info">
              <span class="label">{item.label}</span>
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>
</div>
<style>
  .sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }
  .layout {
    display: flex;
    height: 99vh;
    position: relative;
    border-radius: 20px;
  }

  /* Icon Menu Styles */
  .icon-menu {
    width: 72px;
    background-color: black;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0;
    box-sizing: border-box;
  }

  .logo {
    width: 40px;
    max-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .logo img {
    width: 100%;
    height: auto;
  }

  .menu-items {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .menu-item {
    margin-left: 10px;
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    color: #ffffff;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.2s ease;
    font-size: 1.2rem;
    font-family: "Segoe UI Symbol", "Apple Color Emoji", sans-serif;
    border-radius: 50%;
    background-color: #4b4b4ba4;
  }

  .menu-item:hover {
    background-color: rgba(255, 255, 255, 0.03);
    color: #808080;
  }

  .menu-item.active {
    color: #ffffff;
    background-color: rgba(2, 136, 6, 0.938);
  }

  .bottom-icons {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    background-color: none !important;
  }

  .exit {
    margin-bottom: 10px;
  }

  .exit .icon {
    transform: rotate(180deg);
    background-color: none !important;
  }

  /* Source Panel Styles */
  .source-panel {
    width: 280px;
    background-color: black;
    padding: 1.5rem 1.5rem 0;
    box-sizing: border-box;
    color: #ffffff;
    border-left: 1px solid #1A1A1A;
    display: flex;
    flex-direction: column;
    height: 99vh;
    border-top-right-radius: 50px 50px;
    border-bottom-right-radius: 20px 50px;
  }

  .search-container {
    position: relative;
    width: 100%;
    flex-shrink: 0;
    margin-bottom: 1.5rem;
  }

  .source-section {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .section-title {
    color: #666666;
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0 0 1rem 0;
    flex-shrink: 0;
  }

  .source-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    overflow-y: auto;
    padding-right: 0.5rem;
    padding-bottom: 1.5rem;
    margin-right: -0.5rem;
    height: 100%;
  }

  /* Scrollbar Styles */
  .source-items::-webkit-scrollbar {
    width: 6px;
  }

  .source-items::-webkit-scrollbar-track {
    background: transparent;
  }

  .source-items::-webkit-scrollbar-thumb {
    background-color: #333333;
    border-radius: 3px;
  }

  .source-items::-webkit-scrollbar-thumb:hover {
    background-color: #444444;
  }

  /* Firefox scrollbar */
  .source-items {
    scrollbar-width: thin;
    scrollbar-color: #333333 transparent;
  }

  .search-input {
    width: 90%;
    padding: 0.75rem 1rem;
    background-color: #0c0c0c;
    border: none;
    border-radius: 8px;
    color: #ffffff;
    font-size: 0.9rem;
  }

  .search-input::placeholder {
    color: #666666;
  }

  .search-input:focus {
    outline: none;
    background-color: #1a1a1a;
  }

  .source-item {
    display: flex;
    flex-direction: column;
    padding: 0;
    background-color: black;
    border: 1px solid transparent;
    border-radius: 8px;
    color: #ffffff;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: all 0.2s ease;
    height: 500px;
  }

  .source-item:hover {
    background-color: #1A1A1A;
    border-color: #333333;
  }

  .source-item.active {
    background-color: #1A1A1A;
    border-color: #4CAF50;
  }

  .thumbnail {
    position: relative;
    width: 100%;
    min-height: 140px;
    background-color: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .thumbnail-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .item-info {
    padding: 0.75rem 1rem;
    background-color: #111111;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .label {
    font-size: 0.875rem;
    color: #FFFFFF;
    font-weight: 500;
  }

  .icon {
    font-size: 1.25rem;
  }

  .thumbnail-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
  }
</style> 