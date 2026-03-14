import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { MapPin, Users, Heart, X, Sparkles, Home, ChevronLeft, Plane, TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ============ 假数据 ============
const destinations = [
  {
    id: 1,
    city: '京都',
    country: '日本',
    image: '/images/cities/京都.png',
    gradient: 'from-[#f8e0e0] via-[#f0c8c8] to-[#e8b0b0]',
    textColor: 'text-[#3a2a2a]',
    tagline: '千年古都与樱花之美',
    bestTime: '3-5 月樱花季',
  },
  {
    id: 2,
    city: '巴黎',
    country: '法国',
    image: '/images/cities/巴黎.png',
    gradient: 'from-[#e8e0f0] via-[#d0c0e0] to-[#b8a0d0]',
    textColor: 'text-[#2a1a3a]',
    tagline: '浪漫之都的艺术与美食',
    bestTime: '全年适宜',
  },
  {
    id: 3,
    city: '巴厘岛',
    country: '印度尼西亚',
    image: '/images/cities/巴厘岛.png',
    gradient: 'from-[#d0f0e8] via-[#a8e0d0] to-[#80d0b8]',
    textColor: 'text-[#1a3a30]',
    tagline: '热带天堂的度假体验',
    bestTime: '4-10 月旱季',
  },
  {
    id: 4,
    city: '纽约',
    country: '美国',
    image: '/images/cities/nyc.png',
    gradient: 'from-[#0f1724] via-[#1a2744] to-[#0a1628]',
    textColor: 'text-white',
    tagline: '不夜城的无限可能',
    bestTime: '9-11 月秋叶季',
  },
  {
    id: 5,
    city: '雷克雅未克',
    country: '冰岛',
    image: '/images/cities/雷克雅未克.png',
    gradient: 'from-[#1a2f3a] via-[#2d4a5a] to-[#1a3a4a]',
    textColor: 'text-white',
    tagline: '极光与冰川的奇幻之旅',
    bestTime: '9-3 月极光季',
  },
]

const flights = [
  {
    id: 1,
    destinationId: 1,
    date: '3 月 15 日 - 3 月 22 日',
    route: 'SFO → KIX',
    departureAirport: 'SFO',
    arrivalAirport: 'KIX',
    departureDate: '3 月 15 日',
    arrivalDate: '3 月 16 日',
    departureTime: '09:30',
    arrivalTime: '14:30',
    arrivalDay: '+1',
    duration: '14h',
    stops: '直飞',
    price: 580,
    priceStatus: 'low',
    priceChange: -15,
  },
  {
    id: 2,
    destinationId: 2,
    date: '4 月 1 日 - 4 月 10 日',
    route: 'SFO → CDG',
    departureAirport: 'SFO',
    arrivalAirport: 'CDG',
    departureDate: '4 月 1 日',
    arrivalDate: '4 月 2 日',
    departureTime: '17:45',
    arrivalTime: '13:20',
    arrivalDay: '+1',
    duration: '11h',
    stops: '直飞',
    price: 720,
    priceStatus: 'good',
    priceChange: -8,
  },
  {
    id: 3,
    destinationId: 3,
    date: '5 月 5 日 - 5 月 12 日',
    route: 'SFO → DPS',
    departureAirport: 'SFO',
    arrivalAirport: 'DPS',
    departureDate: '5 月 5 日',
    arrivalDate: '5 月 7 日',
    departureTime: '23:55',
    arrivalTime: '06:30',
    arrivalDay: '+2',
    duration: '18h',
    stops: '中转',
    stopsCity: '新加坡',
    stopsDuration: '2h 15m',
    price: 890,
    priceStatus: 'high',
    priceChange: 12,
  },
  {
    id: 4,
    destinationId: 4,
    date: '3 月 20 日 - 3 月 27 日',
    route: 'SFO → JFK',
    departureAirport: 'SFO',
    arrivalAirport: 'JFK',
    departureDate: '3 月 20 日',
    arrivalDate: '3 月 20 日',
    departureTime: '08:00',
    arrivalTime: '16:25',
    arrivalDay: '',
    duration: '5h 30m',
    stops: '直飞',
    price: 320,
    priceStatus: 'low',
    priceChange: -25,
  },
  {
    id: 5,
    destinationId: 5,
    date: '2 月 10 日 - 2 月 17 日',
    route: 'SFO → KEF',
    departureAirport: 'SFO',
    arrivalAirport: 'KEF',
    departureDate: '2 月 10 日',
    arrivalDate: '2 月 10 日',
    departureTime: '16:30',
    arrivalTime: '19:45',
    arrivalDay: '',
    duration: '6h 15m',
    stops: '直飞',
    price: 450,
    priceStatus: 'good',
    priceChange: -5,
  },
]

const interests = [
  { icon: '🏖️', label: '海滩度假' },
  { icon: '🍜', label: '美食探索' },
  { icon: '🏛️', label: '历史文化' },
  { icon: '🏔️', label: '户外冒险' },
  { icon: '🛍️', label: '购物血拼' },
  { icon: '📸', label: '拍照打卡' },
  { icon: '🍷', label: '品酒体验' },
  { icon: '🧘', label: '放松疗愈' },
  { icon: '🎨', label: '艺术展览' },
  { icon: '🌃', label: '夜生活' },
  { icon: '👨‍‍👧', label: '亲子友好' },
  { icon: '💑', label: '浪漫情侣' },
]

const tripTypes = [
  { icon: '👤', label: '独自旅行' },
  { icon: '💑', label: '情侣出行' },
  { icon: '👨‍👩‍👧', label: '家庭出游' },
  { icon: '👯', label: '朋友结伴' },
  { icon: '💼', label: '商务出行' },
]

const budgets = [
  { icon: '$', label: '经济型', range: '$500-1000' },
  { icon: '$$', label: '舒适型', range: '$1000-2000' },
  { icon: '$$$', label: '豪华型', range: '$2000+' },
]

// ============ 工具函数 ============
function getPriceColor(status) {
  switch (status) {
    case 'low': return 'text-green-600 bg-green-100'
    case 'good': return 'text-teal-600 bg-teal-100'
    case 'high': return 'text-rose-600 bg-rose-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

function getPriceIcon(status) {
  switch (status) {
    case 'low': return TrendingDown
    case 'good': return TrendingDown
    case 'high': return TrendingUp
    default: return Minus
  }
}

function getPriceLabel(status, change) {
  switch (status) {
    case 'low': return `比平时低${Math.abs(change)}%`
    case 'good': return `比平时低${Math.abs(change)}%`
    case 'high': return `比平时高${change}%`
    default: return '价格正常'
  }
}

// ============ Onboarding 页面 ============
function OnboardingPage1({ onComplete, data, onUpdate }) {
  const [selected, setSelected] = useState(new Set(data.interests || []))

  const toggleInterest = (index) => {
    const newSelected = new Set(selected)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelected(newSelected)
    onUpdate({ interests: Array.from(newSelected) })
  }

  return (
    <motion.div
      className="flex flex-col h-full px-6 pt-12 pb-8"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* 进度指示器 */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-2 h-2 rounded-full bg-gray-900" />
        {[1, 2, 3].map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-gray-900/40' : 'bg-gray-400'}`} />
        ))}
      </div>

      {/* 标题 */}
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        选择你感兴趣的
      </h1>
      <p className="text-gray-500 text-base mb-8">
        帮助我们了解你的旅行偏好，推荐更匹配的目的地
      </p>

      {/* 兴趣标签 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="flex flex-wrap gap-3">
          {interests.map((item, index) => (
            <motion.button
              key={index}
              onClick={() => toggleInterest(index)}
              className={`px-4 py-3 rounded-full border-2 text-sm font-medium transition-all ${
                selected.has(index)
                  ? 'border-gray-900 bg-white text-gray-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 底部操作区 */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100 safe-bottom">
        <button className="text-gray-400 font-medium px-4 py-2">
          跳过
        </button>
        <motion.button
          onClick={onComplete}
          className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-medium"
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-xl">→</span>
        </motion.button>
      </div>
    </motion.div>
  )
}

function OnboardingPage2({ onComplete, data, onUpdate }) {
  const [selectedTripType, setSelectedTripType] = useState(data.tripTypes?.[0] ?? 0)

  const selectTripType = (index) => {
    setSelectedTripType(index)
    onUpdate({ tripTypes: [index] })
  }

  const [budget, setBudget] = useState(data.budget || 1)
  const [minPrice, setMinPrice] = useState(500)
  const [maxPrice, setMaxPrice] = useState(2000)

  // 预计算柱状图高度（固定不变）
  const barHeights = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const center = 15
      const distance = Math.abs(i - center)
      const baseHeight = Math.max(15, 100 - (distance * distance) * 0.3 - Math.random() * 20)
      return Math.min(100, Math.max(10, baseHeight))
    })
  }, [])

  const handleLeftDrag = (_, info) => {
    const el = info.point.element
    if (el) {
      const rect = el.parentElement.getBoundingClientRect()
      const newLeft = Math.max(0, Math.min(1, (info.point.x - rect.left) / rect.width))
      setMinPrice(Math.round(500 + newLeft * 1500))
    }
  }

  const handleRightDrag = (_, info) => {
    const el = info.point.element
    if (el) {
      const rect = el.parentElement.getBoundingClientRect()
      const newRight = Math.max(0, Math.min(1, (info.point.x - rect.left) / rect.width))
      setMaxPrice(Math.round(500 + newRight * 1500))
    }
  }

  return (
    <motion.div
      className="flex flex-col h-full px-6 pt-12 pb-8"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* 进度指示器 */}
      <div className="flex items-center gap-2 mb-8 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-gray-900" />
        <div className="w-2 h-2 rounded-full bg-gray-900" />
        {[1, 2].map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-gray-900/40' : 'bg-gray-300'}`} />
        ))}
      </div>

      {/* 标题 - 和谁旅行 */}
      <div className="mb-8 flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-gray-900" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          和谁一起旅行？
        </h1>
        <p className="text-gray-500 text-base">
          选择适合你的出行方式
        </p>
      </div>

      {/* 可滚动内容区 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* 出行类型 */}
        <div className="space-y-3 mb-8">
          {tripTypes.map((item, index) => (
            <motion.button
              key={index}
              onClick={() => selectTripType(index)}
              className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                selectedTripType === index
                  ? 'border-gray-900 bg-white text-gray-900'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-gray-900">{item.label}</span>
              </span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selectedTripType === index ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
              }`}>
                {selectedTripType === index && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-white text-xs font-bold"
                  >
                    ✓
                  </motion.span>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* 预算范围 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            预算范围？
          </h2>

          {/* 价格分布柱状图 */}
          <div className="mb-6">
            <div className="flex items-end justify-center gap-1 h-16 mb-4">
              {barHeights.map((height, i) => {
                const pricePerBar = 1500 / 30
                const barMinPrice = 500 + i * pricePerBar
                const barMaxPrice = barMinPrice + pricePerBar
                const isSelected = barMinPrice >= minPrice && barMaxPrice <= maxPrice
                return (
                  <div
                    key={i}
                    className={`w-1.5 rounded-t-sm transition-colors ${
                      isSelected ? 'bg-electric-purple' : 'bg-gray-200'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                )
              })}
            </div>

            {/* 双滑块 */}
            <div className="relative h-6">
              {/* 轨道背景 - 灰色 */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full" />
              <input
                type="range"
                min="500"
                max="2000"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="absolute top-1/2 -translate-y-1/2 left-0 right-0 w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:z-20"
                style={{ zIndex: 10 }}
              />
              <input
                type="range"
                min="500"
                max="2000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="absolute top-1/2 -translate-y-1/2 left-0 right-0 w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:z-20"
                style={{ zIndex: 10 }}
              />
              {/* 选中区域 */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-1 bg-electric-purple rounded-full pointer-events-none"
                style={{
                  left: `${((minPrice - 500) / 1500) * 100}%`,
                  right: `${100 - ((maxPrice - 500) / 1500) * 100}%`
                }}
              />
            </div>

            {/* 价格输入框 */}
            <div className="flex items-center justify-between mt-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">最低</label>
                <div className="px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium text-gray-900">
                  ${minPrice}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最高</label>
                <div className="px-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium text-gray-900">
                  ${maxPrice}+
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作区 */}
      <div className="flex justify-end pt-6 border-t border-gray-100 safe-bottom flex-shrink-0">
        <motion.button
          onClick={onComplete}
          className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-medium"
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-xl">→</span>
        </motion.button>
      </div>
    </motion.div>
  )
}

