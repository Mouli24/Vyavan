import {
  motion, MotionValue, useMotionValue, useSpring,
  useTransform, type SpringOptions, AnimatePresence,
} from 'motion/react'
import React, { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react'

export type DockItemData = {
  icon: React.ReactNode
  label: React.ReactNode
  onClick: () => void
  className?: string
  isActive?: boolean
}

export type DockProps = {
  items: DockItemData[]
  className?: string
  distance?: number
  panelHeight?: number
  baseItemSize?: number
  dockHeight?: number
  magnification?: number
  spring?: SpringOptions
  orientation?: 'horizontal' | 'vertical'
}

type DockItemProps = {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  mouseX: MotionValue<number>
  spring: SpringOptions
  distance: number
  baseItemSize: number
  magnification: number
  isActive?: boolean
  orientation?: 'horizontal' | 'vertical'
}

function DockItem({
  children, className = '', onClick, mouseX, spring,
  distance, magnification, baseItemSize, isActive, orientation = 'horizontal',
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isHovered = useMotionValue(0)

  const mouseDistance = useTransform(mouseX, val => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, y: 0, width: baseItemSize, height: baseItemSize }
    if (orientation === 'vertical') return val - rect.y - baseItemSize / 2
    return val - rect.x - baseItemSize / 2
  })

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize])
  const size = useSpring(targetSize, spring)

  return (
    <motion.div
      ref={ref}
      style={{ width: orientation === 'vertical' ? baseItemSize : size, height: orientation === 'vertical' ? size : baseItemSize }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-xl cursor-pointer transition-colors ${
        isActive
          ? 'bg-mfr-peach text-mfr-dark'
          : 'text-mfr-muted hover:bg-mfr-peach/50 hover:text-mfr-dark'
      } ${className}`}
      tabIndex={0}
      role="button"
    >
      {Children.map(children, child =>
        React.isValidElement(child)
          ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, { isHovered })
          : child
      )}
    </motion.div>
  )
}

type DockLabelProps = {
  className?: string
  children: React.ReactNode
  isHovered?: MotionValue<number>
  orientation?: 'horizontal' | 'vertical'
}

function DockLabel({ children, className = '', isHovered, orientation = 'horizontal' }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    if (!isHovered) return
    const unsub = isHovered.on('change', v => setIsVisible(v === 1))
    return () => unsub()
  }, [isHovered])

  const positionClass = orientation === 'vertical'
    ? 'left-full ml-2 top-1/2 -translate-y-1/2'
    : '-top-8 left-1/2 -translate-x-1/2'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.15 }}
          className={`absolute z-50 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold pointer-events-none
            bg-[#1A1A1A] text-white shadow-lg ${positionClass} ${className}`}
          role="tooltip"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

type DockIconProps = {
  className?: string
  children: React.ReactNode
  isHovered?: MotionValue<number>
}

function DockIcon({ children, className = '' }: DockIconProps) {
  return <div className={`flex items-center justify-center ${className}`}>{children}</div>
}

// ── Vertical Dock (for sidebar) ───────────────────────────────────────────────
export function VerticalDock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 44,
  distance = 120,
  baseItemSize = 36,
}: Omit<DockProps, 'panelHeight' | 'dockHeight' | 'orientation'>) {
  const mouseY = useMotionValue(Infinity)

  return (
    <motion.div
      onMouseMove={({ pageY }) => mouseY.set(pageY)}
      onMouseLeave={() => mouseY.set(Infinity)}
      className={`flex flex-col items-start gap-0.5 ${className}`}
      role="toolbar"
    >
      {items.map((item, i) => (
        <SidebarNavItem
          key={i}
          item={item}
          mouseY={mouseY}
          spring={spring}
          distance={distance}
          baseItemSize={baseItemSize}
          magnification={magnification}
        />
      ))}
    </motion.div>
  )
}

// ── Sidebar nav item with icon + always-visible label ─────────────────────────
function SidebarNavItem({
  item, mouseY, spring, distance, baseItemSize, magnification,
}: {
  item: DockItemData
  mouseY: MotionValue<number>
  spring: SpringOptions
  distance: number
  baseItemSize: number
  magnification: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  const mouseDistance = useTransform(mouseY, val => {
    const rect = ref.current?.getBoundingClientRect() ?? { y: 0, height: baseItemSize }
    return val - rect.y - baseItemSize / 2
  })

  const targetHeight = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize])
  const height = useSpring(targetHeight, spring)
  const fontSize = useTransform(height, [baseItemSize, magnification], [13, 14.5])
  const iconScale = useTransform(height, [baseItemSize, magnification], [1, 1.25])

  return (
    <motion.div
      ref={ref}
      style={{ height }}
      onClick={item.onClick}
      className={`w-full flex items-center gap-3 px-3 rounded-xl cursor-pointer transition-colors overflow-hidden ${
        item.isActive
          ? 'bg-mfr-peach text-mfr-dark font-semibold'
          : 'text-mfr-muted hover:bg-mfr-peach/50 hover:text-mfr-dark'
      } ${item.className ?? ''}`}
    >
      <motion.div style={{ scale: iconScale }} className="flex-shrink-0 flex items-center justify-center">
        {item.icon}
      </motion.div>
      <motion.span
        style={{ fontSize }}
        className="truncate font-medium leading-none"
      >
        {item.label}
      </motion.span>
    </motion.div>
  )
}

// ── Horizontal Dock (for topbar) ──────────────────────────────────────────────
export default function Dock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 52,
  distance = 140,
  baseItemSize = 36,
}: DockProps) {
  const mouseX = useMotionValue(Infinity)

  return (
    <motion.div
      onMouseMove={({ pageX }) => mouseX.set(pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`flex items-center gap-1 ${className}`}
      role="toolbar"
    >
      {items.map((item, i) => (
        <DockItem
          key={i}
          onClick={item.onClick}
          className={item.className ?? ''}
          mouseX={mouseX}
          spring={spring}
          distance={distance}
          magnification={magnification}
          baseItemSize={baseItemSize}
          isActive={item.isActive}
          orientation="horizontal"
        >
          <DockIcon>{item.icon}</DockIcon>
          <DockLabel orientation="horizontal">{item.label}</DockLabel>
        </DockItem>
      ))}
    </motion.div>
  )
}
