import { create } from 'zustand'

export type ThemeType = 'royal' | 'cute' | 'galaxy' | 'aquarium'

export interface StudentInfo {
  characterType: 'boy' | 'girl' | 'robot'
  nickname: string
}

export interface AppState {
  view: 'home' | 'teacher' | 'student-setup' | 'gallery' | 'auth' | 'admin' | 'share'
  projectName: string
  uploadedImages: string[]
  currentTheme: ThemeType
  studentInfo: StudentInfo | null
  galleryBannerText: string
  galleryBannerImage: string | null
  cameraView: '1st' | '3rd'
  
  setView: (view: AppState['view']) => void
  setProjectName: (name: string) => void
  addUploadedImage: (imageUrl: string) => void
  setCurrentTheme: (theme: ThemeType) => void
  setStudentInfo: (info: StudentInfo | null) => void
  setBannerText: (text: string) => void
  setBannerImage: (imageUrl: string | null) => void
  setCameraView: (view: '1st' | '3rd') => void
  resetGalleryState: () => void
}

export const useStore = create<AppState>((set) => ({
  view: 'home',
  projectName: 'Dự án của tôi',
  uploadedImages: [],
  currentTheme: 'aquarium', // default
  studentInfo: null,
  galleryBannerText: 'phuongngoc091',
  galleryBannerImage: null,
  cameraView: '3rd',
  
  setView: (view) => set({ view }),
  setProjectName: (name) => set({ projectName: name }),
  addUploadedImage: (imageUrl) => set((state) => ({ 
    uploadedImages: [...state.uploadedImages, imageUrl] 
  })),
  setCurrentTheme: (theme) => set({ currentTheme: theme }),
  setStudentInfo: (info) => set({ studentInfo: info }),
  setBannerText: (text) => set({ galleryBannerText: text }),
  setBannerImage: (imageUrl) => set({ galleryBannerImage: imageUrl }),
  setCameraView: (view) => set({ cameraView: view }),
  resetGalleryState: () => set({
    projectName: 'Dự án của tôi',
    uploadedImages: [],
    currentTheme: 'aquarium',
    galleryBannerText: 'phuongngoc091',
    galleryBannerImage: null,
    studentInfo: null
  })
}))
