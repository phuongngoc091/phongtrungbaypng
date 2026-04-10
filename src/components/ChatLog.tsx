import { useEffect, useState, useRef } from 'react'
import { rtdb } from '../utils/firebase'
import { ref, push, onValue, query, limitToLast } from 'firebase/database'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/useAuthStore'
import { ArrowUp } from 'lucide-react'

interface ChatMessage {
  id: string
  sender: string
  text: string
  timestamp: number
  color: string
}

export const ChatLog = ({ galleryId }: { galleryId: string }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isFaded, setIsFaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const studentInfo = useStore(s => s.studentInfo)
  const profile = useAuthStore(s => s.profile)
  const setChatMessage = useStore(s => s.setChatMessage)
  const chatTimestamp = useStore(s => s.chatTimestamp)

  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen to the last 20 messages
  useEffect(() => {
    if (!galleryId) return
    const chatRef = query(ref(rtdb, `rooms/${galleryId}/chat`), limitToLast(20))
    
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const msgs = Object.entries(data).map(([id, val]: any) => ({
          id,
          ...val
        }))
        // Sort by timestamp
        msgs.sort((a, b) => a.timestamp - b.timestamp)
        setMessages(msgs)
        
        // Trigger un-fade and reset fade timeout
        setIsFaded(false)
        if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
        fadeTimeoutRef.current = setTimeout(() => {
          setIsFaded(true)
        }, 10000)
      }
    })

    return () => {
      unsubscribe()
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
    }
  }, [galleryId])

  // Timer to force re-render and remove messages older than 20s
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const visibleMessages = messages.filter(msg => Date.now() - msg.timestamp <= 20000)

  // Always scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle manual hover un-fading
  useEffect(() => {
    if (isHovered) {
      setIsFaded(false)
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
    } else {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = setTimeout(() => {
        setIsFaded(true)
      }, 10000)
    }
  }, [isHovered])

  // Global hotkey to focus chat input on Enter
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (document.activeElement !== inputRef.current) {
          e.preventDefault()
          inputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    
    // Cooldown check (5s)
    if (Date.now() - chatTimestamp < 5000) {
      alert('Vui lòng đợi 5 giây giữa các lần chat!')
      return
    }

    const text = chatInput.trim()
    const sender = studentInfo?.nickname || profile?.displayName || 'Khách'
    const color = studentInfo ? (studentInfo.characterType === 'girl' ? '#ec4899' : studentInfo.characterType === 'boy' ? '#3b82f6' : '#a855f7') : '#f59e0b'

    // Push explicitly to Firebase room chat
    push(ref(rtdb, `rooms/${galleryId}/chat`), {
      sender,
      text,
      color,
      timestamp: Date.now()
    })

    // Set globally for 5s 3D bubble
    setChatMessage(text)
    setChatInput('')
  }
  
  return (
    <div 
      className={`absolute top-20 left-4 md:left-6 z-50 flex flex-col gap-2 transition-opacity duration-1000 w-[60vw] md:w-80 ${isFaded && !isHovered ? 'opacity-30' : 'opacity-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => {
         setTimeout(() => setIsHovered(false), 3000)
      }}
    >
      {/* Messages Window */}
      <div 
        className="flex flex-col max-h-[25vh] md:max-h-[35vh] overflow-y-auto pr-2 gap-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
        
        {visibleMessages.map((msg) => (
          <div key={msg.id} className="text-[12px] md:text-sm px-2.5 py-1.5 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 break-words shadow-sm">
            <span style={{ color: msg.color }} className="font-bold mr-2 tracking-wide drop-shadow-md">{msg.sender}:</span>
            <span className="text-white/95 font-medium drop-shadow-md">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendChat} className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[60vw] max-w-[280px] md:max-w-none md:static md:translate-x-0 md:w-full flex gap-2 mt-1 z-50`}>
        <input  
          ref={inputRef}
          type="text" 
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-black/60 border border-white/20 rounded-full px-4 py-2 text-white text-[13px] md:text-sm focus:outline-none focus:border-pink-500 backdrop-blur-md shadow-lg"
          maxLength={60}
          onKeyDown={(e) => {
            e.stopPropagation()
            e.nativeEvent.stopPropagation()
            if (e.key === 'Escape') {
              inputRef.current?.blur()
            }
          }}
        />
        <button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-full shadow-lg border border-pink-400 transition-colors shrink-0">
           <ArrowUp className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </form>
    </div>
  )
}
