import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'

// ── Hooks ─────────────────────────────────────────────────────────────────────
const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
  const get = () => values[queries.findIndex(q => matchMedia(q).matches)] ?? defaultValue
  const [value, setValue] = useState<number>(get)
  useEffect(() => {
    const handler = () => setValue(get)
    queries.forEach(q => matchMedia(q).addEventListener('change', handler))
    return () => queries.forEach(q => matchMedia(q).removeEventListener('change', handler))
  }, [])
  return value
}

const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

const preloadImages = async (urls: string[]): Promise<void> => {
  await Promise.all(urls.map(src => new Promise<void>(resolve => {
    const img = new Image(); img.src = src
    img.onload = img.onerror = () => resolve()
  })))
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MasonryItem {
  id: string
  img: string
  url?: string
  height: number
  label?: string
  sublabel?: string
}

interface GridItem extends MasonryItem {
  x: number; y: number; w: number; h: number
}

interface MasonryProps {
  items: MasonryItem[]
  ease?: string
  duration?: number
  stagger?: number
  animateFrom?: 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random'
  scaleOnHover?: boolean
  hoverScale?: number
  blurToFocus?: boolean
  colorShiftOnHover?: boolean
  gap?: number
  onItemClick?: (item: MasonryItem) => void
}

// ── Component ─────────────────────────────────────────────────────────────────
const Masonry: React.FC<MasonryProps> = ({
  items,
  ease = 'power3.out',
  duration = 0.6,
  stagger = 0.05,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false,
  gap = 16,
  onItemClick,
}) => {
  const columns = useMedia(
    ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
    [5, 4, 3, 2], 1
  )
  const [containerRef, { width }] = useMeasure<HTMLDivElement>()
  const [imagesReady, setImagesReady] = useState(false)

  const getInitialPosition = (item: GridItem) => {
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return { x: item.x, y: item.y }
    let dir = animateFrom
    if (animateFrom === 'random') {
      const dirs = ['top', 'bottom', 'left', 'right']
      dir = dirs[Math.floor(Math.random() * dirs.length)] as typeof animateFrom
    }
    switch (dir) {
      case 'top':    return { x: item.x, y: -200 }
      case 'bottom': return { x: item.x, y: window.innerHeight + 200 }
      case 'left':   return { x: -200, y: item.y }
      case 'right':  return { x: window.innerWidth + 200, y: item.y }
      case 'center': return { x: containerRect.width / 2 - item.w / 2, y: containerRect.height / 2 - item.h / 2 }
      default:       return { x: item.x, y: item.y + 100 }
    }
  }

  useEffect(() => {
    preloadImages(items.map(i => i.img)).then(() => setImagesReady(true))
  }, [items])

  const grid = useMemo<GridItem[]>(() => {
    if (!width) return []
    const colHeights = new Array(columns).fill(0)
    const totalGaps = (columns - 1) * gap
    const columnWidth = (width - totalGaps) / columns
    return items.map(child => {
      const col = colHeights.indexOf(Math.min(...colHeights))
      const x = col * (columnWidth + gap)
      const height = child.height / 2
      const y = colHeights[col]
      colHeights[col] += height + gap
      return { ...child, x, y, w: columnWidth, h: height }
    })
  }, [columns, items, width, gap])

  const totalHeight = useMemo(() => {
    if (!grid.length) return 0
    return Math.max(...grid.map(item => item.y + item.h))
  }, [grid])

  const hasMounted = useRef(false)

  useLayoutEffect(() => {
    if (!imagesReady) return
    grid.forEach((item, index) => {
      const sel = `[data-key="${item.id}"]`
      const animProps = { x: item.x, y: item.y, width: item.w, height: item.h }
      if (!hasMounted.current) {
        const start = getInitialPosition(item)
        gsap.fromTo(sel,
          { opacity: 0, x: start.x, y: start.y, width: item.w, height: item.h, ...(blurToFocus && { filter: 'blur(10px)' }) },
          { opacity: 1, ...animProps, ...(blurToFocus && { filter: 'blur(0px)' }), duration: 0.8, ease: 'power3.out', delay: index * stagger }
        )
      } else {
        gsap.to(sel, { ...animProps, duration, ease, overwrite: 'auto' })
      }
    })
    hasMounted.current = true
  }, [grid, imagesReady, stagger, animateFrom, blurToFocus, duration, ease])

  const handleMouseEnter = (id: string, el: HTMLElement) => {
    if (scaleOnHover) gsap.to(`[data-key="${id}"]`, { scale: hoverScale, duration: 0.3, ease: 'power2.out' })
    if (colorShiftOnHover) {
      const overlay = el.querySelector('.masonry-overlay') as HTMLElement
      if (overlay) gsap.to(overlay, { opacity: 0.35, duration: 0.3 })
    }
  }

  const handleMouseLeave = (id: string, el: HTMLElement) => {
    if (scaleOnHover) gsap.to(`[data-key="${id}"]`, { scale: 1, duration: 0.3, ease: 'power2.out' })
    if (colorShiftOnHover) {
      const overlay = el.querySelector('.masonry-overlay') as HTMLElement
      if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 })
    }
  }

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: totalHeight }}>
      {grid.map(item => (
        <div
          key={item.id}
          data-key={item.id}
          className="absolute box-content cursor-pointer"
          style={{ willChange: 'transform, width, height, opacity' }}
          onClick={() => onItemClick ? onItemClick(item) : item.url && window.open(item.url, '_blank', 'noopener')}
          onMouseEnter={e => handleMouseEnter(item.id, e.currentTarget)}
          onMouseLeave={e => handleMouseLeave(item.id, e.currentTarget)}
        >
          <div
            className="relative w-full h-full bg-cover bg-center rounded-2xl overflow-hidden"
            style={{ backgroundImage: `url(${item.img})`, boxShadow: '0 8px 32px -8px rgba(0,0,0,0.18)' }}
          >
            {colorShiftOnHover && (
              <div className="masonry-overlay absolute inset-0 rounded-2xl bg-gradient-to-tr from-pink-500/50 to-sky-500/50 opacity-0 pointer-events-none" />
            )}
            {(item.label || item.sublabel) && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl">
                {item.label && <p className="text-white text-xs font-bold truncate">{item.label}</p>}
                {item.sublabel && <p className="text-white/70 text-[10px] truncate">{item.sublabel}</p>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Masonry
