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
          {/* 动态图标 - 电光紫主题 */}
          <motion.div
            className="w-20 h-20 rounded-full gradient-electric flex items-center justify-center mx-auto mb-5 shadow-colored animate-pulse-glow"
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Plane className="w-9 h-9 text-white" strokeWidth={2} />
          </motion.div>
          <h2 className="text-2xl font-extrabold text-ink-black mb-2 tracking-tight">
            滑动选择航班
          </h2>
          <p className="text-slate-gray text-sm leading-relaxed">
            像约会一样选航班，找到你的真爱目的地
          </p>
        </div>

        <div className="space-y-3.5 mb-7">
          {/* 右滑说明 - 电光紫主题 */}
          <motion.div
            className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-electric-purple/5 border border-electric-purple/20"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="w-14 h-14 rounded-full gradient-electric flex items-center justify-center shadow-colored"
              whileHover={{ scale: 1.05 }}
            >
              <Heart className="w-7 h-7 text-white" strokeWidth={2.5} fill="white" />
            </motion.div>
            <div>
              <div className="font-bold text-ink-black text-base tracking-tight">右滑 = 收藏</div>
              <div className="text-sm text-slate-gray leading-tight mt-0.5">喜欢的航班加入收藏夹</div>
            </div>
          </motion.div>

          {/* 左滑说明 */}
          <motion.div
            className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-50/30 border border-rose-200/50"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center shadow-md"
              whileHover={{ scale: 1.05 }}
            >
              <X className="w-7 h-7 text-white" strokeWidth={2.5} />
            </motion.div>
            <div>
              <div className="font-bold text-ink-black text-base tracking-tight">左滑 = 下一个</div>
              <div className="text-sm text-slate-gray leading-tight mt-0.5">跳过不感兴趣的选项</div>
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
function DraggableCard({ flight, destination, onSwipe, isTopCard, cardId }) {
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
    const threshold = 80 // 降低阈值，更灵敏
    const velocity = info.velocity.x

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      // 达到阈值或速度够快 → 飞出
      const direction = info.offset.x > 0 ? 1 : -1
      const flyDistance = window.innerWidth * 0.8

      animate(x, direction * flyDistance, {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        mass: 0.8,
        duration: 0.4,
        onComplete: () => onSwipe(cardId, direction > 0 ? 'right' : 'left')
      })
    } else {
      // 回弹 - 更 Q 弹的效果
      animate(x, 0, {
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.5,
        duration: 0.5
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
      drag={isTopCard}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6} // 降低弹性，增加阻尼
      dragMomentum={false} // 关闭惯性，更跟手
      onDragEnd={isTopCard ? handleDragEnd : undefined}
      className="absolute inset-0 bg-white rounded-[32px] shadow-strong overflow-hidden touch-none select-none"
      initial={{ scale: 0.93, opacity: 0, y: 20 }}
      animate={
        isTopCard
          ? { scale: 1, opacity: 1, y: 0 }
          : { scale: 0.92, opacity: 0.6, y: 10 }
      }
      exit={{ scale: 0.85, opacity: 0, rotate: isTopCard ? 20 : -20 }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 30,
        mass: 0.6,
        duration: 0.25
      }}
    >
      {/* 目的地插画区域 - 视觉升级 */}
      <div className={`h-72 relative overflow-hidden noise-overlay`}>
        {/* 渐变背景 */}
        <div className={`absolute inset-0 bg-gradient-to-br ${destination.gradient}`} />

        {/* 动态光晕装饰 */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-white/15 rounded-full blur-2xl" />

        {/* 目的地内容 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <motion.div
            className="text-8xl mb-3 drop-shadow-2xl"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}
          >
            {destination.image}
          </motion.div>
          <motion.h2
            className="text-4xl font-extrabold tracking-tight drop-shadow-lg"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {destination.city}
          </motion.h2>
          <motion.p
            className="text-white/90 text-sm mt-2 px-6 text-center font-medium tracking-wide"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {destination.country}
          </motion.p>
        </div>

        {/* 右上角标签 - 毛玻璃 */}
        <div className="absolute top-4 right-4 px-4 py-2 bg-white/25 backdrop-blur-md rounded-full text-white text-xs font-bold tracking-wide border border-white/30 shadow-md">
          {destination.bestTime}
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
              className="absolute top-5 right-5 px-5 py-2.5 bg-rose-500/95 backdrop-blur-md rounded-full text-white font-bold text-sm shadow-xl border-2 border-white/50"
            >
              <span className="flex items-center gap-1.5">
                <X className="w-4 h-4" strokeWidth={3} />
                跳过
              </span>
            </motion.div>
          </>
        )}
      </div>

      {/* 航班信息区域 - 视觉升级 */}
      <div className="p-5">
        {/* 航线信息卡片 - 主题色点缀 */}
        <div className="bg-gradient-to-br from-mist-gray to-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-soft">
          {/* 时间行 */}
          <div className="flex items-center gap-4">
            {/* 左侧：出发信息 */}
            <div className="flex-shrink-0 w-20">
              <div className="text-xs text-slate-gray mb-1 font-semibold">{flight.departureDate}</div>
              <div className="text-4xl font-bold flight-time text-ink-black tracking-tight leading-none">
                {flight.departureTime}
              </div>
              <div className="text-xs text-slate-gray mt-1.5 font-bold tracking-wider">SFO</div>
            </div>

            {/* 中间：时长胶囊 + 线段 */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex-1 max-w-14 h-px bg-gradient-to-r from-gray-300 to-gray-400" />
              <div className="px-4 py-2.5 bg-ink-black rounded-full text-white text-xs font-bold whitespace-nowrap flex items-center gap-2 -mx-px shadow-md">
                <span>{flight.duration}</span>
                {flight.stops === '直飞' && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-200">直飞</span>
                  </>
                )}
              </div>
              <div className="flex-1 max-w-14 h-px bg-gradient-to-l from-gray-300 to-gray-400" />
            </div>

            {/* 右侧：到达信息 */}
            <div className="flex-shrink-0 w-20 text-right">
              <div className="text-xs text-slate-gray mb-1 font-semibold">{flight.arrivalDate}</div>
              <div className="flex items-center justify-end gap-0.5">
                <div className="text-4xl font-bold flight-time text-ink-black tracking-tight leading-none">
                  {flight.arrivalTime}
                </div>
                {flight.arrivalDay && (
                  <div className="text-xs text-slate-gray font-bold">{flight.arrivalDay}</div>
                )}
              </div>
              <div className="text-xs text-slate-gray mt-1.5 font-bold tracking-wider">KIX</div>
            </div>
          </div>

          {/* 转机标签 */}
          {flight.stops !== '直飞' && (
            <div className="flex items-center justify-center mt-4">
              <span className="px-3 py-1.5 bg-orange-100/80 text-orange-700 rounded-full text-xs font-bold border border-orange-200">
                {flight.stops}
              </span>
            </div>
          )}
        </div>

        {/* 价格区域 - 主题色强调 */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold flight-time text-slate-gray">$</span>
              <span className="text-4xl font-bold flight-time text-ink-black tracking-tight">{flight.price}</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mt-2 ${getPriceColor(flight.priceStatus)}`}>
              <Sparkles className="w-3.5 h-3.5" />
              {getPriceLabel(flight.priceStatus, flight.priceChange)}
            </div>
          </div>
        </div>

        {/* 种草文案 - 电光紫主题 */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50/80 to-electric-purple/10 rounded-2xl p-4 border border-purple-100/50">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-electric-purple/15 to-transparent rounded-full blur-xl" />
          <div className="flex items-start gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric-purple to-purple-400 flex items-center justify-center flex-shrink-0 shadow-colored">
              <span className="text-lg">✨</span>
            </div>
            <div>
              <div className="font-bold text-ink-black text-sm mb-0.5 tracking-tight">推荐理由</div>
              <p className="text-xs text-slate-gray leading-relaxed">{destination.tagline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作按钮 - 重新设计 */}
      <div className="px-5 pb-6 pt-2 flex items-center justify-center gap-5">
        {/* 跳过按钮 */}
        <motion.button
          onClick={() => onSwipe('left')}
          className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-medium hover:shadow-lg transition-shadow group"
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.05 }}
        >
          <X className="w-8 h-8 text-gray-400 group-hover:text-rose-500 transition-colors" strokeWidth={2.5} />
        </motion.button>

        {/* 收藏按钮 - 电光紫主题 */}
        <motion.button
          onClick={() => onSwipe('right')}
          className="w-16 h-16 rounded-full gradient-electric flex items-center justify-center shadow-colored hover:shadow-lg transition-shadow"
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
        <h1 className="text-lg font-extrabold text-ink-black tracking-tight">已收藏 <span className="text-electric-purple">({saved.length})</span></h1>
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
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${dest.gradient} flex items-center justify-center text-3xl flex-shrink-0 shadow-md`}>
                      {dest.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-ink-black truncate tracking-tight">{dest.city}, {dest.country}</h3>
                      <p className="text-sm text-slate-gray mt-0.5">{flight.date}</p>
                      <p className="text-xs text-slate-gray mt-1 font-medium">{flight.route}</p>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-xl font-bold flight-time text-electric-purple">${flight.price}</span>
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
    <div className="flex flex-col h-full bg-gradient-to-br from-mist-gray via-purple-50/30 to-white">
      {/* 顶部导航 - 毛玻璃效果 */}
      <div className="glass px-4 py-3 flex items-center justify-between border-b border-white/30 flex-shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/60 transition-colors">
          <Home className="w-6 h-6 text-ink-black" />
        </button>
        <h1 className="text-lg font-extrabold text-ink-black tracking-tight">探索目的地</h1>
        <button onClick={() => setShowSavedList(true)} className="p-2 -mr-2 relative">
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
      <div className="flex-1 relative p-4 overflow-hidden">
        <div className="h-full flex items-center justify-center">
          {/* 卡片容器 */}
          <div className="relative w-full h-full max-h-[680px]">
            {/* 渲染顺序：先渲染下层卡片，再渲染顶层卡片 */}
            <AnimatePresence>
              {/* 下层卡片（在底层） */}
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
              {/* 顶层卡片（在上层） */}
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
