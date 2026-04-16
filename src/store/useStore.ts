import { create } from 'zustand'

export type ThemeType = 'royal' | 'cute' | 'galaxy' | 'aquarium'

export interface StudentInfo {
  characterType: 'boy' | 'girl' | 'robot'
  nickname: string
}

export interface GalleryImage {
  src: string;
  title: string;
}

export interface AppState {
  view: 'home' | 'teacher' | 'student-setup' | 'gallery' | 'auth' | 'admin' | 'share'
  projectName: string
  uploadedImages: GalleryImage[]
  currentTheme: ThemeType
  studentInfo: StudentInfo | null
  galleryBannerText: string
  galleryBannerImage: string | null
  cameraView: '1st' | '3rd'
  joystickState: { forward: boolean; backward: boolean; left: boolean; right: boolean; camPan: number; camTilt: number; resetLook: boolean }
  chatMessage: string
  chatTimestamp: number
  
  setView: (view: AppState['view']) => void
  setJoystickState: (state: Partial<{ forward: boolean; backward: boolean; left: boolean; right: boolean; camPan: number; camTilt: number; resetLook: boolean }>) => void
  setProjectName: (name: string) => void
  addUploadedImage: (image: string | GalleryImage) => void
  updateImageTitle: (index: number, title: string) => void
  removeImage: (index: number) => void
  setCurrentTheme: (theme: ThemeType) => void
  setStudentInfo: (info: StudentInfo | null) => void
  setBannerText: (text: string) => void
  setBannerImage: (imageUrl: string | null) => void
  setCameraView: (view: '1st' | '3rd') => void
  setChatMessage: (msg: string) => void
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
  joystickState: { forward: false, backward: false, left: false, right: false, camPan: 0, camTilt: 0, resetLook: false },
  chatMessage: '',
  chatTimestamp: 0,
  
  setView: (view) => set({ view }),
  setJoystickState: (state) => set((prev) => ({ joystickState: { ...prev.joystickState, ...state } })),
  setProjectName: (name: string) => set({ projectName: name }),
  addUploadedImage: (image) => set((state) => {
    const newImage: GalleryImage = typeof image === 'string' ? { src: image, title: '' } : image;
    return { uploadedImages: [...state.uploadedImages, newImage] };
  }),
  updateImageTitle: (index, title) => set((state) => {
    const newImages = [...state.uploadedImages];
    if (newImages[index]) {
      newImages[index].title = title;
    }
    return { uploadedImages: newImages };
  }),
  removeImage: (index) => set((state) => {
    const newImages = [...state.uploadedImages];
    newImages.splice(index, 1);
    return { uploadedImages: newImages };
  }),
  setCurrentTheme: (theme) => set({ currentTheme: theme }),
  setStudentInfo: (info) => set({ studentInfo: info }),
  setBannerText: (text) => set({ galleryBannerText: text }),
  setBannerImage: (imageUrl) => set({ galleryBannerImage: imageUrl }),
  setCameraView: (view) => set({ cameraView: view }),
  setChatMessage: (msg) => {
    const now = Date.now();
    set({ chatMessage: msg, chatTimestamp: now });
    setTimeout(() => {
      set((state) => {
        if (state.chatTimestamp === now) {
          return { chatMessage: '' };
        }
        return {};
      });
    }, 5000);
  },
  resetGalleryState: () => set({
    projectName: 'Dự án của tôi',
    uploadedImages: [],
    currentTheme: 'aquarium',
    galleryBannerText: 'phuongngoc091',
    galleryBannerImage: null,
    studentInfo: null,
    chatMessage: '',
    chatTimestamp: 0
  })
}))
