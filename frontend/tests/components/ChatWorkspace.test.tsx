import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatWorkspace from '@/components/chat/ChatWorkspace'
import { useChatStore } from '@/store/chatStore'
import { useFileStore } from '@/store/fileStore'
import { chatService } from '@/services/chatService'

// Mock icons
jest.mock('lucide-react', () => ({
  Send: () => <span>SendIcon</span>,
  Plus: () => <span>PlusIcon</span>,
  FileText: () => <span>FileIcon</span>,
  Paperclip: () => <span>ClipIcon</span>,
  X: () => <span>XIcon</span>,
  ChevronDown: () => <span>DownIcon</span>,
  MessageSquare: () => <span>MessageIcon</span>,
  Clock: () => <span>ClockIcon</span>,
  User: () => <span>UserIcon</span>,
  Bot: () => <span>BotIcon</span>,
  Loader2: () => <span>LoaderIcon</span>,
  Upload: () => <span>UploadIcon</span>,
  FilePlus: () => <span>FilePlusIcon</span>
}))

// Mock stores
jest.mock('@/store/chatStore', () => ({
  useChatStore: jest.fn()
}))
jest.mock('@/store/fileStore', () => ({
  useFileStore: jest.fn()
}))
jest.mock('@/services/chatService', () => ({
  chatService: {
    sendMessage: jest.fn(),
    getSessions: jest.fn(),
    getMessages: jest.fn()
  }
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('ChatWorkspace', () => {
  const mockAddMessage = jest.fn();
  const mockFetchSessions = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    (useFileStore as any).mockReturnValue({ files: [] });
    (useChatStore as any).mockReturnValue({
      activeSession: { id: '1', title: 'Test Session', file_ids: [] },
      messages: [],
      isLoading: false,
      addMessage: mockAddMessage,
      fetchSessions: mockFetchSessions,
      attachFilesToActiveSession: jest.fn()
    });
  })

  it('renders correctly', () => {
    render(<ChatWorkspace />)
    expect(screen.getByPlaceholderText(/Message Gemini/i)).toBeInTheDocument()
    expect(screen.getByText('Test Session')).toBeInTheDocument()
  })

  it('handles message sending', async () => {
    (chatService.sendMessage as jest.Mock).mockResolvedValue({
      role: 'assistant',
      content: 'Hello from AI',
      timestamp: new Date().toISOString()
    })

    render(<ChatWorkspace />)
    
    const input = screen.getByPlaceholderText(/Message Gemini/i)
    fireEvent.change(input, { target: { value: 'Hi' } })
    
    const sendButton = screen.getByText('SendIcon').parentElement
    fireEvent.click(sendButton!)

    expect(mockAddMessage).toHaveBeenCalledWith(expect.objectContaining({
      role: 'user',
      content: 'Hi'
    }))

    await waitFor(() => {
      expect(chatService.sendMessage).toHaveBeenCalledWith('Hi', '1')
    })
  })
})
