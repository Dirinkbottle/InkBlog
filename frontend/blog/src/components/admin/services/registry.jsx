import React from 'react'
import { Bell, Database, Globe, Package, Server, Shield } from 'lucide-react'
import ServiceSlotCard from './ServiceSlotCard'
import DefaultServicePanel from './DefaultServicePanel'
import NotificationServicePanel from './NotificationServicePanel'

function createSlotDefinition({
  id,
  title,
  description,
  scope,
  supportsPanel,
  icon,
  panelRoute,
  panelMenuLabel,
}) {
  return {
    id,
    title,
    description,
    scope,
    supportsPanel,
    icon,
    panelRoute,
    panelMenuLabel,
    renderOverviewCard: ({ slot, controlLock, onAction }) => (
      <ServiceSlotCard
        key={slot.id}
        snapshot={slot.snapshot}
        icon={slot.icon}
        description={slot.description}
        controlLock={controlLock}
        onAction={onAction}
      />
    ),
    renderManagementPage: ({ slot }) => {
      if (slot.id === 'notification') {
        return <NotificationServicePanel key={slot.id} serviceId={slot.id} snapshot={slot.snapshot} />
      }

      return (
        <DefaultServicePanel
          key={slot.id}
          snapshot={slot.snapshot}
          description={slot.description}
        />
      )
    },
  }
}

const slotDefinitions = [
  createSlotDefinition({
    id: 'backend',
    title: 'Backend',
    description: '主业务 API、鉴权与内容写操作入口',
    scope: 'app',
    supportsPanel: false,
    icon: Server,
    panelRoute: '/admin/services/backend',
    panelMenuLabel: 'Backend',
  }),
  createSlotDefinition({
    id: 'notification',
    title: 'Notification',
    description: '负责 delivery、SSE、ACK 与历史重放',
    scope: 'app',
    supportsPanel: true,
    icon: Bell,
    panelRoute: '/admin/services/notification',
    panelMenuLabel: 'Notification',
  }),
  createSlotDefinition({
    id: 'web',
    title: 'Web',
    description: '前端静态资源与同域代理入口',
    scope: 'app',
    supportsPanel: false,
    icon: Globe,
    panelRoute: '/admin/services/web',
    panelMenuLabel: 'Web',
  }),
  createSlotDefinition({
    id: 'mysql',
    title: 'MySQL',
    description: '主数据库容器',
    scope: 'infra',
    supportsPanel: false,
    icon: Database,
    panelRoute: '/admin/services/mysql',
    panelMenuLabel: 'MySQL',
  }),
  createSlotDefinition({
    id: 'redis',
    title: 'Redis',
    description: '缓存与异步状态辅助容器',
    scope: 'infra',
    supportsPanel: false,
    icon: Package,
    panelRoute: '/admin/services/redis',
    panelMenuLabel: 'Redis',
  }),
  createSlotDefinition({
    id: 'core-control',
    title: 'Core Control',
    description: '主控微服务，采集状态并控制容器生命周期',
    scope: 'app',
    supportsPanel: false,
    icon: Shield,
    panelRoute: '/admin/services/core-control',
    panelMenuLabel: 'Core Control',
  }),
]

const slotMap = Object.fromEntries(slotDefinitions.map((slot) => [slot.id, slot]))

export function getRegisteredSlots(snapshots) {
  return slotDefinitions
    .map((slot) => {
      const snapshot = snapshots.find((item) => item.id === slot.id)
      if (!snapshot) return null

      return {
        ...slot,
        snapshot,
      }
    })
    .filter(Boolean)
}

export function getSlotDefinition(serviceId) {
  return slotMap[serviceId] || null
}

export function getPanelSlots(slots) {
  return slots.filter((slot) => slot.supportsPanel)
}

export function renderServiceOverviewCard(slot, context) {
  return slot.renderOverviewCard({ slot, ...context })
}

export function renderServiceManagementPage(slot, context = {}) {
  if (!slot) return null
  return slot.renderManagementPage({ slot, ...context })
}
