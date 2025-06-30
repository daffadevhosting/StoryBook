---
layout: default
---


<div class="panel-wrapper">
  <div id="storyFormWrapper" class="panel-slide panel-visible">
    {% include formCerita.html %}
  </div>
  <div id="storyBoxWrapper" class="panel-slide panel-hidden-right">
    <div id="chatBox" class="bg-white p-4 rounded shadow-sm" style="min-height: 200px;"></div>
  </div>
</div>

<div class="modal fade" id="storyModal" tabindex="-1">
  <div class="modal-dialog modal-fullscreen">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">📖 Cerita Lyra</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body overflow-auto" style="line-height: 1.7;"></div>
    </div>
  </div>
</div>
