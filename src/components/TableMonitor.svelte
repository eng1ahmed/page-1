<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let monitorItems = [
    {
      id: 'table-1',
      type: 'table',
      title: 'Participants',
      content: {
        headers: ['Name', 'Status', 'Duration', 'Quality'],
        rows: [
          ['John Doe', 'Active', '1:23:45', 'HD'],
          ['Jane Smith', 'Active', '1:20:15', 'HD'],
          ['Mike Johnson', 'Away', '0:45:30', 'SD']
        ]
      }
    },
    {
      id: 'chart-1',
      type: 'chart',
      title: 'Network Quality',
      content: {
        type: 'line',
        data: {
          labels: ['0s', '10s', '20s', '30s', '40s', '50s'],
          values: [95, 92, 98, 85, 90, 95]
        }
      }
    }
  ];

  function handleCloseAll() {
    monitorItems = [];
    dispatch('closeAll');
  }

  function handleSelectAll() {
    dispatch('selectAll', { items: monitorItems });
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  function handleDrop(e) {
    e.preventDefault();
    const sourceType = e.dataTransfer.getData('sourceType');
    const sourceId = e.dataTransfer.getData('sourceId');
    const sourceData = e.dataTransfer.getData('sourceData');

    if (!monitorItems.find(item => item.id === sourceId)) {
      try {
        const content = sourceData ? JSON.parse(sourceData) : null;
        monitorItems = [...monitorItems, {
          id: sourceId,
          type: sourceType,
          title: content?.title || 'New Item',
          content
        }];
      } catch (err) {
        console.error('Failed to add monitor item:', err);
      }
    }
  }
</script>

<div class="monitor-container">
  <div class="header">
    <div class="left">
      <h2>Table Monitor</h2>
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
      <span class="drag-text">Monitor View</span>
      <span class="subtitle">Drag tables and charts</span>
    </div>
  </div>

  <div class="monitor-grid" on:dragover={handleDragOver} on:drop={handleDrop}>
    {#each monitorItems as item (item.id)}
      <div class="monitor-item">
        <div class="item-header">
          <h3>{item.title}</h3>
        </div>
        {#if item.type === 'table'}
          <div class="table-view">
            <table>
              <thead>
                <tr>
                  {#each item.content.headers as header}
                    <th>{header}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each item.content.rows as row}
                  <tr>
                    {#each row as cell}
                      <td>{cell}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else if item.type === 'chart'}
          <div class="chart-view">
            <div class="chart-container">
              <div class="chart-placeholder">
                <div class="chart-line">
                  {#each item.content.data.values as value, i}
                    <div class="chart-point" style="--value: {value}%">
                      <span class="point"></span>
                      <span class="label">{item.content.data.labels[i]}</span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .monitor-container {
    width: 100%;
    height: 100%;
    background-color: white;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
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

  .power-btn {
    color: #ff3e3e;
  }

  .success-btn {
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
  }

  .monitor-grid {
    flex: 1;
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    overflow: auto;
    overflow-x: hidden;
    background-color: #f8f8f8;
  }

  .monitor-item {
    background: white;
    border-radius: 8px;
    border: 1px solid #eee;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .item-header {
    padding: 1rem;
    background-color: #f8f8f8;
    border-bottom: 1px solid #eee;
  }

  .item-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #333;
    font-weight: 500;
  }

  .table-view {
    padding: 1rem;
    overflow: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    background-color: #f8f8f8;
    font-weight: 500;
    color: #333;
  }

  td {
    color: #666;
  }

  .chart-view {
    padding: 1rem;
  }

  .chart-container {
    height: 200px;
    position: relative;
    padding: 1rem;
  }

  .chart-placeholder {
    width: 100%;
    height: 100%;
    position: relative;
    border-bottom: 1px solid #eee;
  }

  .chart-line {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }

  .chart-point {
    position: relative;
    height: var(--value);
    width: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .point {
    width: 8px;
    height: 8px;
    background-color: #4CAF50;
    border-radius: 50%;
    margin-bottom: 4px;
  }

  .label {
    font-size: 0.75rem;
    color: #999;
    transform: rotate(-45deg);
    transform-origin: top left;
    position: absolute;
    bottom: -20px;
    left: 50%;
  }
</style> 