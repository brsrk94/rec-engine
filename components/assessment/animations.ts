'use client'

import { gsap } from 'gsap'

export function animateAssessmentScreen(root: HTMLElement | null) {
  if (!root) {
    return
  }

  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    gsap.set(root, { clearProps: 'all', opacity: 1 })
    return
  }

  const header = root.firstElementChild
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="card"]'))
  const actions = Array.from(
    root.querySelectorAll<HTMLElement>('form [data-slot="button"]')
  ).filter((button) => !header?.contains(button))

  const timeline = gsap.timeline({
    defaults: { ease: 'power2.out' },
  })

  if (header) {
    timeline.fromTo(
      header,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.55 }
    )
  }

  if (cards.length > 0) {
    timeline.fromTo(
      cards,
      { opacity: 0, y: 24, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 0.56, stagger: 0.08 },
      header ? '-=0.26' : undefined
    )
  }

  if (actions.length > 0) {
    timeline.fromTo(
      actions,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.38, stagger: 0.04 },
      cards.length > 0 ? '-=0.28' : undefined
    )
  }
}