function OnboardingPage3({ onComplete, data, onUpdate }) {
  const [departure, setDeparture] = useState(data.departure || '')
  const [selectedDates, setSelectedDates] = useState(data.flexibleDates || 'any')

  const dateOptions = [
    { value: 'any', label: '时间灵活', icon: '📅' },
    { value: 'weekend', label: '周末出行', icon: '🌙' },
    { value: 'specific', label: '指定日期', icon: '📆' },
  ]

  return (
    <motion.div
      className="flex flex-col h-full px-6 pt-12 pb-8"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* 进度指示器 */}
      <div className="flex items-center gap-2 mb-8 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-gray-900" />
        <div className="w-2 h-2 rounded-full bg-gray-900" />
        <div className="w-2 h-2 rounded-full bg-gray-900" />
        <div className="w-2 h-2 rounded-full bg-gray-900/40" />
      </div>

      {/* 标题 */}
      <div className="mb-8 flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <MapPin className="w-6 h-6 text-gray-900" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          你从哪里出发？
        </h1>
        <p className="text-gray-500 text-base">
          设置出发城市，开始探索目的地
        </p>
      </div>

      {/* 可滚动内容区 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* 出发城市选择 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            出发城市
          </label>
          <motion.button
            className="w-full p-4 rounded-2xl border-2 border-gray-900 flex items-center justify-between hover:border-gray-900 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">旧金山</div>
                <div className="text-sm text-gray-500">SFO · 当前位置</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </motion.button>
        </div>

        {/* 日期偏好 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            出行时间偏好
          </h2>
          <div className="space-y-3">
            {dateOptions.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setSelectedDates(option.value)}
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                  selectedDates === option.value
                    ? 'border-gray-900 bg-white text-gray-900'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <span className={`font-medium ${selectedDates === option.value ? 'text-gray-900' : 'text-gray-900'}`}>{option.label}</span>
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedDates === option.value ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                }`}>
                  {selectedDates === option.value && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-white text-xs font-bold"
                    >
                      ✓
                    </motion.span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* 底部操作区 */}
      <div className="flex justify-end pt-6 border-t border-gray-100 safe-bottom flex-shrink-0">
        <motion.button
          onClick={onComplete}
          className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-medium"
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-xl">→</span>
        </motion.button>
      </div>
    </motion.div>
  )
}

