import { useRef, useEffect, useState } from 'react'

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const onResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    let carX = -1000
    const carY = height * 0.42
    const speed = 110
    let done = false
    let raf: number

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const bg = ctx.createLinearGradient(0, 0, 0, height)
      bg.addColorStop(0, '#000')
      bg.addColorStop(1, '#020101')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, width, height)

      if (!done) {
        carX += speed
        if (carX > width + 1200) done = true
      }

      if (!done) {
        const bloom = ctx.createRadialGradient(carX + 100, carY, 0, carX + 100, carY, 420)
bloom.addColorStop(0, 'rgba(255, 50, 10, 1)')
bloom.addColorStop(0.12, 'rgba(255, 20, 0, 0.7)')
bloom.addColorStop(0.3, 'rgba(180, 0, 0, 0.25)')
bloom.addColorStop(0.6, 'rgba(40, 0, 0, 0.05)')
bloom.addColorStop(1, 'rgba(0,0,0,0)')
ctx.fillStyle = bloom
ctx.beginPath()
ctx.arc(carX + 100, carY, 420, 0, Math.PI * 2)
ctx.fill()

        ctx.save()
        ctx.translate(carX, carY)
        ctx.fillStyle = 'rgba(12, 4, 4, 0.65)'
        ctx.beginPath()
        ctx.moveTo(-180, 6)
        ctx.quadraticCurveTo(-90, -34, 5, -40)
        ctx.quadraticCurveTo(120, -42, 210, -2)
        ctx.quadraticCurveTo(220, 18, 170, 26)
        ctx.quadraticCurveTo(15, 42, -80, 30)
        ctx.quadraticCurveTo(-155, 14, -180, 6)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className={`relative z-10 flex flex-col items-center pt-32 pb-16 px-6 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <p className="text-red-600 text-[10px] tracking-[0.8em] uppercase mb-6">Formula 1</p>
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-none">MANAGER</h1>
        <div className="mt-6 h-px w-28 bg-red-600" />
        <p className="mt-6 text-zinc-500 text-xs tracking-[0.4em] uppercase">Saison 2026</p>
      </div>
    </>
  )
}