<script setup lang="ts">
import { NCard, NGradientText, NTimeline, NTimelineItem } from 'naive-ui'
</script>

<template>
  <div class="about-container">
    <div class="about-content">
      <n-card class="glass-card">
        <n-gradient-text type="info" :size="48" weight="800">
          關於我們
        </n-gradient-text>
        <p class="intro">
          這是一個致力於提供高品質數位娛樂體驗的實驗性平台。
        </p>
        
        <div class="timeline-section">
          <h3>發展歷程</h3>
          <n-timeline>
            <n-timeline-item type="success" title="專案啟動" content="開始建立基礎架構與視覺風格" time="2026-06-01" />
            <n-timeline-item type="info" title="遊戲大廳上線" content="整合多款經典迷你遊戲" time="2026-06-05" />
            <n-timeline-item type="warning" title="路由系統整合" content="優化導覽體驗與頁面架構" time="2026-06-09" />
          </n-timeline>
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.about-container {
  width: 100%;
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7f9 0%, #e4e7eb 100%);
  padding: 40px 20px;
}

.about-content {
  max-width: 800px;
  width: 100%;
}

.glass-card {
  border-radius: 24px !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05) !important;
  padding: 40px;
}

.intro {
  font-size: 18px;
  color: #666;
  margin: 20px 0 40px;
}

.timeline-section {
  margin-top: 40px;
  text-align: left;
}

.timeline-section h3 {
  margin-bottom: 24px;
  font-size: 24px;
}
</style>
