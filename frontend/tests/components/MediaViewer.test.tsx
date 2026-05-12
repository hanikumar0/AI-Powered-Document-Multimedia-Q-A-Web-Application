import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import MediaViewer from '@/components/media/MediaViewer'

describe('MediaViewer', () => {
  const mockTranscript = [
    { start: 0, end: 10, text: 'Hello world' },
    { start: 10, end: 20, text: 'This is a test' }
  ]

  it('renders video element when type is video', () => {
    const { container } = render(<MediaViewer fileUrl="/test.mp4" type="video" />)
    const videoElement = container.querySelector('video')
    expect(videoElement).toBeInTheDocument()
    expect(videoElement).toHaveAttribute('src', '/test.mp4')
  })

  it('renders audio element when type is audio', () => {
    const { container } = render(<MediaViewer fileUrl="/test.mp3" type="audio" />)
    const audioElement = container.querySelector('audio')
    expect(audioElement).toBeInTheDocument()
    expect(screen.getByText('Audio Playback')).toBeInTheDocument()
  })

  it('renders transcript and handles seeking', () => {
    render(
      <MediaViewer 
        fileUrl="/test.mp4" 
        type="video" 
        transcript={mockTranscript} 
      />
    )
    
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('[0:00]')).toBeInTheDocument() // Check if formatTime(0) is 0:00
    
    const secondSegment = screen.getByText('This is a test')
    fireEvent.click(secondSegment)
    
    // Check if it shows the timestamp for the second segment
    expect(screen.getByText('[0:10]')).toBeInTheDocument()
  })
})
