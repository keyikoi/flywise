import { useState, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { MapPin, Users, Heart, X, Sparkles, Home, ChevronLeft, Plane } from 'lucide-react'

// ============ 假数据 ============
const destinations = [
  {
    id: 1,
    city: '京都',
    country: '日本',
    image: '🏯',
    gradient: 'from-orange-400 to-red-500',
    tagline: '千年古都与樱花之美',
    bestTime: '3-5 月樱花季',
  },
  {
    id: 2,
    city: '巴黎',
    country: '法国',
    image: '🗼',
    gradient: 'from-purple-400 to-pink-500',
    tagline: '浪漫之都的艺术与美食',
    bestTime: '全年适宜',
  },
  {
    id: 3,
    city: '巴厘岛',
    country: '印度尼西亚',
    image: '🏝️',
    gradient: 'from-cyan-400 to-blue-500',
    tagline: '热带天堂的度假体验',
    bestTime: '4-10 月旱季',
  },
  {
    id: 4,
    city: '纽约',
    country: '美国',
    image: '🗽',
    gradient: 'from-indigo-400 to-blue-600',
    tagline: '不夜城的无限可能',
    bestTime: '9-11 月秋叶季',
  },
  {
    id: 5,
    city: '雷克雅未克',
    country: '冰岛',
    image: '❄️',
    gradient: 'from-blue-300 to-indigo-400',
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
    departureDate: '5 月 5 日',
    arrivalDate: '5 月 7 日',
    departureTime: '23:55',
    arrivalTime: '06:30',
    arrivalDay: '+2',
    duration: '18h',
    stops: '1 转机',
    price: 890,
    priceStatus: 'high',
    priceChange: 12,
  },
  {
    id: 4,
    destinationId: 4,
    date: '3 月 20 日 - 3 月 27 日',
    route: 'SFO → JFK',
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
    case 'high': return 'text-orange-600 bg-orange-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

function getPriceLabel(status, change) {
  switch (status) {
    case 'low': return `比平时低${Math.abs(change)}% 🎉`
    case 'good': return `比平时低${Math.abs(change)}% ✨`
    case 'high': return `比平时高${change}% 🔥`
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
      if (newSelected.size < 5) {
        newSelected.add(index)
      }
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
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        {[1, 2, 3].map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-orange-300' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* 标题 */}
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        选择 5 个你感兴趣的
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
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
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
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            {selected.size}/5 已选择
          </span>
          <motion.button
            onClick={onComplete}
            disabled={selected.size < 5}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              selected.size >= 5
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-400'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-xl">→</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

function OnboardingPage2({ onComplete, data, onUpdate }) {
  const [selected, setSelected] = useState(new Set(data.tripTypes || []))

  const toggleTripType = (index) => {
    const newSelected = new Set(selected)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelected(newSelected)
    onUpdate({ tripTypes: Array.from(newSelected) })
  }

  const [budget, setBudget] = useState(data.budget || 1)

  return (
    <motion.div
      className="flex flex-col h-full px-6 pt-12 pb-8"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      {/* 进度指示器 */}
      <div className="flex items-center gap-2 mb-8 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        {[1, 2].map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-orange-300' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* 标题 - 和谁旅行 */}
      <div className="mb-8 flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-orange-500" />
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
              onClick={() => toggleTripType(index)}
              className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                selected.has(index)
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-gray-900">{item.label}</span>
              </span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selected.has(index) ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
              }`}>
                {selected.has(index) && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-white text-xs"
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
          <div className="flex gap-3">
            {budgets.map((item, index) => (
              <motion.button
                key={index}
                onClick={() => setBudget(index)}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                  budget === index
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{item.icon}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.range}</div>
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
          className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg"
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
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        <div className="w-2 h-2 rounded-full bg-orange-300" />
      </div>

      {/* 标题 */}
      <div className="mb-8 flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <MapPin className="w-6 h-6 text-blue-500" />
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
        {/* 出发地输入 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            出发城市
          </label>
          <div className="relative">
            <input
              type="text"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              placeholder="搜索城市或机场"
              className="w-full p-4 pl-12 rounded-2xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none text-lg"
            />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* 快速选择 */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-3">或使用当前位置</p>
          <motion.button
            className="w-full p-4 rounded-2xl bg-gray-100 flex items-center gap-3 hover:bg-gray-200 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <span className="text-lg">📍</span>
            </div>
            <span className="font-medium text-gray-900">旧金山 (SFO)</span>
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
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <span className="font-medium text-gray-900">{option.label}</span>
                </span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedDates === option.value ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                }`}>
                  {selectedDates === option.value && (
                    <span className="text-white text-xs">✓</span>
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
          className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg"
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-xl">→</span>
        </motion.button>
      </div>
    </motion.div>
  )
}

// ============ 教程卡片 ============
function TutorialCard({ onComplete }) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            滑动选择航班
          </h2>
          <p className="text-gray-500 text-sm">
            像约会一样选航班，找到你的真爱目的地
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-4 p-3 rounded-xl bg-green-50">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900">右滑 = 收藏</div>
              <div className="text-sm text-gray-500">喜欢的航班加入收藏夹</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-100">
            <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center">
              <X className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900">左滑 = 下一个</div>
              <div className="text-sm text-gray-500">跳过不感兴趣的选项</div>
            </div>
          </div>
        </div>

        <motion.button
          onClick={onComplete}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold text-lg shadow-lg"
          whileTap={{ scale: 0.98 }}
        >
          开始探索
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ============ 可拖拽的航班卡片 ============
function DraggableCard({ flight, destination, onSwipe, isTopCard, cardId }) {
  const cardRef = useRef(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])

  // Like/Nope 指示器透明度
  const likeOpacity = useTransform(x, [0, 150], [0, 1])
  const nopeOpacity = useTransform(x, [0, -150], [0, 1])

  const handleDragEnd = (_, info) => {
    const threshold = 100
    if (info.offset.x > threshold) {
      // 右滑 - 喜欢
      animate(x, window.innerWidth, {
        type: 'tween',
        duration: 0.3,
        onComplete: () => onSwipe(cardId, 'right')
      })
    } else if (info.offset.x < -threshold) {
      // 左滑 - 跳过
      animate(x, -window.innerWidth, {
        type: 'tween',
        duration: 0.3,
        onComplete: () => onSwipe(cardId, 'left')
      })
    } else {
      // 回弹
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
    }
  }

  return (
    <motion.div
      ref={cardRef}
      style={{
        x,
        rotate,
        zIndex: isTopCard ? 10 : 1
      }}
      drag={isTopCard}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={isTopCard ? handleDragEnd : undefined}
      className="absolute inset-0 bg-white rounded-3xl shadow-xl overflow-hidden"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={isTopCard ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0.5 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 目的地插画区域 */}
      <div className={`h-64 bg-gradient-to-br ${destination.gradient} relative overflow-hidden`}>
        {/* 装饰性圆形 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* 目的地内容 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="text-7xl mb-2">{destination.image}</div>
          <h2 className="text-3xl font-bold">{destination.city}</h2>
          <p className="text-white/80 text-center mt-1 px-8 text-sm">{destination.country}</p>
        </div>

        {/* 右上角标签 */}
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium">
          {destination.bestTime}
        </div>

        {/* 滑动指示器 - 只在顶层卡片显示 */}
        {isTopCard && (
          <>
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-4 left-4 px-4 py-2 bg-green-500 rounded-full text-white font-bold text-sm border-2 border-white">
              ✈️ 收藏
            </motion.div>
            <motion.div style={{ opacity: nopeOpacity }} className="absolute top-4 right-4 px-4 py-2 bg-red-500 rounded-full text-white font-bold text-sm border-2 border-white">
              ✕ 跳过
            </motion.div>
          </>
        )}
      </div>

      {/* 航班信息区域 */}
      <div className="p-4">
        {/* 航线信息 */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-3">
          {/* 时间行 */}
          <div className="flex items-center gap-3">
            {/* 左侧：出发信息 - 固定宽度 */}
            <div className="flex-shrink-0 w-20">
              <div className="text-xs text-gray-500 mb-0.5">{flight.departureDate}</div>
              <div className="text-3xl font-bold text-gray-900 tracking-tight">{flight.departureTime}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">SFO</div>
            </div>

            {/* 中间：时长胶囊 + 线段 */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex-1 max-w-12 h-px bg-gray-400" />
              <div className="px-4 py-1.5 bg-gray-900 rounded-full text-white text-xs font-medium whitespace-nowrap flex items-center gap-1.5 -mx-px">
                {flight.duration}
                {flight.stops === '直飞' && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-100">直飞</span>
                  </>
                )}
              </div>
              <div className="flex-1 max-w-12 h-px bg-gray-400" />
            </div>

            {/* 右侧：到达信息 - 固定宽度 */}
            <div className="flex-shrink-0 w-20 text-right">
              <div className="text-xs text-gray-500 mb-0.5">{flight.arrivalDate}</div>
              <div className="flex items-center justify-end gap-0.5">
                <div className="text-3xl font-bold text-gray-900 tracking-tight">{flight.arrivalTime}</div>
                {flight.arrivalDay && (
                  <div className="text-xs text-gray-500 font-medium">{flight.arrivalDay}</div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">KIX</div>
            </div>
          </div>

          {/* 转机标签（仅非直飞显示） */}
          {flight.stops !== '直飞' && (
            <div className="flex items-center justify-center">
              <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">{flight.stops}</span>
            </div>
          )}
        </div>

        {/* 价格 */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-2xl font-bold text-gray-900">${flight.price}</div>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getPriceColor(flight.priceStatus)}`}>
              <Sparkles className="w-3 h-3" />
              {getPriceLabel(flight.priceStatus, flight.priceChange)}
            </div>
          </div>
        </div>

        {/* 种草文案 */}
        <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-3">
          <div className="flex items-start gap-2">
            <span className="text-xl">💡</span>
            <div>
              <div className="font-medium text-gray-900 text-sm mb-0.5">推荐理由</div>
              <p className="text-xs text-gray-600">{destination.tagline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="px-4 pb-6 pt-3 flex items-center justify-center gap-4">
        <motion.button
          onClick={() => onSwipe('left')}
          className="w-14 h-14 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-lg"
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-7 h-7 text-gray-400" />
        </motion.button>
        <motion.button
          onClick={() => onSwipe('right')}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-lg"
          whileTap={{ scale: 0.9 }}
        >
          <Heart className="w-7 h-7 text-white" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ============ 收藏列表页 ============
function SavedListPage({ saved, onBack, destinations }) {
  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* 顶部导航 */}
      <div className="bg-white px-4 py-3 flex items-center gap-4 border-b border-gray-100">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">已收藏 ({saved.length})</h1>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Heart className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">还没有收藏任何航班</h2>
            <p className="text-gray-500 mb-6">右滑喜欢的航班，它们会出现在这里</p>
          </div>
        ) : (
          <div className="space-y-4">
            {saved.map((flight, i) => {
              const dest = destinations.find(d => d.id === flight.destinationId)
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${dest.gradient} flex items-center justify-center text-3xl flex-shrink-0`}>
                      {dest.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{dest.city}, {dest.country}</h3>
                      <p className="text-sm text-gray-500">{flight.date}</p>
                      <p className="text-sm text-gray-500">{flight.route}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-orange-500">${flight.price}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriceColor(flight.priceStatus)}`}>
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

  const handleSwipe = (cardId, direction) => {
    if (direction === 'right') {
      const flight = flights.find(f => f.id === cardId)
      const destination = destinations.find(d => d.id === flight.destinationId)
      setSaved(prev => [...prev, { ...flight, destination }])
    }
    setSwipedCards(prev => new Set(prev).add(cardId))

    // 动画完成后切换到下一张
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
    }, 300)
  }

  // 显示收藏列表
  if (showSavedList) {
    return <SavedListPage saved={saved} onBack={() => setShowSavedList(false)} destinations={destinations} />
  }

  // 获取当前显示的卡片（最多 2 张）
  const visibleCards = []
  for (let i = 0; i < 2 && currentIndex + i < flights.length; i++) {
    const flight = flights[currentIndex + i]
    const destination = destinations.find(d => d.id === flight.destinationId)
    visibleCards.push({ flight, destination, isTop: i === 0 })
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* 顶部导航 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
        <button onClick={onBack} className="p-2 -ml-2">
          <Home className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">探索目的地</h1>
        <button onClick={() => setShowSavedList(true)} className="p-2 -mr-2 relative">
          <Heart className="w-6 h-6 text-gray-600" />
          {saved.length > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
              {saved.length}
            </span>
          )}
        </button>
      </div>

      {/* 卡片区域 */}
      <div className="flex-1 relative p-4 overflow-hidden">
        <div className="h-full flex items-center justify-center">
          {/* 卡片容器 */}
          <div className="relative w-full h-full max-h-[650px]">
            {/* 渲染顺序：先渲染顶层卡片，再渲染下层卡片，确保 DOM 顺序正确 */}
            <AnimatePresence>
              {/* 先渲染下层卡片（在底层） */}
              {visibleCards.filter(c => !c.isTop).map(({ flight, destination }) => (
                <DraggableCard
                  key={`bottom-${flight.id}`}
                  flight={flight}
                  destination={destination}
                  onSwipe={() => {}}
                  isTopCard={false}
                  cardId={flight.id}
                />
              ))}
              {/* 再渲染顶层卡片（在上层） */}
              {visibleCards.filter(c => c.isTop).map(({ flight, destination }) => (
                <DraggableCard
                  key={`top-${flight.id}`}
                  flight={flight}
                  destination={destination}
                  onSwipe={handleSwipe}
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
    </div>
  )
}

// ============ 主 App ============
function App() {
  const [page, setPage] = useState(0)
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
