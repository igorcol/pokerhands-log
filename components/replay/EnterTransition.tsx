'use client'

import { useEffect, useState } from 'react'

// Entrada com escala e fade. React não anima desmontagem sem lib, então isso só cobre
// a chegada — monta no estado inicial, um frame depois troca pro estado final, a
// transição CSS cuida do resto. Usado pra ficha de aposta e selo de ação, que
// "aparecem do nada" quando uma street começa ou uma ação nova acontece.
export function EnterTransition({ children }: { children: React.ReactNode }) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className={`transition-all duration-200 ${entered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
    >
      {children}
    </div>
  )
}