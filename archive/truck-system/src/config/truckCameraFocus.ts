export type TruckCameraViewport = 'desktop' | 'tablet' | 'mobile'

export type TruckCameraFocusPreset = Readonly<{
  zoom: number
  offsetX: number
  offsetY: number
  duration: number
  easing: string
}>

export type TruckCameraComponentId =
  | 'brakes'
  | 'air-compressor'
  | 'mechanical-suspension'
  | 'pneumatic-suspension'
  | 'abs'
  | 'ebs'
  | 'ecas'

type TruckCameraFocusConfig = Readonly<
  Record<
    TruckCameraComponentId,
    Readonly<Record<TruckCameraViewport, TruckCameraFocusPreset>>
  >
>

export const TRUCK_CAMERA_RESET: TruckCameraFocusPreset = Object.freeze({
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  duration: 0.62,
  easing: 'power3.inOut',
})

export const truckCameraFocus: TruckCameraFocusConfig = Object.freeze({
  brakes: {
    desktop: {
      zoom: 1.045,
      offsetX: -4.2,
      offsetY: -2.8,
      duration: 0.64,
      easing: 'power3.inOut',
    },
    tablet: {
      zoom: 1.035,
      offsetX: -3.2,
      offsetY: -2.2,
      duration: 0.58,
      easing: 'power3.inOut',
    },
    mobile: {
      zoom: 1.025,
      offsetX: -2.2,
      offsetY: -1.5,
      duration: 0.54,
      easing: 'power3.inOut',
    },
  },
  'air-compressor': {
    desktop: {
      zoom: 1.04,
      offsetX: 2.4,
      offsetY: -0.8,
      duration: 0.62,
      easing: 'power3.inOut',
    },
    tablet: {
      zoom: 1.03,
      offsetX: 1.8,
      offsetY: -0.6,
      duration: 0.57,
      easing: 'power3.inOut',
    },
    mobile: {
      zoom: 1.02,
      offsetX: 1.2,
      offsetY: -0.4,
      duration: 0.53,
      easing: 'power3.inOut',
    },
  },
  'mechanical-suspension': {
    desktop: {
      zoom: 1.035,
      offsetX: -1.4,
      offsetY: -2.2,
      duration: 0.6,
      easing: 'power3.inOut',
    },
    tablet: {
      zoom: 1.03,
      offsetX: -1.1,
      offsetY: -1.7,
      duration: 0.56,
      easing: 'power3.inOut',
    },
    mobile: {
      zoom: 1.02,
      offsetX: -0.8,
      offsetY: -1.1,
      duration: 0.52,
      easing: 'power3.inOut',
    },
  },
  'pneumatic-suspension': {
    desktop: {
      zoom: 1.045,
      offsetX: -4.8,
      offsetY: -1.8,
      duration: 0.65,
      easing: 'power3.inOut',
    },
    tablet: {
      zoom: 1.035,
      offsetX: -3.6,
      offsetY: -1.4,
      duration: 0.59,
      easing: 'power3.inOut',
    },
    mobile: {
      zoom: 1.025,
      offsetX: -2.5,
      offsetY: -0.9,
      duration: 0.55,
      easing: 'power3.inOut',
    },
  },
  abs: {
    desktop: {
      zoom: 1.04,
      offsetX: 0,
      offsetY: -1.7,
      duration: 0.61,
      easing: 'power3.inOut',
    },
    tablet: {
      zoom: 1.03,
      offsetX: 0.2,
      offsetY: -1.3,
      duration: 0.56,
      easing: 'power3.inOut',
    },
    mobile: {
      zoom: 1.02,
      offsetX: 0.2,
      offsetY: -0.9,
      duration: 0.52,
      easing: 'power3.inOut',
    },
  },
  ebs: {
    desktop: {
      zoom: 1.04,
      offsetX: -2.5,
      offsetY: -1,
      duration: 0.62,
      easing: 'power3.inOut',
    },
    tablet: {
      zoom: 1.03,
      offsetX: -1.9,
      offsetY: -0.8,
      duration: 0.57,
      easing: 'power3.inOut',
    },
    mobile: {
      zoom: 1.02,
      offsetX: -1.2,
      offsetY: -0.5,
      duration: 0.53,
      easing: 'power3.inOut',
    },
  },
  ecas: {
    desktop: {
      zoom: 1.04,
      offsetX: -3.8,
      offsetY: -0.8,
      duration: 0.63,
      easing: 'power3.inOut',
    },
    tablet: {
      zoom: 1.03,
      offsetX: -2.9,
      offsetY: -0.6,
      duration: 0.58,
      easing: 'power3.inOut',
    },
    mobile: {
      zoom: 1.02,
      offsetX: -1.8,
      offsetY: -0.4,
      duration: 0.54,
      easing: 'power3.inOut',
    },
  },
})

export function getTruckCameraFocus(
  componentId: string | null,
  viewport: TruckCameraViewport,
): TruckCameraFocusPreset {
  if (!componentId || !(componentId in truckCameraFocus)) {
    return TRUCK_CAMERA_RESET
  }

  return truckCameraFocus[componentId as TruckCameraComponentId][viewport]
}
