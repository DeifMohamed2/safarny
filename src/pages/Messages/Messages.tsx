import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface Conversation {
  avatar: string | undefined
  id: string
  name: string
  lastMessage: string
  time: string
  unread?: number
}

interface Message {
  from: 'company' | 'me'
  text: string
  time: string
}

const initialConversations: Conversation[] = [
  {
    id: '1',
    name: 'Red Sea Adventures',
     avatar: "/attached_assets/companies/company.png",
    lastMessage: 'That sounds great! See you then.',
    time: '2m ago',
    unread: 2,
  },
  {
    id: '2',
    name: 'Sunny Tours',
    avatar: "/attached_assets/companies/company.png",
    lastMessage: "I'll send the itinerary soon.",
    time: '1h ago',
  },
  {
    id: '3',
    name: 'Blue Nile Travels',
     avatar: "/attached_assets/companies/company.png",
    lastMessage: 'Can we reschedule?',
    time: '3h ago',
    unread: 1,
  },
]

const initialMessages: Record<string, Message[]> = {
  '1': [
    { from: 'company', text: 'Hey! How are you doing?', time: '8:04 PM' },
    { from: 'me', text: "I'm doing great! Thanks for asking.", time: '8:06 PM' },
    { from: 'company', text: 'Want to grab coffee tomorrow?', time: '8:07 PM' },
    { from: 'me', text: 'That sounds great! See you then.', time: '9:02 PM' },
  ],
  '2': [
    { from: 'company', text: "We got your request.", time: '2:15 PM' },
  ],
  '3': [
    { from: 'company', text: 'Can we reschedule to next week?', time: '10:45 AM' },
  ],
}

const Messages = () => {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations)

  const [messages, setMessages] =
    useState<Record<string, Message[]>>(initialMessages)

  const [activeId, setActiveId] =
    useState(conversations[0]?.id || '')

  const [newMsg, setNewMsg] = useState('')

  const activeMessages = messages[activeId] || []

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const sendMessage = () => {
    const text = newMsg.trim()
    if (!text) return

    const time = formatTime(new Date())

    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), { from: 'me', text, time }],
    }))

    setConversations(prev =>
      prev.map(c =>
        c.id === activeId ? { ...c, lastMessage: text, time: 'now' } : c
      )
    )

    setNewMsg('')
  }

  const selectConversation = (id: string) => {
    setActiveId(id)

    setConversations(prev =>
      prev.map(c => ({ ...c, unread: c.id === id ? 0 : c.unread }))
    )
  }

  const activeConv = conversations.find(c => c.id === activeId)

  return (
    <div className="max-w-300 mx-auto pt-32 px-4 pb-10">
      <div className="flex bg-white rounded-2xl shadow  overflow-hidden h-162.5 border-[E8E8E8]">

        {/* LEFT SIDE */}
        <div className="w-[32%] flex flex-col">

          <h2 className="text-2xl font-semibold p-6 flex items-center justify-center text-[#122445]">Messages</h2>

          <div className="px-6 pb-4">
            <Input
              placeholder="Search"
              className="bg-[#F6F6F6] border border-[#D4D7DE] rounded-xl h-11"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-2">
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition",
                  activeId === conv.id
                    ? "bg-[#EAF0FF]"
                    : "hover:bg-gray-50"
                )}
              >

               <img
  src={conv.avatar}
  className="w-10 h-10 rounded-full object-cover"
/>

                <div className="flex-1">
                  <p className="text-sm font-semibold">{conv.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {conv.lastMessage}
                  </p>
                </div>

                <div className="text-xs text-gray-400 text-right">
                  <p>{conv.time}</p>

                  {conv.unread && (
                    <span className="bg-orange-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full mt-1 ml-auto">
                      {conv.unread}
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* RIGHT SIDE Messages */}
        <div className="flex flex-col w-[68%]">

          <div className="flex items-center gap-3 p-5 border-[E8E8E8] bg-white">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-[E8E8E8]">
                <img
                    src={activeConv?.avatar}
                    alt={activeConv?.name}
                    className="w-full h-full object-cover"
                />
                </div>

            <div>
              <p className="font-semibold">{activeConv?.name}</p>
              <p className="text-xs text-green-500">Active now</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#FAFAFA]">
            {activeMessages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex",
                  msg.from === "me"
                    ? "justify-end"
                    : "justify-start"
                )}
              >

                <div
                  className={cn(
                    "px-4 py-3 rounded-2xl text-sm max-w-[60%]",
                    msg.from === "me"
                      ? "bg-[#2E6CF6] text-white rounded-br-sm"
                      : "bg-[#EFEFEF] text-gray-900 rounded-bl-sm"
                  )}
                >

                  {msg.text}

                  <p className="text-[10px] opacity-60 mt-1 text-right">
                    {msg.time}
                  </p>

                </div>

              </div>
            ))}
          </div>

          <div className="p-5  flex items-center gap-3">

            <Input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="Type a message..."
              className="h-11 rounded-full"
            />

            <button
              onClick={sendMessage}
              className="w-11 h-11 border-[F3F4F6] flex items-center justify-center rounded-full bg-[#263859] text-white"
            >
              ➤
            </button>

          </div>

        </div>

      </div>
    </div>
  )
}

export default Messages