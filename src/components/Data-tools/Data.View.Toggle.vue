<template>
  <ul
    class="nav nav-pills p-1 border-1 rounded mb-0 nav-pills-main"
    role="tablist"
  >
    <!-- Stats View -->
    <li v-if="showStats" class="nav-item">
      <a
        :class="activeView === 'stats' ? 'active' : ''"
        class="nav-link d-flex align-items-center gap-1"
        href="#"
        @click.prevent="selectView('stats')"
      >
        <Icon
          :icon="
            activeView === 'stats'
              ? 'bxs:bar-chart-alt-2'
              : 'bx:bar-chart-alt-2'
          "
          class="fs-3"
        />
        <div><div>Stats View</div></div>
      </a>
    </li>
    <!-- Table View -->
    <li v-if="showTable" class="nav-item">
      <a
        :class="activeView === 'table' ? 'active' : ''"
        class="nav-link d-flex align-items-center gap-1"
        href="#"
        @click.prevent="selectView('table')"
      >
        <Icon
          :icon="
            activeView === 'table'
              ? 'boxicons:list-square-filled'
              : 'boxicons:list-square'
          "
          class="fs-3"
        />
        <div><div>Table View</div></div>
      </a>
    </li>
    <!-- Map View -->
    <li v-if="showMap" class="nav-item">
      <a
        :class="activeView === 'map' ? 'active' : ''"
        class="nav-link d-flex align-items-center gap-1"
        href="#"
        @click.prevent="selectView('map')"
      >
        <Icon
          :icon="activeView === 'map' ? 'bxs:map' : 'bx:map'"
          class="fs-3"
        />
        <div><div>Map View</div></div>
      </a>
    </li>
    <!-- List View -->
    <li v-if="showList" class="nav-item">
      <a
        :class="activeView === 'list' ? 'active' : ''"
        class="nav-link d-flex align-items-center gap-1"
        href="#"
        @click.prevent="selectView('list')"
      >
        <Icon
          :icon="activeView === 'list' ? 'bxs:list-ul' : 'bx:list-ul'"
          class="fs-3"
        />
        <div><div>List View</div></div>
      </a>
    </li>
    <!-- Calendar View -->
    <li v-if="showCalendar" class="nav-item">
      <a
        :class="activeView === 'calendar' ? 'active' : ''"
        class="nav-link d-flex align-items-center gap-1"
        href="#"
        @click.prevent="selectView('calendar')"
      >
        <Icon
          :icon="activeView === 'calendar' ? 'bxs:calendar' : 'bx:calendar'"
          class="fs-3"
        />
        <div><div>Calendar View</div></div>
      </a>
    </li>
    <!-- Timeline View -->
    <li v-if="showTimeline" class="nav-item">
      <a
        :class="activeView === 'timeline' ? 'active' : ''"
        class="nav-link d-flex align-items-center gap-1"
        href="#"
        @click.prevent="selectView('timeline')"
      >
        <Icon
          :icon="activeView === 'timeline' ? 'bxs:time' : 'bx:time'"
          class="fs-3"
        />
        <div><div>Timeline View</div></div>
      </a>
    </li>
    <!-- Tree View (a hierarchy, e.g. the catalogue's category tree) -->
    <li v-if="showTree" class="nav-item">
      <a
        :class="activeView === 'tree' ? 'active' : ''"
        class="nav-link d-flex align-items-center gap-1"
        href="#"
        @click.prevent="selectView('tree')"
      >
        <Icon
          :icon="activeView === 'tree' ? 'boxicons:sitemap-filled' : 'boxicons:sitemap'"
          class="fs-3"
        />
        <div><div>Tree View</div></div>
      </a>
    </li>
    <!-- Users (the people list; first used by System Users) -->
    <li v-if="showUsers" class="nav-item">
      <a
        :class="activeView === 'users' ? 'active' : ''"
        class="nav-link d-flex align-items-center gap-1"
        href="#"
        @click.prevent="selectView('users')"
      >
        <Icon
          :icon="activeView === 'users' ? 'boxicons:group-filled' : 'boxicons:group'"
          class="fs-3"
        />
        <div><div>Users</div></div>
      </a>
    </li>
    <!-- Role View (one role at a time and what it can do) -->
    <li v-if="showRoles" class="nav-item">
      <a
        :class="activeView === 'roles' ? 'active' : ''"
        class="nav-link d-flex align-items-center gap-1"
        href="#"
        @click.prevent="selectView('roles')"
      >
        <Icon
          :icon="activeView === 'roles' ? 'boxicons:shield-filled' : 'boxicons:shield'"
          class="fs-3"
        />
        <div><div>Role View</div></div>
      </a>
    </li>
    <!-- Matrix View (every permission against every role) -->
    <li v-if="showMatrix" class="nav-item">
      <a
        :class="activeView === 'matrix' ? 'active' : ''"
        class="nav-link d-flex align-items-center gap-1"
        href="#"
        @click.prevent="selectView('matrix')"
      >
        <Icon
          :icon="activeView === 'matrix' ? 'boxicons:grid-9-filled' : 'boxicons:grid-9'"
          class="fs-3"
        />
        <div><div>Matrix View</div></div>
      </a>
    </li>
    <!-- Grid View -->
    <li v-if="showGrid" class="nav-item">
      <a
        :class="activeView === 'grid' ? 'active' : ''"
        class="nav-link d-flex align-items-center gap-1"
        href="#"
        @click.prevent="selectView('grid')"
      >
        <Icon
          :icon="activeView === 'grid' ? 'bxs:grid-alt' : 'bx:grid-alt'"
          class="fs-3"
        />
        <div><div>Grid View</div></div>
      </a>
    </li>
  </ul>
</template>
<script setup>
import { Icon } from '@iconify/vue'
import {
    ref,
    computed,
    onMounted,
    onBeforeUnmount
} from 'vue'

const props = defineProps({ 
    activeView: { type: String, default: 'stats' }, 
    showStats: { type: Boolean, default: true }, 
    showTable: { type: Boolean, default: true }, 
    showMap: { type: Boolean, default: false }, 
    showList: { type: Boolean, default: false }, 
    showCalendar: { type: Boolean, default: false },
     showTimeline: { type: Boolean, default: false }, 
     showGrid: { type: Boolean, default: false },
     // A hierarchy view; first used by the Product Catalogue's category tree (19 Oct 2026)
     showTree: { type: Boolean, default: false },
     // People / roles / permissions; first used by System Users (19 Oct 2026)
     showUsers: { type: Boolean, default: false },
     showRoles: { type: Boolean, default: false },
     showMatrix: { type: Boolean, default: false }
    }) 
    const emit = defineEmits(['update:activeView']) 
    const selectView = (view) => { 
    emit('update:activeView', view) 

    }
</script>

<style scoped>
/*
 * The toggle's own look, copied from the first page that used it
 * (MOHFacilities/moh.facilities.vue, which keeps its copy), so every page
 * that drops the component in gets the same pills without repeating the CSS.
 */
.nav-pills-main {
    border: 1px solid #d5d6d7;
    background-color: #eff2f7;
}

.nav-pills-main .nav-link.active {
    color: #2164f3;
    font-size: 14px;
    font-weight: 600;
    background: #fff;
    border: 1px solid rgba(33, 100, 243, 0.08);
    box-shadow:
        0 2px 4px rgba(0, 0, 0, 0.04),
        0 4px 10px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
    transition: all 0.2s ease;
}

.nav-pills-main .nav-link {
    transition: all 0.2s ease;
}
</style>
