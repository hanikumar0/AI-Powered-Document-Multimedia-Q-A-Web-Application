import { useChatStore } from '@/store/chatStore'
import { act } from '@testing-library/react'

describe('ChatStore', () => {
  it('should initialize with default state', () => {
    const state = useChatStore.getState()
    expect(state.sessions).toEqual([])
    expect(state.activeSession).toBeNull()
    expect(state.messages).toEqual([])
  })

  it('should set messages', () => {
    const mockMessages: any[] = [{ role: 'user', content: 'Hello', timestamp: 'now' }]
    
    act(() => {
      useChatStore.getState().setMessages(mockMessages)
    })
    
    expect(useChatStore.getState().messages).toEqual(mockMessages)
  })

  it('should set active session', () => {
    const mockSession: any = { id: '123', title: 'Test', file_ids: [] }
    act(() => {
      useChatStore.getState().setActiveSession(mockSession)
    })
    
    expect(useChatStore.getState().activeSession).toEqual(mockSession)
  })
})
