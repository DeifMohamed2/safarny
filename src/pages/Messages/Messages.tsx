import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Chat {
  id: number
  name: string
  avatar?: string
  lastMessage: string
  time: string
  unread?: number
}

interface MessageItem {
  id: number
  fromMe: boolean
  text: string
  time: string
}

const sampleChats: Chat[] = [
  {
    id: 1,
    name: "Red Sea Adventures",
    avatar: "/attached_assets/companies/redsea.png",
    lastMessage: "That sounds great! See you then.",
    time: "2m ago",
    unread: 2,
  },
  {
    id: 2,
    name: "Blue Nile Tours",
    avatar: "/attached_assets/companies/bluenile.png",
    lastMessage: "Your booking is confirmed.",
    time: "1h ago",
  },
  {
    id: 3,
    name: "Desert Safari Co.",
    avatar: "/attached_assets/companies/desert.png",
    lastMessage: "Please let us know if you need help.",
    time: "Yesterday",
  },
]

const sampleMessages: Record<number, MessageItem[]> = {
  1: [
    { id: 1, fromMe: false, text: "Hey! How are you doing?", time: "8:04 PM" },
    { id: 2, fromMe: true, text: "I'm doing great! Thanks for asking.", time: "8:06 PM" },
    { id: 3, fromMe: false, text: "Want to grab coffee tomorrow?", time: "8:07 PM" },
    { id: 4, fromMe: false, text: "That sounds great! See you then.", time: "9:02 PM" },
  ],
  2: [
    { id: 1, fromMe: false, text: "Your booking is confirmed.", time: "1:00 PM" },
    { id: 2, fromMe: true, text: "Thank you!", time: "1:05 PM" },
  ],
  3: [
    { id: 1, fromMe: false, text: "Please let us know if you need help.", time: "Yesterday" },
  ],
}

const Messages = () => {
  const { t } = useTranslation()
  const [selectedChat, setSelectedChat] = useState<number>(sampleChats[0].id)
  const [inputValue, setInputValue] = useState("")

  const messages = sampleMessages[selectedChat] || []

  const sendMessage = () => {
    if (inputValue.trim()) {
      messages.push({
        id: messages.length + 1,
        fromMe: true,
        text: inputValue,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
      setInputValue("")
    }
  }

  return (
    <div className="relative min-h-dvh sm:h-full max-w-340 w-full px-4 pt-32.5 mx-auto">
      <div className="flex flex-col lg:flex-row gap-4 h-full">
        {/* chat list */}
        <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow flex flex-col">
          <div className="px-4 py-5 border-b">
            <h2 className="text-xl font-semibold text-[#122445] capitalize">
              {t("messages.chats", "Chats")}
            </h2>
          </div>
          <div className="overflow-y-auto flex-1">
            {sampleChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`w-full flex items-center px-4 py-3 gap-3 hover:bg-gray-100 text-left 
                  ${selectedChat === chat.id ? 'bg-gray-100' : ''}`}
              >
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-[#122445]">
                      {chat.name}
                    </span>
                    <span className="text-xs text-gray-500">{chat.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.unread && (
                  <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {chat.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* conversation */}
        <div className="w-full lg:w-2/3 flex flex-col bg-white rounded-2xl shadow">
          <div className="px-4 py-5 border-b flex items-center gap-3">
            <img
              src={sampleChats.find(c => c.id === selectedChat)?.avatar}
              alt="avatar"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-medium text-lg text-[#122445]">
                {sampleChats.find(c => c.id === selectedChat)?.name}
              </p>
              <p className="text-xs text-gray-500">{t("messages.activeNow", "Active now")}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`${msg.fromMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} 
                    max-w-[70%] px-4 py-2 rounded-2xl relative`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <span className="absolute bottom-1 right-2 text-[10px] text-gray-400">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t flex items-center gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t("messages.typeMessage", "Type a message...")}
              className="flex-1 bg-neutral-100 rounded-full"
            />
            <Button onClick={sendMessage} className="shrink-0">
              {t("messages.send", "Send")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Messages
