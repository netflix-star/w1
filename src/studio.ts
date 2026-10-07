export interface Studio {
 environment:'dark'|'white';intensity:number;exposure:number;focalLength:number;
 hdriId?:string;environmentRotation?:number;aperture?:number;focusDistance?:number;dof?:boolean;quality?:'performance'|'balanced'|'high'|'ultra';
 lightType?:'directional'|'spot'|'area';lightPosition?:[number,number,number];lightRotation?:[number,number,number];lightSize?:number;temperature?:number;
 groundRoughness?:number;cameraPreset?:'hero'|'front'|'side'|'top';
}
export const presets={
 dark:{environment:'dark',intensity:1,exposure:1,temperature:6500},
 white:{environment:'white',intensity:1.3,exposure:1.1,temperature:6500},
 softbox:{environment:'dark',intensity:1.1,exposure:1,lightType:'area',lightSize:5,temperature:6000},
 showroom:{environment:'white',intensity:1.5,exposure:1,temperature:5500},
 dramatic:{environment:'dark',intensity:1.5,exposure:0.7,lightType:'spot',temperature:6500},
 day:{environment:'white',intensity:2,exposure:1,temperature:6000},
 sunset:{environment:'dark',intensity:1.2,exposure:1,temperature:3200},
 night:{environment:'dark',intensity:0.4,exposure:0.7,temperature:8500},
} satisfies Record<string,Partial<Studio>>;