// ============ 爱心动效组件 ============
function HeartEffect({ heartEffect, onComplete }) {
  const { startX, startY, endX, endY } = heartEffect

  return (
    <motion.div
      className="fixed z-[100] pointer-events-none"
      initial={{
        x: startX,
        y: startY,
        scale: 0,
        opacity: 1
      }}
      animate={{
        x: endX,
        y: endY,
        scale: 0.3,
        opacity: 0
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        className="w-[120px] h-[120px] gradient-electric rounded-full flex items-center justify-center shadow-colored"
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          duration: 0.3,
          type: 'spring',
          stiffness: 400
        }}
      >
        <Heart className="w-[60px] h-[60px] text-white" strokeWidth={0} fill="white" />
      </motion.div>
    </motion.div>
  )
}

// ============ 教程卡片 ============
function TutorialCard({ onComplete }) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-ink-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-[32px] p-7 max-w-sm w-full shadow-strong border border-white/20"
        initial={{ scale: 0.92, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      >
        <div className="text-center mb-7">
          <h2 className="text-2xl font-extrabold text-ink-black mb-2 tracking-tight">
            滑动选择航班
          </h2>
          <p className="text-slate-gray text-sm leading-relaxed">
            像约会一样选航班，找到你的真爱目的地
          </p>
        </div>

        <div className="flex gap-3 mb-7">
          {/* 左滑说明 - 左侧卡片 */}
          <motion.div
            className="flex-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-50/30"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center shadow-md mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <X className="w-7 h-7 text-white" strokeWidth={2.5} />
            </motion.div>
            <div className="text-center">
              <div className="font-bold text-ink-black text-base tracking-tight mb-1">左滑 = 下一个</div>
              <div className="text-sm text-slate-gray leading-tight">跳过不感兴趣的选项</div>
            </div>
          </motion.div>

          {/* 右滑说明 - 右侧卡片 */}
          <motion.div
            className="flex-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-electric-purple/5"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="w-14 h-14 rounded-full gradient-electric flex items-center justify-center shadow-colored mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <Heart className="w-7 h-7 text-white" strokeWidth={2.5} fill="white" />
            </motion.div>
            <div className="text-center">
              <div className="font-bold text-ink-black text-base tracking-tight mb-1">右滑 = 收藏</div>
              <div className="text-sm text-slate-gray leading-tight">喜欢的航班加入收藏夹</div>
            </div>
          </motion.div>
        </div>

        <motion.button
          onClick={onComplete}
          className="w-full py-4.5 rounded-2xl gradient-electric text-white font-bold text-lg shadow-colored hover:shadow-lg transition-shadow"
          whileTap={{ scale: 0.96 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          开始探索
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ============ 可拖拽的航班卡片 ============
function DraggableCard({ flight, destination, onSwipe, isTopCard, cardId, onShowHeartEffect }) {
  const cardRef = useRef(null)

  // 运动值
  const x = useMotionValue(0)
  const rotateRaw = useTransform(x, [-200, 200], [-15, 15])

  // 平滑旋转 - 增加阻尼感
  const rotate = useTransform(rotateRaw, (latest) => {
    return `${latest * 0.6}deg`
  })

  // 指示器透明度 - 更灵敏的触发
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-20, -100], [0, 1])

  // 卡片缩放 - 拖动时轻微缩小增加真实感
  const scale = useTransform(x, [-100, 100], [0.97, 1])

  const handleDragEnd = (_, info) => {
    const threshold = 60 // 更低的阈值
    const velocity = info.velocity.x

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 400) {
      // 达到阈值或速度够快 → 飞出
      const direction = info.offset.x > 0 ? 1 : -1
      const flyDistance = window.innerWidth * 0.8

      // 如果是右滑，触发动效
      if (direction > 0) {
        // 获取卡片中心位置
        const cardRect = cardRef.current?.getBoundingClientRect()
        if (cardRect && onShowHeartEffect) {
          const startX = cardRect.left + cardRect.width / 2
          const startY = cardRect.top + cardRect.height / 2
          onShowHeartEffect({ startX, startY })
        }
      }

      // 立即触发 onSwipe，让下层卡片提前准备
      onSwipe(cardId, direction > 0 ? 'right' : 'left')

      // 然后飞出去
      animate(x, direction * flyDistance, {
        type: 'tween',
        ease: 'easeOut',
        duration: 0.25
      })
    } else {
      // 回弹 - 更快更干脆
      animate(x, 0, {
        type: 'spring',
        stiffness: 500,
        damping: 35,
        mass: 0.4,
        duration: 0.3
      })
    }
  }

  return (
    <motion.div
      ref={cardRef}
      style={{
        x,
        rotate,
        scale,
        zIndex: isTopCard ? 10 : 1,
        cursor: isTopCard ? 'grab' : 'default'
      }}
      drag={isTopCard ? 'x' : false}
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={0.4}
      dragMomentum={false}
      onDragEnd={isTopCard ? handleDragEnd : undefined}
      className="absolute inset-0 bg-white rounded-[32px] overflow-hidden touch-none select-none shadow-strong"
      initial={{ scale: 0.93, opacity: 0, y: 20 }}
      animate={
        isTopCard
          ? { scale: 1, opacity: 1, y: 0 }
          : { scale: 0.92, opacity: 0.6, y: 10 }
      }
      exit={{ scale: 0.85, opacity: 0, rotate: isTopCard ? 20 : -20 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 35,
        mass: 0.5,
        duration: 0.2
      }}
    >
      {/* 目的地插画区域 - 视觉升级 */}
      <div className={`h-[395px] relative overflow-hidden`}>
        {/* 渐变背景 */}
        <div className={`absolute inset-0 bg-gradient-to-br ${destination.gradient}`} />

        {/* 动态光晕装饰 */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/25 rounded-full blur-[64px]" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/20 rounded-full blur-[40px]" />

        {/* 目的地内容 */}
        <div className={`relative flex flex-col items-center justify-center ${destination.textColor} py-8`}>
          <motion.div
            className="w-[300px] h-[252px] mb-4"
            initial={{ scale: 0.8, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
          >
            <img
              src={destination.image}
              alt={`${destination.city}`}
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.h2
            className="text-4xl font-extrabold tracking-tight drop-shadow-medium"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {destination.city}·{destination.country}
          </motion.h2>
          {/* 推荐语 */}
          <motion.div
            className="flex items-start justify-center gap-1 mt-[10px] mb-6"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <svg className={`w-3 h-3 flex-shrink-0 ${destination.textColor} opacity-50 mt-0.5`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
            </svg>
            <p className={`text-sm px-2 text-center font-light leading-relaxed ${destination.textColor}`}>
              {destination.tagline}
            </p>
            <svg className={`w-3 h-3 flex-shrink-0 ${destination.textColor} opacity-50 scale-x-[-1] scale-y-[-1] mt-0.5`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
            </svg>
          </motion.div>
        </div>

        {/* 滑动指示器 - 更大更明显 */}
        {isTopCard && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-5 left-5 px-5 py-2.5 bg-emerald-500/95 backdrop-blur-md rounded-full text-white font-bold text-sm shadow-xl border-2 border-white/50"
            >
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 fill-white" strokeWidth={0} />
                收藏
              </span>
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-5 right-5 px-5 py-2.5 bg-emerald-500/95 backdrop-blur-md rounded-full text-white font-bold text-sm shadow-xl border-2 border-white/50"
            >
              <span className="flex items-center gap-1.5">
                <X className="w-4 h-4" strokeWidth={3} />
                跳过
              </span>
            </motion.div>
          </>
        )}

      </div>

      {/* 航班信息区域 */}
      <div className="px-[20px] py-[24px]">
        {/* 航线信息 - 三段式布局 */}
        <div className="mb-[12px]">
          {/* 时间行 */}
          <div className="flex items-center justify-between gap-[12px]">
            {/* 左侧：出发信息块 - 左对齐 */}
            <div className="flex-shrink-0 text-left w-[92px]">
              <div className="text-[12px] text-black mb-[4px] font-medium">{flight.departureDate}</div>
              <div className="text-[36px] font-bold font-['Manrope'] text-black tracking-[-0.72px] leading-none">
                {flight.departureTime}
              </div>
              <div className="text-[18px] font-light font-['Manrope'] text-black mt-[4px] tracking-[0.45px]">
                {flight.departureAirport}
              </div>
            </div>

            {/* 中间：时长胶囊 + 中转信息（整体居中） */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="flex items-center w-full">
                {/* 左侧细线 */}
                <div className="flex-1 h-px bg-gray-900 max-w-20" />
                {/* 时长胶囊 */}
                <div className="px-6 py-2.5 bg-gray-900 rounded-full text-white text-xs font-bold whitespace-nowrap flex items-center gap-2">
                  <span>{flight.duration}</span>
                  {flight.stops === '直飞' && (
                    <>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-200">直飞</span>
                    </>
                  )}
                </div>
                {/* 右侧细线 */}
                <div className="flex-1 h-px bg-gray-900 max-w-20" />
              </div>
              {/* 中转信息 - 紧挨胶囊下方 */}
              {flight.stops !== '直飞' && (
                <div className="mt-1.5 text-center">
                  <p className="text-xs text-slate-gray">
                    中转 <span className="font-bold text-gray-900">{flight.stopsCity}</span> <span className="text-gray-500">{flight.stopsDuration}</span>
                  </p>
                </div>
              )}
            </div>

            {/* 右侧：到达信息块 - 右对齐 */}
            <div className="flex-shrink-0 text-right w-[86px]">
              <div className="text-[12px] text-black mb-[4px] font-medium text-right">{flight.arrivalDate}</div>
              <div className="text-[36px] font-bold font-['Manrope'] text-black tracking-[-0.72px] leading-none">
                {flight.arrivalTime}
              </div>
              <div className="text-[18px] font-light font-['Manrope'] text-black mt-[4px] tracking-[0.45px]">
                {flight.arrivalAirport}
              </div>
            </div>
          </div>
        </div>

        {/* 分割线 */}
        <div className="h-px bg-[#f3f4f6] mb-[12px]" />

        {/* 价格区域 */}
        <div className="flex items-end justify-between mb-4">
          <div className="flex items-end gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold flight-time text-slate-gray">$</span>
              <span className="text-4xl font-bold flight-time text-ink-black tracking-tight">{flight.price}</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-1 ${getPriceColor(flight.priceStatus)}`}>
              {(() => {
                const Icon = getPriceIcon(flight.priceStatus)
                return <Icon className="w-3.5 h-3.5" />
              })()}
              {getPriceLabel(flight.priceStatus, flight.priceChange)}
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="px-[134px] pb-[30px] pt-[12px] flex items-center justify-center gap-[20px]">
        {/* 跳过按钮 - 白色带边框 */}
        <motion.button
          onClick={() => onSwipe('left')}
          className="w-[64px] h-[64px] rounded-full bg-white border-2 border-[#e5e7eb] flex items-center justify-center shadow-[0px_8px_30px_0px_rgba(0,0,0,0.12)] hover:shadow-lg transition-shadow group"
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.05 }}
        >
          <X className="w-8 h-8 text-gray-400 group-hover:text-rose-500 transition-colors" strokeWidth={2.5} />
        </motion.button>

        {/* 收藏按钮 - 渐变紫色 */}
        <motion.button
          onClick={() => onSwipe('right')}
          className="w-[64px] h-[64px] rounded-full flex items-center justify-center shadow-[0px_8px_30px_0px_rgba(102,102,255,0.25)] hover:shadow-lg transition-shadow bg-gradient-to-br from-[#6666ff] to-[#8888ff]"
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.05 }}
        >
          <Heart className="w-8 h-8 text-white" strokeWidth={2.5} fill="white" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ============ 收藏列表页 ============
function SavedListPage({ saved, onBack, destinations }) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-mist-gray via-purple-50/30 to-white">
      {/* 顶部导航 - 毛玻璃效果 */}
      <div className="glass px-4 py-3 flex items-center gap-4 border-b border-white/30">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/60 transition-colors">
          <ChevronLeft className="w-6 h-6 text-ink-black" />
        </button>
        <h1 className="text-lg font-extrabold text-ink-black tracking-tight">已收藏 <span className="text-gray-900">({saved.length})</span></h1>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-28 h-28 rounded-full gradient-electric flex items-center justify-center mb-6 shadow-colored animate-pulse-glow"
            >
              <Heart className="w-14 h-14 text-white" strokeWidth={1.5} />
            </motion.div>
            <h2 className="text-2xl font-extrabold text-ink-black mb-2 tracking-tight">还没有收藏任何航班</h2>
            <p className="text-slate-gray mb-8 max-w-xs">右滑喜欢的航班，它们会出现在这里</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {saved.map((flight, i) => {
              const dest = destinations.find(d => d.id === flight.destinationId)
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.08, type: 'spring' }}
                  className="bg-white rounded-2xl p-4 shadow-soft border border-purple-100/50"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${dest.gradient} flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden`}>
                      <img
                        src={dest.image}
                        alt={`${dest.city}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-ink-black truncate tracking-tight">{dest.city}, {dest.country}</h3>
                      <p className="text-sm text-slate-gray mt-0.5">{flight.date}</p>
                      <p className="text-xs text-slate-gray mt-1 font-medium">{flight.route}</p>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-xl font-bold flight-time text-gray-900">${flight.price}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getPriceColor(flight.priceStatus)}`}>
                          {getPriceLabel(flight.priceStatus, flight.priceChange)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============ 主滑动界面 ============
function SwipePage({ data, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [saved, setSaved] = useState([])
  const [showTutorial, setShowTutorial] = useState(true)
  const [showSavedList, setShowSavedList] = useState(false)
  const [swipedCards, setSwipedCards] = useState(new Set())
  const [heartEffect, setHeartEffect] = useState(null)

  const handleSwipe = (cardId, direction) => {
    if (direction === 'right') {
      const flight = flights.find(f => f.id === cardId)
      const destination = destinations.find(d => d.id === flight.destinationId)
      setSaved(prev => [...prev, { ...flight, destination }])
    }
    setSwipedCards(prev => new Set(prev).add(cardId))

    // 立即切换到下一张，让动画和卡片切换同步
    setCurrentIndex(prev => prev + 1)
  }

  const handleShowHeartEffect = ({ startX, startY }) => {
    // 获取右上角收藏图标的位置
    const savedButton = document.querySelector('[data-saved-button]')
    const savedRect = savedButton?.getBoundingClientRect()

    if (savedRect) {
      const endX = savedRect.left + savedRect.width / 2 - 60 // 减去爱心半径
      const endY = savedRect.top + savedRect.height / 2 - 60
      setHeartEffect({ startX, startY, endX, endY })
    }
  }

  const handleHeartEffectComplete = () => {
    setHeartEffect(null)
  }

  // 显示收藏列表 - 支持 URL 参数 ?saved=1 直接显示
  const showSavedFromURL = new URLSearchParams(window.location.search).get('saved') === '1'
  if (showSavedList || showSavedFromURL) {
    // 如果是从 URL 参数显示，使用示例数据
    const sampleSaved = showSavedFromURL && saved.length === 0 ? flights.slice(0, 3).map(f => ({
      ...f,
      destination: destinations.find(d => d.id === f.destinationId)
    })) : saved

    return <SavedListPage saved={sampleSaved} onBack={() => setShowSavedList(false)} destinations={destinations} />
  }

  // 获取当前显示的卡片（最多 2 张）
  const visibleCards = []
  for (let i = 0; i < 2 && currentIndex + i < flights.length; i++) {
    const flight = flights[currentIndex + i]
    const destination = destinations.find(d => d.id === flight.destinationId)
    visibleCards.push({ flight, destination, isTop: i === 0 })
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-mist-gray via-purple-50/30 to-white">
      {/* 顶部导航 - 毛玻璃效果 */}
      <div className="glass px-4 py-3 flex items-center justify-between border-b border-white/30 flex-shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/60 transition-colors">
          <Home className="w-6 h-6 text-ink-black" />
        </button>
        <h1 className="text-lg font-extrabold text-ink-black tracking-tight">探索目的地</h1>
        <button data-saved-button onClick={() => setShowSavedList(true)} className="p-2 -mr-2 relative">
          <Heart className="w-6 h-6 text-ink-black" />
          {saved.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1 right-1 w-5 h-5 gradient-electric text-white text-xs rounded-full flex items-center justify-center font-bold shadow-colored border border-white/50"
            >
              {saved.length}
            </motion.span>
          )}
        </button>
      </div>

      {/* 卡片区域 */}
      <div className="relative flex-1 p-4 overflow-hidden">
        <div className="h-full flex items-start justify-center">
          {/* 卡片容器 */}
          <div className="relative w-full max-w-md h-[720px]">
            {/* 渲染顺序：先渲染下层卡片，再渲染顶层卡片 */}
            <AnimatePresence>
              {/* 下层卡片（在底层） */}
              {visibleCards.filter(c => !c.isTop).map(({ flight, destination }) => (
                <DraggableCard
                  key={`bottom-${flight.id}`}
                  flight={flight}
                  destination={destination}
                  onSwipe={() => {}}
                  onShowHeartEffect={() => {}}
                  isTopCard={false}
                  cardId={flight.id}
                />
              ))}
              {/* 顶层卡片（在上层） */}
              {visibleCards.filter(c => c.isTop).map(({ flight, destination }) => (
                <DraggableCard
                  key={`top-${flight.id}`}
                  flight={flight}
                  destination={destination}
                  onSwipe={handleSwipe}
                  onShowHeartEffect={handleShowHeartEffect}
                  isTopCard={true}
                  cardId={flight.id}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 教程覆盖层 */}
      <AnimatePresence>
        {showTutorial && <TutorialCard onComplete={() => setShowTutorial(false)} />}
      </AnimatePresence>

      {/* 爱心动效 */}
      <AnimatePresence>
        {heartEffect && (
          <HeartEffect
            heartEffect={heartEffect}
            onComplete={handleHeartEffectComplete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ 主 App ============
function App() {
  // 从 URL 参数读取页面索引，支持 ?page=0,1,2,3
  const getPageFromURL = () => {
    const params = new URLSearchParams(window.location.search)
    const pageParam = params.get('page')
    return pageParam !== null ? parseInt(pageParam, 10) : 0
  }

  const [page, setPage] = useState(getPageFromURL())
  const [onboardingData, setOnboardingData] = useState({})

  const updateOnboardingData = (data) => {
    setOnboardingData({ ...onboardingData, ...data })
  }

  const pages = [
    <OnboardingPage1
      key="page1"
      onComplete={() => setPage(1)}
      data={onboardingData}
      onUpdate={updateOnboardingData}
    />,
    <OnboardingPage2
      key="page2"
      onComplete={() => setPage(2)}
      data={onboardingData}
      onUpdate={updateOnboardingData}
    />,
    <OnboardingPage3
      key="page3"
      onComplete={() => setPage(3)}
      data={onboardingData}
      onUpdate={updateOnboardingData}
    />,
    <SwipePage
      key="swipe"
      data={onboardingData}
      onBack={() => setPage(0)}
    />,
  ]

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-white overflow-hidden relative">
      <AnimatePresence mode="wait">
        {pages[page]}
      </AnimatePresence>
    </div>
  )
}

export default App
